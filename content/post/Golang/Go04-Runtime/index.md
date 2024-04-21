---
title: "Go(4) Runtime"
date: 2021-09-28T19:31:04+08:00
draft: false
author: "Chasing1020"
comment: true
keywords: ['Runtime']
description: ""
tags: ['Go']
categories: ['Language']
image: "go-model-sheet.webp"
---

# Part4. Runtime

## 1. GMP 

### 1.1. Implement

#### 1.1.1. Data Structure

创建、销毁、调度 G 都需要每个 M 获取锁，这就形成了激烈的锁竞争。
M 转移 G 会造成延迟和额外的系统负载。比如当 G 中包含创建新协程的时候，M 创建了 G’，为了继续执行 G，需要把 G’交给 M’执行，也造成了很差的局部性，因为 G’和 G 是相关的，最好放在 M 上执行，而不是其他 M’。
系统调用 (CPU 在 M 之间的切换) 导致频繁的线程阻塞和取消阻塞操作增加了系统开销。

全局队列（Global Queue）：存放等待运行的 G。
P 的本地队列：不超过 256 个。新建 G’时，G’优先加入到 P 的本地队列，如果队列满了，则会把本地队列中一半的 G 移动到全局队列。
P 列表：所有的 P 都在程序启动时创建，并保存在数组中，最多有 GOMAXPROCS(可配置) 个。
M：线程想运行任务就得获取 P，从 P 的本地队列获取 G，P 队列为空时，M 也会尝试从全局队列拿一批 G 放到 P 的本地队列，或从其他 P 的本地队列偷一半放到自己 P 的本地队列。M 运行 G，G 执行之后，M 会从 P 获取下一个 G，不断重复下去。

##### 1.1.1.1. G

G：作为最小的运行的调度单元

```go
// Stack describes a Go execution stack.
// The bounds of the stack are exactly [lo, hi),
// with no implicit data structures on either side.
type stack struct {
    lo uintptr
    hi uintptr
}
type g struct {
    // Stack parameters.
    // stack describes the actual stack memory: [stack.lo, stack.hi).
    // stackguard0 is the stack pointer compared in the Go stack growth prologue.
    // It is stack.lo+StackGuard normally, but can be StackPreempt to trigger a preemption.
    // stackguard1 is the stack pointer compared in the C stack growth prologue.
    // It is stack.lo+StackGuard on g0 and gsignal stacks.
    // It is ~0 on other goroutine stacks, to trigger a call to morestackc (and crash).
    stack       stack   // offset known to runtime/cgo
    stackguard0 uintptr // offset known to liblink
    stackguard1 uintptr // offset known to liblink

    _panic       *_panic // innermost panic - offset known to liblink
    _defer       *_defer // innermost defer
    m            *m      // current m; offset known to arm liblink
    sched        gobuf
    syscallsp    uintptr        // if status==Gsyscall, syscallsp = sched.sp to use during gc
    syscallpc    uintptr        // if status==Gsyscall, syscallpc = sched.pc to use during gc
    stktopsp     uintptr        // expected sp at top of stack, to check in traceback
    param        unsafe.Pointer // passed parameter on wakeup
    atomicstatus uint32
    stackLock    uint32 // sigprof/scang lock; TODO: fold in to atomicstatus
    goid         int64
    schedlink    guintptr
    waitsince    int64      // approx time when the g become blocked
    waitreason   waitReason // if status==Gwaiting

    preempt       bool // preemption signal, duplicates stackguard0 = stackpreempt
    preemptStop   bool // transition to _Gpreempted on preemption; otherwise, just deschedule
    preemptShrink bool // shrink stack at synchronous safe point

    // asyncSafePoint is set if g is stopped at an asynchronous
    // safe point. This means there are frames on the stack
    // without precise pointer information.
    asyncSafePoint bool

    paniconfault bool // panic (instead of crash) on unexpected fault address
    gcscandone   bool // g has scanned stack; protected by _Gscan bit in status
    throwsplit   bool // must not split stack
    // activeStackChans indicates that there are unlocked channels
    // pointing into this goroutine's stack. If true, stack
    // copying needs to acquire channel locks to protect these
    // areas of the stack.
    activeStackChans bool
    // parkingOnChan indicates that the goroutine is about to
    // park on a chansend or chanrecv. Used to signal an unsafe point
    // for stack shrinking. It's a boolean value, but is updated atomically.
    parkingOnChan uint8

    raceignore     int8     // ignore race detection events
    sysblocktraced bool     // StartTrace has emitted EvGoInSyscall about this goroutine
    sysexitticks   int64    // cputicks when syscall has returned (for tracing)
    traceseq       uint64   // trace event sequencer
    tracelastp     puintptr // last P emitted an event for this goroutine
    lockedm        muintptr
    sig            uint32
    writebuf       []byte
    sigcode0       uintptr
    sigcode1       uintptr
    sigpc          uintptr
    gopc           uintptr         // pc of go statement that created this goroutine
    ancestors      *[]ancestorInfo // ancestor information goroutine(s) that created this goroutine (only used if debug.tracebackancestors)
    startpc        uintptr         // pc of goroutine function
    racectx        uintptr
    waiting        *sudog         // sudog structures this g is waiting on (that have a valid elem ptr); in lock order
    cgoCtxt        []uintptr      // cgo traceback context
    labels         unsafe.Pointer // profiler labels
    timer          *timer         // cached timer for time.Sleep
    selectDone     uint32         // are we participating in a select and did someone win the race?

    // Per-G GC state

    // gcAssistBytes is this G's GC assist credit in terms of
    // bytes allocated. If this is positive, then the G has credit
    // to allocate gcAssistBytes bytes without assisting. If this
    // is negative, then the G must correct this by performing
    // scan work. We track this in bytes to make it fast to update
    // and check for debt in the malloc hot path. The assist ratio
    // determines how this corresponds to scan work debt.
    gcAssistBytes int64
}
```

可以看到，g的`stack`保存了当前的栈范围，分别存储 `defer` 和 `panic` 对应结构体的链表，
`m` — 当前 Goroutine 占用的线程，可能为空； `atomicstatus` — Goroutine 的状态；
`sched` — 存储 Goroutine 的调度相关的数据； `goid` — Goroutine 的 ID，该字段对开发者不可见，Go 团队认为引入 ID 会让部分 Goroutine 变得更特殊，从而限制语言的并发能力。

其中g还内嵌了一个结构体gobuf，用于调度器保存以及恢复上下文中用到

```go
type gobuf struct {
    // The offsets of sp, pc, and g are known to (hard-coded in) libmach.
    //
    // ctxt is unusual with respect to GC: it may be a
    // heap-allocated funcval, so GC needs to track it, but it
    // needs to be set and cleared from assembly, where it's
    // difficult to have write barriers. However, ctxt is really a
    // saved, live register, and we only ever exchange it between
    // the real register and the gobuf. Hence, we treat it as a
    // root during stack scanning, which means assembly that saves
    // and restores it doesn't need write barriers. It's still
    // typed as a pointer so that any other writes from Go get
    // write barriers.
    sp   uintptr
    pc   uintptr
    g    guintptr  // 持有该gobuf的goroutine
    ctxt unsafe.Pointer
    ret  uintptr   // 系统调用的返回值
    lr   uintptr
    bp   uintptr // for framepointer-enabled architectures
}
```

此外atomicstatus还记录了goroutine当前的状态

```go
const (
    // G status
    //
    // Beyond indicating the general state of a G, the G status
    // acts like a lock on the goroutine's stack (and hence its
    // ability to execute user code).
    // _Gidle means this goroutine was just allocated and has not yet been initialized.
    _Gidle = iota // 0
    // _Grunnable means this goroutine is on a run queue. It isnot currently executing user code. The stack is not owned.
    _Grunnable // 1
    // _Grunning means this goroutine may execute user code. The stack is owned by this goroutine. It is not on a run queue. It is assigned an M and a P (g.m and g.m.p are valid).
    _Grunning // 2

    // _Gsyscall means this goroutine is executing a system call. It is not executing user code. The stack is owned by this goroutine. It is not on a run queue. It is assigned an M.
    _Gsyscall // 3

    // _Gwaiting means this goroutine is blocked in the runtime.
    // It is not executing user code. It is not on a run queue,
    // but should be recorded somewhere (e.g., a channel wait
    // queue) so it can be ready()d when necessary. The stack is
    // not owned *except* that a channel operation may read or
    // write parts of the stack under the appropriate channel
    // lock. Otherwise, it is not safe to access the stack after a
    // goroutine enters _Gwaiting (e.g., it may get moved).
    _Gwaiting // 4

    // _Gmoribund_unused is currently unused, but hardcoded in gdb
    // scripts.
    _Gmoribund_unused // 5

    // _Gdead means this goroutine is currently unused. It may be
    // just exited, on a free list, or just being initialized. It
    // is not executing user code. It may or may not have a stack
    // allocated. The G and its stack (if any) are owned by the M
    // that is exiting the G or that obtained the G from the free
    // list.
    _Gdead // 6

    // _Genqueue_unused is currently unused.
    _Genqueue_unused // 7

    // _Gcopystack means this goroutine's stack is being moved. It
    // is not executing user code and is not on a run queue. The
    // stack is owned by the goroutine that put it in _Gcopystack.
    _Gcopystack // 8

    // _Gpreempted means this goroutine stopped itself for a
    // suspendG preemption. It is like _Gwaiting, but nothing is
    // yet responsible for ready()ing it. Some suspendG must CAS
    // the status to _Gwaiting to take responsibility for
    // ready()ing this G.
    _Gpreempted // 9

    // _Gscan combined with one of the above states other than
    // _Grunning indicates that GC is scanning the stack. The
    // goroutine is not executing user code and the stack is owned
    // by the goroutine that set the _Gscan bit.
    //
    // _Gscanrunning is different: it is used to briefly block
    // state transitions while GC signals the G to scan its own
    // stack. This is otherwise like _Grunning.
    //
    // atomicstatus&~Gscan gives the state the goroutine will
    // return to when the scan completes.
    _Gscan          = 0x1000
    _Gscanrunnable  = _Gscan + _Grunnable  // 0x1001
    _Gscanrunning   = _Gscan + _Grunning   // 0x1002
    _Gscansyscall   = _Gscan + _Gsyscall   // 0x1003
    _Gscanwaiting   = _Gscan + _Gwaiting   // 0x1004
    _Gscanpreempted = _Gscan + _Gpreempted // 0x1009
)
```

