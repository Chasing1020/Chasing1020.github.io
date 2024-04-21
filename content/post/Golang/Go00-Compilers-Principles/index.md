---
title: "Go(0) Compilers Principles"
date: 2021-08-26T15:00:13+08:00
draft: false
author: "Chasing1020"
comment: true
keywords: ['Compilers']
description: ""
tags: ['Go']
categories: ['Language']
image: "go-model-sheet.webp"
---

# Part0. Compilers Principles

## 1. Stage

编译器技术影响了计算机的体系结构，同时也受到体系结构发展的影响。

体系结构的很多现代创新都依赖于编译器能从源程序中抽取出有效利用硬件能力的机会。

Go语言的编译执行流程阶段：词法解析、语法分析、AST构建、类型检查、变量捕获、函数内联、逃逸分析、闭包重写、遍历函数、SSA生成、机器码生成。

## 2. Lexical Analysis

Lex 是用于生成词法分析器的工具，Lex 生成的代码能够将一个文件中的字符分解成 Token 序列，很多语言在设计早期都会使用它快速设计出原型。词法分析作为具有固定模式的任务，出现这种更抽象的工具必然的，Lex 作为一个代码生成器，使用了类似 C 语言的语法，可以将 Lex 理解为正则匹配的生成器，它会使用正则匹配扫描输入的字符流。这里以最简单的helloworld程序为例：

```go
package main

import (
    "fmt"
)

func main() {
    fmt.Println("Hello, world!")
}
```

使用lex命令转化为C语言代码：

```go
int yylex (void) {
  ...
  while ( 1 ) {
    ...
yy_match:
    do {
      register YY_CHAR yy_c = yy_ec[YY_SC_TO_UI(*yy_cp)];
      if ( yy_accept[yy_current_state] ) {
        (yy_last_accepting_state) = yy_current_state;
        (yy_last_accepting_cpos) = yy_cp;
      }
      while ( yy_chk[yy_base[yy_current_state] + yy_c] != yy_current_state ) {
        yy_current_state = (int) yy_def[yy_current_state];
        if ( yy_current_state >= 30 )
          yy_c = yy_meta[(unsigned int) yy_c];
        }
      yy_current_state = yy_nxt[yy_base[yy_current_state] + (unsigned int) yy_c];
      ++yy_cp;
    } while ( yy_base[yy_current_state] != 37 );
    ...

do_action:
    switch ( yy_act )
      case 0:
          ...

      case 1:
          YY_RULE_SETUP
          printf("PACKAGE ");
          YY_BREAK
      ...
}
```

除了基本的宏定义以外，全部函数都使用有限自动机模型来解析输入的字符串，将上述Go代码作为lex输入可得：

```assembly
PACKAGE  IDENT

IMPORT  LPAREN
  QUOTE IDENT QUOTE
RPAREN

IDENT  IDENT LPAREN RPAREN  LBRACE
  IDENT DOT IDENT LPAREN QUOTE IDENT QUOTE RPAREN
RBRACE
```

Go语言的词法解析通过scanner结构体实现

```go
type scanner struct {
  source
  mode   uint
  nlsemi bool

  // current token, valid after calling next()
  line, col uint
  blank     bool // line is blank up to col
  tok       token
  lit       string   // valid if tok is _Name, _Literal, or _Semi ("semicolon", "newline", or "EOF"); may be malformed if bad is true
  bad       bool     // valid if tok is _Literal, true if a syntax error occurred, lit may be malformed
  kind      LitKind  // valid if tok is _Literal
  op        Operator // valid if tok is _Operator, _AssignOp, or _IncOp
  prec      int      // valid if tok is _Operator, _AssignOp, or _IncOp
}
```

其定义的next获取未解析的下一个字符，根据字符类型决定下一个case。

```go
func (s *scanner) next() {
  ...
  s.stop()
  startLine, startCol := s.pos()
  for s.ch == ' ' || s.ch == '\t' || s.ch == '\n' && !nlsemi || s.ch == '\r' {
    s.nextch()
  }

  s.line, s.col = s.pos()
  s.blank = s.line > startLine || startCol == colbase
  s.start()
  if isLetter(s.ch) || s.ch >= utf8.RuneSelf && s.atIdentChar(true) {
    s.nextch()
    s.ident()
    return
  }

  switch s.ch {
  case -1:
    s.tok = _EOF

  case '0', '1', '2', '3', '4', '5', '6', '7', '8', '9':
    s.number(false)
  ...
  }
}
```

