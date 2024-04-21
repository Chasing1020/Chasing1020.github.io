---
title: "Distributed Systems"
date: 2023-04-05T19:23:12+08:00
math: true
slug: "Distributed-Systems"
# weight: 1
# aliases: ["", ""]
# tags: ["Tag1", "Tag2"]
# categories: [""]
# author: ["", ""]
# showToc: true
# TocOpen: false
# draft: false
# hidemeta: false
# comments: false
# description: "Desc Text."
# image: "distributed-network.jpeg"
---

# 1. Overview

> [A distributed system is one in which the failure of a coumputer you didn't even know existed can render your own computer unusable.](https://lamport.azurewebsites.net/pubs/distributed-system.txt)

UCB 团队在 2009 年发表的论文 [Above the Clouds: A Berkeley View of Cloud Computing](https://www2.eecs.berkeley.edu/Pubs/TechRpts/2009/EECS-2009-28.pdf)，预测了云计算机的价值、演进和普及的进程；而 2019 年的论文 [Cloud Programming Simplified: A Berkeley View on Serverless Computing](https://www2.eecs.berkeley.edu/Pubs/TechRpts/2019/EECS-2019-3.pdf)，则提出了一种新的猜测：“无服务会发展成未来云计算的主要形式”，无服务架构下的用户不再需要关心细节，而极大解放生产力。

阿里巴巴团队所编写的[云原生架构白皮书](https://developer.aliyun.com/topic/cn-architecture-paper?spm=a2c6h.12873639.article-detail.4.147c6c7ewSNSJn)也预言在未来十年，云计算将无处不在，像水电煤一样成为数字经济时代的基础设施，云原生让云计算变得标准、开放、简单高效、触手可及。

一般来说，现代的分布式计算的服务模型基本分为如下一些类别：

| Name     | Description                                    | Example                                 |
| -------- | ---------------------------------------------- | --------------------------------------- |
| SaaS     | Web services, multimedia, business apps        | Web services, multimedia, business apps |
| PaaS     | Software framework (Java/Go), Database systems | MS Azure Google App engine              |
| IaaS     | Computation (VM), storage (block, file)        | Amazon S3; Amazon EC2                   |
| Hardware | CPU, memory, disk, bandwidth                   | Datacenters                             |

为了实现这些分层，对用户透明，需要很多的抽象，Andrew Tanenbaum 在图书 [Distributed Systems Principles and Paradigms](https://www.distributed-systems.net/index.php/books/ds4/) 中，也给出了系统透明性的各个角度的描述。

| Transparency | Description                                                           |
| :----------: | :-------------------------------------------------------------------- |
|    Access    | Hide differences in data representation and how an object is accessed |
|   Location   | Hide where an object is located                                       |
|  Relocation  | Hide that an object may be moved to another location while in use     |
|  Migration   | Hide that an object may move to another location                      |
| Replication  | Hide that an object is replicated                                     |
| Concurrency  | Hide that an object may be shared by several independent users        |
|   Failure    | Hide the failure and recovery of an object                            |

为了实现一个彻底透明的分布式系统还有非常多的挑战，早在 20 世纪 90 年代，L. Peter Deutsch 等人总结出了分布式计算的谬误（[The Fallacies of Distributed Computing](https://en.wikipedia.org/wiki/Fallacies_of_distributed_computing)）：

1. The network is reliable; 网络是可靠的
2. Latency is zero; 延迟为零
3. Bandwidth is infinite; 带宽是无限的
4. The network is secure; 网络是安全的
5. Topology doesn't change; 拓扑结构不会改变
6. There is one administrator; 单一的管理员
7. Transport cost is zero; 传输成本为 0
8. The network is homogeneous. 网络是同构的

实际上，在真实的世界中，分布式系统充满了各种挑战，其中主要包括如下三点：

1. 不可靠的网络：消息可能丢失、拥塞、排队、重传、不一定按序到达。即便有了 TCP 这样的协议，在网络硬件设备上同样是不可靠的。
2. 不可靠的进程：系统可能部分节点正常工作，但是另一部分不能正常运行；由于编程语言的垃圾回收（GC），在虚拟化环境中的挂起（Suspend），操作系统的上下文切换，同步磁盘的访问等等不确定性和失效的可能，使得分布式系统难以调试，尤其是对于需要原子操作的场景，部分失效会带来很大的复杂性与挑战。
3. 不可靠的时钟：由于通信不是即时的，网络延迟永远都在发生，不像单机系统中每个进程都有一个共同的时间。一种解决方案是设置时间服务器来同步时间（依旧存在网络可变延迟问题，而且同步后也未必精准）；使用 [Spanner, TrueTime](https://research.google.com/pubs/archive/45855.pdf)；或者使用 [Lamport 的逻辑时钟](http://lamport.azurewebsites.net/pubs/time-clocks.pdf?from=https://research.microsoft.com/users/lamport/pubs/time-clocks.pdf&type=path)来确定时序等。

# 2. The System Models

> [All of which prove to be false in the long run and all of which cause big trouble and painful learning experiences.](https://queue.acm.org/detail.cfm?id=2655736)

两将军问题（[Two General's Problem](https://en.wikipedia.org/wiki/Two_Generals%27_Problem)）：两支军队攻打同一个城堡，然而两个军队通信被山谷隔开，信息传递的信使随时可能被俘虏，而且两个军队需要同时达成进攻或者撤退的一致。这个问题已经被 Lamport 的论文 [Solved Problems, Unsolved Problems and Non-Problems in Concurrency](https://lamport.azurewebsites.net/pubs/solved-and-unsolved.pdf) 证明无解，不过在工程上的解决方案即是 TCP 的三次握手。进一步说明，在一个分布式系统中，某个节点如果需要确认另一个节点的状态，唯一的方法就是进行可靠的消息通信。

拜占庭将军问题（[The Byzantine Generals Problem](https://en.wikipedia.org/wiki/Byzantine_fault)）：有 n 个拜占庭将军，他们希望在进攻/撤退上达成一致，将军们只能通过信使进行交流，但是信使可能有叛徒。Lamport 给出了最终证明，[至少要 3n+1 个计算机，才能保证其中的 n 个“叛徒”不会阻碍正确操作的计算机达成共识](https://lamport.azurewebsites.net/pubs/byz.pdf)。

网络链路模型：在分布式系统中，网络永远都有可能发生分区（Network Partition），将网络进行抽象，只考虑点对点的链路，可大致分为

1. 可靠链路（Reliable Link or Perfect Link）：TCP 的编程模型，可以保证：消息传递一定可靠、没有重复消费、不会无中生有消息。
2. 公平损失链路（Fair-Loss Link）：消息可能丢失、重复或者乱序，但是能保证消息最终一定会到达。
3. 任意链路（Arbitrary Link）：最弱的编程模型，允许任意网络链路执行任意操作。使用 TLS 等加密技术可以转换成公平损失链路

节点故障模型：节点可能出现故障，主要包括以下三种

1. 崩溃-停止（fail-stop or crash-stop）：一个节点崩溃后永远不会恢复。
2. 崩溃-恢复（fail-recover or crash-recovery）：允许节点重新启动后继续执行剩余的步骤。
3. 拜占庭故障（Byzantine fault）：故障的节点不仅会偏离状态，还会恶意破坏系统。

消息传递模型：各个节点通过传递消息进行通信，常见解决方案如消息丢失->重传，消息重复消费->采用幂等方案。


# 3. Distributed Clock

格林尼治标准时间（Greenwich Mean Time, GMT）：又称格林尼治平均时间，是指位于英国伦敦郊区的皇家格林尼治天文台当地的平太阳时，因为本初子午线被定义为通过那里的经线。

世界协调时间（Coordinated Universal Time, UTC）：作为一种世界的时间标准，基于国际原子时，并通过不规则添加正负闰秒来抵消地球自转变量的影响，并在时刻上尽量接近格林尼治标准时间（Greenwich Mean Time, GMT）。

UNIX 时间戳（Timestamp）：计算从 UTC 的 1970 年 1 月 1 日 0 时 0 分 0 秒开始经过的时间，当出现闰秒问题时，通过“降速”问题解决，即出现闰秒后，在未来的十小时内，刻意让时钟变慢来实现“加一秒”。

夏时令（Daylight Saving Time, DST）：又称日光节约时制和夏令时间，是一种为节约能源而人为规定地方时间的制度；天亮早的夏季人为将时间调快一小时，可以使人早起早睡，减少照明量，以充分利用光照资源，从而节约照明用电；在中国并没有夏令时间。

由于任何时钟都会出现走不准的问题，分布式系统中，所有服务器都使用本地时间不可避免会出现较多问题。

## 3.1. Synchronization

网络时间协议（Network Time Protocol, NTP）：作为 UTC 在互联网中使用的一种标准，是一个典型的 C/S 架构，NTP 通过网络不停的纠正多个客户端的时间，由于网路和 CPU 的延迟，很多时候 NTP 客户端需要计算其时间偏移量和来回通信延迟。

我们假设，以下 4 个时间节点：

- t0：客户端发起请求的 NTP 包
- t1：服务端收到 NTP 包
- t2：服务端发送返回
- t3：客户端收到返回

其中网络延迟并不固定，为了更精确，只能得到往返延迟 $\delta = (t_3 - t_0) - (t_2 - t_1)$。

NTP 认为，RTT 的延迟除以 2 即是一趟消息的时间，这个延迟时间加上 t2 即可得到 NTP 客户端时间，称为客户端的时间偏移，用 $\theta$ 表示，其中 $\theta = t_2 + \frac{\delta}{2} = \frac{(t_1 - t_0) + (t_2 - t_3)}{2}$。

实际上，在具体实践上会更加复杂，往往需要客户端定期轮询 3 台甚至更多的服务器，做统计分析排除异常值，在公共网络下能保证几十毫秒的误差，而在局域网能够小于一毫秒。

一般来说，一些语言或者 OS 会提供一种单调时钟（Monotonic Clock）来解决，如

```java
long startTime = System.nanoTime();
// Code to be timed goes here
long endTime = System.nanoTime();
long elapsedTime = endTime - startTime;
```

```c
#include <time.h>
struct timespec tp;
clock_gettime(CLOCK_MONOTONIC, &tp); // ignored error check
```

如上方法保证获取到的时钟一定是单调的，但是在分布式系统中，有着很大的局限性。
特别地，Golang 标准库中，`time.Time` 的结构默认包括了 `hasMonotonic` 选项，意味着其保存了 `CLOCK_REALTIME` 和 `CLOCK_MONTONIC` 两个值，即实际时间（Wall Time）和单调时钟（Monotonic Clock），对于测量和计算的操作，均采用单调时钟，不会受到 Wall Time 重置的影响，而 `time.In`、`time.Local` 和 `time.UTC` 等操作，返回的则是真实时间，会从结果中去除单调的读数。

## 3.2. Logical Clock

Lamport 发表的论文 [Time, Clocks, and the Ordering of Events in a Distributed System](https://lamport.azurewebsites.net/pubs/time-clocks.pdf) 提出了逻辑时钟（Logical Clock）的概念，也称作 Lamport 时间戳（Lamport Timestamp）。

爱因斯坦在狭义相对论（Special Relativity）给出的时间的定义：时空中没有一个不变的、确定的时间顺序，不同的观察者可能对两个事件的顺序各抒己见。Lamport 这里的逻辑时钟借鉴了相对论的定义，其论文描述为 "One of the mysteries of the universe is that it is possible to construct a system of physical clocks which, running quite independently of one another, will satisfy the Strong Clock Condition. We can therefore use physical clocks to eliminate anomalous behavior."

Lamport 提出，我们的分布式系统或许并不一定需要一个绝对物理的时钟，而把时钟定义为“发生在之前”（Happens-Before）的关系，并使用如下定义：

1. a, b 事件属于一个进程，如果 a 发生先于 b，则 $a \rightarrow b$
2. a 是发送消息的事件，b 是接受消息的事件，则 $a \rightarrow b$
3. 如果有 $a \rightarrow b, b \rightarrow c$，则有 $a \rightarrow c$
4. 如果事件 a, b 不能满足 $a \rightarrow b$ 或是 $a \rightarrow a$，则称 a, b 两个事件是并发的，记为 $a || b$

逻辑时钟模型并不能得到完整的时间顺序（这也是相比物理时钟最大的缺点），逻辑时钟下的事件排序方式分为全序关系（Total Ordering）和偏序关系（Partial Ordering）。为了获取到系统的全序关系，我们需要在逻辑时钟上加上进程号，同时定义进程的全序关系，默认使用逻辑时钟排序。

此外，本篇论文还提出了一个重要的思想：任何一个分布式系统都可以被描述为一个特定顺序的状态机，状态机不依赖于物理时钟，可以用来解决网络延迟，网络分区和容错等等问题。

实际上，Paxos 的 Ballot、Raft 算法的 Term 都采用了逻辑时钟（原文：Terms acts as a logical clock in Raft）的思想。

## 3.3. Vector Clock

Colin J. Fidge 的论文 [Timestamps in Message-Passing Systems That Preserve the Partial Ordering ](https://fileadmin.cs.lth.se/cs/Personal/Amr_Ergawy/dist-algos-papers/4.pdf) 和 Friedemann Mattern 的论文 [Virtual Time and Global States of Distributed Systems](http://www.vs.inf.ethz.ch/publ/papers/VirtTimeGlobStates.pdf) 都提出了向量时钟（Vector Clock）的概念。相对于逻辑时钟，只有每个进程知道自己的时钟，没有其他进程的时钟，从而导致通过逻辑时钟无法计算出某些事件，必须指定另一个进程的优先级。

向量时钟的每个进程都包含了整个系统的时钟，这样就无需指定其他进程的优先级，可以用于冲突场景的检测。

在 N 个节点的分布式系统中，每个时钟的数据结构都是一个 N 维向量，表示为 $V_0, V_1, ..., V_{N-1}$，其中第 i 个节点的时钟表示为 $(V_{i}[0], V_{i}[1], ..., V_{i}[N-1])$，其中 $V_{i}[i]$ 代表进程自己的时钟。相比于逻辑时钟，向量时钟需要重新更新本地记录所有的节点的向量的时钟。向量时钟的更新逻辑为：

1. 所有进程的向量时钟的初始值都设置为 0
2. 当进程 a 发生一个事件，则 $V_{a}[a] = V_{a}[a] + 1$
3. 进程 a 向 b 发送消息，a 先会 $V_{a}[a] = V_{a}[a] + 1$，再把自己本地的 $V_a$ 发给 b，b 再进行操作 $ V_{b}[i] = Max(V_{a}[i], V_{b}[i]), (i \in [0, N-1]) $

对于向量时钟，判断“发生在之前”的充要条件为：

- $(\forall i \in [0, N-1], V_{a}[i] \le V_{b}[i]) \wedge (\exist j \in [0, N-1], V_{a}[j] \lt V_{b}[j]) \Leftrightarrow a \rightarrow b$

此外，在分布式存储领域，还有一个算法称之为版本向量（Version Vector），其思想与向量时钟非常相似，不过其没有记录每个事件的向量时钟，只关心改变了数据副本的事件。

1. 每个进程的版本向量的初始值都设置为 0
2. 当进程 a 发生更新事件的时候，$V_{i}[i] = V_{i}[i] + 1$
3. 当 a, b 两个进程消息通信的时候，$ V_{a}[i] = V_{b}[i] = Max(V_{a}[i], V_{b}[i]), (i \in [0, N-1]) $

相对于向量时钟，版本向量只在更新操作会增加时钟，且收发双方都要对向量进行同步。对于存储应用，每个数据项都对应一个版本，网络分区时，不同的版本向量可以帮助客户端识别需要解决的冲突数据。但是其缺点是随着向量维度很大，需要很大的存储空间，比较的时间也很长。




# 4. Distributed Data

> [No Silver Bullet: Essence and Accidents of Software Engineering](https://www.cgl.ucsf.edu/Outreach/pc204/NoSilverBullet.html)

## 4.1. Partitioning

- 垂直分区（Vertical Partitioning）：对列表进行拆分，将某些列拆到特定的分区，如将 TEXT 或者 BLOB 类型的放在单独的表中，保证完整性并提高性能。
- 水平分区（Horizontal Partitioning）：也称为分片（Sharding），即对行进行拆分，不同的行放入不同的表中，所有表的定义在每个分区中都能找到。

对于水平分区，主要有以下分区策略：

1. 范围分区（Range Partitioning）：根据关键字来将数据集拆分为多个范围

- 优点：实现简单，能用关键字范围查询，方便修改范围实现数据的增加或减少
- 缺点：无法对分区以外的键进行关键字查询，且查询范围较大且位于多个节点是性能较差，数据分布不均匀，容易造成尾部热点效应

2. 哈希分区（Hash Partitioning）：将哈希值用于分区，使得分区相对均匀；但是无法实现范围查询，且不易增减节点

3. 一致性哈希（Consistent Hashing）：将整个哈希组织抽象成一个环，数据分区到的节点为按顺时针遇见的第一个节点上。当系统节点太少时，一个节点下线会给下一个顺时针方向上的节点增加大量的数据，可以通过虚拟节点（Virtual Node）方案解决，当一个节点失效或新的节点加入时，只需要重新映射它所对应的虚拟节点，而不需要重新映射所有的数据，从而减少了数据迁移的成本。此外，通过虚拟节点还可以刻意让数据产生偏斜，如让更好的机器承载更多的数据等。

## 4.2. Replication

为了高可用，除了分区以外还可以使用复制技术，提高数据的可用性和安全性，通过多地数据中心可以减少往返时间（RTT），增加吞吐量。

> 单主复制

客户端的请求都走到主节点，其余副本都是从节点（Follower or Slave），从节点负责读请求，并与主节点同步最新的数据。其中的同步方式也可分为如下三种

1. 同步复制（Synchronous Replication）：所有从节点都写完成后才返回客户端成功
2. 异步复制（Asynchronous Replication）：主节点完成请求后，立即告诉客户端成功
3. 半同步复制（Semisynchronous Replication）：只需等待至少一个从节点写入成功后即可返回

- 优点：简单易于实现，通过拓展从节点可以提高读性能，仅仅需要对主节点进行并发操作，避免了处理从节点之间冲突的问题，适用于分布式事务。
- 缺点：主节点很可能造成性能瓶颈，主节点宕机时，从节点选主不是实时的，可能造成短暂的停机，可能出现脑裂（Split Brain）问题造成数据损坏。

> 多主复制

多个节点都可以接受写请求，这意味着对与请求的顺序可能造成分歧造成数据不一致（数据冲突在单主复制也会出现，但是往往用主节点作为最终数据，处理并不复杂）。一般可以让客户端选择如何解决冲突、最后写入胜利（LWW, Last Write Wins）、因果关系跟踪（Happens Before）等手段解决。

- 优点：增加了主节点的容错性，可以分担写负载，可以路由到不同主节点提高速度
- 缺点：解决数据冲突带来了复杂性，节点增加复杂

一般来说，多主复制数据冲突的复杂性远远大于其优点，一般只用于避免跨数据中心的写请求操作，路由到地理位置更近的中心提升写性能。

> 无主复制

让客户写请求发送到多个节点，一旦得到一部分的成功相应，即可判断这次请求成功了。客户的读请求也发到很多的节点，获取数据和数据的版本号，对比决定使用哪个数据。此外，为了让系统能够修复旧数据的不一致，还需要使用一解决方案，这里以 Dynamo 架构（[Dynamo-Style](https://javawithloveblog.wordpress.com/2019/12/09/dynamo-style-db/)）为例

1. 读修复（Read Repair）：客户端负责更新数据，检测到旧数据后，顺便发送写请求到旧数据所在的节点
2. 反熵过程（Anti-Entropy Process）：建立一个后台进程来修复数据，进程找出错误的数据，并从存储了最新的数据的节点来将数据复制到错误的节点，不保证写的顺序，只保证最终的一致。如使用 [Merkle Tree](https://en.wikipedia.org/wiki/Merkle_tree)，也称哈希树（Hash Tree）来验证数据是否一致，将数据按关键字划分范围，每个范围计算出一个哈希值作为叶子节点，然后自底向上合并成整个树，如果两个树的根节点相同，则保证了叶子节点也相同，则不需要再检查，如果根节点不同，再往子节点中查找，直至发现不同。

[法定人数（Quorum）机制](<https://en.wikipedia.org/wiki/Quorum_(distributed_computing)#:~:text=A%20quorum%20is%20the%20minimum,operation%20in%20a%20distributed%20system.>)：用于保证分布式系统中的数据冗余和最终一致性，用于多副本数据的一致性维护。在一个 N 个节点组成的系统中，要求至少 W 个节点写成功，且同时从 R 个节点中读取数据，只要保证 W + R > N && W > N/2，即可保证 R 个返回值中一定有最新的数据，其中的 W > N/2 保证了数据的串行化修改，不能有两个写请求同时修改一份数据。这个机制在工程上的实践可以在读写性能上调节参数，以适配更好的读写负载。

## 4.3. CAP Theorem

[CAP 定理](https://en.wikipedia.org/wiki/CAP_theorem)，也称为布鲁尔定理（Brewer's Theorem），指出在一个异步网络环境中，对于一个分布式读写的存储系统（Read-Write Storage System），只能满足一致性（Consistency, `C`）、可用性（Availability, `A`）、分区容错性（Partition Tolerance, `P`）三者中的两个。

[PACELC 定理](https://en.wikipedia.org/wiki/PACELC_theorem)，指出在分布式系统存在网络分区（Partition, `P`）的情况下，必须在可用性（Availability, `A`）和一致性（Consistency, `C`）中做出选择；否则（Else, `E`），系统在没有网络分区且正常运行的情况下，必须在延迟（Latency, `L`）和一致性（Consistency, `C`）之间做出选择。

BASE（Basically Available, Soft State, Eventually Consistent）：Dan Pritchett 在论文 [Base: An Acid Alternative
](https://queue.acm.org/detail.cfm?id=1394128) 提出，BASE 是基本可用、软状态、最终一致的简写。指出存在网络分区的情况，为了高可用，可以暂时牺牲强一致，选择更弱的最终一致性。如经典的缓存一致性问题解决方案 [Cache-Aside Pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside) 就是采用的 BASE。

## 4.4. Consistency Model

> 线性一致性（Linearizable Consistency or Linearizability）

也称为强一致性（Strong Consistency），严格一致性（Strict Consistency），原子一致性（Atomic Consistency），立即一致性（Immediate Consistency）或者外部一致性（External Consistency）。

严格定义：给定一个执行的历史，执行历史根据并发操作可以拓展为多个顺序历史（Sequential History），只要从中找到一个合法的历史，就说明该执行历史是线性一致的。

线性一致性指的就是 CAP 定理中的一致性，也是最强的一致性模型，往往需要通过共识算法来实现，包括如何选取领导者，如何处理重复请求等；实现线性一致性需要花费很大的代价，同步原语和原子变量等都会增加系统开销。

> 顺序一致性（Sequential Consistency）

要求同一个客户端的操作在排序后的先后顺序不变，不同客户端之间的先后顺序是可以任意改变的。顺序一致与线性一致的主要区别在于只关注局部的顺序。现代 CPU 同样也不能保证顺序一致性，大多数情况下都会进行指令重排以达到更好的性能。

> 因果一致性（Causal Consistency）

相同的顺序看到因果相关的操作，而没有因果关系的并发操作可以乱序，如[微信的取号器](https://www.infoq.cn/article/wechat-serial-number-generator-architecture)设计，使用全局唯一单调递增的用户 ID 来确认评论的顺序，每条评论的 ID 都比已经见过的全局 ID 要大，确保因果关系。

## 4.5. Isolation Level

ANSI SQL-92 标准定义了 4 种数据隔离的级别：

- 脏写（Dirty Write）：一个事务覆盖了另一个还没提交事务的写入的值。会破坏完整性约束，大多数场景下都应该避免脏写。
- 脏读（Dirty Read）：一个事务读到了另一个还没提交的事务已经写入的值。
- 不可重复读（Non-Repeatable Read）：查询一个值两次，但是两次查询的返回不同，也称为模糊读（Ruzzy Read）。
- 幻读（Phantom Read）：一个事务进行条件查询时，另一个事务在中间插入或者删除了某些数据，即读到的数据变多了或者变少了。

此外还有一些异常情况：

- 更新丢失（Lost Update）：指两个事务同时更新一个数值，最后两个更新只有一个能生效。
- 读偏斜（Read Skew）：读到了数据一致性约束被破坏的数据，一般指的应用层面，即 ACID 的 C 不满足。
- 写偏斜（Write Skew）：两个事务读到了相同的数据集，但是各自修改了不相关的数据集，导致一致性被破坏。

|          | 脏写 | 脏读 | 不可重复读 | 幻读 | 更新丢失 | 读偏斜 | 写偏斜 |
| :------: | :--: | :--: | :--------: | :--: | :------: | :----: | :----: |
| 读未提交 |  ❌  |  ✅  |     ✅     |  ✅  |    ✅    |   ✅   |   ✅   |
| 读已提交 |  ❌  |  ❌  |     ✅     |  ✅  |    ✅    |   ✅   |   ✅   |
| 可重复读 |  ❌  |  ❌  |     ❌     |  ✅  |    ❌    |   ❌   |   ❌   |
|  串行化  |  ❌  |  ❌  |     ❌     |  ❌  |    ❌    |   ❌   |   ❌   |

_这里的表格强依赖于具体实现，因数据库而异。_

需要说明的是，一致性模型和数据库的隔离模型主要区别在于，一致性模型一般用于单个对象，隔离级别通常设计多个操作的对象（并发场景）。

# 5. Distributed Consensus

一个共识问题可以描述为：假设系统有 n 个节点，每个节点相互通信，设计一种逻辑，保证出现故障后仍然能够协商出某个不可以撤销的最终决定值，《[Distributed Systems: An Algorithmic Approach](https://jagdishkapadnis.files.wordpress.com/2018/08/santosh-kumar-distributed-systems-algorithmic-approach-information-812.pdf)》一书提出，共识算法应该满足如下三个性质：

1. 终止性（Termination）：所有正确的节点都会认同某一个值
2. 协定性（Agreement）：所有争取的进程认同的值都是同一个值
3. 完整性（Integrity）或有效性（Validity）：正确的节点倡议某个值 V，则所有的正确的节点都应该接受这个 V。

在分布式系统中，对于不可靠的网络、进程、时钟等问题，可归结为如下故障模型（Failure Models）表格

| Type                                                      | Description of server’s behavior                                                                              |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Crash failure                                             | Halts, but is working correctly until it halts                                                                |
| Omission failure(Receive omission Send omission )         | 1.Fails to respond to incoming requests; 2.Fails to receive incoming messages; 3.Fails to send messages       |
| Timing failure                                            | Response lies outside a specified time interval                                                               |
| Response failure (Value failure State-transition failure) | 1. Response is incorrect; 2. The value of the response is wrong; 3. Deviates from the correct flow of control |
| Arbitrary failure                                         | May produce arbitrary responses at arbitrary times                                                            |

为了保证故障恢复，常采用一种复制状态机模型（Replicated State Machines）也称状态机复制（State Machine Replication, SMR）。为了实现复制状态机，通常使用多副本的日志（Replicated Log）系统，即多个进程看到的日志的顺序和内容都相同，那么他们的状态应该也能够相同，得到相同的输出。

实现复制状态机的共识模型能够解决下述问题：

1. 网络：尽管在丢包、乱序、重复和延迟的场景下，也能确保返回正确的结果
2. 时钟：状态机不再依赖于时钟
3. 可用性：只要过半节点正常，便能保证集群完全可用，也可以容忍低于半数节点的故障。

此外，还能解决分布式系统的以下问题：

1. 互斥（Mutual Exclusion）：决定哪个进程优先访问临界资源，实现分布式锁等。
2. 选主（Leader Election）：在故障时能够正常切换，在选出新领导上达成共识。
3. 原子提交（Atomic Commit）：对于跨节点或跨分区的数据库，能够让事务在某些方面提交成功，某些方面失败。

| Term              | Description                                                             | Example                                                                      |
| ----------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Fault prevention  | Prevent the occurrence of a fault                                       | Don’t hire sloppy programmers                                                |
| Fault tolerance   | Build a component such that it can mask the occurrence of a fault       | Build each component by two independent programmers                          |
| Fault removal     | Reduce the presence, number, or seriousness of a fault                  | Get rid of sloppy programmers                                                |
| Fault forecasting | Estimate current presence, future incidence, and consequences of faults | Estimate how a recruiter is doing when it comes to hiring sloppy programmers |

## 5.1. FLP Impossibility

MICHAEL J. FISCHER, NANCY A. LYNCH 和 MICHAEL S. PATERSON 三个人发表的论文 [Impossibility of Distributed Consensus with One Faulty Process](https://groups.csail.mit.edu/tds/papers/Lynch/jacm85.pdf)，证明了在一个完全异步的系统中（进程可能很慢响应，无法分辨是速度很慢还是已经崩溃），即便只有一个节点发生了故障，也不存在一个算法使得系统达成共识。换句话说，如果系统的节点在宕机后无法恢复，那么不存在任何一种分布式协议可以达成共识。

换一种类似于 CAP 定理的说法，即我们不可能在完全异步系统中同时满足安全性（Safety，所有正确的节点都认可同一个值）、活性（Liveness，最终认可一个确定值）和容错性（Fault Tolerance）。实际上，我们必须放宽对异步网络的假设绕过 FLP 不可能定理，找到工程最优解。常见的方案有三种：故障屏蔽（Fault Masking）、故障检测（Failure Detectors）、随机算法（Non-Determinism）。

> 故障屏蔽（Fault Masking）

将 FLP 不可能描述中的异步系统，转变为同步系统，即假设故障的进程最终一定能够恢复，并且找到一种重新加入到系统的方式。这样如果某个节点没有受到消息，便允许长时间的等待，直到收到期望的消息。

自动重启的进程可以采用持久化的方案，如在 2PC 协议中，添加持久化的存储，让进程能够恢复到原来的状态。

> 使用故障检测器（Failure Detectors）

通过某种故障检测器来判断进程是否发生了异常，其中 Tushar Deepak Chandra、Vassos Hadzilacos 和 Sam Toueg 的论文 [The Weakest Failure Detector for Solving Consensus\*](https://dl.acm.org/doi/pdf/10.1145/135419.135451#:~:text=Thus%2C%20OVV%20is%20indeed%20the,a%20majority%20of%20correct%20processes.) 提出了故障检测器应该满足的两个属性

- 完全性（Completeness）：每个故障的进程都应该被一个正确的进程怀疑。
- 精确性（Accuracy）：正确的进程不应该被其他进程怀疑。

上述条件不一定要彻底实现，即便使用不完美的故障检测器，在通信可靠的情况下，失效的节点不超过 N/2 ，依然能使用来解决共识问题，即最终弱故障检测器（Eventually Weakly Failure Detector），应该满足如下两个性质。

- 最终弱完全性（Eventually Weakly Complete）：每个故障的进程都会被一些正确的进程检测到
- 最终弱精确性（Eventually Weakly Accurate）：一段时间后，正确的进程不会被其他进程怀疑

> 随机算法（Non-Determinism）

通过使用随机算法，使得拜占庭问题中的“叛徒”不能有效阻碍系统达成共识。如区块链应用中，基于最快运算结果节点而达成的共识，如 BitCoin 采用的 [PoW](https://github.com/bitcoin/bitcoin/blob/e9262ea32a6e1d364fb7974844fadc36f931f8c6/src/pow.cpp)（Proof of Work）达成的共识；以及 Ethereum、DASH、NEO 使用的 [PoS](https://www.mckinsey.com/featured-insights/mckinsey-explainers/what-is-proof-of-stake)（Proof of Stake）达成的共识等。当然，对于攻击者，囤积 50% 以上算力也可以发动 PoW 的女巫攻击（Sybil Attack），来击退网络上的大部分节点。

## 5.2. Paxos

Danny Dolev 和 H. Raymond Strong 发表的论文 [Authenticated algorithms for byzantine agreement](https://www.csa.iisc.ac.in/~arpita/BroadcastBAReadingGroup/DS83.pdf) 提出了 Dolev-Strong 算法：在同步系统中，不超过 F 个进程发生故障，且错误的进程数量 F 小于总进程数 N，则经过 F+1 论消息传递后，一定能达成共识。生产环境中大多数共识算法都是基于同步实现，云服务环境在企业的数据中心也基本无需考虑拜占庭容错。

Paxos 算法是 Lamport 在论文 [The Part-Time Parliament](https://lamport.azurewebsites.net/pubs/lamport-paxos.pdf) 提出的共识算法。并最后重写了一个更加简短的论文 [Paxos Made Simple](https://lamport.azurewebsites.net/pubs/paxos-simple.pdf)。

在 Paxos 岛上，每个议员都是分布式系统的节点，每个议员都会进行提案（Proposal）对应分布式系统的状态，包括提案编号（Proposal Number or Ballot）和提案值（Proposal Value）。

每个议员都会通过消息传递不断提出提案，超过半数的节点同意，则最终使整个系统接受同一个提案，也称提案批准（Chosen）。一般来说 Paxos 算法有三个状态：

- 提议者（Proposer）：提议者受到客户端的请求，则提出提案，试图让接受者接受并且在冲突时刻进行协调
- 接受者（Acceptor）：也称为投票者（Voter），即接受或拒绝提案，超过半数接受则为批准。
- 学习者（Learner）：学习者只能学习被批准的提案，不能参与提案的决议，客户端如果收到了接受者的同意，则学习者可以学习到提案值。

> Basic Paxos

Basic Paxos 只决议出一个共识的值，主要分为两个阶段，每个阶段分 ab 两个部分，记作 1a, 1b, 2a, 2b（其中 a, b 分别代表请求和相应两个阶段），下用 [TLA+](https://github.com/tlaplus/tlaplus) 对 Paxos 算法进行简单描述。

Phase1a，也称为 Prepare 阶段，发送一个类型为 1a 的消息，其中 ballot 标记为 b。

```tla+
Phase1a(b) == /\ Send([type |-> "1a", bal |-> b])
              /\ UNCHANGED <<maxBal, maxVBal, maxVal>>
```

Phase1b，也称为 Promise 阶段，接受者对受到的 Prepare 消息进行判断

- 如果 1a 消息的提案编号大于自己的，则返回 1b 消息，保证不会再接收编号小于当前 ballot 的提案；如果接受者已经接收了更早的提案号，则会响应前一次的 ballot 给提议者。
- 否则，忽略这个请求（也可以发送一个拒绝的响应）。

```tla+
Phase1b(a) == /\ \E m \in msgs :
                  /\ m.type = "1a"
                  /\ m.bal > maxBal[a]
                  /\ maxBal' = [maxBal EXCEPT ![a] = m.bal]
                  /\ Send([type |-> "1b", acc |-> a, bal |-> m.bal,
                            mbal |-> maxVBal[a], mval |-> maxVal[a]])
              /\ UNCHANGED <<maxVBal, maxVal>>
```

Phase2a，也称为 Accept 或者 Propose 阶段，提议者收到过半数的响应后，提议者向多数派接受者发送 2a 请求，并且告诉他们 ballot 和 value。

```tla+
Phase2a(b, v) == /\ ~ \E m \in msgs : m.type = "2a" /\ m.bal = b
                 /\ \E Q \in Quorum :
                        LET Q1b == {m \in msgs : /\ m.type = "1b"
                                                 /\ m.acc \in Q
                                                 /\ m.bal = b}
                            Q1bv == {m \in Q1b : m.mbal \geq 0}
                        IN  /\ \A a \in Q : \E m \in Q1b : m.acc = a
                            /\ \/ Q1bv = {}
                            \/ \E m \in Q1bv :
                                    /\ m.mval = v
                                    /\ \A mm \in Q1bv : m.mbal \geq mm.mbal
                 /\ Send([type |-> "2a", bal |-> b, val |-> v])
                 /\ UNCHANGED <<maxBal, maxVBal, maxVal>>
```

Phase2b，也称为 Accepted 阶段，接受者收到 2a 请求后，如果没有另外承诺比当前 ballot 更大的提案，则接受该提案，更新承诺的提案编号。

```tla+
Phase2b(a) == \E m \in msgs : /\ m.type = "2a"
                              /\ m.bal \geq maxBal[a]
                              /\ maxBal' = [maxBal EXCEPT ![a] = m.bal]
                              /\ maxVBal' = [maxVBal EXCEPT ![a] = m.bal]
                              /\ maxVal' = [maxVal EXCEPT ![a] = m.val]
                              /\ Send([type |-> "2b", acc |-> a,
                                       bal |-> m.bal, val |-> m.val])
```

FLP 不可能定理对于 Paxos 也生效，很可能多个节点的 Prepare 消息源源不断，以至于谁都不能接受新的提案（活锁问题）。可以通过引入随机时间解决。

## 5.3. Raft

斯坦福大学的 Diego Ongaro 和 John Ousterhout 发表的论文 [In Search of an Understandable Consensus Algorithm
(Extended Version)](https://raft.github.io/raft.pdf)，提出的 Raft 算法，也可以理解为（R{eliable|eplicated|edundant} And Fault-Tolerant）。

Raft 算法所运行的系统模型基于以下假设：

- 服务器可能宕机、停止运行，过段时间恢复，但不存在拜占庭故障，节点行为非恶意。
- 消息可能丢失，乱序，重复；可能有网络分区，并在一段时间后恢复。

Raft 算法的服务器中任意服务器只能存在以下三个状态之一。

```go
const (
    Follower = iota // 跟随者，完全被动处理请求，不主动发送 RPC
    Candidate       // 候选者，是处于领导者和跟随者的中间状态
    Leader          // 领导者，负责处理所有客户请求和日志复制
)
```

以下是使用 TLA+ 对算法的描述，对应的代码片段来源于 https://github.com/ongardie/raft.tla，遵循 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by/4.0/) 协议。

当节点在超时时间没有收到任期更大的 RPC 请求，则认为当前 Leader 宕机，该节点会更改自己的任期，开始竞选时，设置当前状态为 Candiate，发起索要投票的请求。
当节点收到了半数以上选票时，则可以当选为 Leader。

```tla+
\* Server i times out and starts a new election.
Timeout(i) == /\ state[i] \in {Follower, Candidate}
              /\ state' = [state EXCEPT ![i] = Candidate]
              /\ currentTerm' = [currentTerm EXCEPT ![i] = currentTerm[i] + 1]
              \* Most implementations would probably just set the local vote
              \* atomically, but messaging localhost for it is weaker.
              /\ votedFor' = [votedFor EXCEPT ![i] = Nil]
              /\ votesResponded' = [votesResponded EXCEPT ![i] = {}]
              /\ votesGranted'   = [votesGranted EXCEPT ![i] = {}]
              /\ voterLog'       = [voterLog EXCEPT ![i] = [j \in {} |-> <<>>]]
              /\ UNCHANGED <<messages, leaderVars, logVars>>

\* Candidate i sends j a RequestVote request.
RequestVote(i, j) == /\ state[i] = Candidate
                     /\ j \notin votesResponded[i]
                     /\ Send([mtype         |-> RequestVoteRequest,
                             mterm         |-> currentTerm[i],
                             mlastLogTerm  |-> LastTerm(log[i]),
                             mlastLogIndex |-> Len(log[i]),
                             msource       |-> i,
                             mdest         |-> j])
                     /\ UNCHANGED <<serverVars, candidateVars, leaderVars, logVars>>

\* Candidate i transitions to leader.
BecomeLeader(i) ==
    /\ state[i] = Candidate
    /\ votesGranted[i] \in Quorum
    /\ state'      = [state EXCEPT ![i] = Leader]
    /\ nextIndex'  = [nextIndex EXCEPT ![i] =
                         [j \in Server |-> Len(log[i]) + 1]]
    /\ matchIndex' = [matchIndex EXCEPT ![i] =
                         [j \in Server |-> 0]]
    /\ elections'  = elections \cup
                         {[eterm     |-> currentTerm[i],
                           eleader   |-> i,
                           elog      |-> log[i],
                           evotes    |-> votesGranted[i],
                           evoterLog |-> voterLog[i]]}
    /\ UNCHANGED <<messages, currentTerm, votedFor, candidateVars, logVars>>
```

Raft 算法通过索引和任期号唯一标识一条日志记录，通过 AppendEntries 来复制日志。

如果两个节点的日志在相同的索引位置上的任期号相同，则认为是一样的命令；如果当前的日志被提交，则之前的日志都判定为已提交。

```tla+
\* Leader i sends j an AppendEntries request containing up to 1 entry.
\* While implementations may want to send more than 1 at a time, this spec uses
\* just 1 because it minimizes atomic regions without loss of generality.
AppendEntries(i, j) ==
    /\ i /= j
    /\ state[i] = Leader
    /\ LET prevLogIndex == nextIndex[i][j] - 1
           prevLogTerm == IF prevLogIndex > 0 THEN
                              log[i][prevLogIndex].term
                          ELSE
                              0
           \* Send up to 1 entry, constrained by the end of the log.
           lastEntry == Min({Len(log[i]), nextIndex[i][j]})
           entries == SubSeq(log[i], nextIndex[i][j], lastEntry)
       IN Send([mtype          |-> AppendEntriesRequest,
                mterm          |-> currentTerm[i],
                mprevLogIndex  |-> prevLogIndex,
                mprevLogTerm   |-> prevLogTerm,
                mentries       |-> entries,
                \* mlog is used as a history variable for the proof.
                \* It would not exist in a real implementation.
                mlog           |-> log[i],
                mcommitIndex   |-> Min({commitIndex[i], lastEntry}),
                msource        |-> i,
                mdest          |-> j])
    /\ UNCHANGED <<serverVars, candidateVars, leaderVars, logVars>>
```

> Paxos vs Raft

Heidi Howard 和 Richard Mortier 发表了论文 [Paxos vs Raft: Have we reached consensus on distributed consensus?](https://arxiv.org/pdf/2004.05074.pdf) 比较了两者的区别与联系。当然，Chubby 的作者 Mike Burrows 也表明，[There is only one consensus protocol, and that’s Paxos](https://medium.datadriveninvestor.com/from-distributed-consensus-algorithms-to-the-blockchain-consensus-mechanism-75ee036abb65)（所有的共识算法本质都是 Paxos）

首先，两个算法的共同点在于：

- 只有一个领导者，接受所有写请求，并且把日志发送给追随者
- 多数派复制了日志后，则该日志永久生效并作用于所有状态机
- 如果领导者失败了，多数派会重新选举出一个新的领导者

Raft 相比 Paxos 算法也存在诸多优点。Raft 优势在于：

- 表现形式：Raft 更容易学习和理解，并且给出了相关的实现逻辑
- 简单性：Raft 按顺序提交日志，而 Paxos 不保证按顺序，需要额外的协议来实现。而且 Raft 的所有日志都有相同的索引任期和命令。
- 高效的选举算法：Raft 使用了更加高效率的选举算法，只需要简单比较 id 即可判断谁胜出。

按照 Heidi Howard 论文中的说法，实际上两者相差非常小，很多场景下的优化都是相通的。上交 IPADS 也发表了论文 [On the parallels between Paxos and Raft, and how to port optimizations](https://arxiv.org/pdf/1905.10786.pdf)，表示近年来 Raft 算法已经成为了共识算法的优先选择。

## 5.4. PBFT

PBFT（[Piratical Byzantine Fault Tolerance](https://pmg.csail.mit.edu/papers/osdi99.pdf)）是由 Miguel Castro 和 Barbara Liskov 提出的一种实用的拜占庭容错算法，也算是一种 Paxos 算法的一种变体，也称为 Byzantine Paxos 算法。。

同步环境下，容错的要求是 N >= 3F + 1（其中 F 表示故障节点，N 表示总进程数），虽然存在拜占庭将军存在的解答，但是需要很高的复杂度 $O(N^F)$。而 PBFT 只需要 $O(N^2)$ 的信息交换量。

PBFT 算法的核心思想是通过一个三阶段的消息交互过程来达成共识。具体来说，每个节点在提出一个新的交易或者区块后，会把这个请求发送给其他节点。然后，节点们会经过预准备、准备、提交三个阶段的消息交互，来达成共识并将这个交易或者区块记录到区块链上。

由于其每个节点都需要经过许可（Permissioned）才能加入系统，这种区块链也称为许可链（Permissioned Blockchain）。被用于权益证明（Proof of Stake, POS）算法中，避免了节点恶意行为，也不需要挖矿浪费电力。

# 6. Distributed Transactions

> Atomic Commit Protocol, ACP

分布式事务的原子性通过原子提交协议（Atomic Commit Protocol, ACP）来实现，一般来说需要满足以下三个特性：

- 协定性（Agreement）：所有进程都决议出同一个值，即所有进程要么同时提交，要么同时回滚
- 有效性（Validity）：所有进程都提交且没有异常，则最终整个系统都要提交事务，反之系统将终止事务
- 终止性（Termination）：又分为弱终止（Weak Termination）条件，即没有故障发生时，则所有进程最终都会作出决定；强终止（Strong Termination）条件也称非阻塞（Non-Blocking）条件，指的是，只有没有发生故障的那些进程最终才会作出决议。

## 6.1. 2PC

两阶段提交（Two-Phase Commit，2PC）有两个阶段组成，是最经典的 ACP 协议。PingCAP 联合创始人黄东旭在演讲中也表示，[所有的分布式事务本质都是 2PC](https://www.youtube.com/watch?v=xAiuLJtCZOg&t=21s)。

2PC 的第一阶段称为准备阶段（Prepare Phase）或者投票阶段（Vote Phase）。

```go
// 第一阶段：协调者向所有参与者发送请求
func (c *CoordinatorNode) Phase1() bool {
    // 向所有参与者发送请求，这个操作可以并行处理
    for _, p := range c.Participants {
        if !p.Prepare() {
            // 如果有任何一个参与者返回失败，则放弃本次事务
            c.Abort()
            return false
        }
    }
    // 所有参与者都返回成功，则进入第二阶段
    return true
}

// 参与者节点处理请求
func (p *ParticipantNode) Prepare() (ok bool) {
    // 处理协调者的请求，检查所需条件以及资源，并返回响应结果
    // 如果处理成功，则返回 true，否则返回 false
    return
}
```

第二阶段称为提交阶段（Commit Phase），要求上一阶段的所有参与者都回复“是”，则可以向所有参与者发送消息，表示本次提交，只要有一个参与者回复了“否”，则向所有参与者发送终止。

```go
// 第二阶段：协调者根据参与者的响应做出决策
func (c *CoordinatorNode) Phase2() bool {
    // 统计所有参与者的决策结果
    trueCount := 0
    falseCount := 0
    for _, p := range c.Participants {
        if p.Decision() {
            trueCount++
        } else {
            falseCount++
        }
    }
    // 如果所有参与者都已提交，则本次事务成功
    if trueCount == len(c.Participants) {
        c.Commit()
        return true
    }
    // 如果有任何一个参与者已回滚，则放弃本次事务
    if falseCount > 0 {
        c.Abort()
        return false
    }
    // 如果有参与者尚未提交或回滚，则等待下一次协调
    return false
}
```

所有参与者和协调者都应该把事务相关的信息持久化，并且所有修改操作都应该实现 WAL。

实际上 2PC 协议还存在诸多问题：

1. 阻塞问题：在第二阶段中，如果协调者节点挂掉或者网络出现故障，参与者节点会一直等待，导致整个系统阻塞。
2. 单点故障问题：在第一阶段中，如果协调者节点挂掉，需要选举新的协调者节点来继续进行事务的处理，但是选举过程本身也可能出现故障，从而导致整个系统不可用。
3. 数据一致性问题：在第二阶段中，如果有参与者节点出现故障，导致它无法提交或回滚，会导致数据出现不一致的情况。
4. 性能问题：由于 2PC 需要进行两轮消息交互，因此它的性能比较低，尤其是在参与者节点较多的情况下，会导致消息传递的延迟和负载增加，进而影响整个系统的性能。
5. 可用性问题：由于 2PC 需要协调者节点和参与者节点之间的密切协作，因此在分布式系统中，如果协调者节点或参与者节点的数量较多，会导致系统的可用性降低。

CockroachDB 提出了一种 [Parallel Commits](https://www.cockroachlabs.com/blog/parallel-commits/) 的优化思路，在第一阶段，Coordinator 已经知道了是否应该提交事务，这个状态可以将第一阶段的返回直接交给客户端，并将第一阶段的节点状态写进全局事务的日志中，问题发生时，便可以查询其他节点处理异常情况。

## 6.2. 3PC

3PC 主要用于解决 2PC 的提交协议阻塞性这一缺点而设计的，参与者不知道第一阶段的结果，3PC 则在 2PC 的两个阶段中间添加了一个预提交阶段（Prepare to Commit, Pre-Commit），这一阶段，协调者将第一轮的投票结果发送给所有参与者，这样如果运行时出现了故障，则可以从剩下的参与者中重新选举出协调者，新的协调者可以重新选择是提交还是终止。

3PC 极易受到网络分区的影响，而且一次事务至少需要 3 次消息往返，增加了事务完成时间。大多数情况下还是选择使用 2PC 协议。

## 6.3. Paxos Commit

James Gray 和 Lamport 共同发表的论文 [Consensus on Transaction Commit](https://lamport.azurewebsites.net/video/consensus-on-transaction-commit.pdf) 提出了 Paxos 提交算法。该算法主要有三个角色

```go
const (
    ResourceManager = iota // 资源管理者，集群中有 N 个资源管理者，每个都代表一组 Paxos 实例的提案发起者
    Leader                 // 领导者，只有一个领导者，用于协调整个算法，由 Paxos 算法选举出来
    Acceptors              // 接受者，与资源管理者共同组成 Paxos 实例，RM 共享所有接受者，2F+1 接受者可以允许 F 个故障
)
```

完整的提交流程如下：

1. 任意一个 RM 提交事务以后，发送 BeginCommit 给 Leader，请求提交该事务
2. Leader 收到消息后，向所有的 RM 发送 Prepare 消息
3. RM 收到 Prepare 消息后，如果条件允许事务提交，则向所有接受者发送带有提案编号与值为 Prepared 消息；反之发送 Aborted 消息；整个这个阶段也称为 Phase 2a 消息。
4. 接受者收到 Phase 2a 消息后，如果没有更大提案编号的消息，则接受该消息，并回复提案编号与值的 Phase 2b 消息；如果已经有了提案编号更大的消息，则拒绝这条消息。
5. 对于每一组 Paxos 实例，Leader 如果收到了 F+1 条同样编号的消息，根据 Paxos 算法，管理会选定这个值。
6. 每一个 Paxos 实例都选择完毕后，Leader 最终确认，如果每个值都是 Prepared，代表一致认为这个值能被提交，Leader 向所有 RM 发送提交消息，RM 收到消息后对事务进行提交。
7. 如果 Leader 发现有一个 RM 的值有一个是 Aborted，即有的 RM 希望终止事务，则领导者向所有 RM 发送中止消息，RM 收到消息后中止事务。

## 6.4. Saga

Hector 和 Kenneth 发表的论文 [SAGAS](https://www.cs.cornell.edu/andru/cs711/2002fa/reading/sagas.pdf) 定义了一种长活事务（Long-Lived Transaction, LLT），其本质由一连串子事务 T1、T2、... Tn 组成，可以与其他事务交错运行，依然能够保证所有事务全部成功或者全部失败，每个子事务 Tx 都对应一个补偿的事务 Cx ，补偿事务在回滚的时候执行。

## 6.5. Percolator

Google 发表的论文 [Large-scale Incremental Processing Using Distributed Transactions and Notifications](https://www.usenix.org/legacy/event/osdi10/tech/full_papers/Peng.pdf) 介绍了 Percolator 的架构设计。Percolator 依赖于一个单点授时，单时间源的授时服务，称为 TSO（Timestamp Oracle），用于给事务分配时间戳，以下是对论文中代码的解释。

```cpp
class Transaction {
    struct Write { Row row; Column col; string value; };
    vector<Write> writes_;
    int start_ts_;

    // 1. 分配分布式开始的时间戳，开始的时间戳决定了该事务看到的版本
    Transaction(): start_ts_(oracle.GetTimestamp()) {}

    // 2. 对于写操作，将操作放入 Buffer，直到提交才一并写入
    void Set(Write w) { writes_.push_back(w); }

    // 2. 对于读操作，按照快照隔离的要求，允许 start_ts_ 后的事务拥有行锁
    bool Get(Row row, Column c, string *value) {
        while (true) {
            bigtable::Txn T = bigtable::StartRowTransaction(row);
            // Check for locks that signal concurrent writes.
            if (T.Read(row, c + "lock", [0, start_ts_])) {
                // There is a pending lock; try to clean it and wait
                BackoffAndMaybeCleanupLock(row, c);
                continue;
            }

            // Find the latest write below our start timestamp.
            latest_write = T.Read(row, c + "write", [0, start_ts_]);
            if (!latest_write.found()) return false; // no data
            int data_ts = latest_write.start_timestamp();
            *value = T.Read(row, c + "data", [data_ts, data_ts]);
            return true;
        }
    }

    // 3. 预写（PreWrite）阶段，即 2PC 的第一阶段。
    // 选择一个写操作作为主（Primary）锁，其他操作作为次（Second）锁
    // 理论上，主锁可以随便选，论文中选择了第一个写操作
    // Prewrite tries to lock cell w, returning false in case of conflict.
    bool Prewrite(Write w, Write primary) {
        Column c = w.col;
        // 启动一个 Bigtable 的单行事务
        bigtable::Txn T = bigtable::StartRowTransaction(w.row);

        // 检查当前写操作所涉及的所有 write 元数据信息，如果有其他事务在当前事务之后
        // 即时间戳为 [start, +∞)，如果有，则立即终止当前事务，反之则可以下一步
        // Abort on writes after our start timestamp . . .
        if (T.Read(w.row, c + "write", [start_ts_, ∞])) return false;

        // 检查当前写操作所涉及的 Lock 列，检查是否有其他事务持有当前行的锁
        // 如果已经有锁，Percolator 不会等锁，而是直接终止事务
        // . . . or locks at any timestamp.
        if (T.Read(w.row, c + "lock", [0, ∞])) return false;

        // 顺利通过检查以后，开始更新数据，以开始的时间戳作为 Bigtable 的时间戳
        // 这里的 Write 不会覆盖元数据，而是 Append 操作
        T.Write(w.row, c + "data", start_ts_, w.value);
        // 数据更新以后，获取对应的行锁，以 primary 的 row 和 col 写入 lock 列
        T.Write(w.row, c + "lock", start_ts_,
                {primary.row, primary.col}); // The primary’s location.
        return T.Commit();
    }

    // 4. 提交事务
    bool Commit() {
        Write primary = writes_[0];
        vector<Write> secondaries(writes_.begin() + 1, writes_.end());
        if (!Prewrite(primary, primary)) return false;
        for (Write w : secondaries)
            if (!Prewrite(w, primary))
                return false;

        // 获取提交的时间戳
        int commit_ts = oracle.GetTimestamp();

        // Commit primary first.
        Write p = primary;
        bigtable::Txn T = bigtable::StartRowTransaction(p.row);

        // 对于主锁启动的单行事务，检查事务是否持有 lock 列的锁，如果检查失败，则终止事务
        if (!T.Read(p.row, p.col + "lock", [start_ts_, start_ts_]))
            return false; // aborted while working
        // 如果事务仍然持有锁，以提交时间戳作为 BigTable 的时间戳，让该数据对其他事务可见
        T.Write(p.row, p.col + "write", commit_ts,
                start_ts_); // Pointer to data written at start ts.
        // 释放主锁，检查主锁的写操作是否对其他事务可见，如果失败则终止事务
        T.Erase(p.row, p.col + "lock", commit_ts);
        if (!T.Commit()) return false; // commit point

        // 主锁的写操作提交以后，Percolator 认为整个事务已经完成，进入第二阶段
        // 所有次锁的写操作全都可以更新，这个操作可以异步执行
        // Second phase: write out write records for secondary cells.
        for (Write w : secondaries) {
            bigtable::Write(w.row, w.col + "write", commit ts, start ts);
            bigtable::Erase(w.row, w.col + "lock", commit ts);
        }
        return true;
    }
}; // class Transaction
```

Percolator 优点在于松耦合，但是由于单点授时的服务，并且需要与授时服务通信两次，所以很容易成为性能瓶颈。