主要状态如下：

| 状态          | 描述                                                         |
| ------------- | ------------------------------------------------------------ |
| `_Gidle`      | 刚刚被分配并且还没有被初始化，初始化结束后变为\_Gdead        |
| `_Grunnable`  | 没有执行代码，没有栈的所有权，存储在运行队列中               |
| `_Grunning`   | 可以执行代码，拥有栈的所有权，被赋予了内核线程 M 和处理器 P  |
| `_Gsyscall`   | 正在执行系统调用，拥有栈的所有权，没有执行用户代码，被赋予了内核线程 M 但是不在运行队列上 |
| `_Gwaiting`   | 由于运行时而被阻塞，没有执行用户代码并且不在运行队列上，但是可能存在于 Channel 的等待队列上 |
| `_Gdead`      | 可以是被销毁的，也可以是刚创建的。没有被使用，没有执行代码，可能有分配的栈 |
| `_Gcopystack` | 栈正在被拷贝，没有执行代码，不在运行队列上                   |
| `_Gpreempted` | 由于抢占而被阻塞，没有执行用户代码并且不在运行队列上，等待唤醒 |
| `_Gscan`      | GC 正在扫描栈空间，没有执行代码，可以与其他状态同时存在      |

其中g0作为特殊的调度协程：执行函数的流程相对固定，切为了避免栈溢出，g0的栈会复用

##### 1.1.1.2. M

```go
type m struct {
    g0      *g     // goroutine with scheduling stack
    morebuf gobuf  // gobuf arg to morestack
    divmod  uint32 // div/mod denominator for arm - known to liblink

    // Fields not known to debuggers.
    procid        uint64            // for debuggers, but offset not hard-coded
    gsignal       *g                // signal-handling g
    goSigStack    gsignalStack      // Go-allocated signal handling stack
    sigmask       sigset            // storage for saved signal mask
    tls           [tlsSlots]uintptr // thread-local storage (for x86 extern register)
    mstartfn      func()
    curg          *g       // current running goroutine
    caughtsig     guintptr // goroutine running during fatal signal
    p             puintptr // attached p for executing go code (nil if not executing go code)
    nextp         puintptr
    oldp          puintptr // the p that was attached before executing a syscall
    id            int64
    mallocing     int32
    throwing      int32
    preemptoff    string // if != "", keep curg running on this m
    locks         int32
    dying         int32
    profilehz     int32
    spinning      bool // m is out of work and is actively looking for work
    blocked       bool // m is blocked on a note
    newSigstack   bool // minit on C thread called sigaltstack
    printlock     int8
    incgo         bool   // m is executing a cgo call
    freeWait      uint32 // if == 0, safe to free g0 and delete m (atomic)
    fastrand      [2]uint32
    needextram    bool
    traceback     uint8
    ncgocall      uint64      // number of cgo calls in total
    ncgo          int32       // number of cgo calls currently in progress
    cgoCallersUse uint32      // if non-zero, cgoCallers in use temporarily
    cgoCallers    *cgoCallers // cgo traceback if crashing in cgo call
    doesPark      bool        // non-P running threads: sysmon and newmHandoff never use .park
    park          note
    alllink       *m // on allm
    schedlink     muintptr
    lockedg       guintptr
    createstack   [32]uintptr // stack that created this thread.
    lockedExt     uint32      // tracking for external LockOSThread
    lockedInt     uint32      // tracking for internal lockOSThread
    nextwaitm     muintptr    // next m waiting for lock
    waitunlockf   func(*g, unsafe.Pointer) bool
    waitlock      unsafe.Pointer
    waittraceev   byte
    waittraceskip int
    startingtrace bool
    syscalltick   uint32
    freelink      *m // on sched.freem

    // mFixup is used to synchronize OS related m state
    // (credentials etc) use mutex to access. To avoid deadlocks
    // an atomic.Load() of used being zero in mDoFixupFn()
    // guarantees fn is nil.
    mFixup struct {
        lock mutex
        used uint32
        fn   func(bool) bool
    }

    // these are here because they are too large to be on the stack
    // of low-level NOSPLIT functions.
    libcall   libcall
    libcallpc uintptr // for cpu profiler
    libcallsp uintptr
    libcallg  guintptr
    syscall   libcall // stores syscall parameters on windows

    vdsoSP uintptr // SP for traceback while in VDSO call (0 if not in call)
    vdsoPC uintptr // PC for traceback while in VDSO call

    // preemptGen counts the number of completed preemption
    // signals. This is used to detect when a preemption is
    // requested, but fails. Accessed atomically.
    preemptGen uint32

    // Whether this is a pending preemption signal on this M.
    // Accessed atomically.
    signalPending uint32

    dlogPerM

    mOS

    // Up to 10 locks held by this m, maintained by the lock ranking code.
    locksHeldLen int
    locksHeld    [10]heldLockInfo
}
```

其中 g0 是持有调度栈的 Goroutine，`curg` 是在当前线程上运行的用户 Goroutine，这也是操作系统线程唯一关心的两个 Goroutine。

##### 1.1.1.3. P

调度器中的处理器 P 是线程和 Goroutine 的中间层，它能提供线程需要的上下文环境，也会负责调度线程上的等待队列，通过处理器 P 的调度，每一个内核线程都能够执行多个 Goroutine，它能在 Goroutine 进行一些 I/O 操作时及时让出计算资源，提高线程的利用率。

因为调度器在启动时就会创建 `GOMAXPROCS` 个处理器，所以 Go 语言程序的处理器数量一定会等于 `GOMAXPROCS`，这些处理器会绑定到不同的内核线程上。

`runtime.p` 是处理器的运行时表示，作为调度器的内部实现，它包含的字段也非常多，其中包括与性能追踪、垃圾回收和计时器相关的字段，这些字段也非常重要，但是在这里就不展示了，我们主要关注处理器中的线程和运行队列：

P：作为中间层，

```go
type p struct {
    id          int32
    status      uint32 // one of pidle/prunning/...
    link        puintptr
    schedtick   uint32     // incremented on every scheduler call
    syscalltick uint32     // incremented on every system call
    sysmontick  sysmontick // last tick observed by sysmon
    m           muintptr   // back-link to associated m (nil if idle)
    mcache      *mcache
    pcache      pageCache
    raceprocctx uintptr

    deferpool    [5][]*_defer // pool of available defer structs of different sizes (see panic.go)
    deferpoolbuf [5][32]*_defer

    // Cache of goroutine ids, amortizes accesses to runtime·sched.goidgen.
    goidcache    uint64
    goidcacheend uint64

    // Queue of runnable goroutines. Accessed without lock.
    runqhead uint32
    runqtail uint32
    runq     [256]guintptr
    // runnext, if non-nil, is a runnable G that was ready'd by
    // the current G and should be run next instead of what's in
    // runq if there's time remaining in the running G's time
    // slice. It will inherit the time left in the current time
    // slice. If a set of goroutines is locked in a
    // communicate-and-wait pattern, this schedules that set as a
    // unit and eliminates the (potentially large) scheduling
    // latency that otherwise arises from adding the ready'd
    // goroutines to the end of the run queue.
    //
    // Note that while other P's may atomically CAS this to zero,
    // only the owner P can CAS it to a valid G.
    runnext guintptr

    // Available G's (status == Gdead)
    gFree struct {
        gList
        n int32
    }

    sudogcache []*sudog
    sudogbuf   [128]*sudog

    // Cache of mspan objects from the heap.
    mspancache struct {
        // We need an explicit length here because this field is used
        // in allocation codepaths where write barriers are not allowed,
        // and eliminating the write barrier/keeping it eliminated from
        // slice updates is tricky, moreso than just managing the length
        // ourselves.
        len int
        buf [128]*mspan
    }

    tracebuf traceBufPtr

    // traceSweep indicates the sweep events should be traced.
    // This is used to defer the sweep start event until a span
    // has actually been swept.
    traceSweep bool
    // traceSwept and traceReclaimed track the number of bytes
    // swept and reclaimed by sweeping in the current sweep loop.
    traceSwept, traceReclaimed uintptr

    palloc persistentAlloc // per-P to avoid mutex

    _ uint32 // Alignment for atomic fields below

    // The when field of the first entry on the timer heap.
    // This is updated using atomic functions.
    // This is 0 if the timer heap is empty.
    timer0When uint64

    // The earliest known nextwhen field of a timer with
    // timerModifiedEarlier status. Because the timer may have been
    // modified again, there need not be any timer with this value.
    // This is updated using atomic functions.
    // This is 0 if there are no timerModifiedEarlier timers.
    timerModifiedEarliest uint64

    // Per-P GC state
    gcAssistTime         int64 // Nanoseconds in assistAlloc
    gcFractionalMarkTime int64 // Nanoseconds in fractional mark worker (atomic)

    // gcMarkWorkerMode is the mode for the next mark worker to run in.
    // That is, this is used to communicate with the worker goroutine
    // selected for immediate execution by
    // gcController.findRunnableGCWorker. When scheduling other goroutines,
    // this field must be set to gcMarkWorkerNotWorker.
    gcMarkWorkerMode gcMarkWorkerMode
    // gcMarkWorkerStartTime is the nanotime() at which the most recent
    // mark worker started.
    gcMarkWorkerStartTime int64

    // gcw is this P's GC work buffer cache. The work buffer is
    // filled by write barriers, drained by mutator assists, and
    // disposed on certain GC state transitions.
    gcw gcWork

    // wbBuf is this P's GC write barrier buffer.
    //
    // TODO: Consider caching this in the running G.
    wbBuf wbBuf

    runSafePointFn uint32 // if 1, run sched.safePointFn at next safe point

    // statsSeq is a counter indicating whether this P is currently
    // writing any stats. Its value is even when not, odd when it is.
    statsSeq uint32

    // Lock for timers. We normally access the timers while running
    // on this P, but the scheduler can also do it from a different P.
    timersLock mutex

    // Actions to take at some time. This is used to implement the
    // standard library's time package.
    // Must hold timersLock to access.
    timers []*timer

    // Number of timers in P's heap.
    // Modified using atomic instructions.
    numTimers uint32

    // Number of timerDeleted timers in P's heap.
    // Modified using atomic instructions.
    deletedTimers uint32

    // Race context used while executing timer functions.
    timerRaceCtx uintptr

    // preempt is set to indicate that this P should be enter the
    // scheduler ASAP (regardless of what G is running on it).
    preempt bool

    // Padding is no longer needed. False sharing is now not a worry because p is large enough
    // that its size class is an integer multiple of the cache line size (for any of our architectures).
}
```

