---
title: "Go(5) Concurrency"
date: 2021-10-13T20:36:34+08:00
lastmod: 2021-10-26T19:33:34+08:00
draft: false
author: "Chasing1020"
comment: true
keywords: ['Concurrency']
description: ""
tags: ['Go']
categories: ['Language']
image: "go-model-sheet.webp"
---

# Part5. Concurrency

## 1. Channel

```go
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

type waitq struct {
    first *sudog
    last  *sudog
}

// sudog represents a g in a wait list, such as for sending/receiving
// on a channel.
// sudog is necessary because the g ↔ synchronization object relation
// is many-to-many. A g can be on many wait lists, so there may be
// many sudogs for one g; and many gs may be waiting on the same
// synchronization object, so there may be many sudogs for one object.
//
```

如果目标 Channel 没有被关闭并且已经有处于读等待的 Goroutine，那么 [`runtime.chansend`](https://draveness.me/golang/tree/runtime.chansend) 会从接收队列 `recvq` 中取出最先陷入等待的 Goroutine 并直接向它发送数据：

```go
    if sg := c.recvq.dequeue(); sg != nil {
        send(c, sg, ep, func() { unlock(&c.lock) }, 3)
        return true
    }
```

1. 调用 [`runtime.sendDirect`](https://draveness.me/golang/tree/runtime.sendDirect) 将发送的数据直接拷贝到 `x = <-c` 表达式中变量 `x` 所在的内存地址上；
2. 调用 [`runtime.goready`](https://draveness.me/golang/tree/runtime.goready) 将等待接收数据的 Goroutine 标记成可运行状态 `Grunnable` 并把该 Goroutine 放到发送方所在的处理器的 `runnext` 上等待执行，该处理器在下一次调度时会立刻唤醒数据的接收方；

```go
func send(c *hchan, sg *sudog, ep unsafe.Pointer, unlockf func(), skip int) {
    if sg.elem != nil {
        sendDirect(c.elemtype, sg, ep)
        sg.elem = nil
    }
    gp := sg.g
    unlockf()
    gp.param = unsafe.Pointer(sg)
    goready(gp, skip+1)
}
```

如果创建的 Channel 包含缓冲区并且 Channel 中的数据没有装满，会执行下面这段代码：

```go
func chansend(c *hchan, ep unsafe.Pointer, block bool, callerpc uintptr) bool {
    ...
    if c.qcount < c.dataqsiz {
        qp := chanbuf(c, c.sendx)
        typedmemmove(c.elemtype, qp, ep)
        c.sendx++
        if c.sendx == c.dataqsiz {
            c.sendx = 0
        }
        c.qcount++
        unlock(&c.lock)
        return true
    }
    ...
}
```

在这里我们首先会使用 [`runtime.chanbuf`](https://draveness.me/golang/tree/runtime.chanbuf) 计算出下一个可以存储数据的位置，然后通过 `runtime.typedmemmove`将发送的数据拷贝到缓冲区中并增加 `sendx` 索引和 `qcount` 计数器。

当 Channel 没有接收者能够处理数据时，向 Channel 发送数据会被下游阻塞，当然使用 `select` 关键字可以向 Channel 非阻塞地发送消息。向 Channel 阻塞地发送数据会执行下面的代码，我们可以简单梳理一下这段代码的逻辑：

```go
func chansend(c *hchan, ep unsafe.Pointer, block bool, callerpc uintptr) bool {
    ...
    if !block {
        unlock(&c.lock)
        return false
    }

    gp := getg()
    mysg := acquireSudog()
    mysg.elem = ep
    mysg.g = gp
    mysg.c = c
    gp.waiting = mysg
    c.sendq.enqueue(mysg)
    goparkunlock(&c.lock, waitReasonChanSend, traceEvGoBlockSend, 3)

    gp.waiting = nil
    gp.param = nil
    mysg.c = nil
    releaseSudog(mysg)
    return true
}
```

当我们从一个空 Channel 接收数据时会直接调用 [`runtime.gopark`](https://draveness.me/golang/tree/runtime.gopark) 让出处理器的使用权。

```go
func chanrecv(c *hchan, ep unsafe.Pointer, block bool) (selected, received bool) {
    if c == nil {
        if !block {
            return
        }
        gopark(nil, nil, waitReasonChanReceiveNilChan, traceEvGoStop, 2)
        throw("unreachable")
    }

    lock(&c.lock)

    if c.closed != 0 && c.qcount == 0 {
        unlock(&c.lock)
        if ep != nil {
            typedmemclr(c.elemtype, ep)
        }
        return true, false
    }
```

如果当前 Channel 已经被关闭并且缓冲区中不存在任何数据，那么会清除 `ep` 指针中的数据并立刻返回。

除了上述两种特殊情况，使用 [`runtime.chanrecv`](https://draveness.me/golang/tree/runtime.chanrecv) 从 Channel 接收数据时还包含以下三种不同情况：

- 当存在等待的发送者时，通过 [`runtime.recv`](https://draveness.me/golang/tree/runtime.recv) 从阻塞的发送者或者缓冲区中获取数据；
- 当缓冲区存在数据时，从 Channel 的缓冲区中接收数据；
- 当缓冲区中不存在数据时，等待其他 Goroutine 向 Channel 发送数据；

```go
func recv(c *hchan, sg *sudog, ep unsafe.Pointer, unlockf func(), skip int) {
    if c.dataqsiz == 0 {
        if ep != nil {
            recvDirect(c.elemtype, sg, ep)
        }
    } else {
        qp := chanbuf(c, c.recvx)
        if ep != nil {
            typedmemmove(c.elemtype, ep, qp)
        }
        typedmemmove(c.elemtype, qp, sg.elem)
        c.recvx++
        c.sendx = c.recvx // c.sendx = (c.sendx+1) % c.dataqsiz
    }
    gp := sg.g
    gp.param = unsafe.Pointer(sg)
    goready(gp, skip+1)
}
```

- 如果 Channel 不存在缓冲区；
    1. 调用 [`runtime.recvDirect`](https://draveness.me/golang/tree/runtime.recvDirect) 将 Channel 发送队列中 Goroutine 存储的 `elem` 数据拷贝到目标内存地址中；
- 如果 Channel 存在缓冲区；
    1. 将队列中的数据拷贝到接收方的内存地址；
    2. 将发送队列头的数据拷贝到缓冲区中，释放一个阻塞的发送方；

当 Channel 的发送队列中不存在等待的 Goroutine 并且缓冲区中也不存在任何数据时，从管道中接收数据的操作会变成阻塞的，然而不是所有的接收操作都是阻塞的，与 `select` 语句结合使用时就可能会使用到非阻塞的接收操作：

```go
func chanrecv(c *hchan, ep unsafe.Pointer, block bool) (selected, received bool) {
    ...
    if !block {
        unlock(&c.lock)
        return false, false
    }

    gp := getg()
    mysg := acquireSudog()
    mysg.elem = ep
    gp.waiting = mysg
    mysg.g = gp
    mysg.c = c
    c.recvq.enqueue(mysg)
    goparkunlock(&c.lock, waitReasonChanReceive, traceEvGoBlockRecv, 3)

    gp.waiting = nil
    closed := gp.param == nil
    gp.param = nil
    releaseSudog(mysg)
    return true, !closed
}
```

在正常的接收场景中，我们会使用 [`runtime.sudog`](https://draveness.me/golang/tree/runtime.sudog) 将当前 Goroutine 包装成一个处于等待状态的 Goroutine 并将其加入到接收队列中。

完成入队之后，上述代码还会调用 [`runtime.goparkunlock`](https://draveness.me/golang/tree/runtime.goparkunlock) 立刻触发 Goroutine 的调度，让出处理器的使用权并等待调度器的调度。

 `ch <- i` 向 Channel 发送数据时遇到的几种情况：

1. 如果当前 Channel 的 `recvq` 上存在已经被阻塞的 Goroutine，那么会直接将数据发送给当前 Goroutine 并将其设置成下一个运行的 Goroutine；
2. 如果 Channel 存在缓冲区并且其中还有空闲的容量，我们会直接将数据存储到缓冲区 `sendx` 所在的位置上；
3. 如果不满足上面的两种情况，会创建一个 [`runtime.sudog`](https://draveness.me/golang/tree/runtime.sudog) 结构并将其加入 Channel 的 `sendq` 队列中，当前 Goroutine 也会陷入阻塞等待其他的协程从 Channel 接收数据；

发送数据的过程中包含几个会触发 Goroutine 调度的时机：

1. 发送数据时发现 Channel 上存在等待接收数据的 Goroutine，立刻设置处理器的 `runnext` 属性，但是并不会立刻触发调度；
2. 发送数据时并没有找到接收方并且缓冲区已经满了，这时会将自己加入 Channel 的 `sendq` 队列并调用 [`runtime.goparkunlock`](https://draveness.me/golang/tree/runtime.goparkunlock) 触发 Goroutine 的调度让出处理器的使用权；

从 Channel 中接收数据时可能会发生的五种情况：

1. 如果 Channel 为空，那么会直接调用 [`runtime.gopark`](https://draveness.me/golang/tree/runtime.gopark) 挂起当前 Goroutine；
2. 如果 Channel 已经关闭并且缓冲区没有任何数据，[`runtime.chanrecv`](https://draveness.me/golang/tree/runtime.chanrecv) 会直接返回；
3. 如果 Channel 的 `sendq` 队列中存在挂起的 Goroutine，会将 `recvx` 索引所在的数据拷贝到接收变量所在的内存空间上并将 `sendq` 队列中 Goroutine 的数据拷贝到缓冲区；
4. 如果 Channel 的缓冲区中包含数据，那么直接读取 `recvx` 索引对应的数据；
5. 在默认情况下会挂起当前的 Goroutine，将 [`runtime.sudog`](https://draveness.me/golang/tree/runtime.sudog) 结构加入 `recvq` 队列并陷入休眠等待调度器的唤醒；

我们总结一下从 Channel 接收数据时，会触发 Goroutine 调度的两个时机：

1. 当 Channel 为空时；
2. 当缓冲区中不存在数据并且也不存在数据的发送者时；

## 2. Select

Linux的`select` 是操作系统中的系统调用，我们经常会使用 `select`、`poll` 和 `epoll` 等函数构建 I/O 多路复用模型提升程序的性能（synchronous I/O multiplexing）。Go 语言的 `select` 与操作系统中的 `select` 比较相似，C 语言的 `select` 系统调用可以同时监听多个文件描述符的可读或者可写的状态，Go 语言中的 `select` 也能够让 Goroutine 同时等待多个 Channel 可读或者可写，在多个文件或者 Channel状态改变之前，`select` 会一直阻塞当前线程或者 Goroutine。

如果是带有chan的语句，则会直接执行如下操作：

1. 当存在可以收发的 Channel 时，直接处理该 Channel 对应的 `case`；
2. 当不存在可以收发的 Channel 时，执行 `default` 中的语句；

空的select会直接转换成调用 [`runtime.block`](https://draveness.me/golang/tree/runtime.block) 函数，阻塞这个Goroutine并且永远无法唤醒。

如果当前的 `select` 条件只包含一个 `case`，那么编译器会将 `select` 改写成 `if` 条件语句。下面对比了改写前后的代码：

```go
// 改写前
select {
case v, ok <-ch: // case ch <- v
    ...    
}

// 改写后
if ch == nil {
    block()
}
v, ok := <-ch // case ch <- v
...
```

当 `select` 中仅包含两个 `case`，并且其中一个是 `default` 时，Go 语言的编译器就会认为这是一次非阻塞的收发操作。[`cmd/compile/internal/gc.walkselectcases`](https://draveness.me/golang/tree/cmd/compile/internal/gc.walkselectcases) 会对这种情况单独处理。不过在正式优化之前，该函数会将 `case` 中的所有 Channel 都转换成指向 Channel 的地址，我们会分别介绍非阻塞发送和非阻塞接收时，编译器进行的不同优化。

编译器会使用如下的流程处理 `select` 语句

1. 将所有的 `case` 转换成包含 Channel 以及类型等信息的 [`runtime.scase`](https://draveness.me/golang/tree/runtime.scase) 结构体；

2. 调用运行时函数 [`runtime.selectgo`](https://draveness.me/golang/tree/runtime.selectgo) 从多个准备就绪的 Channel 中选择一个可执行的 [`runtime.scase`](https://draveness.me/golang/tree/runtime.scase) 结构体；

3. 通过 `for` 循环生成一组 `if` 语句，在语句中判断自己是不是被选中的 `case`；

```go
    func selectgo(cas0 *scase, order0 *uint16, ncases int) (int, bool) {
        cas1 := (*[1 << 16]scase)(unsafe.Pointer(cas0))
        order1 := (*[1 << 17]uint16)(unsafe.Pointer(order0))
        
        ncases := nsends + nrecvs
        scases := cas1[:ncases:ncases]
        pollorder := order1[:ncases:ncases]
        lockorder := order1[ncases:][:ncases:ncases]
    
        norder := 0
        for i := range scases {
            cas := &scases[i]
        }
    
        for i := 1; i < ncases; i++ {
            j := fastrandn(uint32(i + 1))
            pollorder[norder] = pollorder[j]
            pollorder[j] = uint16(i)
            norder++
        }
        pollorder = pollorder[:norder]
        lockorder = lockorder[:norder]
    
        // 根据 Channel 的地址排序确定加锁顺序
        ...
        sellock(scases, lockorder)
        ...
    }
```
Go 语言会对 select 语句进行优化，它会根据 select 中 case 的不同选择不同的优化路径：

1. 空的 select 语句会被转换成调用 runtime.block 直接挂起当前 Goroutine；
2. 如果 select 语句中只包含一个 case，编译器会将其转换成 if ch == nil { block }; n; 表达式；
3. 首先判断操作的 Channel 是不是空的；然后执行 case 结构中的内容；如果 select 语句中只包含两个 case 并且其中一个是 default，那么会使用 runtime.selectnbrecv 和 runtime.selectnbsend 非阻塞地执行收发操作；

在默认情况下会通过 runtime.selectgo 获取执行 case 的索引，并通过多个 if 语句执行对应 case 中的代码；
在编译器已经对 select 语句进行优化之后，Go 语言会在运行时执行编译期间展开的 runtime.selectgo 函数，该函数会按照以下的流程执行：

1. 随机生成一个遍历的轮询顺序 pollOrder 并根据 Channel 地址生成锁定顺序 lockOrder；
2. 根据 pollOrder 遍历所有的 case 查看是否有可以立刻处理的 Channel；
   1.如果存在，直接获取 case 对应的索引并返回；
   2.如果不存在，创建 runtime.sudog 结构体，将当前 Goroutine 加入到所有相关 Channel 的收发队列，并调用 runtime.gopark 挂起当前 Goroutine 等待调度器的唤醒；
3. 当调度器唤醒当前 Goroutine 时，会再次按照 lockOrder 遍历所有的 case，从中查找需要被处理的 runtime.sudog 对应的索引；

## 3. Locker

```go
// A Locker represents an object that can be locked and unlocked.
type Locker interface {
   Lock()
   Unlock()
}
```

## 4. Mutex

```go
type Mutex struct {
    state int32
    sema  uint32
}
//在默认情况下，互斥锁的所有状态位都是 0，int32 中的不同位分别表示了不同的状态：
//waitersCount — 当前互斥锁上等待的 Goroutine 个数；
//mutexStarving — 当前的互斥锁进入饥饿状态；
//mutexWoken — 表示从正常模式被从唤醒；
//mutexLocked — 表示互斥锁的锁定状态；
```

在正常模式下，锁的等待者会按照先进先出的顺序获取锁。但是刚被唤起的 Goroutine 与新创建的 Goroutine 竞争时，大概率会获取不到锁，为了减少这种情况的出现，一旦 Goroutine 超过 1ms 没有获取到锁，它就会将当前互斥锁切换饥饿模式，

在cas状态不成功时，会进入如下的一个循环，判断当前 Goroutine 能否进入自旋：

1. 互斥锁只有在普通模式才能进入自旋；
2. runtime.sync_runtime_canSpin 需要返回 true：
3. 运行在多 CPU 的机器上，并且GOMAXPROCS > 1；
4. 当前 Goroutine 为了获取该锁进入自旋的次数小于四次；
5. 当前机器上至少存在一个正在运行的处理器 P 并且处理的运行队列为空

```go
var waitStartTime int64
    starving := false
    awoke := false
    iter := 0
    old := m.state
    for {
        if old&(mutexLocked|mutexStarving) == mutexLocked && runtime_canSpin(iter) {
            if !awoke && old&mutexWoken == 0 && old>>mutexWaiterShift != 0 &&
                atomic.CompareAndSwapInt32(&m.state, old, old|mutexWoken) {
                awoke = true
            }
            runtime_doSpin()
            iter++
            old = m.state
            continue
        }
```
在处理自旋逻辑以后，互斥锁会再次根据上下文来计算互斥锁最新的状态
```go
new := old
if old&mutexStarving == 0 {
    new |= mutexLocked
}
if old&(mutexLocked|mutexStarving) != 0 {
    new += 1 << mutexWaiterShift
}
if starving && old&mutexLocked != 0 {
    new |= mutexStarving
}
if awoke {
    new &^= mutexWoken
}
```
在互斥锁状态更新结束以后，会让CAS再次更新
```go
if atomic.CompareAndSwapInt32(&m.state, old, new) {
            if old&(mutexLocked|mutexStarving) == 0 {
                break // 通过 CAS 函数获取了锁
            }
            ...
            runtime_SemacquireMutex(&m.sema, queueLifo, 1)
            starving = starving || runtime_nanotime()-waitStartTime > starvationThresholdNs
            old = m.state
            if old&mutexStarving != 0 {
                delta := int32(mutexLocked - 1<<mutexWaiterShift)
                if !starving || old>>mutexWaiterShift == 1 {
                    delta -= mutexStarving
                }
                atomic.AddInt32(&m.state, delta)
                break
            }
            awoke = true
            iter = 0
        } else {
            old = m.state
        }
```

在正常模式下，这段代码会设置唤醒和饥饿标记、重置迭代次数并重新执行获取锁的循环；
在饥饿模式下，当前 Goroutine 会获得互斥锁，如果等待队列中只存在当前 Goroutine，互斥锁还会从饥饿模式中退出；

1. 通过自旋等待互斥锁的释放；
2. 计算互斥锁的最新状态；
3. 更新互斥锁的状态并获取锁；
如果该函数返回的新状态等于 0，当前 Goroutine 就成功解锁了互斥锁；
如果该函数返回的新状态不等于 0，这段代码会调用 sync.Mutex.unlockSlow 开始慢速解锁：
```go
func (m *Mutex) unlockSlow(new int32) {
    if (new+mutexLocked)&mutexLocked == 0 {
        throw("sync: unlock of unlocked mutex")
    }
    if new&mutexStarving == 0 { // 正常模式
        old := new
        for {
            if old>>mutexWaiterShift == 0 || old&(mutexLocked|mutexWoken|mutexStarving) != 0 {
                return
            }
            new = (old - 1<<mutexWaiterShift) | mutexWoken
            if atomic.CompareAndSwapInt32(&m.state, old, new) {
                runtime_Semrelease(&m.sema, false, 1)
                return
            }
            old = m.state
        }
    } else { // 饥饿模式
        runtime_Semrelease(&m.sema, true, 1)
    }
}
```

## 5. RWMutex

```go
type RWMutex struct {
   w           Mutex  // held if there are pending writers
   writerSem   uint32 // semaphore for writers to wait for completing readers
   readerSem   uint32 // semaphore for readers to wait for completing writers
   readerCount int32  // number of pending readers
   readerWait  int32  // number of departing readers
}
```

writerSem和readerSem分别用于写等待读和读等待写

当资源的使用者想要获取写锁时，需要调用 sync.RWMutex.Lock 方法：
```go
func (rw *RWMutex) Lock() {
    rw.w.Lock()
    r := atomic.AddInt32(&rw.readerCount, -rwmutexMaxReaders) + rwmutexMaxReaders
    if r != 0 && atomic.AddInt32(&rw.readerWait, r) != 0 {
        runtime_SemacquireMutex(&rw.writerSem, false, 0)
    }
}
```
调用结构体持有的 sync.Mutex 结构体的 sync.Mutex.Lock 阻塞后续的写操作；
因为互斥锁已经被获取，其他 Goroutine 在获取写锁时会进入自旋或者休眠；
调用 sync/atomic.AddInt32 函数阻塞后续的读操作：
如果仍然有其他 Goroutine 持有互斥锁的读锁，该 Goroutine 会调用 runtime.sync_runtime_SemacquireMutex 进入休眠状态等待所有读锁所有者执行结束后释放 writerSem 信号量将当前协程唤醒；

```go
func (rw *RWMutex) Unlock() {
    r := atomic.AddInt32(&rw.readerCount, rwmutexMaxReaders)
    if r >= rwmutexMaxReaders {
        throw("sync: Unlock of unlocked RWMutex")
    }
    for i := 0; i < int(r); i++ {
        runtime_Semrelease(&rw.readerSem, false, 0)
    }
    rw.w.Unlock()
}
```

1. 调用 [`sync/atomic.AddInt32`](https://draveness.me/golang/tree/sync/atomic.AddInt32) 函数将 `readerCount` 变回正数，释放读锁；
2. 通过 for 循环释放所有因为获取读锁而陷入等待的 Goroutine：
3. 调用 [`sync.Mutex.Unlock`](https://draveness.me/golang/tree/sync.Mutex.Unlock) 释放写锁；

读锁的加锁方法 sync.RWMutex.RLock 很简单，该方法会通过 sync/atomic.AddInt32 将 readerCount 加一：


```go
func (rw *RWMutex) RLock() {
    if atomic.AddInt32(&rw.readerCount, 1) < 0 {
        runtime_SemacquireMutex(&rw.readerSem, false, 0)
    }
}
```
如果该方法返回负数 — 其他 Goroutine 获得了写锁，当前 Goroutine 就会调用 runtime.sync_runtime_SemacquireMutex 陷入休眠等待锁的释放；
如果该方法的结果为非负数 — 没有 Goroutine 获得写锁，当前方法会成功返回；
当 Goroutine 想要释放读锁时，会调用如下所示的 sync.RWMutex.RUnlock 方法：
```go
func (rw *RWMutex) RUnlock() {
    if r := atomic.AddInt32(&rw.readerCount, -1); r < 0 {
        rw.rUnlockSlow(r)
    }
}
```
该方法会先减少正在读资源的 readerCount 整数，根据 sync/atomic.AddInt32 的返回值不同会分别进行处理：

如果返回值大于等于零 — 读锁直接解锁成功；
如果返回值小于零 — 有一个正在执行的写操作，在这时会调用sync.RWMutex.rUnlockSlow 方法；
```go
func (rw *RWMutex) rUnlockSlow(r int32) {
    if r+1 == 0 || r+1 == -rwmutexMaxReaders {
        throw("sync: RUnlock of unlocked RWMutex")
    }
    if atomic.AddInt32(&rw.readerWait, -1) == 0 {
        runtime_Semrelease(&rw.writerSem, false, 1)
    }
}
````
sync.RWMutex.rUnlockSlow 会减少获取锁的写操作等待的读操作数 readerWait 并在所有读操作都被释放之后触发写操作的信号量 writerSem，该信号量被触发时，调度器就会唤醒尝试获取写锁的 Goroutine。

## 6. WaitGroup

```go
type WaitGroup struct {
    noCopy noCopy

    // 64-bit value: high 32 bits are counter, low 32 bits are waiter count.
    // 64-bit atomic operations require 64-bit alignment, but 32-bit
    // compilers do not ensure it. So we allocate 12 bytes and then use
    // the aligned 8 bytes in them as state, and the other 4 as storage
    // for the sema.
    state1 [3]uint32
}
```

其中noCopy确保不会被赋值的方式拷贝，state1记录状态量，其提供了三个方法

```go
func (wg *WaitGroup) Add(delta int) {
    statep, semap := wg.state()
    state := atomic.AddUint64(statep, uint64(delta)<<32)
    v := int32(state >> 32)
    w := uint32(state)
    if v < 0 {
        panic("sync: negative WaitGroup counter")
    }
    if v > 0 || w == 0 {
        return
    }
    *statep = 0
    for ; w != 0; w-- {
        runtime_Semrelease(semap, false, 0)
    }
}
// Done decrements the WaitGroup counter by one.
func (wg *WaitGroup) Done() {
    wg.Add(-1)
}

```

通过对 [`sync.WaitGroup`](https://draveness.me/golang/tree/sync.WaitGroup) 的分析和研究，我们能够得出以下结论：

- [`sync.WaitGroup`](https://draveness.me/golang/tree/sync.WaitGroup) 必须在 [`sync.WaitGroup.Wait`](https://draveness.me/golang/tree/sync.WaitGroup.Wait) 方法返回之后才能被重新使用；
- [`sync.WaitGroup.Done`](https://draveness.me/golang/tree/sync.WaitGroup.Done) 只是对 [`sync.WaitGroup.Add`](https://draveness.me/golang/tree/sync.WaitGroup.Add) 方法的简单封装，我们可以向 [`sync.WaitGroup.Add`](https://draveness.me/golang/tree/sync.WaitGroup.Add) 方法传入任意负数（需要保证计数器非负）快速将计数器归零以唤醒等待的 Goroutine；
- 可以同时有多个 Goroutine 等待当前 [`sync.WaitGroup`](https://draveness.me/golang/tree/sync.WaitGroup) 计数器的归零，这些 Goroutine 会被同时唤醒；

## 7. Once

```go
type Once struct {
    done uint32
    m    Mutex
}
```
为当前 Goroutine 获取互斥锁；
执行传入的无入参函数；
运行延迟函数调用，将成员变量 done 更新成 1；

```go
func (o *Once) Do(f func()) {
    if atomic.LoadUint32(&o.done) == 0 {
        o.doSlow(f)
    }
}

func (o *Once) doSlow(f func()) {
    o.m.Lock()
    defer o.m.Unlock()
    if o.done == 0 {
        defer atomic.StoreUint32(&o.done, 1)
        f()
    }
}
```

## 8. Context

```go
type Context interface {
    Deadline() (deadline time.Time, ok bool)
    Done() <-chan struct{}
    Err() error
    Value(key interface{}) interface{}
}
```

在 Goroutine 构成的树形结构中对信号进行同步以减少计算资源的浪费是 [`context.Context`](https://draveness.me/golang/tree/context.Context) 的最大作用。Go 服务的每一个请求都是通过单独的 Goroutine 处理的，HTTP/RPC 请求的处理器会启动新的 Goroutine 访问数据库和其他服务。

都会从最顶层的 Goroutine 一层一层传递到最下层。[`context.Context`](https://draveness.me/golang/tree/context.Context) 可以在上层 Goroutine 执行出现错误时，将信号及时同步给下层。

```go
type emptyCtx int

func (*emptyCtx) Deadline() (deadline time.Time, ok bool) {
    return
}

func (*emptyCtx) Done() <-chan struct{} {
    return nil
}

func (*emptyCtx) Err() error {
    return nil
}

func (*emptyCtx) Value(key interface{}) interface{} {
    return nil
}
````

- [`context.Background`](https://draveness.me/golang/tree/context.Background) 是上下文的默认值，所有其他的上下文都应该从它衍生出来；
- [`context.TODO`](https://draveness.me/golang/tree/context.TODO) 应该仅在不确定应该使用哪种上下文时使用；

## 9. Map

```go
type Map struct {
    // 加锁作用，保护 dirty 字段
    mu Mutex
    // 只读的数据，实际数据类型为 readOnly
    read atomic.Value
    // 最新写入的数据
    dirty map[interface{}]*entry
    // 计数器，每次需要读 dirty 则 +1
    misses int
}

```

使用read，dirty空间换时间。通过引入两个map将读写分离到不同的map，其中read map提供并发读和已存元素原子写，而dirty map则负责读写。
这样read map就可以在不加锁的情况下进行并发读取,当read map中没有读取到值时,再加锁进行后续读取,并累加未命中数。
当未命中数大于等于dirty map长度,将dirty map上升为read map。
从结构体的定义可以发现，虽然引入了两个map，但是底层数据存储的是指针，指向的是同一份值。

其中设置ReadOnly的字段为：

```go
type readOnly struct {
    // 内建 map
    m  map[interface{}]*entry
    // 表示 dirty 里存在 read 里没有的 key，通过该字段决定是否加锁读 dirty
    amended bool
}
```

通过 read 和 dirty 两个字段将读写分离，读的数据存在只读字段 read 上，将最新写入的数据则存在 dirty 字段上

读取时会先查询 read，不存在再查询 dirty，写入时则只写入 dirty

读取 read 并不需要加锁，而读或写 dirty 都需要加锁

```go
func (m *Map) Load(key interface{}) (value interface{}, ok bool) {
    read, _ := m.read.Load().(readOnly)
    e, ok := read.m[key]
    if !ok && read.amended {
        m.mu.Lock()
        // Avoid reporting a spurious miss if m.dirty got promoted while we were
        // blocked on m.mu. (If further loads of the same key will not miss, it's
        // not worth copying the dirty map for this key.)
        read, _ = m.read.Load().(readOnly)
        e, ok = read.m[key]
        if !ok && read.amended {
            e, ok = m.dirty[key]
            // Regardless of whether the entry was present, record a miss: this key
            // will take the slow path until the dirty map is promoted to the read
            // map.
            m.missLocked()
        }
    m.mu.Unlock()
    }
    if !ok {
        return nil, false
    }
    return e.load()
}
func (e *entry) load() (value interface{}, ok bool) {
    p := atomic.LoadPointer(&e.p)
    if p == nil || p == expunged {
        return nil, false
    }
    return *(*interface{})(p), true
}
```

另外有 misses 字段来统计 read 被穿透的次数（被穿透指需要读 dirty 的情况），超过一定次数则将 dirty 数据同步到 read 上
```go
// Store sets the value for a key.
func (m *Map) Store(key, value interface{}) {
   read, _ := m.read.Load().(readOnly)
   if e, ok := read.m[key]; ok && e.tryStore(&value) {
      return
   }

   m.mu.Lock()
   read, _ = m.read.Load().(readOnly)
   if e, ok := read.m[key]; ok {
      if e.unexpungeLocked() {
         // The entry was previously expunged, which implies that there is a
         // non-nil dirty map and this entry is not in it.
         m.dirty[key] = e
      }
      e.storeLocked(&value)
   } else if e, ok := m.dirty[key]; ok {
      e.storeLocked(&value)
   } else {
      if !read.amended {
         // We're adding the first new key to the dirty map.
         // Make sure it is allocated and mark the read-only map as incomplete.
         m.dirtyLocked()
         m.read.Store(readOnly{m: read.m, amended: true})
      }
      m.dirty[key] = newEntry(value)
   }
   m.mu.Unlock()
}

// tryStore stores a value if the entry has not been expunged.
//
// If the entry is expunged, tryStore returns false and leaves the entry
// unchanged.
func (e *entry) tryStore(i *interface{}) bool {
   for {
      p := atomic.LoadPointer(&e.p)
      if p == expunged {
         return false
      }
      if atomic.CompareAndSwapPointer(&e.p, p, unsafe.Pointer(i)) {
         return true
      }
   }
}
```

对于删除数据则直接通过标记来延迟删除


```go
// LoadAndDelete deletes the value for a key, returning the previous value if any.
// The loaded result reports whether the key was present.
func (m *Map) LoadAndDelete(key interface{}) (value interface{}, loaded bool) {
   read, _ := m.read.Load().(readOnly)
   e, ok := read.m[key]
   if !ok && read.amended {
      m.mu.Lock()
      read, _ = m.read.Load().(readOnly)
      e, ok = read.m[key]
      if !ok && read.amended {
         e, ok = m.dirty[key]
         delete(m.dirty, key)
         // Regardless of whether the entry was present, record a miss: this key
         // will take the slow path until the dirty map is promoted to the read
         // map.
         m.missLocked()
      }
      m.mu.Unlock()
   }
   if ok {
      return e.delete()
   }
   return nil, false
}

// Delete deletes the value for a key.
func (m *Map) Delete(key interface{}) {
   m.LoadAndDelete(key)
}
```
