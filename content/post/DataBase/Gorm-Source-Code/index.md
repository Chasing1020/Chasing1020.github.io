---
title: "Gorm Source Code"
date: 2021-12-22T18:24:56+08:00
lastmod: 2021-12-22T18:24:56+08:00
draft: false
author: "Chasing1020"
comment: true
keywords: []
description: ""
tags: ['DataBase']
categories: ['Note']
image: "gorm.webp"
---

# Gorm Source Code

# 1. sql.DB

```go
// driverConn wraps a driver.Conn with a mutex, to
// be held during all calls into the Conn. (including any calls onto
// interfaces returned via that Conn, such as calls on Tx, Stmt,
// Result, Rows)
type driverConn struct {
    db        *DB
    createdAt time.Time

    sync.Mutex  // guards following
    ci          driver.Conn
    needReset   bool // The connection session should be reset before use if true.
    closed      bool
    finalClosed bool // ci.Close has been called
    openStmt    map[*driverStmt]bool

    // guarded by db.mu
    inUse      bool
    returnedAt time.Time // Time the connection was created or returned.
    onPut      []func()  // code (with db.mu held) run when conn is next returned
    dbmuClosed bool      // same as closed, but guarded by db.mu, for removeClosedStmtLocked
}
```

sql.DB数据结构对数据库做了一层简单的抽象，但是需要明确的是：`sql.DB不是一个连接，也不是映射到任何DataBase或者是Schema的概念`。

sql.DB可以执行一系列重要的任务：包括使用驱动打开和关闭实际底层数据库的连接；通过管理连接池，涉及相关的事务。

这个数据结构设计为长期存在的，不应该经常性地新建或者是删除。

在Gorm中，将DB类型和Session类型进行了封装。

```go

// DB GORM DB definition
type DB struct {
    *Config
    Error        error
    RowsAffected int64
    Statement    *Statement
    clone        int
}

// Session session config when create session with Session() method
type Session struct {
    // ...
    Context                  context.Context
    Logger                   logger.Interface
    NowFunc                  func() time.Time
    CreateBatchSize          int
}
```

其中数据库对象放置在Statement中

```go
// Statement statement
type Statement struct {
    *DB
    TableExpr            *clause.Expr
    Table                string
    Model                interface{}
    Unscoped             bool
    Dest                 interface{}
    ReflectValue         reflect.Value
    Clauses              map[string]clause.Clause
    // ...
    ConnPool             ConnPool
    Schema               *schema.Schema
    Context              context.Context
    // ...
}
```

# 2. Parse

对于一般数据对象，涉及对表的转换，一般需要这个对象提供信息：

包括表名到结构体名、字段名和字段类型、额外的约束条件（非空，自增等等）

在schema/field.go下面，设计了Field结构体，主要部分如下

```go
type Field struct {
    Name                   string
    DBName                 string
    BindNames              []string
    DataType               DataType
    GORMDataType           DataType
    // ... 
    FieldType              reflect.Type
    Tag                    reflect.StructTag
    // ...
}
```

对应reflect包下的Tag操作

```go
// A StructTag is the tag string in a struct field.
//
// By convention, tag strings are a concatenation of
// optionally space-separated key:"value" pairs.
// Each key is a non-empty string consisting of non-control
// characters other than space (U+0020 ' '), quote (U+0022 '"'),
// and colon (U+003A ':').  Each value is quoted using U+0022 '"'
// characters and Go string literal syntax.
type StructTag string

// Get returns the value associated with key in the tag string.
// If there is no such key in the tag, Get returns the empty string.
// If the tag does not have the conventional format, the value
// returned by Get is unspecified. To determine whether a tag is
// explicitly set to the empty string, use Lookup.
func (tag StructTag) Get(key string) string {
    v, _ := tag.Lookup(key)
    return v
}
```

在对数据类型进行解析时，会执行如下的操作

