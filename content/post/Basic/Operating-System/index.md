---
title: "Operating System"
date: 2021-11-12T19:33:04+08:00
lastmod: 2023-02-27T23:00:35+08:00
draft: false
author: "Chasing1020"
comment: true
keywords: ['Operating System']
description: ""
tags: ['Operating System']
categories: ['Note']
image: "unix.webp"
---

# 1. Overview

什么是操作系统？

硬件角度：

-   1. 管理硬件：将复杂的，具备不同功能的硬件资源纳入统一管理。

-   2. 对硬件进行抽象：抽象成不依赖具体硬件特性的资源。

    将有限的，离散的资源高效地抽象成无限的、连续的资源，并提交接口给上层系统调用。

应用角度：

-   1.   服务于应用：提供不同层次，不同功能的接口以满足应用需求
-   2.   管理应用：负责应用生命周期管理，包括加载，启动，切换，调度等。

# 2. Hardware Infrastructure

冯诺依曼架构：中央处理单元，存储器，输入输出。

缓存结构：CPU缓存是由若干个缓存行决定的，每个缓存行包括一个有效位（valid bit），一个标记地址（tag address）。物理地址在逻辑上分为三段。Tag、Index(Set)、Way。物理地址能表示Index(Set)的最大数目为组，支持Tag最大的数目为路（Way）。

物理地址结构：Tag（物理地址）+ Set（组号）+ Offset（组内偏移）

直接映射：内存与CPU的Cache Line相对位置固定，导致淘汰换出频繁。

全相联映射：灵活，电路设计困难，只适合小容量Cache。

组相联映射：CPU和主存都分组，同组的缓存行数量称为路，组内采用直接映射，组间采用全相联映射。

CPU访问设备的方式：内存映射输入输出（Memory-Mapped I/O），将IO设备和物理内存放到同一个存储空间。

如果CPU通过不断轮询，查看MMIO是否有输入效率会很低，所以更高效的做法是利用中断，主动通知CPU。

# 3. Operating System Architecture

设计上，策略（Policy，“要做什么”）和机制（Mechanism，“怎么做”）隔离。

内核架构

1.   简要结构：以DOS典型，没有现代意义的内存管理单元（Memory Management Unit，MMU）
2.   宏内核架构（Monolithic Kernel）：又称单内核，现代Unix，Linux，Windows都采用宏内核。
     - 模块化（modularity）：使用可加载内核模块（Loadable Kernel Module）机制，使内核与其他模块（如驱动）解耦。
	 - 抽象（abstraction）：采用“Everything is a file”思想，为上层应用提供统一接口，降低复杂性，增强维护性。
	 - 分层（layering）：Dijkstra提出的“THE”操作系统，分为6层，更好地组织各种功能。
	 - 层级（hierarchy）：应用于资源管理，如调度算法优先级分类，控制组（cgroup）分类。
3.   微内核架构：以Mach为代表，将单个功能或模块从内核中拆分出来，提高安全性。由于Mach对IPC设计过于通用，以至于自身资源占用过大，效率并不及同期的宏内核。但是微内核具有弹性拓展的能力，硬件异构，并且具有功能安全与信息安全，并且调用具有确定的时延。

4.   外核架构：库操作系统LibOS，可以按照应用领域的特点与需求，安装最适合的LibOS，最小化非必要代码，多个LibOS之间的隔离很强，具有很好的安全性。还有云计算的容器，基于Unikernel将虚拟机监控器作为支撑Unikernel/LibOS运行的内核。

其他框架结构：以Android为例，其包含硬件抽象层，Android库，Android运行环境，Android运行框架。

# 4. Memory Management

现代操作系统采用虚拟内存，以下作为设计目标

-   高效性：虚拟内存没有明显性能开销。
-   安全性：使应用之间的内存相互隔离。
-   透明性：虚拟内存抽象对程序员透明。

CPU的内存管理单元（Memory Management Unit，MMU）负责虚拟地址到物理地址的转换，此外，还有地址旁路缓存（Translation Lookaside Buffer，TLB）

分段机制：如将应用分成代码段，数据段。每个段表，作为段内地址与段内偏移来确定位置。很容易产生外部碎片。

分页机制：用虚拟页号与页内偏移量，按固定大小管理，减少外部碎片。

>   访存次数（一般访问TLB不算访存）

**页式存储**，2次：第一次、访问内存中的页表，利用逻辑地址中的页号查找到页帧号，与逻辑地址中的页内偏移拼接形成物理地址；第二次：得到物理地址后，再一次访问内存，存取指令或者数据。

**段式存储**，2次（同上）

**段页式存储**，3次：

第一次：访问内存中的段表查到页表的起始地址

第二次：访问内存中的页表找到页帧号，形成物理地址

第三次：得到物理地址后，再一次访问内存，存取指令或者数据

**多级页表**，若页表划分为N级，则需要访问内存N+1次。TLB命中，只需访问1次内存即可。

## 4.1. Paging

内核把物理页作为内存管理的基本单位。物理页的基本数据结构如下：

```c
struct page {
    unsigned long flags; // 页是不是脏的，是否锁定在内存中
    atomic_t      _count; // 页的引用计数
    atomic_t      _mapcount;
    unsigned long private;
    struct address_space *mapping;
    pgoff_t       index;
    struct list_head     lru;
    void          *virtual; // 页的虚拟地址
}
```

