---
title: "Go(6) Network"
date: 2021-10-26T19:35:13+08:00
lastmod: 2021-10-26T19:35:13+08:00
draft: false
author: "Chasing1020"
comment: true
keywords: ['Network']
description: ""
tags: ['Go']
categories: ['Language']
image: "go-model-sheet.webp"
---
# Part6. Network

## 1. IO/Polling

select 操作的不足之处：

- 监听能力有限 — 最多只能监听 1024 个文件描述符；
- 内存拷贝开销大 — 需要维护一个较大的数据结构存储文件描述符，该结构需要拷贝到内核中；
- 时间复杂度 O(n)O(n) — 返回准备就绪的事件个数后，需要遍历所有的文件描述符；

为了提高 I/O 多路复用的性能，不同的操作系统也都实现了自己的 I/O 多路复用函数，例如：`epoll`、`kqueue` 和 `evport` 等。Go 语言为了提高在不同操作系统上的 I/O 操作性能，使用平台的特定的函数实现了多个版本的网络轮询模块：

```go
func netpollinit()
func netpollopen(fd uintptr, pd *pollDesc) int32
func netpoll(delta int64) gList
func netpollBreak()
func netpollIsPollDescriptor(fd uintptr) bool
```

- [`runtime.netpollinit`](https://draveness.me/golang/tree/runtime.netpollinit) — 初始化网络轮询器，通过 [`sync.Once`](https://draveness.me/golang/tree/sync.Once) 和 `netpollInited` 变量保证函数只会调用一次；
- [`runtime.netpollopen`](https://draveness.me/golang/tree/runtime.netpollopen) — 监听文件描述符上的边缘触发事件，创建事件并加入监听；
- `runtime.netpoll`— 轮询网络并返回一组已经准备就绪的 Goroutine，传入的参数会决定它的行为
    - 如果参数小于 0，无限期等待文件描述符就绪；
    - 如果参数等于 0，非阻塞地轮询网络；
    - 如果参数大于 0，阻塞特定时间轮询网络；
- [`runtime.netpollBreak`](https://draveness.me/golang/tree/runtime.netpollBreak) — 唤醒网络轮询器，例如：计时器向前修改时间时会通过该函数中断网络轮询器[4](https://draveness.me/golang/docs/part3-runtime/ch06-concurrency/golang-netpoller/#fn:4)；
- [`runtime.netpollIsPollDescriptor`](https://draveness.me/golang/tree/runtime.netpollIsPollDescriptor) — 判断文件描述符是否被轮询器使用；

当前

## 2. Json Marshaler

序列化和反序列化的开销完全不同，JSON 反序列化的开销是序列化开销的好几倍，相信这背后的原因也非常好理解。Go 语言中的 JSON 序列化过程不需要被序列化的对象预先实现任何接口，它会通过反射获取结构体或者数组中的值并以树形的结构递归地进行编码，标准库也会根据 [`encoding/json.Unmarshal`](https://draveness.me/golang/tree/encoding/json.Unmarshal) 中传入的值对 JSON 进行解码。

在创建结构体时，可以添加tag来实现基本的解码方式，其中omitempty表示不存在时就丢弃，加入-代表永远丢弃该字段

```go
type Author struct {
    Name string `json:"name,omitempty"`
    Age  int32  `json:"age,string,omitempty"`
}
```

其中最重要的两个方法分别是

```go
// Marshal returns the JSON encoding of v.
func Marshal(v interface{}) ([]byte, error) {
   e := newEncodeState()

   err := e.marshal(v, encOpts{escapeHTML: true})
   if err != nil {
      return nil, err
   }
   buf := append([]byte(nil), e.Bytes()...)

   encodeStatePool.Put(e)

   return buf, nil
}
```

与反序列化

```go
// Unmarshal parses the JSON-encoded data and stores the result
// in the value pointed to by v. If v is nil or not a pointer,
// Unmarshal returns an InvalidUnmarshalError.
func Unmarshal(data []byte, v interface{}) error {
   // Check for well-formedness.
   // Avoids filling out half a data structure
   // before discovering a JSON syntax error.
   var d decodeState
   err := checkValid(data, &d.scan)
   if err != nil {
      return err
   }

   d.init(data)
   return d.unmarshal(v)
}
```

首先校验是否为Valid数据

## 3. DataBase

结构化查询语言（Structured Query Language、SQL）是在关系型数据库系统中使用的领域特定语言（Domain-Specific Language、DSL），它主要用于处理结构化的数据[1](https://draveness.me/golang/docs/part4-advanced/ch09-stdlib/golang-database-sql/#fn:1)。作为一门领域特定语言，它有更加强大的表达能力，与传统的命令式 API 相比，它能够提供两个优点：

1. 可以使用单个命令在数据库中访问多条数据；
2. 不需要在查询中指定获取数据的方法；

Go 语言的`database/sql` 就建立在上述前提下，我们可以使用相同的 SQL 语言查询关系型数据库，所有关系型数据库的客户端都需要实现如下所示的驱动接口：

```go
type Driver interface {
	Open(name string) (Conn, error)
}

type Conn interface {
	Prepare(query string) (Stmt, error)
	Close() error
	Begin() (Tx, error)
}
```
`database/sql/driver.Driver`接口中只包含一个 `Open` 方法，该方法接收一个数据库连接串作为输入参数并返回一个特定数据库的连接，作为参数的数据库连接串是数据库特定的格式，这个返回的连接仍然是一个接口。
`database/sql`中提供的 `database/sql.Register` 方法可以注册自定义的数据库驱动，这个 package 的内部包含两个变量，分别是 `drivers` 哈希以及 `driversMu` 互斥锁，所有的数据库驱动都会存储在这个哈希中：

```go
func Register(name string, driver driver.Driver) {
	driversMu.Lock()
	defer driversMu.Unlock()
	if driver == nil {
		panic("sql: Register driver is nil")
	}
	if _, dup := drivers[name]; dup {
		panic("sql: Register called twice for driver " + name)
	}
	drivers[name] = driver
}
```

MySQL 驱动会在 `go-sql-driver/mysql/mysql.init`中调用上述方法将实现 `database/sql/driver.Driver`接口的结构体注册到全局的驱动列表中：

```go
func init() {
	sql.Register("mysql", &MySQLDriver{})
}
```

当我们在全局变量中注册了驱动之后，就可以使用 `database/sql.Open`方法获取特定数据库的连接。在如下所示的方法中，我们通过传入的驱动名获取 `database/sql/driver.Driver`组成 `database/sql.dsnConnector`结构体后调用 `database/sql.OpenDB`：

```go
func Open(driverName, dataSourceName string) (*DB, error) {
	driversMu.RLock()
	driveri, ok := drivers[driverName]
	driversMu.RUnlock()
	if !ok {
		return nil, fmt.Errorf("sql: unknown driver %q (forgotten import?)", driverName)
	}
	...
	return OpenDB(dsnConnector{dsn: dataSourceName, driver: driveri}), nil
}
```

`database/sql.OpenDB` 会返回一个 `database/sql.DB` 结构，这是标准库包为我们提供的关键结构体，无论是我们直接使用标准库查询数据库，还是使用 GORM 等 ORM 框架都会用到它：

```go
func OpenDB(c driver.Connector) *DB {
	ctx, cancel := context.WithCancel(context.Background())
	db := &DB{
		connector:    c,
		openerCh:     make(chan struct{}, connectionRequestQueueSize),
		lastPut:      make(map[*driverConn]string),
		connRequests: make(map[uint64]chan connRequest),
		stop:         cancel,
	}
	go db.connectionOpener(ctx)
	return db
}
```

结构体 `database/sql.DB` 在刚刚初始化时不会包含任何的数据库连接，它持有的数据库连接池会在真正应用程序申请连接时在单独的 Goroutine 中获取。`database/sql.DB.connectionOpener`方法中包含一个不会退出的循环，每当该 Goroutine 收到了请求时都会调用 `database/sql.DB.openNewConnection`

```go
func (db *DB) openNewConnection(ctx context.Context) {
	ci, _ := db.connector.Connect(ctx)
	...
	dc := &driverConn{
		db:         db,
		createdAt:  nowFunc(),
		returnedAt: nowFunc(),
		ci:         ci,
	}
	if db.putConnDBLocked(dc, err) {
		db.addDepLocked(dc, dc)
	} else {
		db.numOpen--
		ci.Close()
	}
}
```

数据库结构体 [`database/sql.DB`](https://draveness.me/golang/tree/database/sql.DB) 中的链接器是实现了 `database/sql/driver.Connector`](https://draveness.me/golang/tree/database/sql/driver.Connector) 类型的接口，我们可以使用该接口创建任意数量完全等价的连接，创建的所有连接都会被加入连接池中，MySQL 的驱动在 `go-sql-driver/mysql/mysql.connector.Connect`方法实现了连接数据库的逻辑。

无论是使用 ORM 框架还是直接使用标准库，当我们在查询数据库时都会调用 `database/sql.DB.Query`方法，该方法的入参就是 SQL 语句和 SQL 语句中的参数，它会初始化新的上下文并调用 `database/sql.DB.QueryContext`

```go
func (db *DB) QueryContext(ctx context.Context, query string, args ...interface{}) (*Rows, error) {
	var rows *Rows
	var err error
	for i := 0; i < maxBadConnRetries; i++ {
		rows, err = db.query(ctx, query, args, cachedOrNewConn)
		if err != driver.ErrBadConn {
			break
		}
	}
	if err == driver.ErrBadConn {
		return db.query(ctx, query, args, alwaysNewConn)
	}
	return rows, err
}
```

`database/sql.DB.query` 的执行过程可以分成两个部分，首先调用私有方法 `database/sql.DB.conn` 获取底层数据库的连接，数据库连接既可能是刚刚通过连接器创建的，也可能是之前缓存的连接；获取连接之后调用 `database/sql.DB.queryDC`在特定的数据库连接上执行查询：

```go
func (db *DB) queryDC(ctx, txctx context.Context, dc *driverConn, releaseConn func(error), query string, args []interface{}) (*Rows, error) {
	queryerCtx, ok := dc.ci.(driver.QueryerContext)
	var queryer driver.Queryer
	if !ok {
		queryer, ok = dc.ci.(driver.Queryer)
	}
	if ok {
		var nvdargs []driver.NamedValue
		var rowsi driver.Rows
		var err error
		withLock(dc, func() {
			nvdargs, err = driverArgsConnLocked(dc.ci, nil, args)
			if err != nil {
				return
			}
			rowsi, err = ctxDriverQuery(ctx, queryerCtx, queryer, query, nvdargs)
		})
		if err != driver.ErrSkip {
			if err != nil {
				releaseConn(err)
				return nil, err
			}
			rows := &Rows{
				dc:          dc,
				releaseConn: releaseConn,
				rowsi:       rowsi,
			}
			rows.initContextClose(ctx, txctx)
			return rows, nil
		}
	}
	...
}
```

上述方法在准备了 SQL 查询所需的参数之后，会调用 `database/sql.ctxDriverQuery`完成 SQL 查询，我们会判断当前的查询上下文究竟实现了哪个接口，然后调用对应接口的 `Query` 或者 `QueryContext`：

```go
func ctxDriverQuery(ctx context.Context, queryerCtx driver.QueryerContext, queryer driver.Queryer, query string, nvdargs []driver.NamedValue) (driver.Rows, error) {
	if queryerCtx != nil {
		return queryerCtx.QueryContext(ctx, query, nvdargs)
	}
	dargs, err := namedValueToValue(nvdargs)
	if err != nil {
		return nil, err
	}
	...
	return queryer.Query(query, dargs)
}
```

对应的数据库驱动会真正负责执行调用方输入的 SQL 查询，作为中间层的标准库可以不在乎具体的实现，抹平不同关系型数据库的差异，为用户程序提供统一的接口。