此外，在go/scanner和go/token也提供了一些接口用以扫描源代码，示例如下

```go
func main() {
    src := []byte("cos(x)+2i*sin(x)") //So God exists
    var s scanner.Scanner
    fset := token.NewFileSet()
    file := fset.AddFile("", fset.Base(), len(src))
    s.Init(file, src, nil, scanner.ScanComments)
    for {
        pos, tok, lit := s.Scan()
        if tok == token.EOF {
            break
        }
        fmt.Printf("%s\t%s\t%q\n", fset.Position(pos), tok, lit)
    }
}
```

## 3. Syntax Analysis

### 3.1. Definition

一般使用一个四元组(N, Σ, P, S)来定义一个文法，其作为形式化描述语言的有效工具。
- N 有限个非终结符的集合；
- Σ 有限个终结符的集合；
- P 有限个生产规则的集合；
- S 非终结符集合中唯一的开始符号；

每一个Go语言源码被编译为AST时，其最顶层的结构都是SourceFile

```go
SourceFile = PackageClause ";" { ImportDecl ";" } { TopLevelDecl ";" } .
```

每一个文件都包含一个 `package` 的定义以及可选的 `import` 声明和其他的顶层声明，其还包括syntax结构体。

最顶层的声名包括了五大基本类型：常量、类型、变量、函数、方法

```go
ConstDecl = "const" ( ConstSpec | "(" { ConstSpec ";" } ")" ) .
ConstSpec = IdentifierList [ [ Type ] "=" ExpressionList ] .

TypeDecl  = "type" ( TypeSpec | "(" { TypeSpec ";" } ")" ) .
TypeSpec  = AliasDecl | TypeDef .
AliasDecl = identifier "=" Type .
TypeDef   = identifier Type .

VarDecl = "var" ( VarSpec | "(" { VarSpec ";" } ")" ) .
VarSpec = IdentifierList ( Type [ "=" ExpressionList ] | "=" ExpressionList ) .
```
此即对应着const、type 和 var，而函数和函数和方法的定义就更加复杂
```go
FunctionDecl = "func" FunctionName Signature [ FunctionBody ] .
FunctionName = identifier .
FunctionBody = Block .

MethodDecl = "func" Receiver MethodName Signature [ FunctionBody ] .
Receiver   = Parameters .

Block = "{" StatementList "}" .
StatementList = { Statement ";" } .

Statement =
  Declaration | LabeledStmt | SimpleStmt |
  GoStmt | ReturnStmt | BreakStmt | ContinueStmt | GotoStmt |
  FallthroughStmt | Block | IfStmt | SwitchStmt | SelectStmt | ForStmt |
  DeferStmt .

SimpleStmt = EmptyStmt | ExpressionStmt | SendStmt | IncDecStmt | Assignment | ShortVarDecl .
```

这里的语法结构就对应了常见的 switch/case、if/else、for 循环以及 select 等语句。

这里再次以基础的程序为示例

```go
package main  // PkgName

import "fmt"  // ImportDecl

const word = "world!"  // ConstDecl
type mystr string  // TypeDecl
var hello mystr = "Hello, " + world // VarDecl

func main() {
  fmt.Println(hello)  // FuncDecl  ->  CallExpr  
                      //-> SelectorExpr(Name:fmt, Name:Println), Name = hello
}
```

在执行语法分析的过程中，常见两种方法：

自顶向下：可以被看作找到当前输入流最左推导的过程，对于任意一个输入流，根据当前的输入符号，确定一个生产规则，使用生产规则右侧的符号替代相应的非终结符向下推导

自底向上：语法分析器从输入流开始，每次都尝试重写最右侧的多个符号，这其实是说解析器会从最简单的符号进行推导，在解析的最后合并成开始符号

和大多数语言一样，Go语言的解析器使用了 LALR(1) 的文法来解析词法分析过程中输出的 Token 序列。

### 3.2. AST 

对于Go源文件的每一个import，type，const，func都是一个根节点。在此之下包含当前声明的子节点。

```go
// noder transforms package syntax's AST into a Node tree.
type noder struct {
    posMap

    file           *syntax.File
    linknames      []linkname
    pragcgobuf     [][]string
    err            chan syntax.Error
    importedUnsafe bool
    importedEmbed  bool
    trackScopes    bool

    funcState *funcState
}
```

利用decls将源文件的所有声明语句转换为Node数组