对于Arm64位系统下的4级页表：每个页4KB，最低12位($2^{12}$=4KB)来表示页内偏移。每个页表页也占用物理内存的一个物理页(4KB)，每个页表项8字节，所以一个页表页可以对应512页表项(4KB/8B=512=$2^9$)。所以，48-63位全部置为0或者是1。剩下36+12分别对应四级页表，和页表内偏移量。

对于Sv39 RISC-V，其中前25位为空，由27位index映射到$2^{27}$个（Page Table Entries， PTEs），每个PTE对应物理页44bit的PPN和一些flags，包括记录页表是否有效、可读、可写、User权限是否可以访问等。其中27位index实际上会有3级页表，如果其中任意一级页表不存在，则会抛出一个page-fault exception。Sv48, Sv57同理，Page Table添加一级Level。

32位系统下的2级页表：每个页4KB，最低12位($2^{12}$=4KB)来表示页内偏移。每个页表页也占用物理内存的一个物理页(4KB)，每个页表项4字节，所以一个页表页可以对应1024页表项(4KB/4B=1024=$2^{10}$)。所以，20+12分别对应二级页表(2*10)，和页表内偏移量。

对于32bit操作系统，通过物理地址扩展（Physical Address Extension，PAE），CPU执行单元发出的地址将被MMU截获，进行一次地址转换后才传给内存。这样允许32位系统下多个进程的使用内存加起来超过4GB。

TLB硬件一般采用分层结构，L1部分分为指令TLB与数据TLB，L2不区分指令与数据，作为CPU内部硬件。

在切换应用刷新时，为每个TLB打上标签（在AArch称为Address Space IDentifier，ASID；x86-64中称为Process Context IDentifier），操作系统为每一个应用分配不同的标签，这个标签记录在页表基址寄存器，这样TLB的缓存项就被应用区分开，切换应用时不用清空TLB。

在虚拟页使用后，不一定会在页表中。当物理内存不够的时候，应该将物理页的内容写入到磁盘中，同时记录物理页的位置，这个流程称之为换出。

当访问未映射到内存的虚拟页时，发生缺页异常，将所有磁盘的数据加到物理页，再填写物理页的映射，这个流程称为换入。

预取（Prefetching）：当换入时，猜测还有哪些页会被访问，提前换入内存，减少缺页此数。

按需分配（Demand Paging）：将分配的虚拟页标记为“已经分配，但是没有映射到物理内存”的状态，有效提高资源利用率。

## 4.2. Strategy

MIN/OPT（Minimum，Optimal）：优先选择未来不会访问的页，理论最优，实践困难。

FIFO（First-In First-Out）：时间开销低，但是实际表现不佳，先后顺序和使用频繁关系与否不大。

Second Chance：给队列每一个访问到的设置标志位，按FIFO的“逻辑”，每次将换出时，标志清零，并移到队尾；如果没有标志，且在队头，则会被换出。当所有标志失效时，弱化为FIFO。此外，还有可能发生（Belady异常）

LRU（Least Recently Used）：被换出时，优先选择最久未被访问到的，链表尾放最常用的，首端放最不常用的，每次淘汰首端。

MRU（Most Recently Used）：用LRU相反的策略，基于假设“程序不会反复访问相同的地址”。

Clock Algorithm：类似于Second Chance，但是不需要移动链表中的页号，效率更高。

## 4.3. Virtual Memory

COW（Copy On Write）：用于动态链接库，fork等。用只读的方式共享内存。一旦发生写操作，产生缺页异常，触发COW机制。

KSM（Kernel Same-page Merging）：基于COW，定期扫描相同的物理页，进行合并，减少内存占用。

zswap：在换出内存时，使用压缩算法，将数据压缩后，存放至缓冲区，而不直接存磁盘，可以有效避免磁盘IO。

buddy system：需求m页时，分裂($2^{n-1}< m ≤ 2^n$)至合适的物理块，释放时合并空闲块，这两个操作是级联的，减少外部碎片。

SLAB：一般为SLUB，SLOB，SLAB的统称。为高效分配较小的内存块提高速度，SLAB只会分配固定大小的内存块($2^n$, $3≤ n <12$)，实际还会有特殊值避免内部碎片，这些块称为slab，每个slab会被分成小块，用链表链接，其中current指向当前的slab，partial指向所有空闲的slab，分配时，先去current取，current空了再取一个partial的slab交给current。一般来说，Linux采用slab分配器分配task_struct结构，能够更好实现对象复用和缓存着色。

Implicit Free List：每个内存块的头部，用链表维护是否空闲，块大小的信息，分配请求时，依次合并。

Explicit Free List：仅仅把空闲的链接起来，所以每个空闲块只用维护两个指针和块大小，分配速度比隐式快。

Segregated Free List：维护多条显示链表，找到块大小最合适的空闲块，有空余则插入空闲链表中。

Cache coloring：不同位置的物理页标上不同颜色，连续分配内存物理页时，优先选择不同物理页颜色的进行分配。

>    Zero Copy

传统的内存访问方式，如read/write，每次操作都需要进行内核态与用户态之间的切换，`read()` 把数据从存储器 (磁盘、网卡等) 读取到用户缓冲区，`write()` 则是把数据从用户缓冲区写出到存储器：

```C
#include <unistd.h>

// 其中void *buf指向的内存空间要求合法判断，为了安全考虑，
// 内核会发起从用户内存到内核内存的拷贝的调用
ssize_t read(int fd, void *buf, size_t count);
ssize_t write(int fd, const void *buf, size_t count);
```

一般Linux零拷贝有三种实现方式：1.减少拷贝次数，2.绕过内核直接IO，3.COW技术（只读则不用拷贝）

