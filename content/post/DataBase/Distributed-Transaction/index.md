---
title: "Distributed Transaction"
date: 2022-01-08T15:08:08+08:00
lastmod: 2022-01-08T15:08:08+08:00
draft: false
author: "Chasing1020"
comment: true
keywords: []
description: ""
tags: ['DataBase']
categories: ['Note']
image: "saga.webp"
---
The Eight Fallacies of Distributed Computing by Peter Deutsch.

Essentially everyone, when they first build a distributed application, makes the following eight assumptions. All prove to be false in the long run and all cause big trouble and painful learning experiences.

1.	The network is reliable
2.	Latency is zero
3.	Bandwidth is infinite
4.	The network is secure
5.	Topology doesn't change
6.	There is one administrator
7.	Transport cost is zero
8.	The network is homogeneous


# 1. 2PC

XA规范中定义的分布式事务模型包括四个组成部分：

-   RM（Resource Manager，资源管理器），负责管理分布式系统中的部分数据资源，保障该部分数据的一致性，满足规范要求的数据管理系统均可作为RM参与分布式事务，最典型的应用是数据库，如MySQL、Oracle、SQLServer等均支持该规范
-   TM（Transaction Manager，事务管理器），负责协调跨RM的全局事务的开启、提交和回滚
-   AP（Application Program，应用程序），通过TM定义事务边界，执行全局事务
-   CRM（Communication Resource Managers，通信管理器），负责全局事务过程中的跨节点通信

二阶段提交是一种强一致性的设计。设置一个中心的协调者（Coordinator，也称Transaction Manager，TM）与多个被调度的业务节点参与者（Participant，也称Resource Manager，RM）。

第一阶段（prepare）：

1.   TM记录事务开始日志。
2.   向所有RM发送Prepare消息，等待响应。
3.   每个参与者都执行事务，记录Undo/Redo日志，向TM返回结果，RM并不提交事务。
4.   TM记录准备完成日志。

第二阶段（if commit）：

1.   当事务管理者(TM)确认所有参与者(RM)都ready后，TM记录事务提交日志。
2.   TM向所有RM发送commit命令。
3.   RM提交事务，向TM返回执行结果。
4.   TM记录事务结束日志。

第二阶段（if rollback）：

1.   当事务管理者(TM)确认有任一参与者(RM)失败或超时后，TM记录事务会滚日志。
2.   TM向所有RM发送rollback命令。
3.   RM回滚事务，向TM返回执行结果。
4.   TM记录事务结束日志。

2PC是对业务侵入性较小的强一致性的保证。对于MySQL，XA执行过程中，对对应的资源都要加锁，阻塞其他事务访问。并且TM很容易发生单点故障，此时便会存在数据不一致与不确定性。

# 2. Saga

Saga理论基础来源于Hector & Kenneth 在1987年[发表的论⽂《SAGAS》](https://www.cs.cornell.edu/andru/cs711/2002fa/reading/sagas.pdf)。它把分布式事务看作一组本地分支事务构成的事务链，业务流程中每个参与者都提交本地事务。在执行链中任何一个失败，则反方向进行补偿操作。

<p align="center">
  <img src="https://img.alicdn.com/tfs/TB1Y2kuw7T2gK0jSZFkXXcIQFXa-445-444.png" alt="saga"/>
</p>


	补偿是子事务的提交，对线上其他事务可见，即：已经产生了影响，只能尽可能补偿。

Saga是满足了BASE，并不支持隔离性，可能会发生脏读脏写。吞吐量较高，一阶段提交本地事务，无锁，高性能。事件驱动架构，参与者可异步执行，而且子事务并不一定都需要是DB相关操作。

# 3. TCC

TCC（Try-Confirm-Cancel）理论源于 Pat Helland 在2007年[发表的论文《Life beyond Distributed Transactions:an Apostate’s Opinion》](https://www.ics.uci.edu/~cs223/papers/cidr07p15.pdf)。其将支持把自定义的分支事务纳入到全局事务的管理中

全局事务是由若干分支事务组成的，分支事务要满足2PC模型的要求。

<p align="center">
  <img src="https://img.alicdn.com/tfs/TB14Kguw1H2gK0jSZJnXXaT1FXa-853-482.png" alt="saga"/>
</p>

将TM变成多节点，引入超时补偿的概念，并不会锁住所有资源。

-   Try 阶段：完成所有业务检查，预留必须业务资源。
-   Confirm 阶段：确认执行真正执行业务，只使用 Try 阶段预留的业务资源。一旦异常，发现事务提交标记，重试所有Confirm操作（需要保证幂等性）。
-   Cancel 阶段：取消执行，释放 Try 阶段预留的业务资源。一旦异常，发现事务会滚标记，重试所有Cancel操作（需要保证幂等性）。

TCC满足BASE，相较于2PC，吞吐性、可用性更高。在业务层面保证隔离性。

# 4. AT

AT（Automatic Transaction）模式不依赖参与者对AX事务的支持。

在seata的实现中，Automatic (Branch) Transaction Mode对应AT模式，Manual (Branch) Transaction Mode对应TCC模式。

-   第一阶段（prepare）：在本地事务中，一并提交业务数据更新和相应回滚日志记录。
-   第二阶段（commit）：马上成功结束，**自动** 异步批量清理回滚日志。
-   第二阶段（rollback）：通过回滚日志，**自动** 生成补偿操作，完成数据回滚。

隔离级别为RU，未提交的事务数据也会被其他事务读到。

# *. Conclusion

|              | XA                                                           | AT                                | TCC                                                          | Saga                                                     | 本地/事务消息方案                                 |
| ------------ | ------------------------------------------------------------ | --------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------- | ------------------------------------------------- |
| **一致性**   | 强一致                                                       | 强一致                            | 最终一致                                                     | 最终一致                                                 | 最终一致                                          |
| **隔离性**   | 支持                                                         | 读未提交                          | 支持（通过业务层面在Try阶段的资源锁定实现隔离）              | **不支持**                                               | **不支持**                                        |
| **性能**     | 全局锁，性能差                                               | 吞吐量差，优于XA                  | Try操作使资源锁定可以尽早释放，系统吞吐量高                  | 吞吐量高                                                 | 吞吐量高                                          |
| **业务侵入** | 无侵入                                                       | 无侵入                            | 较高                                                         | 较低                                                     | 较低                                              |
| **优点**     | 强一致性保证 业务无侵入                                      | 业务无侵入 适用于短事务           | 由业务层面来保证隔离性 性能相对较高，吞吐量高                | 性能相对较高，吞吐量高 对业务侵入较少                    | 对业务侵入较少 通过消息中间件解耦，下游事务异步化 |
| **缺点**     | 需要XA规范。存在同步阻塞、单点故障、数据不一致、不确定性等可用性问题 | 事务隔离级别为脏读 不适用于长事务 | 业务改造成本较高，业务需分拆为Try/Confirm/Cancel三个操作 引入中间态，业务复杂，不利于迭代维护。 | 不具备隔离性，易出现脏读，脏写问题，可能造成脏写无法回滚 | 不具备隔离性 不具备事务回滚，只能重试             |
| **适用业务** | 强一致性 短事务 一般可用性                                   | 强一致性 短事务 一般可用性        | 最终一致性 短事务 强可用性                                   | 最终一致性 长事务 强可用性 不要求隔离性                  |                                                   |
| **备注**     |                                                              |                                   | 需要注意处理空回滚，重复提交，悬挂等异常情况                 | 需要注意处理空补偿，重复提交，悬挂等异常情况             |                                                   |
