---
title: "Go(1) Builtin Data Structure"
date: 2021-09-02T19:22:24+08:00
draft: false
author: "Chasing1020"
comment: true
keywords: ['Data Structure']
description: ""
tags: ['Go']
categories: ['Language']
image: "go-model-sheet.webp"
---

# Part1. Builtin Data Structure

## 0. Type

```go
package builtin

type bool bool
const (
    true  = 0 == 0 // Untyped bool.
    false = 0 != 0 // Untyped bool.
)
type uint8 uint8
type uint16 uint16
type uint32 uint32
type uint64 uint64
type int8 int8
type int16 int16
type int32 int32
type int64 int64
type float32 float32
type float64 float64
type complex64 complex64
type complex128 complex128
type string string
type int int
type uint uint
type uintptr uintptr
// byte is an alias for uint8 and is equivalent to uint8 in all ways.
type byte = uint8
// rune is an alias for int32 and is equivalent to int32 in all ways.
type rune = int32
const iota = 0 // Untyped int.
// nil is a predeclared identifier representing the zero value for a
// pointer, channel, func, interface, map, or slice type.
var nil Type // Type must be a pointer, channel, func, interface, map, or slice type
type Type int
type Type1 int
type IntegerType int
type FloatType float32
type ComplexType complex64
func append(slice []Type, elems ...Type) []Type
func copy(dst, src []Type) int
func delete(m map[Type]Type1, key Type)
func len(v Type) int
func cap(v Type) int
func make(t Type, size ...IntegerType) Type
func new(Type) *Type
func complex(r, i FloatType) ComplexType
func real(c ComplexType) FloatType
func imag(c ComplexType) FloatType
func close(c chan<- Type)
func panic(v interface{})
func recover() interface{}
func print(args ...Type)
func println(args ...Type)
type error interface {
    Error() string
}
```

对于类型的定义：

```go
package types
// A Type represents a Go type.
type Type struct {
    Extra interface{}
    Width int64 // valid if Align > 
    methods    Fields
    allMethods Fields
    Nod  *Node // canonical OTYPE node
    Orig *Type // original type (type literal or predefined type)
    // Cache of composite types, with this type being the element type.
    Cache struct {
        ptr   *Type // *T, or nil
        slice *Type // []T, or nil
    }
    Sym    *Sym  // symbol containing name, for named types
    Vargen int32 // unique name for OTYPE/ONAME
    Etype EType // kind of type
    Align uint8 // the required alignment of this type, in bytes (0 means Width and Align have not yet been computed)
    flags bitset8
}
```

特别的，在IEEE-754中，对于NaN的定义分为sNaN和qNaN。

sNaN代表无效的操作，指数位全是1，小数位第一位是0

qNaN代表无效或者异常的结果，指数位全是1，小数位第一位是1

## 1. Array

### 1.1. New Array

```go
// Array contains Type fields specific to array types.
type Array struct {
    Elem  *Type // element type
    Bound int64 // number of elements; <0 if unknown yet
}
```
数组创建时会定义好两个部分：分别是元素类型 `Elem` 和数组的大小 `Bound`，使用[...]初始化时，编译器会对数组大小自行推导，与使用固定数组作用相同，只是作为一种语法糖使用。

```go
// NewArray returns a new fixed-length array Type.
func NewArray(elem *Type, bound int64) *Type {
    if bound < 0 {
        Fatalf("NewArray: invalid bound %v", bound)
    }
    t := New(TARRAY) // retrun types.Type
    t.Extra = &Array{Elem: elem, Bound: bound}
    t.SetNotInHeap(elem.NotInHeap())
    return t
}
```

在新建数组时，编译器会做出优化

```go
if var_.isSimpleName() && n.List.Len() > 4 {
    // lay out static data
    vstat := readonlystaticname(t)

    ctxt := inInitFunction
    if n.Op == OARRAYLIT {
        ctxt = inNonInitFunction
    }
    fixedlit(ctxt, initKindStatic, n, vstat, init)

    // copy static to var
    a := nod(OAS, var_, vstat)
    a = typecheck(a, ctxStmt)
    a = walkexpr(a, init)
    init.Append(a)
    // add expressions to automatic
    fixedlit(inInitFunction, initKindDynamic, n, var_, init)
    break
}
```