方法一：采用mmap+write，可以减少一次CPU拷贝，节省50%内存，适用于大文件传输；小文件反而会造成更多的内存碎片浪费。

```C
#include <sys/mman.h>
// mmap creates a new mapping in the virtual address space of the calling process.
// The starting address for the new mapping is specified in addr.
void *mmap(void *addr, size_t length, int prot, int flags, int fd, off_t offset);
```

方法二：采用Linux内核版本2.1引入的sendfile系统调用，因为这种拷贝发生在内核态，相比于read/write节省了将数据拷贝至用户态的时间。

```c
#include <sys/sendfile.h>

// sendfile copies data between one file descriptor and another.
ssize_t sendfile(int out_fd, int in_fd, off_t *offset, size_t count);
```

方法三：采用Linux 内核版本2.6.17引入的splice系统调用，解决了sendfile只在网络协议专用的弊端，在数据传输过程中，仅传递内存页的指针而不是真实的数据。

```c
#define _GNU_SOURCE /* See feature_test_macros(7) */
#include <fcntl.h>

// splice moves data between two file descriptors 
// without copying between kernel address space and user address space.
ssize_t splice(int fd_in, loff_t *off_in, int fd_out,
               loff_t *off_out, size_t len, unsigned int flags);
```



# 5. Process and Thread

## 5.1. Process

进程的状态：新生（new）、就绪（ready）、运行（running）、阻塞（blocked）、终止（terminated）。在进程结构体中的state域做了标记
| 标记 | 状态 |
| --------------------- | ----------------------------------------------------- |
| TASK\_RUNNING         | 正在执行或者是运行队列中等待执行                      |
| TASK\_INTERRUPTIBLE   | 进程正在阻塞，等待某一事件的达成。                    |
| TASK\_UNINTERRUPTIBLE | 收到信号也不会被唤醒或者准备投入运行。                |
| \_\_TASK\_TRACED      | 被其他跟踪的进程（如ptrace）                          |
| \_\_TASK\_STOPPED     | 停止执行，收到SIGSTOP，SIGTSP，SIGTTIN，SIGTTOU信号后 |

进程的内存空间布局：（在/proc/\<PID\>/maps查看布局）

-   内核部分：空间最顶端的部分，只有进入内核态才可见。

-   用户栈：自顶向下，保存各种临时变量的值。
-   代码库：保存依赖共享的代码库，如libc等，这段标记为只读。
-   数据与代码段：自底向上，这个段用于保存二进制文件，加载时会被载入虚拟空间中。

```c
#inclue<unistd.h>
#inclue<sys/types.h>
pid_t fork(void);

#inclue<unistd.h>
int execve(const char *pathname, char *const argv[], char *const envp[]);
```

exevce会根据pathname的路径，将数据段和代码段加载到当前进程地址空间中，再重新初始化堆栈再将PC指向代码段定义的入口

进程监控：wait

```c
#include<sys/types.h>
#include<sys/wait.h>

pid_t waitpid(pid_t pid, int *wstatus, int options);
```

```c
#include<stdio.h>
#include<stdlib.h>
#include<sys/wait.h>
#include<sys/types.h>
#include<unistd.h>

int main(int argc, char *argv[]) {
    int rc = fork();
    if (rc < 0) {
        fprintf(stderr, "Fork failed\n");
    } else if (rc == 0) {
        printf("ChildProcess: existing\n");
    } else {
        int  status = 0;
        if (waitpid(rc, &status, 0) < 0) {
            fprintf(stderr, "Parent process: waitpid failed");
            exit(-1);
        }
        if (WIFEXITED(status)) {
            printf("Parent process: my child has exited\n");
        } else {
            fprintf(stderr, "Parent process: waitpid returns for unkonwn reasons");
        }
    }
    return 0;
}
```

如果父进程没有wait或者没运行到到wait，子进程中止了，父进程未进行适当处理SIGCHLD信号，占用的资源也不会释放，被称为僵尸进程。内核会为僵尸进程保留Pid以及终止时的status。如果父进程退出了，那么子进程的信息也不会被父进程占用，所有的僵尸进程都会被init用wait回收。（如果父进程不退出，一直死循环，那僵尸进程会越来越多）

进程组（Process Group）：默认父进程和子进程是一个进程组，子进程可以setpgid()创建新进程组或者移入已有进程组。应用程序可以killpg发送信号，通知进程组的每个进程。

会话（Session）：进程组的集合，根据执行状态，分为前台进程组（foreground thread group），和后台进程组（background group）。控制终端是会话与外界交互的一个入口。

```c
#include<sched.h>
int clone(int (fn*)(void *), void *stack, int flags, void *arg, ...);
```

Linux支持对clone进行更精密的控制，允许指定进程栈的位置、禁止复制内存等操作。包括隔离namespace等。

## 5.2. Thread

Linux操作系统把所有的线程都当作进程来实现，内核并没有准备特别的调度算法或者定义特别的数据结构来表征线程。仅仅被视为与其他进程做了资源共享的进程。

线程分为用户态线程和内核态线程，一般来说，有三种调度模型：

用户对内核：多对一，一对一，多对多。没有一对多（即一个用户线程对应多个内核线程）。

```c
#include<pthread.h>
int pthread_create(pthread_t *thread, 
                   const pthread_attr_t *attr, 
                   void *(*start_routine)(void *), 
                   void *arg);
int pthread_exit(void *retval);
int pthread_yield(void);
int pthread_join(pthread_t thread, void **retval);
```

线程创建函数最后还是会调用clone，其中clone_flag为CLONE_THREAD。

