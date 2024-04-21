---
title: "Go(2) Language Basic"
date: 2021-09-14T19:26:33+08:00
draft: false
author: "Chasing1020"
comment: true
keywords: ['Data Structure']
description: ""
tags: ['Go']
categories: ['Language']
image: "go-model-sheet.webp"
---

# Part2. Language Basic

## 1. Function

```go
type funcval struct {
    fn uintptr
    // variable-size, fn-specific data here
}
```

funcval使用二级指针，可以处理闭包（1.外部定义，内部引用的自由变量 2.脱离闭包上下文也能保留这些变量）

```go
func create() (fs [2]func()) {
    for i := 0; i < 2; i++ {
        fs[i] = func() {
            fmt.Println(i)
        }
    }
    return
}
// i 在堆区发生变量逃逸
func main() {
    fs := create()
    for i := 0 ; i<2; i++{
        fs[i]() // 2 2
    }
}
```

函数调用一般分为两种情况：

- 传值：函数调用时会对参数进行拷贝，被调用方和调用方两者持有不相关的两份数据；
- 传引用：函数调用时会传递参数的指针，被调用方和调用方两者持有相同的数据，任意一方做出的修改都会影响另一方。

不同语言会选择不同的方式传递参数，Go 语言选择了传值的方式，**无论是传递基本类型、结构体还是指针，都会对传递的参数进行拷贝**。

- 整型和数组类型都是值传递的
- 传递结构体时：会拷贝结构体中的全部内容；
- 传递结构体指针时：会拷贝结构体指针；

综上所述：应该尽量使用指针作为参数类型来避免发生数据拷贝进而影响性能。

## 2. Interface

接口一般有两类，eface为不带方法的接口，iface表示带方法的接口。

### 2.1. Empty Interface

```go
type eface struct {
    _type *_type
    data  unsafe.Pointer
}

// Needs to be in sync with ../cmd/link/internal/ld/decodesym.go:/^func.commonsize,
// ../cmd/compile/internal/gc/reflect.go:/^func.dcommontype and
// ../reflect/type.go:/^type.rtype.
// ../internal/reflectlite/type.go:/^type.rtype.
// 所有类的类型元信息
type _type struct {
    size       uintptr
    ptrdata    uintptr // size of memory prefix holding all pointers
    hash       uint32  // hash 是对 _type.hash 的拷贝，当我们想将 interface 类型转换成具体类型时，可以使用该字段快速判断目标类型和具体类型是否一致
    tflag      tflag
    align      uint8
    fieldAlign uint8
    kind       uint8
    // function for comparing objects of this type
    // (ptr to object A, ptr to object B) -> ==?
    equal func(unsafe.Pointer, unsafe.Pointer) bool
    // gcdata stores the GC type data for the garbage collector.
    // If the KindGCProg bit is set in kind, gcdata is a GC program.
    // Otherwise it is a ptrmask bitmap. See mbitmap.go for details.
    gcdata    *byte
    str       nameOff
    ptrToThis typeOff
}

func efaceOf(ep *interface{}) *eface {
    return (*eface)(unsafe.Pointer(ep))
}
```

```go
type _interface struct {
    dynamicTypeInfo *_implementation
    dynamicValue    unsafe.Pointer // unsafe.Pointer means
                                   // *ArbitraryType in Go.
}

type _implementation struct {
    itype   *_type   // the interface type.
    dtype   *_type   // the dynamic type, which must implement itype.
    methods []*_func // the methods which are defined on dtype
                     // and each of them implements a
                     // corresponding method declared in itype.
}
```

其中，Go语言每一个新定义的数据类型都会有一个类型元数据记为_type，并记录该类型的大小，边界，名称，是否可比较等等

同时可以使用type方法来自定义新的类型元数据

```go
type mytype1 = int32
type mytype2 int32
```

前者为起别名，都是同样的数据类型（rune和int32的实现），后者则会完全分配新的类型信息。