```go
func (schema *Schema) ParseField(fieldStruct reflect.StructField) *Field {
    // ...
    
    
    // default value is function or null or blank (primary keys)
    field.DefaultValue = strings.TrimSpace(field.DefaultValue)
    skipParseDefaultValue := strings.Contains(field.DefaultValue, "(") &&
        strings.Contains(field.DefaultValue, ")") || strings.ToLower(field.DefaultValue) == "null" || field.DefaultValue == ""
    switch reflect.Indirect(fieldValue).Kind() {
    case reflect.Bool:
        field.DataType = Bool
        if field.HasDefaultValue && !skipParseDefaultValue {
            if field.DefaultValueInterface, err = strconv.ParseBool(field.DefaultValue); err != nil {
                schema.err = fmt.Errorf("failed to parse %s as default value for bool, got error: %v", field.DefaultValue, err)
            }
        }
    case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
    // case ...
    }
}
```

# 3. Cause

对于复杂的SQL语句，一般是由多个子句组合而成，对于每一个子句，Gorm做了简单的抽象，并把子句生成的过程简化为Build方法。

```go
// Interface clause interface
type Interface interface {
    Name() string
    Build(Builder)
    MergeClause(*Clause)
}

// Expression expression interface
type Expression interface {
    Build(builder Builder)
}

// Builder builder interface
type Builder interface {
    Writer
    WriteQuoted(field interface{})
    AddVar(Writer, ...interface{})
}

// Clause
type Clause struct {
    Name                string // WHERE
    BeforeExpression    Expression
    AfterNameExpression Expression
    AfterExpression     Expression
    Expression          Expression
    Builder             ClauseBuilder
}
```

其中，Builder函数返回是Gorm链式操作的核心。

## 3.1. Select

对于查询部分，首先定义了查询的部分内容，将默认的查询内容用逗号分隔、去重

```go
package clause

// Select select attrs when querying, updating, creating
type Select struct {
    Distinct   bool
    Columns    []Column
    Expression Expression
}

func (s Select) Name() string {
    return "SELECT"
}

func (s Select) Build(builder Builder) {
    if len(s.Columns) > 0 {
        if s.Distinct {
            builder.WriteString("DISTINCT ")
        }

        for idx, column := range s.Columns {
            if idx > 0 {
                builder.WriteByte(',')
            }
            builder.WriteQuoted(column)
        }
    } else {
        builder.WriteByte('*')
    }
}

func (s Select) MergeClause(clause *Clause) {
    if s.Expression != nil {
        if s.Distinct {
            if expr, ok := s.Expression.(Expr); ok {
                expr.SQL = "DISTINCT " + expr.SQL
                clause.Expression = expr
                return
            }
        }

        clause.Expression = s.Expression
    } else {
        clause.Expression = s
    }
}

// CommaExpression represents a group of expressions separated by commas.
type CommaExpression struct {
    Exprs []Expression
}

func (comma CommaExpression) Build(builder Builder) {
    for idx, expr := range comma.Exprs {
        if idx > 0 {
            _, _ = builder.WriteString(", ")
        }
        expr.Build(builder)
    }
}
```

## 3.2. From

采用分类方式，考虑SQL92和SQL99语法上的差异

```go
package clause

// From from clause
type From struct {
    Tables []Table
    Joins  []Join
}

// Name from clause name
func (from From) Name() string {
    return "FROM"
}

// Build build from clause
func (from From) Build(builder Builder) {
    if len(from.Tables) > 0 {
        for idx, table := range from.Tables {
            if idx > 0 {
                builder.WriteByte(',')
            }

            builder.WriteQuoted(table)
        }
    } else {
        builder.WriteQuoted(currentTable)
    }

    for _, join := range from.Joins {
        builder.WriteByte(' ')
        join.Build(builder)
    }
}

// MergeClause merge from clause
func (from From) MergeClause(clause *Clause) {
    clause.Expression = from
}
```

## 3.3. Where

判定多种数据的结构进行合并操作。