线程退出函数不是必要的，退出时自动会退出；yield用于让出，会发起sched_yield系统调用。

合并操作允许等待一个线程结束，并保留返回值。

```c
#include<unistd.h>
unsigned int sleep(unsigned int seconds);
int pthread_cond_wait(pthread_t *restrict cond,
                      pthread_mutex_t *restrict mutex);
```

sleep会让线程挂起数秒，或者是使用cond_wait在条件变量为同步方式等待。



# 6. Operating System Scheduling

Long-term Scheduling：决定当前真正可以被调度的进程数量。

Short-term Scheduling：负责进程在就绪、运行、阻塞三个状态之间的转换。

Midium-term Scheduling：负责管理内存（如将进程挂起并且替换入磁盘），换页机制等。

经典调度策略：

-   FIFO/FCFS（First In First Out / First Come First Serve）：在长短任务混合的情况下对短任务不友好。

-   SJF（Shortest Job First）：表现严重依赖于任务到达的时间点。

-   STCF（Shortest Time-to-Completion First）：相比FIFO和SJF，引入preemptive机制，但是可能会导致长任务饥饿。

-   RR（Round Robin）：在任务运行时间相似的情况下周转时间很高。

优先级调度策略：

-   MLQ（Multi-Level Queue）：按多个等级排列，下一级队列为空后，再调度新的任务，在每级队列可以使用不同的调度策略。但是可能造成低优先级饥饿，同时，在切换任务时，发生锁竞争，可能会产生优先级反转。解决方法：priority inheritance，将自己的优先级交给低的，等待放锁后立即执行。

-   MLFQ（Multi-Level Feedback Queue）：相同优先级的采用RR策略，同时短任务有更高的优先级。如果某一任务超过队列允许运行的最大的时间，则优先级降低。同时，将低优先级的任务采用更长的时间片，定时将所有任务的优先级提至最高。采用这种动态提升与降低（Boost and Penalty）被应用于早期的Linux。

公平共享调度策略：

-   Fair-share Scheduling：以份额量化CPU时间

-   Lottery Scheduling：以抽彩票数量决定被调度的概率；份额大的任务可以彩票转让（ticket transfer）给小的任务；同时允许给自己的子任务不同的彩票货币（ticket currency）避免频繁修改；任务可以根据CPU需求，通过彩票通胀（ticket inflation）决定自己的调度份额。

-   Stride Scheduling：引入虚拟时间（virtual runtime）以步幅来决定调度，任务份额决定步幅的倒数。也可以使用借用虚拟时间（Borrowed Virtual Runtime），保证公平的同时提升实时性。

多核调度策略：

-   Load Sharing：从全局队列中取任务。后续添加了（Two-level Scheduling）策略，引入了本地队列。
-   Energy Aware Scheduling：对每个CPU的容量，功率权衡，划分性能域，找到最合适的核来运行。

Linux Scheduling：

2.6.23开始采用Complete Fair Scheduling策略。将调度器实体封装成如下数据结构

```c
struct sched_entity {
    struct load_weight load;
    struct rb_node;
    struct list_head;
    unsigned int on_rq;
    u64    exec_start;
    u64    sum_exec_time;
    u64    vruntime;
    // ...
};
```

Linux操作系统将vruntime作为红黑树的value，在选择下一个运行进程时，只需要找到最左叶子结点的缓存，即只需要O(1)复杂度，而不是O(logn)。

# 7. Inter-Process Communication

管道：在内存中以FIFO的形式缓冲数据，本质上属于一个文件的两个fd，收发端对fd进行操作，有匿名管道（fork后子进程继承文件描述符）和命名管道（mkfifo）两种实现方式。属于单向IPC，收发端需要对字节流进行解析。

```C
#include <unistd.h>
int pipe(int pipefd[2]); // pipefd[0] -> read; pipefd[1] -> write
int pipe2(int pipefd[2], int flags);
```

消息队列：四个基本操作：msgget：获取已有的消息队列连接或者新创建一个，msgsnd往消息队列上发消息，msgrcv：接收消息（收发过程如果消息队列已满或为空，则阻塞），msgctl。

```c
#include <sys/msg.h>
// get System V message queue identifier 
// associated with the value of the key argument.
int msgget(key_t key, int msgflg); 

struct msgbuf {
    long mtype;       /* message type, must be > 0 */
    char mtext[1];    /* message data */
};

// appends a copy of the message pointed to by msgp
// to the message queue whose identifier is specified by msqid.
int msgsnd(int msqid, const void msgp[.msgsz], size_t msgsz, int msgflg);

// removes a message from the queue specified 
// by msqid and places it in the buffer pointed to by msgp.
ssize_t msgrcv(int msqid, void msgp[.msgsz], 
               size_t msgsz, long msgtyp, int msgflg);

// performs the control operation specified by cmd 
// on the System V message queue with identifier msqid.
int msgctl(int msqid, int cmd, struct msqid_ds *buf);
```

信号量：P（Probeer，尝试）计数器减一，操作失败会进入阻塞，V（Verhoog，增加）计数器加一，唤醒P。

共享内存：为需要通信的进程建立共享区域，一旦建立成功，就不再需要内核参与进程间通信。

信号：使用kill向进程、进程组或者是tgkill向线程发送信号，其中1～31为常规信号，32～64为实时信号。处理时机通常在执行完异常、中断、系统调用返回时。

```c
#include <signal.h>

// send any signal to any process group or process.
int kill(pid_t pid, int sig);

// be delivered to an arbitrary thread within that process.
int tgkill(pid_t tgid, pid_t tid, int sig);
```