1. 当元素数量小于或者等于 4 个时，会直接将数组中的元素放置在栈上，优化为1-4个简单的赋值语句；
2. 当元素数量大于 4 个时，会将数组中的元素放置到静态区并在运行时取出到栈；
### 1.2. Array Access

在运行时，会通过[`cmd/compile/internal/gc.typecheck1`](https://draveness.me/golang/tree/cmd/compile/internal/gc.typecheck1)实时检查数组的可用范围

1. 访问数组的索引是非整数时，报错 “non-integer array index %v”；
2. 访问数组的索引是负数时，报错 “invalid array index %v (index must be non-negative)"；
3. 访问数组的索引越界时，报错 “invalid array index %v (out of bounds for %d-element array)"；

```go
if n.Right.Type != nil && !n.Right.Type.IsInteger() {
    yyerror("non-integer %s index %v", why, n.Right)
    break
}

if !n.Bounded() && Isconst(n.Right, CTINT) {
    x := n.Right.Int64Val()
    if x < 0 {
        yyerror("invalid %s index %v (index must be non-negative)", why, n.Right)
    } else if t.IsArray() && x >= t.NumElem() {
        yyerror("invalid array index %v (out of bounds for %d-element array)", n.Right, t.NumElem())
    } else if Isconst(n.Left, CTSTR) && x >= int64(len(n.Left.StringVal())) {
      yyerror("invalid string index %v (out of bounds for %d-byte string)", n.Right, len(n.Left.StringVal()))
    } else if n.Right.Val().U.(*Mpint).Cmp(maxintval[TINT]) > 0 {
        yyerror("invalid %s index %v (index too large)", why, n.Right)
    }
}
```

一旦发生非法访问，立即会报出panic触发运行时错误并退出程序

```go
func goPanicIndex(x int, y int) {
    panicCheck1(getcallerpc(), "index out of range")
    panic(boundsError{x: int64(x), signed: true, y: y, code: boundsIndex})
}
```

## 2. Slice
### 2.1. New Slice
```go
// Fields is a pointer to a slice of *Field.
// This saves space in Types that do not have fields or methods
// compared to a simple slice of *Field.
type Fields struct {
    s *[]*Field
}

// A Field represents a field in a struct or a method in an interface or
// associated with a named type.
type Field struct {
    flags bitset8

    Embedded uint8 // embedded field

    Pos  src.XPos
    Sym  *Sym
    Type *Type  // field type
    Note string // literal string annotation

    // For fields that represent function parameters, Nname points
    // to the associated ONAME Node.
    Nname *Node

    // Offset in bytes of this field or method within its enclosing struct
    // or interface Type.
    Offset int64
}

// Slice returns the entries in f as a slice.
// Changes to the slice entries will be reflected in f.
func (f *Fields) Slice() []*Field {
    if f.s == nil {
        return nil
    }
    return *f.s
}
```

编译期间的切片类型如上所示，创建新切片的方法如下

```go
// NewSlice returns the slice Type with element type elem.
func NewSlice(elem *Type) *Type {
    if t := elem.Cache.slice; t != nil {
        if t.Elem() != elem {
            Fatalf("elem mismatch")
        }
        return t
    }

    t := New(TSLICE)
    t.Extra = Slice{Elem: elem}
    elem.Cache.slice = t
    return t
}
```

但是在运行时，会自动转换为如下的数据结构：

```go
// SliceHeader is the runtime representation of a slice.
// It cannot be used safely or portably and its representation may
// change in a later release.
// Moreover, the Data field is not sufficient to guarantee the data
// it references will not be garbage collected, so programs must keep
// a separate, correctly typed pointer to the underlying data.
type SliceHeader struct {
    Data uintptr
    Len  int
    Cap  int
}
```

其中`Data`是一片连续的内存空间，这片内存空间可以用于存储切片中的全部元素，且Data不必是连续空间的第一个元素。

1. 通过下标的方式获得数组或者切片的一部分：arr[0:3] or slice[0:3]

    会使用`SliceMake` 操作会，接受四个参数创建新的切片，元素类型、数组指针、切片大小和容量

```go
nums := [...]int{0, 1, 2, 3, 4, 5, 5, 6, 7, 8, 9}
slice := nums[3:5]
fmt.Println(len(slice), cap(slice)) // 2 8
```
​      创建后，长度默认是切片范围，但是容量会一直从切片起始值延续到数组的最后一位
2. 使用字面量初始化新的切片：slice := []int{1, 2, 3}

    创建一个数组并初始化，将静态存储区的数组，再用[:]获得一个切片

3. 使用关键字 `make` 创建切片：slice := make([]int, 2, 5)，这样Len=2，数组里前两个元素是默认零值的，剩余三个元素保留为0，并非真正可访问的值，同时在创建时会发生以下校验：

```go
if i >= len(args) {
    yyerror("missing len argument to make(%v)", t)
    return n
}

l = args[i]
i++
var r *Node
if i < len(args) {
    r = args[i]
}
...
if Isconst(l, CTINT) && r != nil && Isconst(r, CTINT) && l.Val().U.(*Mpint).Cmp(r.Val().U.(*Mpint)) > 0 {
    yyerror("len larger than cap in make(%v)", t)
    return n
}

n.Left = l
n.Right = r
n.Op = OMAKESLICE
```

检查切片的大小和容量是否足够小，切片是否发生了逃逸等，最终在堆上初始化。

4. 使用new关键字创建切片：slice := new([]string)，这样slice不会为Data分配底层的数组，标记为nil，在后续通过append会分配数组

```go
slice := new([]string)
// Can't (*slice)[0] = "abc"
```

如果使用[]int{1, 2, 3}这样的字面量初始化，会创建一个array存储到静态区，程序启动时，将静态区的数据拷贝到堆区。

### 2.2. Slice Grow

使用append扩容，如果没有覆盖原始变量，则直接返回

```go
// append(slice, 1, 2, 3)
ptr, len, cap := slice
newlen := len + 3
if newlen > cap {
    ptr, len, cap = growslice(slice, newlen)
    newlen = len + 3
}
*(ptr+len) = 1
*(ptr+len+1) = 2
*(ptr+len+2) = 3
return makeslice(ptr, newlen, cap)
```

但是如果需要扩容后的结果进行赋值，则会变成如下状态

```go
// slice = append(slice, 1, 2, 3)
a := &slice
ptr, len, cap := slice
newlen := len + 3
if uint(newlen) > uint(cap) {
    newptr, len, newcap = growslice(slice, newlen)
    vardef(a)
    *a.cap = newcap
    *a.ptr = newptr
}
newlen = len + 3
*a.len = newlen
*(ptr+len) = 1
*(ptr+len+1) = 2
*(ptr+len+2) = 3
```

在cap不够时，发生扩容的规则如下

```go
func growslice(et *_type, old slice, cap int) slice {
    newcap := old.cap
    doublecap := newcap + newcap
    if cap > doublecap {
        newcap = cap
    } else {
        if old.len < 1024 {
            newcap = doublecap
        } else {
            for 0 < newcap && newcap < cap {
                newcap += newcap / 4
            }
            if newcap <= 0 {
                newcap = cap
            }
        }
    }
}
```

1. 如果期望容量大于当前容量的两倍就会使用期望容量；
2. 如果当前切片的长度小于 1024 就会将容量翻倍；
3. 如果当前切片的长度大于 1024 就会每次增加 25% 的容量，直到新容量大于期望容量；
4. 如果最终容量过大导致溢出，则直接将最终容量设置为新申请容量。

此外，分配空间时，会考虑到内存对齐问题。会选择向上取整的内存段为切片分配，提高内存分配效率以减少外部碎片。

比如当运行如下代码：

```go
var arr []int64
arr = append(arr, 1, 2, 3, 4, 5)
```

分配的期望cap是5，需要40个字节，会调用roundupsize，调整到合适的字节大小48。

```go
// Returns size of the memory block that mallocgc will allocate if you ask for the size.
func roundupsize(size uintptr) uintptr {
    if size < _MaxSmallSize {
        if size <= smallSizeMax-8 {
            return uintptr(class_to_size[size_to_class8[divRoundUp(size, smallSizeDiv)]])
        } else {
            return uintptr(class_to_size[size_to_class128[divRoundUp(size-smallSizeMax, largeSizeDiv)]])
        }
    }
    if size+_PageSize < size {
        return size
    }
    return alignUp(size, _PageSize)
}
```

以下为判断是否需要发生扩容的代码：

```go
    var overflow bool
    var lenmem, newlenmem, capmem uintptr
    switch {
    case et.size == 1:
        lenmem = uintptr(old.len)
        newlenmem = uintptr(cap)
        capmem = roundupsize(uintptr(newcap))
        overflow = uintptr(newcap) > maxAlloc
        newcap = int(capmem)
    case et.size == sys.PtrSize:
        lenmem = uintptr(old.len) * sys.PtrSize
        newlenmem = uintptr(cap) * sys.PtrSize
        capmem = roundupsize(uintptr(newcap) * sys.PtrSize)
        overflow = uintptr(newcap) > maxAlloc/sys.PtrSize
        newcap = int(capmem / sys.PtrSize)
    case isPowerOfTwo(et.size):
        ...
    default:
        ...
    }

const _MaxSmallSize   = 32768
var class_to_size = [_NumSizeClasses]uint16{0, 8, 16, 32, 48, 64, 80, ...,}
```

### 2.3. Slice Copy

需要发生切片拷贝时，非运行时拷贝会调用以下代码：

```go
n := len(a)
if n > len(b) {
    n = len(b)
}
if a.ptr != b.ptr {
    memmove(a.ptr, b.ptr, n*sizeof(elem(a)))
}
```
但是在运行时调用copy(a, b)时，编译器会优化为以下函数
```go
func slicecopy(to, fm slice, width uintptr) int {
    if fm.len == 0 || to.len == 0 {
        return 0
    }
    n := fm.len
    if to.len < n {
        n = to.len
    }
    if width == 0 {
        return n
    }
    // ...
    size := uintptr(n) * width
    if size == 1 {
        *(*byte)(to.array) = *(*byte)(fm.array)
    } else {
        memmove(to.array, fm.array, size)
    }
    return n
}
```

两种拷贝都会调用memmove函数，将整块内存的内容拷贝到目标的内存区域中（如果目标内存不足就不会完全拷贝），这个函数以汇编方式实现。在大切片上执行拷贝要注意对性能的影响。

## 3. Map

### 3.1. New Map

```go
type hmap struct {
    count     int    // count 表示当前哈希表中的元素数量；
    flags     uint8
    B         uint8  // B 表示当前哈希表持有的 buckets 数量，但是因为哈希表中桶的数量都 2 的倍数，所以该字段会存储对数，也就是 len(buckets) == 2^B；
    noverflow uint16
    hash0     uint32 // hash0 是哈希的种子，它能为哈希函数的结果引入随机性，这个值在创建哈希表时确定，并在调用哈希函数时作为参数传入；
    buckets    unsafe.Pointer
    oldbuckets unsafe.Pointer  // oldbuckets 是哈希在扩容时用于保存之前 buckets 的字段，它的大小是当前 buckets 的一半；
    nevacuate  uintptr
    extra *mapextra  // 指向下一个溢出桶的地址
}

type mapextra struct {
    overflow    *[]*bmap  // 已经使用的溢出桶
    oldoverflow *[]*bmap
    nextOverflow *bmap  // 下一个空闲的溢出桶
}
```

hashmap的桶采用如下数据结构，每个桶可以存储8个键值对，桶的数量一定是2^B，

并采用&运算符来选择桶

```go
// A bucket for a Go map.
type bmap struct {
    // tophash generally contains the top byte of the hash value
    // for each key in this bucket. If tophash[0] < minTopHash,
    // tophash[0] is a bucket evacuation state instead.
    tophash [bucketCnt]uint8
    // Followed by bucketCnt keys and then bucketCnt elems.
    // NOTE: packing all the keys together and then all the elems together makes the
    // code a bit more complicated than alternating key/elem/key/elem/... but it allows
    // us to eliminate padding which would be needed for, e.g., map[int64]int8.
    // Followed by an overflow pointer.
}
```

在运行时，bmap中的其他字段在运行时也都是通过计算内存地址的方式访问的，因为kv的关系

自动转化成如下数据结构，为达到内存对齐，topbits，keys，values的数组分别按如下方式存放

```go
type bmap struct {
    topbits  [8]uint8
    keys     [8]keytype
    values   [8]valuetype
    pad      uintptr
    overflow uintptr  // 指向下一个需要扩容的桶
}
```

使用字面量初始化的方式最终都会通过maplit进行初始化：

```go
func maplit(n *Node, m *Node, init *Nodes) {
    a := nod(OMAKE, nil, nil)
    a.Esc = n.Esc
    a.List.Set2(typenod(n.Type), nodintconst(int64(n.List.Len())))
    litas(m, a, init)

    entries := n.List.Slice()
    if len(entries) > 25 {
        // For a large number of entries, put them in an array and loop.
        // build types [count]Tindex and [count]Tvalue
        tk := types.NewArray(n.Type.Key(), int64(len(entries)))
        te := types.NewArray(n.Type.Elem(), int64(len(entries)))
        ...
        return
    }

    // Build list of var[c] = expr.
    // Use temporaries so that mapassign1 can have addressable key, elem.
    ...
}
```

当哈希表中的元素数量少于或者等于 25 个时，编译器会将字面量初始化的结构体优化。将所有的键值对一次加入到哈希表中。一旦哈希表中元素的数量超过了 25 个，编译器会创建两个数组分别存储键和值，这些键值对则会通过 for 循环的方式加入哈希。

运行时，调用makemap函数完成map初始化。

```go
func makemap(t *maptype, hint int, h *hmap) *hmap {
    mem, overflow := math.MulUintptr(uintptr(hint), t.bucket.size)
    if overflow || mem > maxAlloc {
        hint = 0
    }
    if h == nil {
        h = new(hmap)
    }
    h.hash0 = fastrand()
    B := uint8(0)
    for overLoadFactor(hint, B) {
        B++
    }
    h.B = B
    if h.B != 0 {
        var nextOverflow *bmap
        h.buckets, nextOverflow = makeBucketArray(t, h.B, nil)
        if nextOverflow != nil {
            h.extra = new(mapextra)
            h.extra.nextOverflow = nextOverflow
        }
    }
    return h
}
```

1. 计算哈希占用的内存是否溢出或者超出能分配的最大值；
2. 调用 `runtime.fastrand` 获取一个随机的哈希种子；
3. 根据传入的 `hint` 计算出需要的最小需要的桶的数量；
4. 使用 `runtime.makeBucketArray` 创建用于保存桶的数组；

其中makeBucketArray会使用如下方法分配连续空间初始化数据

```go
func makeBucketArray(t *maptype, b uint8, dirtyalloc unsafe.Pointer) (buckets unsafe.Pointer, nextOverflow *bmap) {
    base := bucketShift(b)
    nbuckets := base
    if b >= 4 {
        // 大于4个，大概率会发生扩容，先分配2^(b-4)个空桶以供备用
        nbuckets += bucketShift(b - 4)  
        sz := t.bucket.size * nbuckets
        up := roundupsize(sz)
        if up != sz {
            nbuckets = up / t.bucket.size
        }
    }

    buckets = newarray(t.bucket, int(nbuckets))
    if base != nbuckets {
        nextOverflow = (*bmap)(add(buckets, base*uintptr(t.bucketsize)))
        last := (*bmap)(add(buckets, (nbuckets-1)*uintptr(t.bucketsize)))
        last.setoverflow(t, (*bmap)(buckets))
    }
    return buckets, nextOverflow
}
```

### 3.2. Map Access

当左侧使用一个或两个接收值时，分别会对应到两个方法：

```go
v     := hash[key] // => v     := *mapaccess1(maptype, hash, &key)
v, ok := hash[key] // => v, ok := mapaccess2(maptype, hash, &key)
```

其中两个函数如下，mapaccess2在注释中加入两个情况的返回值

```go
func mapaccess1(t *maptype, h *hmap, key unsafe.Pointer) unsafe.Pointer {
    alg := t.key.alg
    hash := alg.hash(key, uintptr(h.hash0))
    m := bucketMask(h.B)
    b := (*bmap)(add(h.buckets, (hash&m)*uintptr(t.bucketsize)))
    top := tophash(hash)
bucketloop:
    for ; b != nil; b = b.overflow(t) {
        for i := uintptr(0); i < bucketCnt; i++ {
            if b.tophash[i] != top {
                if b.tophash[i] == emptyRest {
                    break bucketloop
                }
                continue
            }
            k := add(unsafe.Pointer(b), dataOffset+i*uintptr(t.keysize))
            if alg.equal(key, k) {
                v := add(unsafe.Pointer(b), dataOffset+bucketCnt*uintptr(t.keysize)+i*uintptr(t.valuesize))
                return v //, true
            }
        }
    }
    return unsafe.Pointer(&zeroVal[0]) //, false
}
```

### 3.3. Map Grow

当发生以下两种情况时开始发生Map扩容，每次扩容都为原先的两倍，原来的桶会分流到两个新桶中

1. 装载因子已经超过 6.5；其中负载因子的定义如下：LoadFactor = count / m
2. 哈希使用了太多溢出桶；

```go
func mapassign(t *maptype, h *hmap, key unsafe.Pointer) unsafe.Pointer {
    ...
    if !h.growing() && (overLoadFactor(h.count+1, h.B) || tooManyOverflowBuckets(h.noverflow, h.B)) {
        hashGrow(t, h)
        goto again
    }
    ...
}
```

B <= 15，触发翻倍扩容，B > 15，触发等量扩容（有较多键值被删除）

### 3.4. Map Delete

Map的删除逻辑与写入逻辑很相似，只是触发哈希的删除需要使用关键字，如果在删除期间遇到了哈希表的扩容，就会分流桶中的元素，分流结束之后会找到桶中的目标元素完成键值对的删除工作。

```go
func walkexpr(n *Node, init *Nodes) *Node {
    switch n.Op {
    case ODELETE:
        init.AppendNodes(&n.Ninit)
        map_ := n.List.First()
        key := n.List.Second()
        map_ = walkexpr(map_, init)
        key = walkexpr(key, init)

        t := map_.Type
        fast := mapfast(t)
        if fast == mapslow {
            key = nod(OADDR, key, nil)
        }
        n = mkcall1(mapfndel(mapdelete[fast], t), nil, init, typename(t), map_, key)
    }
}
```

## 4. String

### 4.1. New String

```go
// StringHeader is the runtime representation of a string.
// It cannot be used safely or portably and its representation may
// change in a later release.
// Moreover, the Data field is not sufficient to guarantee the data
// it references will not be garbage collected, so programs must keep
// a separate, correctly typed pointer to the underlying data.
type StringHeader struct {
    Data uintptr
    Len  int
} // 切片在 Go 语言的运行时表示与字符串高度相似，经常认为字符串是一个只读的切片类型
```

Go 语言不支持直接修改 `string` 类型变量的内存空间，我们仍然可以通过在 `string` 和 `[]byte` 类型之间反复转换实现修改这一目的：

1. 先将这段内存拷贝到堆或者栈上；
2. 将变量的类型转换成 `[]byte` 后并修改字节数据；
3. 将修改后的字节数组转换回 `string`；

使用反引号创建的字符串会在编译时进行解析

```go
func (s *scanner) stdString() {
    s.startLit()
    for {
        r := s.getr()
        if r == '"' {
            break
        }
        if r == '\\' {
            s.escape('"')
            continue
        }
        if r == '\n' {
            s.ungetr()
            s.error("newline in string")
            break
        }
        if r < 0 {
            s.errh(s.line, s.col, "string not terminated")
            break
        }
    }
    s.nlsemi = true
    s.lit = string(s.stopLit())
    s.kind = StringLit
    s.tok = _Literal
}
```

1. 标准字符串使用双引号表示开头和结尾；
2. 标准字符串需要使用反斜杠 `\` 来逃逸双引号；
3. 标准字符串不能出现如下所示的隐式换行 `\n`；

无论是标准字符串还是原始字符串都会被标记成 `StringLit` 并传递到语法分析阶段。在语法分析阶段，与字符串相关的表达式都会由以下函数处理。

```go
func (p *noder) basicLit(lit *syntax.BasicLit) Val {
    switch s := lit.Value; lit.Kind {
    case syntax.StringLit:
        if len(s) > 0 && s[0] == '`' {
            s = strings.Replace(s, "\r", "", -1)
        }
        u, _ := strconv.Unquote(s)
        return Val{U: u}
    }
}
```

### 4.2. Concat String

在编译的AST阶段，调用strings.Join函数来完成字符串常量数组的拼接。

```go
func concatstrings(buf *tmpBuf, a []string) string {
    idx := 0
    l := 0
    count := 0
    for i, x := range a {
        n := len(x)
        if n == 0 {
            continue
        }
        l += n
        count++
        idx = i
    }
    if count == 0 {
        return ""
    }
    if count == 1 && (buf != nil || !stringDataOnStack(a[idx])) {
        return a[idx]
    }
    s, b := rawstringtmp(buf, l)
    for _, x := range a {
        copy(b, x)
        b = b[len(x):]
    }
    return s
}
```

但是在正常情况下，运行时会调用 `copy` 将输入的多个字符串拷贝到目标字符串所在的内存空间。新的字符串是一片新的内存空间，与原来的字符串也没有任何关联，一旦需要拼接的字符串非常大，拷贝带来的性能损失是无法忽略的。

### 4.3. Type Cast

```go
func slicebytetostring(buf *tmpBuf, b []byte) (str string) {
    l := len(b)
    if l == 0 {
        return ""
    }
    if l == 1 {
        stringStructOf(&str).str = unsafe.Pointer(&staticbytes[b[0]])
        stringStructOf(&str).len = 1
        return
    }
    var p unsafe.Pointer
    if buf != nil && len(b) <= len(buf) {
        p = unsafe.Pointer(buf)
    } else {
        p = mallocgc(uintptr(len(b)), nil, false)
    }
    stringStructOf(&str).str = p
    stringStructOf(&str).len = len(b)
    memmove(p, (*(*slice)(unsafe.Pointer(&b))).array, uintptr(len(b)))
    return
}
```


处理过后会根据传入的缓冲区大小决定是否需要为新字符串分配一片内存空间，runtime.stringStructOf 会将传入的字符串指针转换成 runtime.stringStruct 结构体指针，然后设置结构体持有的字符串指针 str 和长度 len，最后通过 runtime.memmove 将原 []byte 中的字节全部复制到新的内存空间中。

```go
func stringtoslicebyte(buf *tmpBuf, s string) []byte {
    var b []byte
    if buf != nil && len(s) <= len(buf) {
        *buf = tmpBuf{}
        b = buf[:len(s)]
    } else {
        b = rawbyteslice(len(s))
    }
    copy(b, s)
    return b
}
```
当传入缓冲区时，它会使用传入的缓冲区存储 []byte；
当没有传入缓冲区时，运行时会调用 runtime.rawbyteslice 创建新的字节切片并将字符串中的内容拷贝过去；