```go
func (not NotConditions) Build(builder Builder) {
    if len(not.Exprs) > 1 {
        builder.WriteByte('(')
    }

    for idx, c := range not.Exprs {
        if idx > 0 {
            builder.WriteString(" AND ")
        }

        if negationBuilder, ok := c.(NegationExpressionBuilder); ok {
            negationBuilder.NegationBuild(builder)
        } else {
            builder.WriteString("NOT ")
            e, wrapInParentheses := c.(Expr)
            if wrapInParentheses {
                sql := strings.ToLower(e.SQL)
                if wrapInParentheses = strings.Contains(sql, "and") || strings.Contains(sql, "or"); wrapInParentheses {
                    builder.WriteByte('(')
                }
            }

            c.Build(builder)

            if wrapInParentheses {
                builder.WriteByte(')')
            }
        }
    }

    if len(not.Exprs) > 1 {
        builder.WriteByte(')')
    }
}
```

后续一系列操作与此类似，在此不再一一列出。

# 4. Hooks

利用接口实现，在执行对应操作时，会先进行相关的检查操作，实现较为简单。

```go
func BeforeCreate(db *gorm.DB) {
   if db.Error == nil && db.Statement.Schema != nil && !db.Statement.SkipHooks && (db.Statement.Schema.BeforeSave || db.Statement.Schema.BeforeCreate) {
      callMethod(db, func(value interface{}, tx *gorm.DB) (called bool) {
         if db.Statement.Schema.BeforeSave {
            if i, ok := value.(BeforeSaveInterface); ok {
               called = true
               db.AddError(i.BeforeSave(tx))
            }
         }

         if db.Statement.Schema.BeforeCreate {
            if i, ok := value.(BeforeCreateInterface); ok {
               called = true
               db.AddError(i.BeforeCreate(tx))
            }
         }
         return called
      })
   }
}
```

# 5. Transaction

Gorm采用的策略是，在事务执行过程中，判断DB对象的err信息，不为空则返回

```go
func BeginTransaction(db *gorm.DB) {
   if !db.Config.SkipDefaultTransaction && db.Error == nil {
      if tx := db.Begin(); tx.Error == nil {
         db.Statement.ConnPool = tx.Statement.ConnPool
         db.InstanceSet("gorm:started_transaction", true)
      } else if tx.Error == gorm.ErrInvalidTransaction {
         tx.Error = nil
      } else {
         db.Error = tx.Error
      }
   }
}

func CommitOrRollbackTransaction(db *gorm.DB) {
   if !db.Config.SkipDefaultTransaction {
      if _, ok := db.InstanceGet("gorm:started_transaction"); ok {
         if db.Error != nil {
            db.Rollback()
         } else {
            db.Commit()
         }

         db.Statement.ConnPool = db.ConnPool
      }
   }
}
```

实际上还可以采用一种比较优雅的设计实现。

```go
func (s Service) DoSomething() (err error) {
    tx, err := s.db.Begin()
    if err != nil {
        return
    }
    defer func() {
        if err != nil {
            tx.Rollback()
            return
        }
        if r := recover(); r != nil {
            tx.Rollback()
        }
        err = tx.Commit()
    }()
    if _, err = tx.Exec(...); err != nil {
        return
    }
    if _, err = tx.Exec(...); err != nil {
        return
    }
    // ...
    return
}
```

这里可以对比Java的JDBC操作，采用trycatch实现回滚。

```java
@Test
public void testUpdateWithTx() {
    Connection conn = null;
    try {
        //1.获取连接的操作（
        //① 手写的连接：JDBCUtils.getConnection();
        //② 使用数据库连接池：C3P0;DBCP;Druid
        //2.对数据表进行一系列CRUD操作
        //① 使用PreparedStatement实现通用的增删改、查询操作（version 1.0 \ version 2.0)
//version2.0的增删改public void update(Connection conn,String sql,Object ... args){}
//version2.0的查询 public <T> T getInstance(Connection conn,Class<T> clazz,String sql,Object ... args){}
        //② 使用dbutils提供的jar包中提供的QueryRunner类
            
        //提交数据
        conn.commit();
            
    
    } catch (Exception e) {
        e.printStackTrace();
            
            
        try {
            //回滚数据
            conn.rollback();
        } catch (SQLException e1) {
            e1.printStackTrace();
        }
            
    }finally{
        //3.关闭连接等操作
        //① JDBCUtils.closeResource();
        //② 使用dbutils提供的jar包中提供的DbUtils类提供了关闭的相关操作
            
    }
}
```