套接字：使用特定“地址”来找到要调用的服务端进程。

```c
#include <sys/socket.h>

// create an endpoint for communication
int socket(int domain, int type, int protocol);
```

# 8. Synchronization Primitives

皮特森算法

```c
while(true) {
    flag[0] = true;
    turn = 1;
    while(flag[1] == true && turn == 1);
    
    do_critical_section();
    
    flag[0] = false;
}


while(true) {
    flag[1] = true;
    turn = 0;
    while(flag[0] == true && turn == 0);
    
    do_critical_section();
    
    flag[1] = false;
}
```

要求访存操作严格顺利执行。

原子操作：CAS（Compare And Swap），以及FAA（Fetch-And-Add）。

Intel平台采用内联汇编来保证操作的原子性，比较expected（这里+a当作寄存器%eax）和addr的值，如果相等就存入地址addr中。

```c
int atomic_CAS(int *addr, int expected, int new_value) {
    asm volatile("lock empxchg %[new], %[ptr]"
                 :"+a"(expected), [ptr] "+m"(*addr)
                 :[new] "r"(new_value)
                 :"memory");
    return expected;
}
```

ARM平台（与RISC-V类似）采用Load-Link和/Store-Conditional的指令组合，通过CPU监视器来实现

```c
int atomic_CAS(int *addr, int expected, int new_value) {
    int oldval, ret;
    asm volatile(
        "1: ldxr    %w0, %2\n"
        "   cmp     %w0, %3\n"
        "   b.ne    %2f\n"
        "   stxr    %w1, %w4, %2\n"
        "2:"
        : "=&r" (oldval), "=&r" (ret), "+Q" (*addr)
        : "r" (expected), "r" (new_value)
        : "memory");
    return oldval;   
}
```

自旋锁

```c
void lock_init(int *lock) {
    *lock = 0;
}

void lock(int *lock) {
    while (atomic_CAS(lock, 0, 1) != 0)
        ;
}

void unlock(int *lock) {
    *lock = 0;
}
```

并不保证有限等待，即不具有公平性，会陷入循环等待。

排号锁

```c
struct lock {
    volatile int owner;
    volatile int next;
}

void lock_init(struct lock *lock) {
    lock->owner = 0;
    lock->next = 0;
}

void lock(struct lock *lock) {
    volatile int my_ticket = atomic_FAA(&lock->next, 1);
    while (lock->owner != my_ticket)
        ;
}

void unlock(struct lock *lock) {
    lock->owner++;
}
```

条件变量

```c
struct cond {
    struct thread *wait_list;
}

void cond_wait(struct cond *cond, struct lock *mutex) {
    list_append(cond->wait_list, thread_self());
    atomic_block_unlock(mutex); // 原子挂起并释放锁
    lock(mutex); // 重新获得互斥锁
}

void cond_signal(struct cond *cond) {
    if (!list_empty(cond->wait_list)) {
        wakeup(list_remove(cond->wait_list));
    }
}

void cond_broadcast(struct cond *cond) {
    while (!list_empty(cond->wait_list)) {
        wakeup(list_remove(cond->wait_list));
    }
}
```

生产者消费者问题，采用条件变量

```c
int empty_slot = 5;
int filled_slot = 0;
struct cond empty_cond;
struct lock empty_cnt_lock;
struct cond filled_cond;
struct lock filled_cnt_lock;

void producer(void) {
    int new_msg;
    while (true) {
        new_msg = produce_new();
        lock(&empty_cnt_lock);
        while (empty_slot == 0) {
            cond_wait(&empty_cond, &empty_cnt_lock);            
        }
        empty_slot--;
        unlock(&empty_cnt_lock);
        
        buffer_add_safe(new_msg);
        
        lock(&filled_cnt_lock);
        filled_slot++;
        cond_signal(&filled_cond);
        unlock(&filled_cnt_lock);
    }
}

void consumer(void) {
    int cur_msg;
    while (true) {
        lock(&filled_cnt_lock);
        while (&filled_slot == 0) {
            cond_wait(&filled_cond, &filled_cnt_lock);
        }
        filled_slot--;
        unlock(&filled_cnt_lock);
        
        cur_msg = buffer_remove_safe();
        
        lock(&empty_cnt_lock);
        empty_slot++;
        cond_signal(&empty_cond);
        unlock(&empty_cnt_lock);
        comsume_msg(cur_msg);
    }
}
```

信号量

```c
struct sem {
    int value;
    int wakeup;
    struct lock sem_lock;
    struct cond sem_cond;
}

void wait(struct sem *S) {
    lock(&S->sem_lock);
    S->value--;
    if (S->value < 0) {
        do {
            cond_wait(&S->sem_cond, &S->sem_lock);
        } while(S->wakeup == 0);
        S->wakeup--;
    }
    unlock(&S->sem_lock);
}

void signal(struct sem *S) {
    lock(&S->sem_lock);
    S->value++;
    if (S->value <= 0) {
        S->wakeup++;
        cond_signal(&S->sem_cond);
    }
    unlock(&S->sem_lock);
}
```

生产者消费者问题，采用信号量

```c
sem_t empty_slot;
sem_t empty_slot;

void producer(void) {
    int new_msg;
    while(true) {
        new_msg = produce_new();
        wait(&empty_slot); // P
        buffer_add_safe(new_msg);
        signal(&filled_slot); // V
    }
}

void consumer(void) {
    int cur_msg;
    while(true) {
        wait(&filled_slot); // P
        cur_msg = buffer_remove_safe();
        signal(&empty_slot); // V
        consume_msg(cur_msg);
    }
}
```