### 2.2. Non-empty interface

```go
type iface struct {
    tab  *itab
    data unsafe.Pointer
}

type itab struct {
    inter *interfacetype
    _type *_type
    hash  uint32
    _     [4]byte
    fun   [1]uintptr // variable sized. fun[0]==0 means _type does not implement inter.
}

type interfacetype struct {
    typ     _type
    pkgpath name
    mhdr    []imethod
}
```

Go在运行时，itab会拷贝动态类型方法的地址，以便快速定位到方法，而不用每次都去类型元数据那里去找。

同时，运行时，对于每一个itab结构体，Go会生成一个512个大小的hashmap，以接口类型为key，动态类型为value类型来缓存itab的信息，与哈希表的table进行异或运算，得到类型。

```go
const itabInitSize = 512
// Note: change the formula in the mallocgc call in itabAdd if you change these fields.
type itabTableType struct {
    size    uintptr             // length of entries array. Always a power of 2.
    count   uintptr             // current number of filled entries.
    entries [itabInitSize]*itab // really [size] large
}

func itabHashFunc(inter *interfacetype, typ *_type) uintptr {
    // compiler has provided some good hash codes for us.
    return uintptr(inter.typ.hash ^ typ.hash)
}
```
隐式类型转换
```go
package main

import "fmt"

type GrpcError struct{}

func (e GrpcError) Error() string {
    return "GrpcError"
}

func main() {
    err := cal()
    fmt.Println(err)            // 打印：<nil>
    fmt.Println(err == nil)     // 打印：false
}

func cal() error {
    var err *GrpcError = nil
    return err
}
```
在 main 中判断 err 是否为 nil，答案是 false。error 是一个非空 interface，底层数据结构是 iface，尽管 data 是 nil，但是 *itab 并不为空，所以 err == nil 答案为 false。
### 2.3. Type Assert

类型断言一共有四种组合

1. 空接口.(具体类型)
    因为每种数据类型的元类型都是全局唯一的，所以只需要比较\_type指向的是不是断言的具体类型指针即可
2. 非空接口.(具体类型)
    比较&itab是不是断言类型的指针即可，这里的比较通过itabHashFunc函数实现，只需计算一次异或即可
3. 空接口.(非空接口)
    比较类型元数据是不是断言类型的指针，成功则会返回指向断言类型的itab结构体指针
4. 非空接口.(空接口)
	比较itab是不时断言类型的指针，且要求fun[0]!=0，表示方法都已经全部实现


此外实现接口的类型和初始化返回的类型两个维度共组成了四种情况：

|                      | 结构体实现接口 | 结构体指针实现接口 |
| :------------------: | :------------: | ------------------ |
|   结构体初始化变量   |      通过      | 不通过             |
| 结构体指针初始化变量 |      通过      | 通过               |

## 3.Reflection

### 3.1. Implement

```go
package runtime
// Needs to be in sync with ../cmd/link/internal/ld/decodesym.go:/^func.commonsize,
// ../cmd/compile/internal/gc/reflect.go:/^func.dcommontype and
// ../reflect/type.go:/^type.rtype.
// ../internal/reflectlite/type.go:/^type.rtype.
type _type struct {
   size       uintptr
   ptrdata    uintptr // size of memory prefix holding all pointers
   hash       uint32
   tflag      tflag
   align      uint8
   fieldAlign uint8
   kind       uint8
   // function for comparing objects of this type
   // (ptr to object A, ptr to object B) -> ==?
   equal func(unsafe.Pointer, unsafe.Pointer) bool
   // gcdata stores the GC type data for the garbage collector.
   // If the KindGCProg bit is set in kind, gcdata is a GC program.
   // Otherwise it is a ptrmask bitmap. See mbitmap.go for details.
   gcdata    *byte
   str       nameOff
   ptrToThis typeOff
}
```
runtime的包的\_type类型是非导出的，所以在reflect包下重写了一遍，称为rtype，并实现了Type接口
```go
package reflect
// rtype is the common implementation of most values.
// It is embedded in other struct types.
//
// rtype must be kept in sync with ../runtime/type.go:/^type._type.
type rtype struct {
   size       uintptr
   ptrdata    uintptr // number of bytes in the type that can contain pointers
   hash       uint32  // hash of type; avoids computation in hash tables
   tflag      tflag   // extra type information flags
   align      uint8   // alignment of variable with this type
   fieldAlign uint8   // alignment of struct field with this type
   kind       uint8   // enumeration for C
   // function for comparing objects of this type
   // (ptr to object A, ptr to object B) -> ==?
   equal     func(unsafe.Pointer, unsafe.Pointer) bool
   gcdata    *byte   // garbage collection data
   str       nameOff // string form
   ptrToThis typeOff // type for pointer to this type, may be zero
}
```

