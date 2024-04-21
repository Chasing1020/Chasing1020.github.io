---
title: "AKF Availability Cube"
date: 2022-01-03T15:53:45+08:00
lastmod: 2022-01-03T15:53:45+08:00
draft: false
author: "Chasing1020"
comment: true
keywords: []
description: ""
tags: ['Cloud']
categories: ['Note']
image: "AKF-Cube.webp"
---

# AKF Availability Cube

随着业务规模增长，拆解单体应用（monolith），设计成为面向服务架构（Service-oriented architectutre），做成一个个微服务（Micro-service）已经是如今的大趋势。

## Scale Cube Model

从拆分的角度来看，也分成多个可以考虑的维度，其中最常用定义分割服务、定义微服务和扩展产品的模型即是比例立方模型。其中保证可用性的解决方案AKF Availability Cube便是最经典的模型。用于指导有关如何实现高可用性的讨论，以及评估现有系统理论上“设计”可用性的工具。它是关于高可用性设计的两部分系列中的第一部分。 ![](https://akfpartners.com/uploads/blog/Availability_Cube_draft.jpg)

## Measuring Availability

互联网产品一直在“服务始终可用”的追求上尽可能减少成本，从这个角度出发，服务衡量标准测度为追求可用性改进提供了一个起点。

>   Clock is not the best measure

时间对于业务的影响是不相等的，这取决于业务是否处于高峰期；企业的商业术语：收入、成本、利润、投资回报率，都以金钱而非时间作为衡量；基础设施组件的时间作为测度是不准确的，他们并不会捕获程序的异常，尽管服务无法运行。

>    Transactional Metics

-   Rates: 以速度记录，例如登录、添加到购物车、注册、下载、订单等。应用统计过程控制或其他分析方法来建立指示交易速度异常偏差的阈值。
-   Ratios: 预料外的或失败的结果的比例可用于衡量服务质量。对此类比率的分析将建立异常的偏差水平。
-   Patterns: 交易模式可以识别预期的活动，没有预期的模式更改可能表示您的产品或服务存在可用性问题。


## 3-Dimensions of scaling

|  Dimension    |  Description    | 
| ---- | ---- |
| X-Axis | Horizontal Duplication and Cloning of services and data |
| Y-Axis | Functional Decomposition and Segmentation - Microservices (or micro-services) |
| Z-Axis | Service and Data Partitioning along Customer Boundaries - Shards/Pods |


## X-axis scaling

X轴的核心思路在于"cloning/replication"，我们将应用复制，以提高可用性。我们假定整体可用率

$P_{singleton\ availability}=\frac{Total\ Available-Non\ Available}{Total\ Available}$

当添加了多个结点以后，新的可用性概率评估变为

$P_{overall\ availability}=1-(1-P_{singleton\ availability})^n$

但是仅仅做应用复制，也无法解决如下缺点：

-   大量与会话相关的信息，这些信息通常难以分发或需要持久化到服务器

-   每个拷贝需要访问所有的数据，对缓存机制要求很高，数据库很可能成为其中的瓶颈。
-   不会减少日益增长的开发复杂度。

## Y-axis scaling

Y轴通过两个角度进行服务切分。分别是动词（操作流程）和名词（对象类型）：

按动词分割：服务1只负责购买流程，服务2只负责售后流程，服务3只负责广告投放流程

按名词分割：服务1只负责商品信息；服务2只负责用户信息。

微服务的设计核心思路便体现在Y轴，其可以将目标应用划分泳道，限制应用的故障域，将应用故障保持在边界内，不会传播影响外界的服务。

然而，Y轴划分的越细致，越复杂的系统越容易产生“多米诺骨牌”效应，可能导致相邻系统瘫痪，从而导致延迟、停机和/或完全失败。

比较合理的方式是：将服务集成在一个隔离的堆栈或泳道内（托管云或公共云），以避免跨数据中心调用。并同时在X轴角度，复制服务，以便每个数据中心或云实例都拥有所需的一切。

综上，Y轴划分的服务需要在`增加服务数量提高可用性`与`减少服务间通信损失`做出一个Trade off。

## Z-axis scaling

Z轴与X轴很像，区别在于Z轴负责的是数据的子集而不是复制，常见于数据库分片。

对于每一个Z轴的分片，软件本质上是相同的，区别仅仅在于数据，其定义了“爆炸半径”（blast radius, aka Swimlanes or Bulkhead），边界假设在泳道之间不存在同步调用。提高了解决方案的事务可扩展性，同时能够实现故障的隔离。

缓存命中率通常随着较小的数据集而上升，优化了缓存利用率，减少内存使用和I/O。

随着可以使用商品服务器或较小的 IaaS 实例，运营成本通常会下降。

但是另一个角度，Z轴的分片也带来了如下缺点：

-   增加了整体的复杂度。
-   需要实现分片机制，这个机制难以变更，对新的需求不友好。











