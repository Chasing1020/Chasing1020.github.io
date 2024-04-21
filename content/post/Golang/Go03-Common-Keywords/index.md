---
title: "Go(3) Common Keywords"
date: 2021-09-20T12:27:33+08:00
draft: false
author: "Chasing1020"
comment: true
keywords: ['']
description: ""
tags: ['Go']
categories: ['Language']
image: "go-model-sheet.webp"
---

# Part3. Common Keyword

## 1. For And Range

对于所有的 range 循环，Go 语言都会在编译期将原切片或者数组赋值给一个新变量 `ha`，在赋值的过程中就发生了拷贝，而我们又通过 `len` 关键字预先获取了切片的长度，所以在循环中追加新的元素也不会改变循环执行的次数，这也就解释了循环永动机一节提到的现象。

```go
func main() {
    arr := []int{1, 2, 3}
    newArr := []*int{}
    for i, _ := range arr {
        newArr = append(newArr, &arr[i])
    }
    for _, v := range newArr {
        fmt.Println(*v)
    }
}
```

而遇到这种同时遍历索引和元素的 range 循环时，Go 语言会额外创建一个新的 `v2` 变量存储切片中的元素，**循环中使用的这个变量 v2 会在每一次迭代被重新赋值而覆盖，赋值时也会触发拷贝**。

在遍历哈希表时，会发生如下操作：

```go
ha := a
hit := hiter(n.Type)
th := hit.Type
mapiterinit(typename(t), ha, &hit)
for ; hit.key != nil; mapiternext(&hit) {
    key := *hit.key
    val := *hit.val
}
```

```go
func mapiternext(it *hiter) {
    h := it.h
    t := it.t
    bucket := it.bucket
    b := it.bptr
    i := it.i
    alg := t.key.alg

next:
    if b == nil {
        if bucket == it.startBucket && it.wrapped {
            it.key = nil
            it.value = nil
            return
        }
        b = (*bmap)(add(it.buckets, bucket*uintptr(t.bucketsize)))
        bucket++
        if bucket == bucketShift(it.B) {
            bucket = 0
            it.wrapped = true
        }
        i = 0
    }
```

字符串遍历，自动转换为Rune类型

```go
ha := s
for hv1 := 0; hv1 < len(ha); {
    hv1t := hv1
    hv2 := rune(ha[hv1])
    if hv2 < utf8.RuneSelf {
        hv1++
    } else {
        hv2, hv1 = decoderune(ha, hv1)
    }
    v1, v2 = hv1t, hv2
}
```

## 2. Defer

### 2.1. Implement

```go
// A _defer holds an entry on the list of deferred calls.
// If you add a field here, add code to clear it in freedefer and deferProcStack
// This struct must match the code in cmd/compile/internal/gc/reflect.go:deferstruct
// and cmd/compile/internal/gc/ssa.go:(*state).call.
// Some defers will be allocated on the stack and some on the heap.
// All defers are logically part of the stack, so write barriers to
// initialize them are not required. All defers must be manually scanned,
// and for heap defers, marked.
type _defer struct {
    siz     int32 // includes both arguments and results 参数和返回值共占多少空间
    started bool
    heap    bool
    // openDefer indicates that this _defer is for a frame with open-coded
    // defers. We have only one defer record for the entire frame (which may
    // currently have 0, 1, or more defers active).
    openDefer bool  // 表示当前 defer 是否经过开放编码的优化；
    sp        uintptr  // sp at time of defer 栈指针
    pc        uintptr  // pc at time of defer 调用方的程序计数器；
    fn        *funcval // can be nil for open-coded defers 关键字中传入的函数
    _panic    *_panic  // panic that is running defer 是触发延迟调用的结构体，可能为空；
    link      *_defer

    // If openDefer is true, the fields below record values about the stack
    // frame and associated function that has the open-coded defer(s). sp
    // above will be the sp for the frame, and pc will be address of the
    // deferreturn call in the function.
    fd   unsafe.Pointer // funcdata for the function associated with the frame
    varp uintptr        // value of varp for the stack frame
    // framepc is the current pc associated with the stack frame. Together,
    // with sp above (which is the sp associated with the stack frame),
    // framepc/sp can be used as pc/sp pair to continue a stack trace via
    // gentraceback().
    framepc uintptr
}
```