### 3.2. The Lows Of Reflection

Reference : https://go.dev/blog/laws-of-reflection

```go
type Type interface {
  Align() int
  FieldAlign() int
  Method(int) Method 
  MethodByName(string) (Method, bool)  // MethodByName 可以获取当前类型对应方法的引用
  NumMethod() int
  ...
  Implements(u Type) bool  // Implements 可以判断当前类型是否实现了某个接口
  ...
}
```

反射三大原则：

1. 从 `interface{}` 变量可以反射出反射对象；
2. 从反射对象可以获取 `interface{}` 变量；
3. 要修改反射对象，其值必须可设置；

`reflect.ValueOf(1)` 时，虽然看起来是获取了基本类型 `int` 对应的反射类型，其实是由以下两个方法反射获取数据原变量

```go
// ValueOf returns a new Value initialized to the concrete value
// stored in the interface i. ValueOf(nil) returns the zero Value.
func ValueOf(i interface{}) Value {
   if i == nil {
      return Value{}
   }
   // TODO: Maybe allow contents of a Value to live on the stack.
   // For now we make the contents always escape to the heap. It
   // makes life easier in a few places (see chanrecv/mapassign
   // comment below).
   escapes(i)
   return unpackEface(i)
}
// unpackEface converts the empty interface i to a Value.
func unpackEface(i interface{}) Value {
    e := (*emptyInterface)(unsafe.Pointer(&i))
    // NOTE: don't read e.word until we know whether it is really a pointer or not.
    t := e.typ
    if t == nil {
        return Value{}
    }
    f := flag(t.Kind())
    if ifaceIndir(t) {
        f |= flagIndir
    }
    return Value{t, e.word, f}
}
```
反射方法中，\*emptyInterface其实就是eface的重写
```go
// TypeOf returns the reflection Type that represents the dynamic type of i.
// If i is a nil interface value, TypeOf returns nil.
func TypeOf(i interface{}) Type {
   eface := *(*emptyInterface)(unsafe.Pointer(&i))
   return toType(eface.typ)
}
func toType(t *rtype) Type {
    if t == nil {
        return nil
    }
    return t
}
```

2. 通过反射获取interface变量

```go
type flag uintptr
// To compare two Values, compare the results of the Interface method.
// Using == on two Values does not compare the underlying values
// they represent.
type Value struct {
    // typ holds the type of the value represented by a Value.
    typ *rtype
    // Pointer-valued data or, if flagIndir is set, pointer to data.
    // Valid when either flagIndir is set or typ.pointers() is true.
    ptr unsafe.Pointer
    // flag holds metadata about the value.
    flag
}

// Interface returns v's current value as an interface{}.
// It is equivalent to:
// var i interface{} = (v's underlying value)
// It panics if the Value was obtained by accessing
// unexported struct fields.
func (v Value) Interface() (i interface{}) {
   return valueInterface(v, true)
}
```

```go
v := reflect.ValueOf(1)
v.Interface().(int)
```

- 从接口值到反射对象：
    - 从基本类型到接口类型的类型转换；
    - 从接口类型到反射对象的转换；