死锁产生的原因：

-   互斥访问、持有并等待、资源非抢占、循环等待

银行家算法：假设系统有M个资源，N个线程。

全局可利用资源Available\[M\]，每个线程最大需求Max\[N\]\[M]，已分配资源Allocation\[N]\[M]，还需要分配的资源Need\[N]\[M]。同时，保证供给关系固定。线程的需求不能超过总量，任意线程分配的资源加上还需要的资源小雨该线程的最大需求。线程获得资源后，有限时间能完成，并且最后会释放这些资源。

死锁检测与恢复：事后恢复；死锁预防：解决死锁产生的四个必要条件之一；死锁避免：找到安全序列，如银行家算法。

优先级反转避免：优先级继承协议（Priority Inheritance protocol）：高优先级等待锁时，会使持有者继承其优先级，避免临界区被低优先级打断。

# 9. File System

Index Node：记录文件索引节点（即存储块），inode保存三块指针，一种直接指向数据块，一种是间接指向一个一级索引块，一种是二级指针指向一级索引。

inode也保存着文件模式、链接数、拥有者用户组，大小、访问时间等信息。

|Symbol| File type                        | Description                                                  |
| -----------| ----------- | ------------------------------------------------------ |
| - | Ordinary or regular files        | Contain data of various content types such as text, script, image, videos, etc. |
| d | Directory files                  | Contain the name and address of other files.                 |
| b & c| Block or character special files | Represent device files such as hard drives, monitors, etc.   |
| l | Link files                       | Point or mirror other files                                  |
| s | Socket files                     | Provide inter-process communication                          |
| p | Named pipe files                 | Allow processes to send data to other processes or receive data from other processes. |

目录大小即记录的文件数量以及文件名长度的大小。

每个inode可以被多个目录项指向，该链接数为0时，inode资源和数据可以被销毁。

Virtual File System：通过基于inode设计了一系列数据结构，包括超级快，inode，目录项等，VFS隐蔽了实现细节。

mount：文件访问到挂载点，就会跳转到挂载点的根目录访问。

Pseudo File System（Synthetic file system）：常见的伪文件系统如/proc，/sys，/sys/kernel/config等。

# 10. Device Management

Peripheral Component Interconnect：PCI标准，满足用于PCI插槽与CPU高效通信

Data Memory Access，DMA：设备与内存之间高效数据传输形式。一般有三个流程

-   处理器向DMA发送至缓冲区的位置和长度，以及数据方向。
-   DMA获得总线控制权，可以直接和内存与设备进行通信。
-   DMA控制器将根据处理器获得的命令，将设备数据拷贝至内存，这期间处理器可以执行其他任务
-   完成后，DMA控制器向处理器发送中断，此时处理器重新获得总线的控制权。

Generic Interrupt Controller：ARM下的通用中断控制器，负责对设备的中断信号处理。每个中断有四种状态：

-   Inactive：无效，此时中断未到来。
-   Pending：有效状态，中断已发生，CPU未响应中断。
-   Active：CPU处于响应并处理中断的过程中。
-   Active & Pending：处理中断时，有相同的中断号发生。

Linux操作系统中，中断分为上半部和下半部。上半部处理时，关闭中断，做一些严格有时限的工作，如应答并且复位硬件。完成后向中断控制器声明中断处理器并开中断，设备驱动通过以下函数来注册/释放相应设备硬中断。

```c
typedef irqreturn_t (*irq_headler_t)(int, void *);
int request_irq (unsigned int irq, // 不同设备的中断号
                 irq_handler_t handler, // 指向这个中断处理程序的指针
                 unsigned long flags, // 标志掩码，如关中断等
                 const char *name, // 中断设备名称的的ASCII表示
                 void* dev) // 共享中断总线，标志中断处理程序

void free_irq (unsigned int irq, // 注销中断处理程序，释放中断线
              void *dev) // 如果中断总线共享，则仅删除dev对应的处理程序
```

软中断：处理函数要求是可重入的，要求软中断的执行过程中可以被硬中断抢占。所以，软中断时应该避免全局变量，或者加锁保护关键数据结构。Linux共有10种中断信号，从TASKLET_HI往下包括定时器，网卡收发，块设备中断等。内核会选择恰当时机来处理软中断（大多数时间在硬中断得到处理后，除非CPU还持有未执行的软中断）。

```c
struct softirq_action {
    void (*action)(struct softirq_action *);
}
// 软中断在编译阶段静态分配，最多只能有32个
static struct softirq_action softirq_vec[NR_SOFTIRQS];
```

通常标记了软中断后执行的场景有：1.从硬件中断代码返回时；2.在ksoftirqd内核线程中；3.在那些显示检查和执行待处理的软中断代码中，如网络子系统。

tasklet：软中断只能编译时静态分配，为了动态分配设计了tasklet，每个tasklet只有SCHED（已被调度未执行）和RUN（正在执行），将所有tasklet用链表串起来。此外tasklet不允许多CPU并发执行，同时保证原子性，不允许被其他下半部机制抢占，满足可重入性。

```c
struct tasklet_struct {
    struct tasklet_strcut *next; // 链表中的下一个tasklet
    unsigned long state; // 三个状态：0，准备运行，正在运行（仅限多核作为优化使用） 
    atomic_t count;      // 引用计数器
    void (*func)(unsigned long); // tasklet处理函数
    unsigned long data;  // 给tasklet处理用的参数
}
```