其中 P 也定义了状态字段

```go
const (
   // P status

   // _Pidle means a P is not being used to run user code or the
   // scheduler. Typically, it's on the idle P list and available
   // to the scheduler, but it may just be transitioning between
   // other states.
   //
   // The P is owned by the idle list or by whatever is
   // transitioning its state. Its run queue is empty.
   _Pidle = iota

   // _Prunning means a P is owned by an M and is being used to
   // run user code or the scheduler. Only the M that owns this P
   // is allowed to change the P's status from _Prunning. The M
   // may transition the P to _Pidle (if it has no more work to
   // do), _Psyscall (when entering a syscall), or _Pgcstop (to
   // halt for the GC). The M may also hand ownership of the P
   // off directly to another M (e.g., to schedule a locked G).
   _Prunning

   // _Psyscall means a P is not running user code. It has
   // affinity to an M in a syscall but is not owned by it and
   // may be stolen by another M. This is similar to _Pidle but
   // uses lightweight transitions and maintains M affinity.
   //
   // Leaving _Psyscall must be done with a CAS, either to steal
   // or retake the P. Note that there's an ABA hazard: even if
   // an M successfully CASes its original P back to _Prunning
   // after a syscall, it must understand the P may have been
   // used by another M in the interim.
   _Psyscall

   // _Pgcstop means a P is halted for STW and owned by the M
   // that stopped the world. The M that stopped the world
   // continues to use its P, even in _Pgcstop. Transitioning
   // from _Prunning to _Pgcstop causes an M to release its P and
   // park.
   //
   // The P retains its run queue and startTheWorld will restart
   // the scheduler on Ps with non-empty run queues.
   _Pgcstop

   // _Pdead means a P is no longer used (GOMAXPROCS shrank). We
   // reuse Ps if GOMAXPROCS increases. A dead P is mostly
   // stripped of its resources, though a few things remain
   // (e.g., trace buffers).
   _Pdead
)
```
| 状态        | 描述                                                         |
| ----------- | ------------------------------------------------------------ |
| `_Pidle`    | 处理器没有运行用户代码或者调度器，被空闲队列或者改变其状态的结构持有，运行队列为空 |
| `_Prunning` | 被线程 M 持有，并且正在执行用户代码或者调度器                |
| `_Psyscall` | 没有执行用户代码，当前线程陷入系统调用                       |
| `_Pgcstop`  | 被线程 M 持有，当前处理器由于垃圾回收被停止                  |
| `_Pdead`    | 当前处理器已经不被使用                                       |

```go
struct P {
    Lock;

    uint32    status;
    P*    link;
    uint32    tick;
    M*    m;
    MCache*    mcache;

    G**    runq; // goroutine组成的环形数组
    int32    runqhead;
    int32    runqtail;
    int32    runqsize;

    G*    gfree;
    int32    gfreecnt;
};
```

1. G的状态

- 空闲中(_Gidle): 表示G刚刚新建, 仍未初始化
- 待运行(_Grunnable): 表示G在运行队列中, 等待M取出并运行
- 运行中(_Grunning): 表示M正在运行这个G, 这时候M会拥有一个P
- 系统调用中(_Gsyscall): 表示M正在运行这个G发起的系统调用, 这时候M并不拥有P
- 等待中(_Gwaiting): 表示G在等待某些条件完成, 这时候G不在运行也不在运行队列中(可能在channel的等待队列中)
- 已中止(_Gdead): 表示G未被使用, 可能已执行完毕(并在freelist中等待下次复用)
- 栈复制中(_Gcopystack): 表示G正在获取一个新的栈空间并把原来的内容复制过去(用于防止GC扫描)

2. M的状态

M并没有像G和P一样的状态标记, 但可以认为一个M有以下的状态:

- 自旋中(spinning): M正在从运行队列获取G, 这时候M会拥有一个P
- 执行go代码中: M正在执行go代码, 这时候M会拥有一个P
- 执行原生代码中: M正在执行原生代码或者阻塞的syscall, 这时M并不拥有P
- 休眠中: M发现无待运行的G时会进入休眠, 并添加到空闲M链表中, 这时M并不拥有P

自旋中(spinning)这个状态非常重要, 是否需要唤醒或者创建新的M取决于当前自旋中的M的数量.

3. P的状态

- 空闲中(_Pidle): 当M发现无待运行的G时会进入休眠, 这时M拥有的P会变为空闲并加到空闲P链表中
- 运行中(_Prunning): 当M拥有了一个P后, 这个P的状态就会变为运行中, M运行G会使用这个P中的资源
- 系统调用中(_Psyscall): 当go调用原生代码, 原生代码又反过来调用go代码时, 使用的P会变为此状态
- GC停止中(_Pgcstop): 当gc停止了整个世界(STW)时, P会变为此状态
- 已中止(_Pdead): 当P的数量在运行时改变, 且数量减少时多余的P会变为此状态

P的数量：设置由启动时环境变量 \$GOMAXPROCS 或者是由 runtime 的方法 GOMAXPROCS() 决定。这意味着在程序执行的任意时刻都只有 \$GOMAXPROCS 个 goroutine 在同时运行。

M 的数量：go 语言本身的限制：go 程序启动时，会设置 M 的最大数量，默认 10000. 但是内核很难支持这么多的线程数，所以这个限制可以忽略。runtime/debug 中的 SetMaxThreads 函数，设置 M 的最大数量。一个 M 阻塞了，会创建新的 M。

在go中有多个运行队列可以保存待运行(_Grunnable)的G, 它们分别是各个P中的本地运行队列和全局运行队列.
入队待运行的G时会优先加到当前P的本地运行队列, M获取待运行的G时也会优先从拥有的P的本地运行队列获取,
本地运行队列入队和出队不需要使用线程锁.