- 从反射对象到接口值：
    - 反射对象转换成接口类型；
    - 通过显式类型转换变成原始类型；

可以通过以下这张图展示数据类型之间的关系
![img](https://img.halfrost.com/Blog/ArticleImage/148_6_0.png)
Go语言修改反射后变量只能通过如下方法来实现：

```go
func main() {
    i := 1
    v := reflect.ValueOf(&i)
    v.Elem().SetInt(10)
    fmt.Println(i)
}
```
调用 reflect.ValueOf 获取变量指针；
调用 reflect.Value.Elem 获取指针指向的变量；
调用 reflect.Value.SetInt 更新变量的值：

### 3.3. Type And Value

Go 语言的 interface{}类型在语言内部是通过 reflect.emptyInterface结体表示的，其中的 rtype 字段用于表示变量的类型，另一个 word 字段指向内部封装的数据：

```go
type emptyInterface struct {
    typ  *rtype
    word unsafe.Pointer
}
```

用于获取变量类型的 reflect.TypeOf函数将传入的变量隐式转换成 reflect.emptyInterface类型并获取其中存储的类型信息 reflect.rtype：

```go
func TypeOf(i interface{}) Type {
    eface := *(*emptyInterface)(unsafe.Pointer(&i))
    return toType(eface.typ)
}

func toType(t *rtype) Type {
    if t == nil {
        return nil
    }
    return t
}

func (t *rtype) String() string {
    s := t.nameOff(t.str).name()
    if t.tflag&tflagExtraStar != 0 {
        return s[1:]
    }
    return s
}
```

reflect.rtype 是一个实现了 reflect.Type 接口的结构体，该结构体实现的 reflect.rtype.String方法可以帮助我们获取当前类型的名称：

```go
func (t *rtype) String() string {
    s := t.nameOff(t.str).name()
    if t.tflag&tflagExtraStar != 0 {
        return s[1:]
    }
    return s
}
```

reflect.TypeOf的实现原理其实并不复杂，它只是将一个 interface{} 变量转换成了内部的 reflect.emptyInterface 表示，然后从中获取相应的类型信息。

使用reflect.ValueOf()获取reflect.Value类型，这里先使用了escapes将变量逃逸到堆上，再获取结构体

```go
func ValueOf(i interface{}) Value {
    if i == nil {
        return Value{}
    }

    escapes(i)
    return unpackEface(i)
}

// Dummy annotation marking that the value x escapes,
// for use in cases where the reflect code is so clever that
// the compiler cannot follow.
func escapes(x interface{}) {
    if dummy.b {
        dummy.x = x
    }
}
//dummy 变量就是一个虚拟标注，标记入参 x 逃逸了。这样标记是为了防止反射代码写的过于高级，以至于编译器跟不上了。
var dummy struct {
    b bool
    x interface{}
}


func unpackEface(i interface{}) Value {
    e := (*emptyInterface)(unsafe.Pointer(&i))
    t := e.typ
    if t == nil {
        return Value{}
    }
    f := flag(t.Kind())
    if ifaceIndir(t) {
        f |= flagIndir
    }
    return Value{t, e.word, f}
}

type Value struct {
   // typ holds the type of the value represented by a Value.
    typ *rtype // 类型元数据指针
    ptr unsafe.Pointer // 数据地址
    flag // 位标识符信息
}
```


使用反射运行方法
```go
func Add(a, b int) int { return a + b }

func main() {
    v := reflect.ValueOf(Add)
    if v.Kind() != reflect.Func {
        return
    }
    t := v.Type()
    argv := make([]reflect.Value, t.NumIn())
    for i := range argv {
        if t.In(i).Kind() != reflect.Int {
            return
        }
        argv[i] = reflect.ValueOf(i)
    }
    result := v.Call(argv)
    if len(result) != 1 || result[0].Kind() != reflect.Int {
        return
    }
    fmt.Println(result[0].Int()) // #=> 1
}
```