Work Queue：把需要推迟的函数放在下半部，用内核线程来执行。Work Queue由驱动开发者自己定义，并且由于其是串行的，可能产生阻塞，也会浪费PID资源。

Concurrency Managed WorkQueue：将工作队列管理还给内核，同一个队列的work不遵守串行，可以并发执行，如果有任务长时间足额，那么CMWQ会自动创建一个新的工作线程去处理该任务后续的工作。

# 11. System Virtualization

CPU虚拟化：通过vCPU抽象执行指令，直接运行在物理机上，使用物理ISA。虚拟机模拟一个安全的下陷的过程。

内存虚拟化：使用客户物理地址与主机物理地址，影子页表机制

IO虚拟化：主引导记录，全局唯一标识分区表。

# 12. Multi-core processor

最小的操作粒度（Cache Line）：一般是64字节，通常L1 Cache 进一步划分为单独的数据缓存（Data Cache）与指令缓存（Instruction Cache）。所有核心共享最末级缓存（Last Level Cache，LLC）。

直写策略（Write Through）：在写时，立刻将修改的值刷回内存（该值会同时保留在高速缓存中）。

写回策略（Write Back）：将值暂时存在高速缓存中。只有在出现高速缓存逐出（Cache Eviction），或是CPU 核心调用写回指令时，修改才会被更新至物理内存。

非一致缓存访问（Non-Uniform Cache Access，NUCA）：不同核心访问时延会依据缓存行所在位置有所差别。

```go
var a, b int

func main() {
    go func() {
        a++ 
        fmt.Println("b = ", b)
    }()
    go func() {
        b++
        fmt.Println("a = ", a)
    }()
    time.Sleep(time.Second)
}
```

内存一致性模型（Memory Consistency Model，简称为内存模型）明确定义了不同核心对于共享内存操作需要遵循的顺序。以上述代码为例，不同情况下(a, b)可能的取值范围(0, 0), (1, 0), (0, 1), (1, 1)也会发生改变。

严格一致性模型（Strict Consistency）：所有访存操作都是严格按程序顺序。

顺序一致性模型（Sequential Consistency）：不同核心看到的访存操作顺序完全一致，这个顺序称为全局顺序。在这种模型下，不可能出现(a, b)=(0, 0)的情况。

TSO一致性模型（Total Store Ordering）：保证对**不同地址且无依赖**的读读、读写、写写操作之间的全局可见顺序，只有写读的全局可见顺序不能得到保证。通过加入写缓冲来实现这个操作，这允许了(0, 0)可能的出现。

PSO一致性模型（Partial Store Ordering）：Is a more relaxed memory consistency model compare to the Total Store Ordering (TSO). PSO is essentially TSO with one additional relaxation to the consistency: PSO only guarantees writes to the same location is in order whereas writes to different memory location may not be in order at all. The processor may rearrange writes so that a sequence of write to memory system may not be in their original order.

弱序一致性模型（Weak-ordering Consistency）：不保证任何不同地址且无依赖的访存操作之间的顺序，也即读读，读写，写读与写写操作之间都可以乱序全局可见。

|                | 读读 | 读写 | 写读 | 写写 |
| -------------- | ---- | ---- | ---- | ---- |
| 严格一致性模型 | ✅    | ✅    | ✅    | ✅    |
| 顺序一致性模型 | ✅    | ✅    | ✅    | ✅    |
| TSO一致性模型 | ✅    | ✅    | ❌    | ✅    |
| PSO一致性模型 | ✅ | ✅ | ❌ | ✅（同位置）/❌（不同） |
| 弱序一致性模型 | ❌    | ❌    | ❌    | ❌    |

硬件内存屏障（Barrier/Fence，简称内存屏障）:

```c
// Any of these GNU inline assembler statements forbids the GCC compiler 
// to reorder read and write commands around it:
asm volatile ("":::"memory");
__asm__ __volatile__ ("" ::: "memory");

// This C11/C++11 function forbids the compiler  
// to reorder read and write commands around it:
atomic_signal_fence(memory_order_acq_rel);
```

|          | 弱顺序一致性                    | TSO一致性模型          | 顺序一致性           |
| -------- | ------------------------------- | ---------------------- | -------------------- |
| 体系结构 | ARM，PowerPC                    | x86                    | Dual386，MIPS R10000 |
| 使用场景 | 嵌入式，手机/平板，高性能服务器 | 桌面电脑，高性能服务器 | 已被淘汰             |

依赖关系：数据依赖（要写入的某值，依赖另一个运行结果，Java的编译器和处理器会满足这个依赖性）；地址依赖（如写操作需要写的地址依赖于读操作读出来的值）、控制依赖（如写操作只有在读操作结束分支满足后才能执行）。

重排序缓冲区（Re-Order Buffer, ROB），让指令按照程序顺序退役（Retire）对应顺序执行中的执行结束，其意味着该条指令对系统的影响终将全局可见。

存取单元（Load/Store Unit，LSU）中预留了读缓冲区与写缓冲区。

阿姆达尔定律（Amdahl’s Law）用以描述并行计算的加速比：$S = \frac{1}{(1 − p) + \frac{p}{s}}$

其中 S 描述加速比，p 为程序中可以并行的部分所占比例（$0≤p≤1$），而 s 为可以并行部分的加速比。在理想情况下，如我们如果有N 个核，此时的并行部分加速比为$s = N$。

# \*. Docker

容器本身作为宿主机上的一个进程，通过namespace实现资源隔离，cgroups实现资源限制，通过copy-on-write实现了高效的文件操作。

## \*.1. namespace

namespace 隔离机制：