本地运行队列有数量限制, 当数量达到256个时会入队到全局运行队列.
本地运行队列的数据结构是[环形队列](https://link.segmentfault.com/?enc=3K7smhVfN1rsbyq%2FSwlKxg%3D%3D.65MePZBQYDpl%2FjSZBC976W%2Blp8dmXiT1ISfuJPU9TLbK7knyfQavGJ%2BADWaPh5uR), 由一个256长度的数组和两个序号(head, tail)组成.

当M从P的本地运行队列获取G时, 如果发现本地队列为空会尝试从其他P盗取一半的G过来,
这个机制叫做[Work Stealing](https://link.segmentfault.com/?enc=dFHWCcy9uuQg8AreOB4osg%3D%3D.d3lAx7XwHsabU%2FP1I8q5qlEqbus5KYD7pQ8L%2Fu6cvm%2Fy78iwj%2FOPweDd%2Fy2%2FeecH), 详见后面的代码分析.

全局运行队列保存在全局变量`sched`中, 全局运行队列入队和出队需要使用线程锁.
全局运行队列的数据结构是链表, 由两个指针(head, tail)组成.

#### 1.1.2. Start

在调度器初始函数执行的过程中会将 `maxmcount` 设置成 10000，这也就是一个 Go 语言程序能够创建的最大线程数，虽然最多可以创建 10000 个线程，但是可以同时运行的线程还是由 `GOMAXPROCS` 变量控制。

```go
func schedinit() {
    _g_ := getg()
    ...

    sched.maxmcount = 10000

    ...
    sched.lastpoll = uint64(nanotime())
    procs := ncpu
    if n, ok := atoi32(gogetenv("GOMAXPROCS")); ok && n > 0 {
        procs = n
    }
    if procresize(procs) != nil {
        throw("unknown runnable goroutine during bootstrap")
    }
}
```

当procresize启动后，开始等待用户创建运行新的 Goroutine 并为 Goroutine 调度处理器资源

### 1.2. Create Goroutine

当调用go func()时，编译器调用call方法，然后再转换成newproc的调用

```go
func (s *state) call(n *Node, k callKind) *ssa.Value {
    if k == callDeferStack {
        ...
    } else {
        switch {
        case k == callGo:
            call = s.newValue1A(ssa.OpStaticCall, types.TypeMem, newproc, s.mem())
        default:
        }
    }
    ...
}
```

`runtime.newproc`的入参是参数大小和表示函数的指针 `funcval`，它会获取 Goroutine 以及调用方的程序计数器，然后调用 `runtime.newproc1`函数获取新的 Goroutine 结构体、将其加入处理器的运行队列并在满足条件时调用 `runtime.wakep` 唤醒新的处理执行 Goroutine：

```go
func newproc(siz int32, fn *funcval) {
    argp := add(unsafe.Pointer(&fn), sys.PtrSize)
    gp := getg()
    pc := getcallerpc()
    systemstack(func() {
        newg := newproc1(fn, argp, siz, gp, pc)

        _p_ := getg().m.p.ptr()
        runqput(_p_, newg, true)

        if mainStarted {
            wakep()
        }
    })
}
```

其中newproc1调用如下，其调用可以分为如下三步：

1. 获取或者创建新的 Goroutine 结构体

```go
func newproc1(fn *funcval, argp unsafe.Pointer, narg int32, callergp *g, callerpc uintptr) *g {
    _g_ := getg()
    siz := narg
    siz = (siz + 7) &^ 7

    _p_ := _g_.m.p.ptr()
    newg := gfget(_p_)  // 获取新的g
    if newg == nil {
        newg = malg(_StackMin)
        casgstatus(newg, _Gidle, _Gdead)
        allgadd(newg)
    }
//...
```

2. 把参数放入栈区：

    接下来，我们会调用 `runtime.memmove` 将 `fn` 函数的所有参数拷贝到栈上，`argp` 和 `narg` 分别是参数的内存空间和大小，我们在该方法中会将参数对应的内存空间整块拷贝到栈上

```go
//...
  totalSize := 4*sys.RegSize + uintptr(siz) + sys.MinFrameSize
    totalSize += -totalSize & (sys.SpAlign - 1)
    sp := newg.stack.hi - totalSize
    spArg := sp
    if narg > 0 {
        memmove(unsafe.Pointer(spArg), argp, uintptr(narg))
    }
//...
```

3. 更新 Goroutine 调度相关的属性；

```go
//...
    memclrNoHeapPointers(unsafe.Pointer(&newg.sched), unsafe.Sizeof(newg.sched))
    newg.sched.sp = sp
    newg.stktopsp = sp
    newg.sched.pc = funcPC(goexit) + sys.PCQuantum
    newg.sched.g = guintptr(unsafe.Pointer(newg))
    gostartcallfn(&newg.sched, fn)
    newg.gopc = callerpc
    newg.startpc = fn.fn
    casgstatus(newg, _Gdead, _Grunnable)
    newg.goid = int64(_p_.goidcache)
    _p_.goidcache++
    return newg
}
```

其中gfget方法如下：

1. 从 Goroutine 所在处理器的 `gFree` 列表或者调度器的 `sched.gFree` 列表中获取 `runtime.g`；

```go
// Available G's (status == Gdead)
gFree struct {
    gList
    n int32
}
// A gList is a list of Gs linked through g.schedlink. A G can only be
// on one gQueue or gList at a time.
type gList struct {
    head guintptr
}
```

2. 调用 `runtime.malg`生成一个新的 `runtime.g` 并将结构体追加到全局的 Goroutine 列表 `allgs` 中。

```go
func gfget(_p_ *p) *g {
retry:
    if _p_.gFree.empty() && (!sched.gFree.stack.empty() || !sched.gFree.noStack.empty()) {
        for _p_.gFree.n < 32 {
            gp := sched.gFree.stack.pop()
            if gp == nil {
                gp = sched.gFree.noStack.pop()
                if gp == nil {
                    break
                }
            }
            _p_.gFree.push(gp)
        }
        goto retry
    }
    gp := _p_.gFree.pop()
    if gp == nil {
        return nil
    }
    return gp
}
```

1. 当处理器的 Goroutine 列表为空时，会将调度器持有的空闲 Goroutine 转移到当前处理器上，直到 `gFree` 列表中的 Goroutine 数量达到 32；
2. 当处理器的 Goroutine 数量充足时，会从列表头部返回一个新的 Goroutine；

当调度器的 `gFree` 和处理器的 `gFree` 列表都不存在结构体时，运行时会调用 `runtime.malg`初始化新的 `runtime.g`结构，如果申请的堆栈大小大于 0，这里会通过 `runtime.stackalloc` 分配 2KB 的栈空间：

```go
func malg(stacksize int32) *g {
    newg := new(g)
    if stacksize >= 0 {
        stacksize = round2(_StackSystem + stacksize)
        newg.stack = stackalloc(uint32(stacksize))
        newg.stackguard0 = newg.stack.lo + _StackGuard
        newg.stackguard1 = ^uintptr(0)
    }
    return newg
}
```

之后会调用`runtime.runqput`会将 Goroutine 放到运行队列上，这既可能是全局的运行队列，也可能是处理器本地的运行队列：

```go
func runqput(_p_ *p, gp *g, next bool) {
    if next {
    retryNext:
        oldnext := _p_.runnext
        if !_p_.runnext.cas(oldnext, guintptr(unsafe.Pointer(gp))) {
            goto retryNext
        }
        if oldnext == 0 {
            return
        }
        gp = oldnext.ptr()
    }
retry:
    h := atomic.LoadAcq(&_p_.runqhead)
    t := _p_.runqtail
    if t-h < uint32(len(_p_.runq)) {
        _p_.runq[t%uint32(len(_p_.runq))].set(gp)
        atomic.StoreRel(&_p_.runqtail, t+1)
        return
    }
    if runqputslow(_p_, gp, h, t) {
        return
    }
    goto retry
}
```

1. 当 `next` 为 `true` 时，将 Goroutine 设置到处理器的 `runnext` 作为下一个处理器执行的任务；
2. 当 `next` 为 `false` 并且本地运行队列还有剩余空间时，将 Goroutine 加入处理器持有的本地运行队列；
3. 当处理器的本地运行队列已经没有剩余空间时就会把本地队列中的一部分 Goroutine 和待加入的 Goroutine 通过 `runtime.runqputslow`添加到调度器持有的全局运行队列上；

这里取全局队列的Goroutine数目刚好为n = min(len(GQ)/GOMAXPROCS + 1, len(GQ/2))

### 1.3. Schedule

#### 1.3.1. M0, G0

go语言的启动流程简单示意见下注释

```go
// The bootstrap sequence is:
//
// call osinit
// call schedinit
// make & queue new G
// call runtime·mstart
//
// The new G calls runtime·main.
```

此外，runtime/proc下也定义了初始状态

```go
var (
    m0           m
    g0           g
    mcache0      *mcache
    raceprocctx0 uintptr
)
```

程序开始时，会先执行schedinit创建第一个G，mstart函数创建第一个M

```go
func newm1(mp *m) {
    if iscgo {
        var ts cgothreadstart
        if _cgo_thread_start == nil {
            throw("_cgo_thread_start missing")
        }
        ts.g.set(mp.g0)
        ts.tls = (*uint64)(unsafe.Pointer(&mp.tls[0]))
        ts.fn = unsafe.Pointer(funcPC(mstart))
        if msanenabled {
            msanwrite(unsafe.Pointer(&ts), unsafe.Sizeof(ts))
        }
        execLock.rlock() // Prevent process clone.
        asmcgocall(_cgo_thread_start, unsafe.Pointer(&ts))
        execLock.runlock()
        return
    }
    execLock.rlock() // Prevent process clone.
    newosproc(mp)
    execLock.runlock()
}


func mstart() {
   _g_ := getg() // 这里创建的是g0，分配在系统堆栈

   osStack := _g_.stack.lo == 0
   if osStack {
      // Initialize stack bounds from system stack.
      size := _g_.stack.hi
      if size == 0 {
         size = 8192 * sys.StackGuardMultiplier
      }
      _g_.stack.hi = uintptr(noescape(unsafe.Pointer(&size)))
      _g_.stack.lo = _g_.stack.hi - size + 1024
   }
   // Initialize stack guard so that we can start calling regular
   // Go code.
   _g_.stackguard0 = _g_.stack.lo + _StackGuard
   // This is the g0, so we can also call go:systemstack
   // functions, which check stackguard1.
   _g_.stackguard1 = _g_.stackguard0
   mstart1()

   // Exit this thread.
   if mStackIsSystemAllocated() {
      osStack = true
   }
   mexit(osStack)
}
```

以上函数函数会调用mstart1来将g0绑定到m0上，并开始执行schedule调度

```go
func mstart1() {
   _g_ := getg()

   if _g_ != _g_.m.g0 {
      throw("bad runtime·mstart")
   }

   // Record the caller for use as the top of stack in mcall and
   // for terminating the thread.
   // We're never coming back to mstart1 after we call schedule,
   // so other calls can reuse the current frame.
   save(getcallerpc(), getcallersp())
   asminit()
   minit()  // 将M进行初始化，设置线程的备用信号堆栈和信号掩码

   // Install signal handlers; after minit so that minit can
   // prepare the thread to be able to handle the signals.
   if _g_.m == &m0 {
      mstartm0()
   }
   if fn := _g_.m.mstartfn; fn != nil {
      fn()
   }
   if _g_.m != &m0 {
      acquirep(_g_.m.nextp.ptr())
      _g_.m.nextp = 0
   }
   schedule()
}

// mstartm0 implements part of mstart1 that only runs on the m0.
//
// Write barriers are allowed here because we know the GC can't be
// running yet, so they'll be no-ops.
//
//go:yeswritebarrierrec
func mstartm0() {
    // Create an extra M for callbacks on threads not created by Go.
    // An extra M is also needed on Windows for callbacks created by
    // syscall.NewCallback. See issue #6751 for details.
    if (iscgo || GOOS == "windows") && !cgoHasExtraM {
        cgoHasExtraM = true
        newextram()
    }
    initsig(false)
}
```

mstart1() 在结束阶段，会调用schedule，而schedule在本地队列中第一次会找到main goroutine，而第一个goroutine绑定的方法就是main，而main方法完成以下操作：

```go
// The main goroutine.
func main() {
   g := getg()

   // Racectx of m0->g0 is used only as the parent of the main goroutine.
   // It must not be used for anything else.
   g.m.g0.racectx = 0

   // Max stack size is 1 GB on 64-bit, 250 MB on 32-bit.
   // Using decimal instead of binary GB and MB because
   // they look nicer in the stack overflow failure message.
   if sys.PtrSize == 8 {
      maxstacksize = 1000000000
   } else {
      maxstacksize = 250000000
   }

   // An upper limit for max stack size. Used to avoid random crashes
   // after calling SetMaxStack and trying to allocate a stack that is too big,
   // since stackalloc works with 32-bit sizes.
   maxstackceiling = 2 * maxstacksize

   // Allow newproc to start new Ms.
   mainStarted = true

   if GOARCH != "wasm" { // no threads on wasm yet, so no sysmon
      // For runtime_syscall_doAllThreadsSyscall, we
      // register sysmon is not ready for the world to be
      // stopped.
      atomic.Store(&sched.sysmonStarting, 1)
      systemstack(func() {
         newm(sysmon, nil, -1)
      })
   }

   // Lock the main goroutine onto this, the main OS thread,
   // during initialization. Most programs won't care, but a few
   // do require certain calls to be made by the main thread.
   // Those can arrange for main.main to run in the main thread
   // by calling runtime.LockOSThread during initialization
   // to preserve the lock.
   lockOSThread()

   if g.m != &m0 {
      throw("runtime.main not on m0")
   }
   m0.doesPark = true

   // Record when the world started.
   // Must be before doInit for tracing init.
   runtimeInitTime = nanotime()
   if runtimeInitTime == 0 {
      throw("nanotime returning zero")
   }

   if debug.inittrace != 0 {
      inittrace.id = getg().goid
      inittrace.active = true
   }

   doInit(&runtime_inittask) // Must be before defer.

   // Defer unlock so that runtime.Goexit during init does the unlock too.
   needUnlock := true
   defer func() {
      if needUnlock {
         unlockOSThread()
      }
   }()

   gcenable()

   main_init_done = make(chan bool)
   if iscgo {
      if _cgo_thread_start == nil {
         throw("_cgo_thread_start missing")
      }
      if GOOS != "windows" {
         if _cgo_setenv == nil {
            throw("_cgo_setenv missing")
         }
         if _cgo_unsetenv == nil {
            throw("_cgo_unsetenv missing")
         }
      }
      if _cgo_notify_runtime_init_done == nil {
         throw("_cgo_notify_runtime_init_done missing")
      }
      // Start the template thread in case we enter Go from
      // a C-created thread and need to create a new thread.
      startTemplateThread()
      cgocall(_cgo_notify_runtime_init_done, nil)
   }

   doInit(&main_inittask)

   // Disable init tracing after main init done to avoid overhead
   // of collecting statistics in malloc and newproc
   inittrace.active = false

   close(main_init_done)

   needUnlock = false
   unlockOSThread()

   if isarchive || islibrary {
      // A program compiled with -buildmode=c-archive or c-shared
      // has a main, but it is not executed.
      return
   }
   fn := main_main // make an indirect call, as the linker doesn't know the address of the main package when laying down the runtime
   fn()
   if raceenabled {
      racefini()
   }

   // Make racy client program work: if panicking on
   // another goroutine at the same time as main returns,
   // let the other goroutine finish printing the panic trace.
   // Once it does, it will exit. See issues 3934 and 20018.
   if atomic.Load(&runningPanicDefers) != 0 {
      // Running deferred functions should not take long.
      for c := 0; c < 1000; c++ {
         if atomic.Load(&runningPanicDefers) == 0 {
            break
         }
         Gosched()
      }
   }
   if atomic.Load(&panicking) != 0 {
      gopark(nil, nil, waitReasonPanicWait, traceEvGoStop, 1)
   }

   exit(0)
   for {
      var x *int32
      *x = 0
   }
}
```

综上所述：Go语言启动流程可以简化如下

确定当前系统的平台，OSinit

schedinit：做好初始化一些锁，cpu，gc等，之后调用procresize

procresize：将当前的m0和allp[0]进行绑定，再调用

mstart：分配go的堆栈，将m0和g0绑定

schedule：调度开始，首先执行m0的g0，绑定的函数即为main

main goroutine：开始函数的执行流

#### 1.3.2. Schedinit

```GO
func schedinit() {
    _g_ := getg()
    ...

    sched.maxmcount = 10000

    ...
    sched.lastpoll = uint64(nanotime())
    procs := ncpu
    if n, ok := atoi32(gogetenv("GOMAXPROCS")); ok && n > 0 {
        procs = n
    }
    if procresize(procs) != nil {
        throw("unknown runnable goroutine during bootstrap")
    }
}
```

1. 如果全局变量 `allp` 切片中的处理器数量少于期望数量，会对切片进行扩容；
2. 使用 `new` 创建新的处理器结构体并调用 [`runtime.p.init`](https://draveness.me/golang/tree/runtime.p.init) 初始化刚刚扩容的处理器；
3. 通过指针将线程 m0 和处理器 `allp[0]` 绑定到一起；
4. 调用 [`runtime.p.destroy`](https://draveness.me/golang/tree/runtime.p.destroy) 释放不再使用的处理器结构；
5. 通过截断改变全局变量 `allp` 的长度保证与期望处理器数量相等；
6. 将除 `allp[0]` 之外的处理器 P 全部设置成 `_Pidle` 并加入到全局的空闲队列中；

#### 1.3.3. Schedule Loop

当程序的调度器启动之后，会执行schedule()函数查找goroutine

```go
func schedule() {
    _g_ := getg()

top:
    var gp *g
    var inheritTime bool

    if gp == nil {
        // 如果发生了61次调度，且全局队列不为空，则去全局队列中找goroutine
        if _g_.m.p.ptr().schedtick%61 == 0 && sched.runqsize > 0 {
            lock(&sched.lock)
            gp = globrunqget(_g_.m.p.ptr(), 1)
            unlock(&sched.lock)
        }
    }
    if gp == nil {
        gp, inheritTime = runqget(_g_.m.p.ptr())
    }
    if gp == nil {
        gp, inheritTime = findrunnable()
    }
    // ...
    if gp.lockedm != 0 {
        // Hands off own p to the locked m,
        // then blocks waiting for a new p.
        startlockedm(gp)
        goto top
    }
    execute(gp, inheritTime)
}
```

1. 为了保证公平，当全局运行队列中有待执行的 Goroutine 时，通过 `schedtick` 保证有一定几率会从全局的运行队列中查找对应的 Goroutine；
2. 从处理器本地的运行队列中查找待执行的 Goroutine；
3. 如果前两种方法都没有找到 Goroutine，会通过 `runtime.findrunnable`进行阻塞地查找 Goroutine；

findrunnable函数会执行以下操作：

1. 从本地运行队列、全局运行队列中查找；
2. 从网络轮询器中查找是否有 Goroutine 等待运行；
3. 通过 `runtime.runqsteal`尝试从其他随机的处理器中窃取待运行的 Goroutine，该函数还可能窃取处理器的计时器；

在获取到Goroutine以后，最终会调用execute函数

```go
func execute(gp *g, inheritTime bool) {
    _g_ := getg()

    _g_.m.curg = gp
    gp.m = _g_.m
    casgstatus(gp, _Grunnable, _Grunning)
    gp.waitsince = 0
    gp.preempt = false
    gp.stackguard0 = gp.stack.lo + _StackGuard
    if !inheritTime {
        _g_.m.p.ptr().schedtick++
    }

    gogo(&gp.sched)
}
```

通过gogo函数，将这个Goroutine调度到当前线程上，gogo函数会从 `runtime.gobuf` 中取出了 `runtime.goexit`的程序计数器和待执行函数的程序计数器，其中：

- `runtime.goexit` 的程序计数器被放到了栈 SP 上；
- 待执行函数的程序计数器被放到了寄存器 BX 上；

当这个Goroutine结束的时候，会runtime·goexit(SB)，再经过一系列复杂的函数调用，我们最终在当前线程的 g0 的栈上调用 `runtime.goexit0`函数，该函数会将 Goroutine 转换会 `_Gdead` 状态、清理其中的字段、移除 Goroutine 和线程的关联并调用 `runtime.gfput`重新加入处理器的 Goroutine 空闲列表 `gFree`：

```go
func goexit0(gp *g) {
    _g_ := getg()

    casgstatus(gp, _Grunning, _Gdead)
    gp.m = nil
    ...
    gp.param = nil
    gp.labels = nil
    gp.timer = nil

    dropg()
    gfput(_g_.m.p.ptr(), gp)
    schedule()
}
```

可以看到，在goexit0调用结束后，会再次出发schedule()重新进行一轮调度。

### 1.4. Trigger Scheduling

#### 1.4.0. Create

详情见1.2，在线程启动 `runtime.mstart`和 Goroutine 执行结束 `runtime.goexit0`触发调度之外。还有以下方法会执行系统调度策略。

#### 1.4.1. Park

主动挂起是触发调度最常见的方法，该函数会将当前 Goroutine 暂停，被暂停的任务不会放回运行队列

```go
func gopark(unlockf func(*g, unsafe.Pointer) bool, lock unsafe.Pointer, reason waitReason, traceEv byte, traceskip int) {
    mp := acquirem()
    gp := mp.curg
    mp.waitlock = lock
    mp.waitunlockf = unlockf
    gp.waitreason = reason
    mp.waittraceev = traceEv
    mp.waittraceskip = traceskip
    releasem(mp)
    mcall(park_m)
}
```

其中park_m还会将状态由\_Grunning切换为\_Gwaiting，并且使用dropg移除当前线程和这个Goroutine的关联。

```go
func park_m(gp *g) {
    _g_ := getg()

    casgstatus(gp, _Grunning, _Gwaiting)
    dropg()

    schedule()
}
```

再需要重新唤醒的时候，会调用以下方法进行唤醒，将状态切换回_Grunnable 并将其加入处理器的运行队列中，等待调度器的调度。

```go
func goready(gp *g, traceskip int) {
    systemstack(func() {
        ready(gp, traceskip, true)
    })
}

func ready(gp *g, traceskip int, next bool) {
    _g_ := getg()

    casgstatus(gp, _Gwaiting, _Grunnable)
    runqput(_g_.m.p.ptr(), gp, next)
    if atomic.Load(&sched.npidle) != 0 && atomic.Load(&sched.nmspinning) == 0 {
        wakep()
    }
}
```

#### 1.4.2. System call

Go 语言通过 `syscall.Syscall`和 `syscall.RawSyscall`等使用汇编语言编写的方法封装操作系统提供的所有系统调用

```assembly
#define INVOKE_SYSCALL    INT    $0x80

TEXT ·Syscall(SB),NOSPLIT,$0-28
    CALL    runtime·entersyscall(SB)
    ...
    INVOKE_SYSCALL
    ...
    CALL    runtime·exitsyscall(SB)
    RET
ok:
    ...
    CALL    runtime·exitsyscall(SB)
    RET
```

Go使用了entrysyscall和exitsyscall完成系统调用时的准备与清理工作，对于不需要运行时参与的系统调用，比如SYS_TIME，SYS_EPOLL_WAIT，Go封装了一层RawSyscall来调用。

在调用entrysyscall会调用reentersyscall函数

```go
//go:nosplit
//go:linkname entersyscall
func entersyscall() {
    reentersyscall(getcallerpc(), getcallersp())
}

func reentersyscall(pc, sp uintptr) {
    _g_ := getg()
    _g_.m.locks++
    _g_.stackguard0 = stackPreempt
    _g_.throwsplit = true

    save(pc, sp)
    _g_.syscallsp = sp
    _g_.syscallpc = pc
    casgstatus(_g_, _Grunning, _Gsyscall)

    _g_.m.syscalltick = _g_.m.p.ptr().syscalltick
    _g_.m.mcache = nil
    pp := _g_.m.p.ptr()
    pp.m = 0
    _g_.m.oldp.set(pp)
    _g_.m.p = 0
    atomic.Store(&pp.status, _Psyscall)
    if sched.gcwaiting != 0 {
        systemstack(entersyscall_gcwait)
        save(pc, sp)
    }
    _g_.m.locks--
}
```

1. 禁止线程上发生的抢占，防止出现内存不一致的问题；
2. 保证当前函数不会触发栈分裂或者增长；
3. 保存当前的程序计数器 PC 和栈指针 SP 中的内容；
4. 将 Goroutine 的状态更新至 `_Gsyscall`；
5. 将 Goroutine 的处理器和线程暂时分离并更新处理器的状态到 `_Psyscall`；
6. 释放当前线程上的锁；

当前线程会陷入系统调用等待返回，在锁被释放后，会有其他 Goroutine 抢占处理器资源。

当系统调用结束后，会再次返回

```go
func exitsyscall() {
    _g_ := getg()

    oldp := _g_.m.oldp.ptr()
    _g_.m.oldp = 0
    if exitsyscallfast(oldp) {
        _g_.m.p.ptr().syscalltick++
        casgstatus(_g_, _Gsyscall, _Grunning)
        ...

        return
    }

    mcall(exitsyscall0)
    _g_.m.p.ptr().syscalltick++
    _g_.throwsplit = false
}
```

其中exitsyscallfast会有两种不同的分支：

1. 如果 Goroutine 的原处理器处于 `_Psyscall` 状态，会直接调用 `wirep` 将 Goroutine 与处理器进行关联；
```go
    // Try to re-acquire the last P.
    if oldp != nil && oldp.status == _Psyscall && atomic.Cas(&oldp.status, _Psyscall, _Pidle) {
        // There's a cpu for us, so we can run.
        wirep(oldp)
        exitsyscallfast_reacquired()
        return true
    }
```
2. 如果调度器中存在闲置的处理器，会调用 `acquirep`使用闲置的处理器处理当前 Goroutine；

```go

func exitsyscallfast_pidle() bool {
    lock(&sched.lock)
    _p_ := pidleget()
    if _p_ != nil && atomic.Load(&sched.sysmonwait) != 0 {
        atomic.Store(&sched.sysmonwait, 0)
        notewakeup(&sched.sysmonnote)
    }
    unlock(&sched.lock)
    if _p_ != nil {
        acquirep(_p_)
        return true
    }
    return false
}

// Associate p and the current m.
//
// This function is allowed to have write barriers even if the caller
// isn't because it immediately acquires _p_.
//
//go:yeswritebarrierrec
func acquirep(_p_ *p) {
    // Do the part that isn't allowed to have write barriers.
    wirep(_p_)

    // Have p; write barriers now allowed.

    // Perform deferred mcache flush before this P can allocate
    // from a potentially stale mcache.
    _p_.mcache.prepareForSweep()

    if trace.enabled {
        traceProcStart()
    }
}

// wirep is the first step of acquirep, which actually associates the
// current M to _p_. This is broken out so we can disallow write
// barriers for this part, since we don't yet have a P.
//
//go:nowritebarrierrec
//go:nosplit
func wirep(_p_ *p) {
    _g_ := getg()

    if _g_.m.p != 0 {
        throw("wirep: already in go")
    }
    if _p_.m != 0 || _p_.status != _Pidle {
        id := int64(0)
        if _p_.m != 0 {
            id = _p_.m.ptr().id
        }
        print("wirep: p->m=", _p_.m, "(", id, ") p->status=", _p_.status, "\n")
        throw("wirep: invalid p state")
    }
    _g_.m.p.set(_p_)
    _p_.m.set(_g_.m)
    _p_.status = _Prunning
}
```

另一个相对较慢的路径 [`runtime.exitsyscall0`](https://draveness.me/golang/tree/runtime.exitsyscall0) 会将当前 Goroutine 切换至 `_Grunnable` 状态，并移除线程 M 和当前 Goroutine 的关联：

1. 当我们通过 [`runtime.pidleget`](https://draveness.me/golang/tree/runtime.pidleget) 获取到闲置的处理器时就会在该处理器上执行 Goroutine；
2. 在其它情况下，我们会将当前 Goroutine 放到全局的运行队列中，等待调度器的调度；

无论哪种情况，我们在这个函数中都会调用 [`runtime.schedule`](https://draveness.me/golang/tree/runtime.schedule) 触发调度器的调度。

#### 1.4.3. Cooperative

该方法不会挂起Goroutine，而是将当前的Goroutine调度到其他线程上

```go
// Gosched yields the processor, allowing other goroutines to run. It does not
// suspend the current goroutine, so execution resumes automatically.
func Gosched() {
   checkTimeouts()
   mcall(gosched_m)
}

// Gosched continuation on g0.
func gosched_m(gp *g) {
    if trace.enabled {
        traceGoSched()
    }
    goschedImpl(gp)
}

func goschedImpl(gp *g) {
    status := readgstatus(gp)
    if status&^_Gscan != _Grunning {
        dumpgstatus(gp)
        throw("bad g status")
    }
    casgstatus(gp, _Grunning, _Grunnable)
    dropg()
    lock(&sched.lock)
    globrunqput(gp)
    unlock(&sched.lock)

    schedule()
}
```

运行时会更新 Goroutine 的状态到 `_Grunnable`，让出当前的处理器并将 Goroutine 重新放回全局队列，在最后，该函数会调用 `runtime.schedule` 触发调度。



### 1.5. Thread Control

Goroutine 应该在调用操作系统服务或者依赖线程状态的非 Go 语言库时调用

```go
func LockOSThread() {
    if atomic.Load(&newmHandoff.haveTemplateThread) == 0 && GOOS != "plan9" {
        startTemplateThread()
    }
    _g_ := getg()
    _g_.m.lockedExt++
    dolockOSThread()
}

func dolockOSThread() {
    _g_ := getg()
    _g_.m.lockedg.set(_g_)
    _g_.lockedm.set(_g_.m)
}
```

会分别设置线程的 `lockedg` 字段和 Goroutine 的 `lockedm` 字段，这两行代码会绑定线程和 Goroutine。

当Goroutine完成操作之后，会使用如下方法分离Goroutine和线程。

Go 语言的运行时会通过 [`runtime.startm`](https://draveness.me/golang/tree/runtime.startm) 启动线程来执行处理器 P，如果我们在该函数中没能从闲置列表中获取到线程 M 就会调用 [`runtime.newm`](https://draveness.me/golang/tree/runtime.newm) 创建新的线程：

```go
func newm(fn func(), _p_ *p, id int64) {
    mp := allocm(_p_, fn, id)
    mp.nextp.set(_p_)
    mp.sigmask = initSigmask
    ...
    newm1(mp)
}

func newm1(mp *m) {
    if iscgo {
        ...
    }
    newosproc(mp)
}
```

该函数在 Linux 平台上会通过系统调用 `clone` 创建新的操作系统线程，它也是创建线程链路上距离操作系统最近的 Go 语言函数

```go
func newosproc(mp *m) {
    stk := unsafe.Pointer(mp.g0.stack.hi)
    ...
    ret := clone(cloneFlags, stk, unsafe.Pointer(mp), unsafe.Pointer(mp.g0), unsafe.Pointer(funcPC(mstart)))
    ...
}
```

## 2. System Monitor

在程序启动前，会首先调用runtime.main函数，其中就包括了sysmon的创建

```go
func main() {
    ...
    if GOARCH != "wasm" {
        systemstack(func() {
            newm(sysmon, nil)
        })
    }
    ...
}

func newm(fn func(), _p_ *p) {
    mp := allocm(_p_, fn)
    mp.nextp.set(_p_)
    mp.sigmask = initSigmask
    ...
    newm1(mp)
}
```

newm1会调用特定平台的 [`runtime.newosproc`](https://draveness.me/golang/tree/runtime.newosproc) 通过系统调用 `clone` 创建一个新的线程并在新的线程中执行 [`runtime.mstart`](https://draveness.me/golang/tree/runtime.mstart)

```go
func newosproc(mp *m) {
    stk := unsafe.Pointer(mp.g0.stack.hi)
    var oset sigset
    sigprocmask(_SIG_SETMASK, &sigset_all, &oset)
    ret := clone(cloneFlags, stk, unsafe.Pointer(mp), unsafe.Pointer(mp.g0), unsafe.Pointer(funcPC(mstart)))
    sigprocmask(_SIG_SETMASK, &oset, nil)
    ...
}
```

在新建线程时，会执行runtime.m中的sysmon启动监控

```go
func sysmon() {
    sched.nmsys++
    checkdead()

    lasttrace := int64(0)
    idle := 0
    delay := uint32(0)
    for {
        if idle == 0 {
            delay = 20
        } else if idle > 50 {
            delay *= 2
        }
        if delay > 10*1000 {
            delay = 10 * 1000
        }
        usleep(delay)
        ...
    }
}
```

当运行时刚刚调用上述函数时，会先通过 [`runtime.checkdead`](https://draveness.me/golang/tree/runtime.checkdead) 检查是否存在死锁，然后进入核心的监控循环；系统监控在每次循环开始时都会通过 `usleep` 挂起当前线程，该函数的参数是微秒，运行时会遵循以下的规则决定休眠时间：

- 初始的休眠时间是 20μs；
- 最长的休眠时间是 10ms；
- 当系统监控在 50 个循环中都没有唤醒 Goroutine 时，休眠时间在每个循环都会倍增；

当程序趋于稳定之后，系统监控的触发时间就会稳定在 10ms。它除了会检查死锁之外，还会在循环中完成以下的工作：

- 运行计时器 — 获取下一个需要被触发的计时器；
- 轮询网络 — 获取需要处理的到期文件描述符；
- 抢占处理器 — 抢占运行时间较长的或者处于系统调用的 Goroutine；
- 垃圾回收 — 在满足条件时触发垃圾收集回收内存；

## 3. Stack And Heap

### 3.1. Traditional Language

1. 栈一般由操作系统来分配和释放，堆由程序员通过编程语言来申请创建与释放。
2. 栈用来存放函数的参数、返回值、局部变量、函数调用时的临时上下文等，堆用来存放全局变量。我们可以这样理解数据存放的规则：只要是局部的、占用空间确定的数据，一般都存放在stack 里面，否则就放在 heap 里面。
3. 栈的访问速度相对比堆快。
4. 一般来说，每个线程分配一个stack，每个进程分配一个heap，也就是说，stack 是线程独占的，heap 是线程共用的。
5. stack 创建的时候，大小是确定的，数据超过这个大小，就发生stack overflow 错误，而heap的大小是不确定的，需要的话可以不断增加。
6. 栈是由高地址向低地址增长的，而堆是由低地址向高地址增长的。


	在Go语言中，官方对堆栈管理做了如下的解释
	只要有对变量的引用，变量就会存在，而它存储的位置与语言的语义无关。如果可能，变量会被分配到其函数的栈，但如果编译器无法证明函数返回之后变量是否仍然被引用，就必须在堆上分配该变量，采用垃圾回收机制进行    管理，从而避免指针悬空。此外，局部变量如果非常大，也会存在堆上。

在编译器中，如果变量具有地址，就作为堆分配的候选，但如果逃逸分析可以确定其生存周期不会超过函数返回，就会分配在栈上。

### 3.2. Implement

Go 的内存分配器基于 Thread-Cache Malloc (tcmalloc) ，tcmalloc 为每个线程实现了一个本地缓存， 区分了小对象（小于 32kb）和大对象分配两种分配类型，其管理的内存单元称为 span。

- heapArena: 保留整个虚拟地址空间

```go
// A heapArena stores metadata for a heap arena. heapArenas are stored
// outside of the Go heap and accessed via the mheap_.arenas index.
//go:notinheap
type heapArena struct {
    bitmap     [heapArenaBitmapBytes]byte
    spans      [pagesPerArena]*mspan  // spans maps from virtual address page ID within this arena to *mspan.
    pageInUse  [pagesPerArena / 8]uint8
    pageMarks  [pagesPerArena / 8]uint8
    pageSpecials [pagesPerArena / 8]uint8
    checkmarks *checkmarksMap
    zeroedBase uintptr
}
//arenaHint is a hint for where to grow the heap arenas. See
// mheap_.arenaHints.
//go:notinheap
type arenaHint struct {
    addr uintptr
    down bool
    next *arenaHint
}
```

- mheap：分配的堆，在页大小为 8KB 的粒度上进行管理

    然而管理 arena 如此粒度的内存并不符合实践，相反，所有的堆对象都通过 span 按照预先设定好的 大小等级分别分配，小于 32KB 的小对象则分配在固定大小等级的 span 上，否则直接从 mheap 上进行分配。
    
- mspan：是 mheap 上管理的一连串的页

```go
//go:notinheap
type mspan struct { // 双向链表
    next *mspan     // 链表中的下一个 span，如果为空则为 nil
    prev *mspan     // 链表中的前一个 span，如果为空则为 nil
    ...
    startAddr      uintptr // span 的第一个字节的地址，即 s.base()
    npages         uintptr // 一个 span 中的 page 数量
    manualFreeList gclinkptr // mSpanManual span 的释放对象链表
    ...
    freeindex  uintptr
    nelems     uintptr // span 中对象的数量
    allocCache uint64
    allocBits  *gcBits
    ...
    allocCount  uint16     // 分配对象的数量
    spanclass   spanClass  // 大小等级与 noscan (uint8)
    incache     bool       // 是否被 mcache 使用
    state       mSpanState // mspaninuse 等待信息
    ...
}
```

- mcentral：收集了给定大小等级的所有 span。当 mcentral 中 nonempty 列表中也没有可分配的 span 时，则会向 mheap 提出请求，从而获得新的 span，并进而交给 mcache。


```go
//go:notinheap
type mcentral struct {
    lock      mutex
    spanclass spanClass
    nonempty  mSpanList // 带有自由对象的 span 列表，即非空闲列表
    empty     mSpanList // 没有自由对象的 span 列表（或缓存在 mcache 中）
    ...
}
```

- mcache：为 per-P 的缓存。
```go
//go:notinheap
type mcache struct {
    ...
    tiny             uintptr
    tinyoffset       uintptr
    local_tinyallocs uintptr
    alloc            [numSpanClasses]*mspan // 用来分配的 spans，由 spanClass 索引
    stackcache       [_NumStackOrders]stackfreelist
    ...
}
```

mcache负责小对象和微对象的分配，其持有mspan

### 3.3. Allocation

常见的内存管理模块分为如下三种fixalloc、linearAlloc、mcache

fixalloc 是一个基于自由列表的固定大小的分配器。其核心原理是将若干未分配的内存块连接起来， 将未分配的区域的第一个字为指向下一个未分配区域的指针使用。Go 的主分配堆中 malloc（span、cache、treap、finalizer、profile、arena hint 等） 均 围绕它为实体进行固定分配和回收。

fixalloc 作为抽象，非常简洁，只包含三个基本操作：初始化、分配、回收
```go
// fixalloc 是一个简单的固定大小对象的自由表内存分配器。
// Malloc 使用围绕 sysAlloc 的 fixalloc 来管理其 MCache 和 MSpan 对象。
//
// fixalloc.alloc 返回的内存默认为零，但调用者可以通过将 zero 标志设置为 false
// 来自行负责将分配归零。如果这部分内存永远不包含堆指针，则这样的操作是安全的。
// 调用方负责锁定 fixalloc 调用。调用方可以在对象中保持状态，
// 但当释放和重新分配时第一个字会被破坏。
// 考虑使 fixalloc 的类型变为 go:notinheap.
type fixalloc struct {
    size   uintptr
    first  func(arg, p unsafe.Pointer) // 首次调用时返回 p
    arg    unsafe.Pointer
    list   *mlink
    chunk  uintptr // 使用 uintptr 而非 unsafe.Pointer 来避免 write barrier
    nchunk uint32
    inuse  uintptr // 正在使用的字节
    stat   *uint64
    zero   bool // 归零的分配
}
```

Go 语言对于零值有自己的规定，自然也就体现在内存分配器上。而 fixalloc 作为内存分配器内部组件的来源于 操作系统的内存，自然需要自行初始化，因此，fixalloc 的初始化也就不可避免的需要将自身的各个字段归零：
```go
func (f *fixalloc) init(size uintptr, first func(arg, p unsafe.Pointer), arg unsafe.Pointer, stat *uint64) {
    f.size = size
    f.first = first
    f.arg = arg
    f.list = nil
    f.chunk = 0
    f.nchunk = 0
    f.inuse = 0
    f.stat = stat
    f.zero = true
}
```
fixalloc 基于自由表策略进行实现，分为两种情况：
1. 存在被释放、可复用的内存

2. 不存在可复用的内存

对于第一种情况，也就是在运行时内存被释放，但这部分内存并不会被立即回收给操作系统， 我们直接从自由表中获得即可，但需要注意按需将这部分内存进行清零操作。

对于第二种情况，直接向操作系统申请固定大小的内存，然后扣除分配的大小即可。
回收阶段

```go
func (f *fixalloc) free(p unsafe.Pointer) {
    // 减少使用的字节数
    f.inuse -= f.size
    // 将要释放的内存地址作为 mlink 指针插入到 f.list 内，完成回收
    v := (*mlink)(p)
    v.next = f.list
    f.list = v
}
```

`linearAlloc` 是一个基于线性分配策略的分配器，但由于它只作为 `mheap_.heapArenaAlloc` 和 `mheap_.arena` 在 32 位系统上使用，这里不做详细分析。

此外，对于每一个P，都有mcache做缓存，每个线程独立持有，也就不会出现并发问题，也不用上锁

```go
//go:notinheap
type mcache struct {
    // 下面的成员在每次 malloc 时都会被访问
    // 因此将它们放到一起来利用缓存的局部性原理
    next_sample uintptr    // 分配这么多字节后触发堆样本
    local_scan  uintptr // 分配的可扫描堆的字节数

    // 没有指针的微小对象的分配器缓存。
    // 请参考 malloc.go 中的 "小型分配器" 注释。
    //
    // tiny 指向当前 tiny 块的起始位置，或当没有 tiny 块时候为 nil
    // tiny 是一个堆指针。由于 mcache 在非 GC 内存中，我们通过在
    // mark termination 期间在 releaseAll 中清除它来处理它。
    tiny             uintptr
    tinyoffset       uintptr
    local_tinyallocs uintptr // 不计入其他统计的极小分配的数量

    // 下面的不在每个 malloc 时被访问

    alloc [numSpanClasses]*mspan // 用来分配的 spans，由 spanClass 索引

    stackcache [_NumStackOrders]stackfreelist

    // 本地分配器统计，在 GC 期间被刷新
    local_largefree  uintptr                  // bytes freed for large objects (>maxsmallsize)
    local_nlargefree uintptr                  // number of frees for large objects (>maxsmallsize)
    local_nsmallfree [_NumSizeClasses]uintptr // number of frees for small objects (<=maxsmallsize)

    // flushGen indicates the sweepgen during which this mcache
    // was last flushed. If flushGen != mheap_.sweepgen, the spans
    // in this mcache are stale and need to the flushed so they
    // can be swept. This is done in acquirep.
    flushGen uint32
}
```

运行时的 `runtime.allocmcache` 从 `mheap` 上分配一个 `mcache`。 由于 `mheap` 是全局的，因此在分配期必须对其进行加锁，而分配通过 fixAlloc 组件完成：

```go
// 虚拟的MSpan，不包含任何对象。
var emptymspan mspan

func allocmcache() *mcache {
    var c *mcache
    systemstack(func() {
        lock(&mheap_.lock)
        c = (*mcache)(mheap_.cachealloc.alloc())
        c.flushGen = mheap_.sweepgen
        unlock(&mheap_.lock)
    }
    for i := range c.alloc {
        c.alloc[i] = &emptymspan // 暂时指向虚拟的 mspan 中
    }
    // 返回下一个采样点，是服从泊松过程的随机数
    c.next_sample = nextSample()
    return c
}
```

当需要释放时调用freemcache函数

```go
func freemcache(c *mcache) {
    systemstack(func() {
        // 归还 span
        c.releaseAll()
        // 释放 stack
        stackcache_clear(c)

        lock(&mheap_.lock)
        // 记录局部统计
        purgecachedstats(c)
        // 将 mcache 释放
        mheap_.cachealloc.free(unsafe.Pointer(c))
        unlock(&mheap_.lock)
    })
}
func (c *mcache) releaseAll() {
    for i := range c.alloc {
        s := c.alloc[i]
        if s != &emptymspan {
            // 将 span 归还
            mheap_.central[i].mcentral.uncacheSpan(s)
            c.alloc[i] = &emptymspan
        }
    }
    // 清空 tinyalloc 池.
    c.tiny = 0
    c.tinyoffset = 0
}
```

- mcache 会被 P 持有，当 M 和 P 绑定时，M 同样会保留 mcache 的指针
- mcache 直接向操作系统申请内存，且常驻运行时
- P 通过 make 命令进行分配，会分配在 Go 堆上

### 3.4. Escape


Go 程序的执行是基于 goroutine 的，goroutine 和传统意义上的程序一样，也有栈和堆的概念。只不过 Go 的运行时帮我们屏蔽掉了这两个概念，只在运行时内部区分并分别对应：goroutine 执行栈以及 Go 堆。

goroutine 的执行栈与传统意义上的栈一样，当函数返回时，在栈上就会被回收，栈中的对象都会被回收，从而 无需 GC 的标记；而堆则麻烦一些，由于 Go 支持垃圾回收，只要对象生存在堆上，Go 的运行时 GC 就会在 后台将对应的内存进行标记从而能够在垃圾回收的时候将对应的内存回收，进而增加了开销。

以下定义了4种情况，使用 `-gcflags "-N -l -m"`

```go
package main
type smallobj struct {
    arr [1 << 10]byte 
}
type largeobj struct {
    arr [1 << 26]byte 
}
func f1() int {
    x := 1
    return x  // 直接返回，没有逃逸
}
func f2() *int {
    y := 2
    return &y // 发生逃逸
}
func f3() {
    large := largeobj{} // large 无法被一个执行栈装下，也会逃逸
    println(&large)
}
func f4() {
    small := smallobj{} // small 对象能够被一个执行栈装下，变量没有返回到栈外，进而没有发生逃逸。
    print(&small)
}
func main() {
    x := f1()
    y := f2()
    f3()
    f4()
    println(x, y)
}
```

Go语言中的引用类型有func（函数类型），interface（接口类型），slice（切片类型），map（字典类型），channel（管道类型），*（指针类型）。

在编译阶段，可以使用`go tool compile`命令，查看，如果有runtime.newobject，则说明在堆上，反之则在栈上。

```go
// 创建一个新的对象
func newobject(typ *_type) unsafe.Pointer {
    return mallocgc(typ.size, typ, true) // true 内存清零
}
func mallocgc(size uintptr, typ *_type, needzero bool) unsafe.Pointer {
    // 创建大小为零的对象，例如空结构体
    if size == 0 {
        return unsafe.Pointer(&zerobase)
    }
    mp := acquirem()
    mp.mallocing = 1
    ...

    // 获取当前 g 所在 M 所绑定 P 的 mcache
    c := gomcache()
    var x unsafe.Pointer
    noscan := typ == nil || typ.kind&kindNoPointers != 0
    if size <= maxSmallSize {
        if noscan && size < maxTinySize {
            // 微对象分配
            ...
        } else {
            // 小对象分配
            ...
        }
    } else {
        // 大对象分配
        ...
    }
    ...
    mp.mallocing = 0
    releasem(mp)
    ...
    return x
}
```

1. 小对象分配

当对一个小对象（<32KB）分配内存时，会将该对象所需的内存大小调整到某个能够容纳该对象的大小等级（size class）， 并查看 mcache 中对应等级的 mspan，通过扫描 mspan 的 `freeindex` 来确定是否能够进行分配。

当没有可分配的 mspan 时，会从 mcentral 中获取一个所需大小空间的新的 mspan，从 mcentral 中分配会对其进行加锁， 但一次性获取整个 span 的过程均摊了对 mcentral 加锁的成本。

如果 mcentral 的 mspan 也为空时，则它也会发生增长，从而从 mheap 中获取一连串的页，作为一个新的 mspan 进行提供。 而如果 mheap 仍然为空，或者没有足够大的对象来进行分配时，则会从操作系统中分配一组新的页（至少 1MB）， 从而均摊与操作系统沟通的成本。

2. 微对象分配

对于过小的微对象（<16B），它们的分配过程与小对象的分配过程基本类似，但是是直接存储在 mcache 上，并由其以 16B 的块大小直接进行管理和释放。

3. 大对象分配

大对象分配非常粗暴，不与 mcache 和 mcentral 沟通，直接绕过并通过 mheap 进行分配。



## 4. Garbage Collection

1. 清理终止阶段；
    1. **暂停程序**，所有的处理器在这时会进入安全点（Safe point）；
    2. 如果当前垃圾收集循环是强制触发的，我们还需要处理还未被清理的内存管理单元；
2. 标记阶段；
    1. 将状态切换至 `_GCmark`、开启写屏障、用户程序协助（Mutator Assists）并将根对象入队；
    2. 恢复执行程序，标记进程和用于协助的用户程序会开始并发标记内存中的对象，写屏障会将被覆盖的指针和新指针都标记成灰色，而所有新创建的对象都会被直接标记成黑色；
    3. 开始扫描根对象，包括所有 Goroutine 的栈、全局对象以及不在堆中的运行时数据结构，扫描 Goroutine 栈期间会暂停当前处理器；
    4. 依次处理灰色队列中的对象，将对象标记成黑色并将它们指向的对象标记成灰色；
    5. 使用分布式的终止算法检查剩余的工作，发现标记阶段完成后进入标记终止阶段；
3. 标记终止阶段；
    1. **暂停程序**、将状态切换至 `_GCmarktermination` ，确认标记工作已经完成，并关闭辅助标记的用户程序；
    2. 清理处理器上的线程缓存；
4. 清理阶段；
    1. 将状态切换至 `_GCoff` 开始清理阶段，在此之前，新建的对象是黑色，切换后的对象是白色，初始化清理状态并关闭写屏障；
    2. 后台并发清理所有的内存管理单元，当 Goroutine 申请新的内存管理单元时就会触发清理；