```go
func (p *noder) decls(decls []syntax.Decl) (l []ir.Node) {
    var cs constState
    for _, decl := range decls {
        p.setlineno(decl)
        switch decl := decl.(type) {
        case *syntax.ImportDecl:
            p.importDecl(decl)
        case *syntax.VarDecl:
            l = append(l, p.varDecl(decl)...)
        case *syntax.ConstDecl:
            l = append(l, p.constDecl(decl, &cs)...)
        case *syntax.TypeDecl:
            l = append(l, p.typeDecl(decl))
        case *syntax.FuncDecl:
            l = append(l, p.funcDecl(decl))
        default:
            panic("unhandled Decl")
        }
    }
    return
}
```

`stringer` 充分利用了 Go 语言标准库对编译器各种能力的支持，其中包括用于解析抽象语法树的 `go/ast`、用于格式化代码的 `go/fmt`等，Go 通过标准库中的这些包对外直接提供了编译器的相关能力，让使用者可以直接在它们上面构建复杂的代码生成机制并实施元编程技术。

作为二进制文件，`stringer` 命令的入口就是如下所示的 `golang/tools/main.main`函数，在下面的代码中，我们初始化了一个用于解析源文件和生成代码的 `golang/tools/main.Generator`，然后开始拼接生成的文件：

```go
func main() {
  types := strings.Split(*typeNames, ",")
  ...
  g := Generator{
    trimPrefix:  *trimprefix,
    lineComment: *linecomment,
  }
  ...

  g.Printf("// Code generated by \"stringer %s\"; DO NOT EDIT.\n", strings.Join(os.Args[1:], " "))
  g.Printf("\n")
  g.Printf("package %s", g.pkg.name)
  g.Printf("\n")
  g.Printf("import \"strconv\"\n")

  for _, typeName := range types {
    g.generate(typeName)
  }

  src := g.format()

  baseName := fmt.Sprintf("%s_string.go", types[0])
  outputName = filepath.Join(dir, strings.ToLower(baseName))
  if err := ioutil.WriteFile(outputName, src, 0644); err != nil {
    log.Fatalf("writing output: %s", err)
  }
}
```

从这段代码中我们能看到最终生成文件的轮廓，最上面的调用的几次 `golang/tools/main.Generator.Printf` 会在内存中写入文件头的注释、当前包名以及引入的包等，随后会为待处理的类型依次调用 `golang/tools/main.Generator.generate`，这里会生成一个签名为 `_` 的函数，通过编译器保证枚举类型的值不会改变：

```go
func (g *Generator) generate(typeName string) {
  values := make([]Value, 0, 100)
  for _, file := range g.pkg.files {
    file.typeName = typeName
    file.values = nil
    if file.file != nil {
      ast.Inspect(file.file, file.genDecl)
      values = append(values, file.values...)
    }
  }
  g.Printf("func _() {\n")
  g.Printf("\t// An \"invalid array index\" compiler error signifies that the constant values have changed.\n")
  g.Printf("\t// Re-run the stringer command to generate them again.\n")
  g.Printf("\tvar x [1]struct{}\n")
  for _, v := range values {
    g.Printf("\t_ = x[%s - %s]\n", v.originalName, v.str)
  }
  g.Printf("}\n")
  runs := splitIntoRuns(values)
  switch {
  case len(runs) == 1:
    g.buildOneRun(runs, typeName)
  ...
  }
}
```

随后调用的 `golang/tools/main.Generator.buildOneRun` 会生成两个常量的声明语句并为类型定义 `String` 方法，其中引用的 `stringOneRun` 常量是方法的模板，与 Web 服务的前端 HTML 模板比较相似：

```go
func (g *Generator) buildOneRun(runs [][]Value, typeName string) {
  values := runs[0]
  g.Printf("\n")
  g.declareIndexAndNameVar(values, typeName)
  g.Printf(stringOneRun, typeName, usize(len(values)), "")
}

const stringOneRun = func (i %[1]s) String() string {
  if %[3]si >= %[1]s(len(_%[1]s_index)-1) {
    return "%[1]s(" + strconv.FormatInt(int64(i), 10) + ")"
  }
  return _%[1]s_name[_%[1]s_index[i]:_%[1]s_index[i+1]]
}
```

整个生成代码的过程就是使用编译器提供的库解析源文件并按照已有的模板生成新的代码，这与 Web 服务中利用模板生成 HTML 文件没有太多的区别，只是生成文件的用途稍微有一些不同。



## 4. After AST

### 4.1. Type Checker

在完成AST的构建后，会对一些类型做特别的语法和语义检查，其不仅使用静态类型检查来保证程序运行的类型安全，还会在编程期间引入类型信息，让工程师能够使用反射来判断参数和变量的类型。当我们想要将 `interface{}` 转换成具体类型时会进行动态类型检查，如果无法发生转换就会发生程序崩溃。