| namespace | 系统调用参数  | 隔离内容                     |
| --------- | ------------- | ---------------------------- |
| UTS       | CLONE_NEWUTS  | 主机名和域名                 |
| IPC       | CLONE_NEWIPC  | 信号量，消息队列，共享内存   |
| PID       | CLONE_NEWPID  | 进程编号                     |
| NetWork   | CLONE_NEWNET  | 网络设备，网络栈，网络端口等 |
| Mount     | CLONE_NEWNS   | 挂载点（文件系统）           |
| User      | CLONE_NEWUSER | 用户和用户组                 |

系统调用方式：clone(), setns(), unshare(), 以及/proc下的虚拟文件。

```c
#inclue<unistd.h>
#inclue<sys/types.h>
// fork - create a child process
// 传统创建进程的方式
pid_t fork(void);

#include<sched.h>
// clone - create a child process
// 是fork更加通用的实现方式，可以使用flag来实现功能。
int clone(int (fn*)(void *), void *stack, int flags, void *arg, ...);
// setns - reassociate thread with a namespace
// 加入现有的namespace中
int setns(int fd, int nstype);
// setns - reassociate thread with a namespace
// 在原进程上进行namespace隔离
int unshare(int flags); // Docker并未采用
```

UTS(Unix Time-haring System) namespace: 提供了主机和域名的隔离，这样每个容器便可以视作独立节点而非宿主机上的一个进程。

IPC(Inter-Process Communication) namespace: 主要包括常见的信号量，消息队列和共享内存。申请IPC其实就是申请了全局唯一的32位ID。IPC namespace实际上就包含了系统的IPC标识符以及实现了POSIX消息队列的文件系统。不同的IPC namespace下的进程之间不可见。

PID(Process ID) namespace: 对进程的PID进行重写，不同namespace下的进程可以拥有相同的PID，所有PID namespace维持一个树状结构。其中init进程具有屏蔽权限，一旦init被销毁，那么同一个namespace下的PID都会收到SIGKILL而被杀死

mount namespace: 是历史上第一个namespace，所以标志位比较特殊，就是CLONE_NEWNS。隔离以后，不同namespace下的文件将不受影响。

在2006年引入了挂载传播(mount propagation)机制，使得挂载可以定义挂载对象之间的关系，决定了事件如何传播到其他挂载的对象。包括：共享(share)，从属(slave)，共享/从属(share and slave)，私有(private)，不可绑定(unbinable)，共五种。

network namespace: 提供了网络资源的隔离，包括网络设备、IPv4/IPv6协议栈、IP路由表、防火墙，/proc/net目录，/sys/class/net目录以及socket等。一个物理的网络设备只能处于一个network namespace中，通过创建veth pair创建通道以达到通信目的。

在建立网桥之前，新旧namespace通过建立pipe，init在pipe一段循环等待，直到管道另一边传来veth的信息，init才结束等待。

user namespace: 直到Linux内核3.8开始都未完全实现，还有部分文件系统未支持。设计主要隔离了安全相关的标识符(identifier)和属性(attribute)，包括用户ID，用户组ID，root目录，key（密钥）以及特殊权限。Docker在1.10开始才支持user namespace，启动daemon时指定userns-remap，则容器内的root将不再等于宿主机内的root。

namespace 的核心实际上是通过层次关联起来，每个namespace都源自于root namespace的映射。

## \*.2. cgroups

cgroups：限制被namespace隔离起来的资源，还可以为资源设置权重、计算使用量、操控任务（进程或线程）启停等。

cgroups是Linux内核提供的一种机制，这种机制可以根据需求把一系列系统任务及其子任务整合（或分隔）到按资源划分等级的不同组内，从而为系统资源管理提供一个统一的框架。cgroups的实现本质上是给任务挂上钩子，当任务运行的过程中涉及某种资源时，就会触发钩子上所附带的子系统进行检测

cgroups为了不同用户层面的管理资源，并提供统一化的接口，包括如下四个功能：

-   资源限制：cgroups可以对资源的总和进行限制，当超过上限即触发OOM。
-   优先级分配：分配CPU分得的时间片以及磁盘I/O带宽，决定其优限级。
-   资源统计：统计内存使用时长，CPU使用量等。
-   任务控制：实现任务挂起，恢复等操作。

镜像分层：每个镜像都由一系列镜像层构成，采用COW机制，并根据文件内容索引镜像和镜像层。联合挂载技术可以在一个挂载点同时挂载多个文件系统，将挂载点的原目录与被挂载内容进行整合，使得最终可见的文件系统将会包含整合之后的各层的文件和目录。

OverlayFS是一种新型联合文件系统（union filesystem），Linux内核版本3.18开始支持，它允许用户将一个文件系统与另一个文件系统重叠（overlay），在上层的文件系统中记录更改，而下层的文件系统保持不变。

libnetwork：在Docker的桥接网络模式中，docker0的IP地址作为连于之上的容器的默认网关地址存在。

-   Bridge驱动：默认方式，Container会接到Docker网桥上，与外界通信采用NAT，增加了通信复杂性。
-   host驱动：不创建默认的namespace，使用宿主机的网卡、IP和端口，避免了地址转换问题。
-   overlay驱动：采用IETF的VXLAN方式，适合大规模的云计算虚拟化SDN controller模式，但是需要额外配置服务，如Consul，etcd和ZooKeeper等，在启动时添加参数
-   remote驱动：没有使用真正的网络服务发现，调用了用户自己的网络驱动插件。
-   null驱动：Container有自己的namespace，但是不会做任何网络相关的配置。