1. *A deferred function’s arguments are evaluated when the defer statement is evaluated.*
2. *Deferred function calls are executed in Last In First Out order after the surrounding function returns.*
3. *Deferred functions may read and assign to the returning function’s named return values.*

Go 语言在 1.13 中引入栈上分配的结构体，减少了 30% 的额外开销[1](https://draveness.me/golang/docs/part2-foundation/ch05-keyword/golang-defer/#fn:1)，并在 1.14 中引入了基于开放编码的 `defer`，使得该关键字的额外开销可以忽略不计。

### 2.2. Execve

#### 2.2.1. In Heap

```go
func (s *state) stmt(n *Node) {
    ...
    switch n.Op {
    case ODEFER:
        if s.hasOpenDefers {
            s.openDeferRecord(n.Left) // 开放编码
        } else {
            d := callDefer // 堆分配
            if n.Esc == EscNever {
                d = callDeferStack // 栈分配
            }
            s.callResult(n.Left, d)
        }
    }
}
```

1.12版本前的defer调用函数，函数需要：

1. 获取需要执行的函数名、闭包指针、代码指针和函数调用的接收方；
2. 获取栈地址并将函数或者方法的参数写入栈中；
3. 使用 [`cmd/compile/internal/gc.state.newValue1A`](https://draveness.me/golang/tree/cmd/compile/internal/gc.state.newValue1A) 以及相关函数生成函数调用的中间代码；
4. 如果当前调用的函数是 `defer`，那么会单独生成相关的结束代码块；
5. 获取函数的返回值地址并结束当前调用；

```go
func (s *state) call(n *Node, k callKind, returnResultAddr bool) *ssa.Value {
    ...
    var call *ssa.Value
    if k == callDeferStack {
        // 在栈上初始化 defer 结构体
        ...
    } else {
        ...
        switch {
        case k == callDefer:
            aux := ssa.StaticAuxCall(deferproc, ACArgs, ACResults)
            call = s.newValue1A(ssa.OpStaticCall, types.TypeMem, aux, s.mem())
        ...
        }
        call.AuxInt = stksize
    }
    s.vars[&memVar] = call
    ...
}
```

创建延迟调用，将defer A() 转换成 defproc(8, A)，整形参数在64位下占用8字节

```go
func deferproc(siz int32, fn *funcval) {
    sp := getcallersp()
    argp := uintptr(unsafe.Pointer(&fn)) + unsafe.Sizeof(fn)
    callerpc := getcallerpc()

    d := newdefer(siz)
    if d._panic != nil {
        throw("deferproc: d.panic != nil after newdefer")
    }
    d.fn = fn
    d.pc = callerpc
    d.sp = sp
    switch siz {
    case 0:
    case sys.PtrSize:
        *(*uintptr)(deferArgs(d)) = *(*uintptr)(unsafe.Pointer(argp))
    default:
        memmove(deferArgs(d), unsafe.Pointer(argp), uintptr(siz))
    }

    return0()
}
```

从调度器的延迟调用缓存池 sched.deferpool 中取出结构体并将该结构体追加到当前 Goroutine 的缓存池中；
从 Goroutine 的延迟调用缓存池 pp.deferpool 中取出结构体；
通过 runtime.mallocgc 在堆上创建一个新的结构体；

```go
func newdefer(siz int32) *_defer {
    var d *_defer
    sc := deferclass(uintptr(siz))
    gp := getg()
    if sc < uintptr(len(p{}.deferpool)) {
        pp := gp.m.p.ptr()
        if len(pp.deferpool[sc]) == 0 && sched.deferpool[sc] != nil {
            for len(pp.deferpool[sc]) < cap(pp.deferpool[sc])/2 && sched.deferpool[sc] != nil {
                d := sched.deferpool[sc]
                sched.deferpool[sc] = d.link
                pp.deferpool[sc] = append(pp.deferpool[sc], d)
            }
        }
        if n := len(pp.deferpool[sc]); n > 0 {
            d = pp.deferpool[sc][n-1]
            pp.deferpool[sc][n-1] = nil
            pp.deferpool[sc] = pp.deferpool[sc][:n-1]
        }
    }
    if d == nil {
        total := roundupsize(totaldefersize(uintptr(siz)))
        d = (*_defer)(mallocgc(total, deferType, true))
    }
    d.siz = siz
    d.link = gp._defer
    gp._defer = d
    return d
}
```

在函数结束前，转为runtime.deferreturn()

```go
func deferreturn(arg0 uintptr) {
    gp := getg()
    d := gp._defer
    if d == nil {
        return
    }
    sp := getcallersp()
    ...

    switch d.siz {
    case 0:
    case sys.PtrSize:
        *(*uintptr)(unsafe.Pointer(&arg0)) = *(*uintptr)(deferArgs(d))
    default:
        memmove(unsafe.Pointer(&arg0), deferArgs(d), uintptr(d.siz))
    }
    fn := d.fn
    gp._defer = d.link
    freedefer(d)
    jmpdefer(fn, uintptr(unsafe.Pointer(&arg0)))
}
```

#### 2.2.2. Stack

```go
func deferprocStack(d *_defer) {
    gp := getg()
    d.started = false
    d.heap = false // 栈上分配的 _defer
    d.openDefer = false
    d.sp = getcallersp()
    d.pc = getcallerpc()
    d.framepc = 0
    d.varp = 0
    *(*uintptr)(unsafe.Pointer(&d._panic)) = 0
    *(*uintptr)(unsafe.Pointer(&d.fd)) = 0
    *(*uintptr)(unsafe.Pointer(&d.link)) = uintptr(unsafe.Pointer(gp._defer))
    *(*uintptr)(unsafe.Pointer(&gp._defer)) = uintptr(unsafe.Pointer(d))

    return0()
}
```

与堆区类似，该方法没有本质上的不同，可以适用于更多场景。

但是在循环中注册的defer，还是需要1.12的方式，在堆中分配，所以在defer结构体中新增了字段

```go
        heap    bool
```

#### 2.2.3. Open Coded

Go 语言在 1.14 中通过开放编码（Open Coded）实现 `defer` 关键字，该设计使用代码内联优化 `defer` 关键的额外开销并引入函数数据 `funcdata` 管理 `panic` 的调用：

```go
const maxOpenDefers = 8

func walkstmt(n *Node) *Node {
    switch n.Op {
    case ODEFER:
        Curfn.Func.SetHasDefer(true)
        Curfn.Func.numDefers++
        if Curfn.Func.numDefers > maxOpenDefers {
            Curfn.Func.SetOpenCodedDeferDisallowed(true)
        }
        if n.Esc != EscNever {
            Curfn.Func.SetOpenCodedDeferDisallowed(true)
        }
        fallthrough
    ...
    }
}
```

1. 函数的 `defer` 数量少于或者等于 8 个；
2. 函数的 `defer` 关键字不能在循环中执行；
3. 函数的 `return` 语句与 `defer` 语句的乘积小于或者等于 15 个；

1.14中，使用df来标记每一个defer是否需要执行，将每一个defer放在函数返回处，通过编译阶段插入代码，把defer函数的逻辑展开在所属的函数内，从而省略了defer结构体和链表。

但是，在函数执行过程中，如果调用了panic，或者是runtime.Goexit()函数，需要额外使用栈扫描方法来实现。

所以在1.14版本中，新增了如下参数，保证栈扫描能够正确执行。在发生panic的情况下，效率要低于1.13版本

```go
    // openDefer indicates that this _defer is for a frame with open-coded
    // defers. We have only one defer record for the entire frame (which may
    // currently have 0, 1, or more defers active).
    openDefer bool  // 表示当前 defer 是否经过开放编码的优化；
    // If openDefer is true, the fields below record values about the stack
    // frame and associated function that has the open-coded defer(s). sp
    // above will be the sp for the frame, and pc will be address of the
    // deferreturn call in the function.
    fd   unsafe.Pointer // funcdata for the function associated with the frame
    varp uintptr        // value of varp for the stack frame
    // framepc is the current pc associated with the stack frame. Together,
    // with sp above (which is the sp associated with the stack frame),
    // framepc/sp can be used as pc/sp pair to continue a stack trace via
    // gentraceback().
    framepc uintptr
```

### 2.3. Version Difference

- 堆上分配 · 1.1 ~ 1.12
    - 编译期将 `defer` 关键字转换成 [`runtime.deferproc`](https://draveness.me/golang/tree/runtime.deferproc) 并在调用 `defer` 关键字的函数返回之前插入 [`runtime.deferreturn`](https://draveness.me/golang/tree/runtime.deferreturn)；
    - 运行时调用 [`runtime.deferproc`](https://draveness.me/golang/tree/runtime.deferproc) 会将一个新的 [`runtime._defer`](https://draveness.me/golang/tree/runtime._defer) 结构体追加到当前 Goroutine 的链表头；
    - 运行时调用 [`runtime.deferreturn`](https://draveness.me/golang/tree/runtime.deferreturn) 会从 Goroutine 的链表中取出 [`runtime._defer`](https://draveness.me/golang/tree/runtime._defer) 结构并依次执行；
- 栈上分配 · 1.13
    - 当该关键字在函数体中最多执行一次时，编译期间的 [`cmd/compile/internal/gc.state.call`](https://draveness.me/golang/tree/cmd/compile/internal/gc.state.call) 会将结构体分配到栈上并调用 [`runtime.deferprocStack`](https://draveness.me/golang/tree/runtime.deferprocStack)；
- 开放编码 · 1.14 ~ 现在
    - 编译期间判断 `defer` 关键字、`return` 语句的个数确定是否开启开放编码优化；
    - 通过 `deferBits` 和 [`cmd/compile/internal/gc.openDeferInfo`](https://draveness.me/golang/tree/cmd/compile/internal/gc.openDeferInfo) 存储 `defer` 关键字的相关信息；
    - 如果 `defer` 关键字的执行可以在编译期间确定，会在函数返回前直接插入相应的代码，否则会由运行时的 [`runtime.deferreturn`](https://draveness.me/golang/tree/runtime.deferreturn) 处理；

## 3. Panic And Recover

### 3.1. Panic Implement

```go
// A _panic holds information about an active panic.
//
// A _panic value must only ever live on the stack.
//
// The argp and link fields are stack pointers, but don't need special
// handling during stack growth: because they are pointer-typed and
// _panic values only live on the stack, regular stack pointer
// adjustment takes care of them.
type _panic struct {
    argp      unsafe.Pointer // pointer to arguments of deferred call run during panic; cannot move - known to liblink      defer的参数空间地址
    arg       interface{}    // argument to panic
    link      *_panic        // link to earlier panic
    pc        uintptr        // where to return to in runtime if this panic is bypassed
    sp        unsafe.Pointer // where to return to in runtime if this panic is bypassed
    recovered bool           // whether this panic is over 是否被恢复
    aborted   bool           // the panic was aborted  是否终止
    goexit    bool
}
```

在panic执行时，会把_defer的panic置位true，如果能够正常结束，

然后执行如下代码：

```go
func gopanic(e interface{}) {
    gp := getg()
    ...
    var p _panic
    p.arg = e
    p.link = gp._panic
    gp._panic = (*_panic)(noescape(unsafe.Pointer(&p)))

    for {
        d := gp._defer
        if d == nil {
            break
        }

        d._panic = (*_panic)(noescape(unsafe.Pointer(&p)))

        reflectcall(nil, unsafe.Pointer(d.fn), deferArgs(d), uint32(d.siz), uint32(d.siz))

        d._panic = nil
        d.fn = nil
        gp._defer = d.link

        freedefer(d)
        if p.recovered {
            ...
        }
    }

    fatalpanic(gp._panic)
    *(*int)(nil) = 0
}
```

对于无法修复的崩溃，会调用如下代码打印所有panic信息

```go
func fatalpanic(msgs *_panic) {
    pc := getcallerpc()
    sp := getcallersp()
    gp := getg()

    if startpanic_m() && msgs != nil {
        atomic.Xadd(&runningPanicDefers, -1)
        printpanics(msgs)
    }
    if dopanic_m(gp, pc, sp) {
        crash()
    }

    exit(2)
}
```

### 3.2. Recover Implement

```go
func gorecover(argp uintptr) interface{} {
    gp := getg()
    p := gp._panic
    if p != nil && !p.recovered && argp == uintptr(p.argp) {
        p.recovered = true
        return p.arg
    }
    return nil
}
```

recover将当前panic的recovered等于true，然后移除并且跳出当前的panic

```go
func gopanic(e interface{}) {
    ...

    for {
        // 执行延迟调用函数，可能会设置 p.recovered = true
        ...

        pc := d.pc
        sp := unsafe.Pointer(d.sp)

        ...
        if p.recovered { // 当标记为为true时，
            gp._panic = p.link
            for gp._panic != nil && gp._panic.aborted {
              gp._panic = gp._panic.link
            }
            if gp._panic == nil {
              gp.sig = 0
            }
            gp.sigcode0 = uintptr(sp)
            gp.sigcode1 = pc
            mcall(recovery)
            throw("recovery failed")
          }
    }
    ...
}
```

1. 编译器会负责做转换关键字的工作；
    1.1. 将 panic 和 recover 分别转换成 runtime.gopanic 和 runtime.gorecover；
    1.2. 将 defer 转换成 runtime.deferproc 函数；
    1.3. 在调用 defer 的函数末尾调用 runtime.deferreturn 函数；
2. 在运行过程中遇到 runtime.gopanic 方法时，会从 Goroutine 的链表依次取出 runtime.\_defer 结构体并执行；
3. 如果调用延迟执行函数时遇到了 runtime.gorecover 就会将 \_panic.recovered 标记成 true 并返回 panic 的参数；
    3.1. 在这次调用结束之后，runtime.gopanic 会从 runtime.\_defer 结构体中取出程序计数器 pc 和栈指针 sp 并调用 runtime.recovery 函数进行恢复程序；
    3.2. runtime.recovery 会根据传入的 pc 和 sp 跳转回 runtime.deferproc；
    3.3. 编译器自动生成的代码会发现 runtime.deferproc 的返回值不为 0，这时会跳回 runtime.deferreturn 并恢复到正常的执行流程；
4. 如果没有遇到 runtime.gorecover 就会依次遍历所有的 runtime.\_defer，并在最后调用 runtime.fatalpanic 中止程序、打印 panic 的参数并返回错误码 2（需要编译）；

如在Go的compile.Main执行期间，加入了defer hidePanic()

```go
func hidePanic() {
    if base.Debug.Panic == 0 && base.Errors() > 0 {
        // If we've already complained about things
        // in the program, don't bother complaining
        // about a panic too; let the user clean up
        // the code and try again.
        if err := recover(); err != nil {
            if err == "-h" {
                panic(err)
            }
            base.ErrorExit()
        }
    }
}
```

## 4. Make And New

- `make` 的作用是初始化内置的数据结构，也就是我们在前面提到的切片、哈希表和 Channel；
- `new` 的作用是根据传入的类型分配一片内存空间并返回指向这片内存空间的指针；

Go 语言会将代表 `make` 关键字的 `OMAKE` 节点根据参数类型的不同转换成了 `OMAKESLICE`、`OMAKEMAP` 和 `OMAKECHAN` 三种不同类型的节点，这些节点会调用不同的运行时函数来初始化相应的数据结构。

分别对应如下：

```go
type SliceHeader struct {
    Data uintptr
    Len  int
    Cap  int
}
type hmap struct {
    // Note: the format of the hmap is also encoded in cmd/compile/internal/gc/reflect.go.
    // Make sure this stays in sync with the compiler's definition.
    count     int // # live cells == size of map.  Must be first (used by len() builtin)
    flags     uint8
    B         uint8  // log_2 of # of buckets (can hold up to loadFactor * 2^B items)
    noverflow uint16 // approximate number of overflow buckets; see incrnoverflow for details
    hash0     uint32 // hash seed

    buckets    unsafe.Pointer // array of 2^B Buckets. may be nil if count==0.
    oldbuckets unsafe.Pointer // previous bucket array of half the size, non-nil only when growing
    nevacuate  uintptr        // progress counter for evacuation (buckets less than this have been evacuated)

    extra *mapextra // optional fields
}
type hchan struct {
    qcount   uint           // total data in the queue
    dataqsiz uint           // size of the circular queue
    buf      unsafe.Pointer // points to an array of dataqsiz elements
    elemsize uint16
    closed   uint32
    elemtype *_type // element type
    sendx    uint   // send index
    recvx    uint   // receive index
    recvq    waitq  // list of recv waiters
    sendq    waitq  // list of send waiters

    // lock protects all fields in hchan, as well as several
    // fields in sudogs blocked on this channel.
    //
    // Do not change another G's status while holding this lock
    // (in particular, do not ready a G), as this can deadlock
    // with stack shrinking.
    lock mutex
}

```

在调用new时，则会分为以下操作

```go
func callnew(t *types.Type) *Node {
    ...
    n := nod(ONEWOBJ, typename(t), nil)
    ...
    return n
}

func (s *state) expr(n *Node) *ssa.Value {
    switch n.Op {
    case ONEWOBJ:
        if n.Type.Elem().Size() == 0 {
            return s.newValue1A(ssa.OpAddr, n.Type, zerobaseSym, s.sb)
        }
        typ := s.expr(n.Left)
        vv := s.rtcall(newobject, true, []*types.Type{n.Type}, typ)
        return vv[0]
    }
}
```

需要注意的是，无论是直接使用 new，还是使用 var 初始化变量，它们在编译器看来都是 ONEW 和 ODCL 节点。如果变量会逃逸到堆上，这些节点在这一阶段都会被 cmd/compile/internal/gc.walkstmt 转换成通过 runtime.newobject 函数并在堆上申请内存

```go
func walkstmt(n *Node) *Node {
    switch n.Op {
    case ODCL:
        v := n.Left
        if v.Class() == PAUTOHEAP {
            if prealloc[v] == nil {
                prealloc[v] = callnew(v.Type)
            }
            nn := nod(OAS, v.Name.Param.Heapaddr, prealloc[v])
            nn.SetColas(true)
            nn = typecheck(nn, ctxStmt)
            return walkstmt(nn)
        }
    case ONEW:
        if n.Esc == EscNone {
            r := temp(n.Type.Elem())
            r = nod(OAS, r, nil)
            r = typecheck(r, ctxStmt)
            init.Append(r)
            r = nod(OADDR, r.Left, nil)
            r = typecheck(r, ctxExpr)
            n = r
        } else {
            n = callnew(n.Type.Elem())
        }
    }
}
```

不过这也不是绝对的，如果通过 var 或者 new 创建的变量不需要在当前作用域外生存，例如不用作为返回值返回给调用方，那么就不需要初始化在堆上。