此外，这个阶段还会进行编译时常量，标识符声明绑定等。

### 4.2. Variable Capturing

完成类型检查后，编译器会对AST分析重构，完成一些列优化，这部分主要针对Closures实现，会专门检查闭包变量捕获的情况。

### 4.3. Function Inline

函数调用的主要成本在于参数与返回值的栈复制，较小的栈寄存器开销以及函数序言部分检查栈扩容等。

Go编译器会对函数内联成本做估计，当函数有for，range，go，select，递归调用，存在//go:noinline这种编译器指示时，编译器不会进行优化。调试过程中，添加-gcflags="-l"也不会发生内联。在编译时，添加-m=2可以查看不会被内联的原因

```go
func fib(index int) int {
    if index < 2 {
        return index
    }
    return fib(index-1) + fib(index-2)  //cannot inline fib: recursive
}
```

附其余编译器指示：

//go:noescape 指令后面必须跟一个没有主体的函数声明（意味着该函数的实现不是用 Go 编写的）

//go:uintptrescapes 指令后面必须跟一个函数声明。它指定函数的 uintptr 参数可能是已转换为 uintptr 的指针值，并且必须由垃圾收集器进行处理。

//go:noinline 指令后面必须跟一个函数声明。它指定不应内联对函数的调用，从而覆盖编译器的通常优化规则。这通常仅在特殊运行时函数或调试编译器时需要。

//go:norace 指令后面必须跟一个函数声明。它指定竞争检测器必须忽略函数的内存访问。这最常用于在调用竞争检测器运行时不安全时调用的低级代码。

//go:nosplit 指令后面必须跟一个函数声明。它指定函数必须省略其通常的堆栈溢出检查。这最常用于在调用 goroutine 被抢占是不安全的时候调用的低级运行时代码。

### 4.4. Escape Analysis

Go的内存模型严格要求栈的对象指针不能存放到堆中，栈上对象的指针不能超过该栈对象的声明周期。

通过对AST的静态数据流分析（static data-flow analysis），可以实现带权重有向图的分析来做逃逸判断。被引用的对象权重-1（即&），而权重大于0则表示存在解引用操作（即*），对于小于0且超过了当前生命周期的变量，进行逃逸处理。

### 4.5. Closure Rewriting

闭包重写分为定义后立即调用和不被立即调用两种情况，在立即调用的情况下，会转换成普通的函数调用的形式，而不被立即调用，则会创建一个闭包对象。

如果对象是按值应用的，且空间小于2*sizeof(int)，那么通过在函数体内创建局部变量的形式来产生该变量。如果存在指针或者引用，那么捕获的变量转换成指针类型的&var，会初始化为捕获变量的值。

### 4.6. Function Traversal

遍历函数，在gc/walk.go中，会识别出生命但是未被使用的变量，带节点的操作转换为具体函数执行，如map获取值会转换为mapaccess_fast64函数，字符串拼接转换为concatstrings，forrange拆开等，同时会根据需要引入临时变量以及语句重排序，如x/=y拆成x=x/y


## 5. SSA

SSA生成阶段是编译器进行后续优化的保证，如常量传播，无效代码消除，冗余消除，强度降低等。

Go在1.7版本引入并成为现代的编译器后端，此时会用于处理 `defer` 关键字的 `runtime.deferproc`、用于创建 Goroutine 的 `runtime.newproc` 和扩容切片的 `runtime.growslice` 等，

这里会对关键字或者内建函数到运行时函数的映射其中涉及 Channel、哈希、`make`、`new` 关键字以及控制流中的关键字 `select` 等，经过walk函数遍历之后，SAA便不会再改变。

```go
func compileSSA(fn *Node, worker int) {
  f := buildssa(fn, worker)
  pp := newProgs(fn, worker)
  genssa(f, pp)

  pp.Flush()
}
```

可以通过GOSSAFUNC=hello go build hello.go来查看SSA生成的过程。

```go
func (s *state) stmt(n *Node) {
  ...
  switch n.Op {
  case OCALLMETH, OCALLINTER:
    s.call(n, callNormal)
    if n.Op == OCALLFUNC && n.Left.Op == ONAME && n.Left.Class() == PFUNC {
      if fn := n.Left.Sym.Name; compiling_runtime && fn == "throw" ||
        n.Left.Sym.Pkg == Runtimepkg && (fn == "throwinit" || fn == "gopanic" || fn == "panicwrap" || fn == "block" || fn == "panicmakeslicelen" || fn == "panicmakeslicecap") {
        m := s.mem()
        b := s.endBlock()
        b.Kind = ssa.BlockExit
        b.SetControl(m)
      }
    }
    s.call(n.Left, callDefer)
  case OGO:
    s.call(n.Left, callGo)
  ...
  }
}
```

从AST到SAA的转换可以发现，在遇到函数调用、方法调用、使用 defer 或者 go 关键字时都会执行 `cmd/compile/internal/gc.state.callResult` 和 `cmd/compile/internal/gc.state.call`生成调用函数的 SSA 节点，这些在开发者看来不同的概念在编译器中都会被实现成静态的函数调用，上层的关键字和方法只是语言为我们提供的语法糖。

某些中间代码仍然需要编译器优化以去掉无用代码并精简操作数：

```go
func Compile(f *Func) {
  if f.Log() {
    f.Logf("compiling %s\n", f.Name)
  }

  phaseName := "init"

  for _, p := range passes {
    f.pass = &p
    p.fn(f)
  }

  phaseName = ""
}
```

## 6. Machine Code Generation

SSA 降级是在中间代码生成的过程中完成的，其中将近 50 轮处理的过程中，`lower` 以及后面的阶段都属于 SSA 降级这一过程，这么多轮的处理会将 SSA 转换成机器特定的操作：

```go
var passes = [...]pass{
  ...
  {name: "lower", fn: lower, required: true},
  {name: "lowered deadcode for cse", fn: deadcode}, // deadcode immediately before CSE avoids CSE making dead values live again
  {name: "lowered cse", fn: cse},
  ...
  {name: "trim", fn: trim}, // remove empty blocks
}
```

转换过程会对应CPU的架构做分析

```go
func rewriteValue386(v *Value) bool {
  switch v.Op {
  case Op386ADCL:
    return rewriteValue386_Op386ADCL_0(v)
  case Op386ADDL:
    return rewriteValue386_Op386ADDL_0(v) || rewriteValue386_Op386ADDL_10(v) || rewriteValue386_Op386ADDL_20(v)
  ...
  }
}

func rewriteValue386_Op386ADCL_0(v *Value) bool {
  // match: (ADCL x (MOVLconst [c]) f)
  // cond:
  // result: (ADCLconst [c] x f)
  for {
    _ = v.Args[2]
    x := v.Args[0]
    v_1 := v.Args[1]
    if v_1.Op != Op386MOVLconst {
      break
    }
    c := v_1.AuxInt
    f := v.Args[2]
    v.reset(Op386ADCLconst)
    v.AuxInt = c
    v.AddArg(x)
    v.AddArg(f)
    return true
  }
  ...
}
```

Go 语言的汇编器是基于 Plan 9 汇编器的输入类型设计的

```go
package hello

func hello(a int) int {
  c := a + 2
  return c
}
$ GOOS=linux GOARCH=amd64 go tool compile -S hello.go
"".hello STEXT nosplit size=15 args=0x10 locals=0x0
  0x0000 00000 (main.go:3)  TEXT  "".hello(SB), NOSPLIT, $0-16
  0x0000 00000 (main.go:3)  FUNCDATA  $0, gclocals·33cdeccccebe80329f1fdbee7f5874cb(SB)
  0x0000 00000 (main.go:3)  FUNCDATA  $1, gclocals·33cdeccccebe80329f1fdbee7f5874cb(SB)
  0x0000 00000 (main.go:3)  FUNCDATA  $3, gclocals·33cdeccccebe80329f1fdbee7f5874cb(SB)
  0x0000 00000 (main.go:4)  PCDATA  $2, $0
  0x0000 00000 (main.go:4)  PCDATA  $0, $0
  0x0000 00000 (main.go:4)  MOVQ  "".a+8(SP), AX
  0x0005 00005 (main.go:4)  ADDQ  $2, AX
  0x0009 00009 (main.go:5)  MOVQ  AX, "".~r1+16(SP)
  0x000e 00014 (main.go:5)  RET
  0x0000 48 8b 44 24 08 48 83 c0 02 48 89 44 24 10 c3     H.D$.H...H.D$..
...
```

上述汇编代码都是由 [`cmd/internal/obj.Flushplist`](https://draveness.me/golang/tree/cmd/internal/obj.Flushplist) 这个函数生成的，该函数会调用架构特定的 `Preprocess` 和 `Assemble` 方法。自此完成最终的机器码生成。
