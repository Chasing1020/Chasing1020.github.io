---
title: "[NSDI23] BMC: Accelerating Memcached Using Safe in Kernel Caching and Pre Stack Processing"
date: 2024-05-09T18:15:23+08:00
math: true
slug: "NSDI23"
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
---

# 简介

通过使用 eBPF，实现了与在用户空间中实现的类似功能（例如，消息广播、收集确认的法定人数）以实现 PAXOS 协议的加速。

![Electrode: Accelerating Distributed Protocols with eBPF-2024-05-09-18-21-07](https://s2.loli.net/2024/05/09/ykNxGLhPRo5OvQT.png)

如图 1(a)所示，传统的 PAXOS 的一次执行流程需要实现 14 次网络的请求，采用 eBPF 用以实现每个阶段的性能优化。

对比其他旁路方案：
DPDK 优势：性能好；劣势：缺乏安全性和隔离性，同时对云原生不友好，产生大量的 CPU 轮询周期，与其他环境的兼容性不好。
eBPF 优势：内核安全；劣势：指令数限制，受限循环，静态内存分配。

# 具体实现

## 消息广播

![Electrode: Accelerating Distributed Protocols with eBPF-2024-05-09-18-41-37](https://s2.loli.net/2024/05/09/MJvVSGzR1ATnLrO.png)

传统方案需要实现 N 次 send()调用，随着节点数线性增长。采用 bpf_clone_redirect 显著减少内核运行时间。
考虑现在数据中心的丢包率非常低，实现上只做了超时和重传策略，并没有采用复杂的实现。

## 快速确认

![Electrode: Accelerating Distributed Protocols with eBPF-2024-05-09-18-52-56](https://s2.loli.net/2024/05/09/gxuldtTGEKU9C7B.png)

append only 日志采用 ringbuffer 实现。用户态程序异步拉取。

## 等待过半节点

![Electrode: Accelerating Distributed Protocols with eBPF-2024-05-09-18-56-19](https://s2.loli.net/2024/05/09/Op2IRu4hFX9N5YC.png)

内核过滤大多数非必要的 ACK。同时采用 bitmap 保证每个节点只计数一次。

# 总结

Electrode 保留了使用标准 Linux 网络堆栈的优势（例如，良好的维护、弹性 CPU 扩展、安全性和隔离），同时优化了分布式协议的性能关键操作（例如，广播和等待仲裁）非侵入性的方式。是一个比新颖的 idea，估计后续还有
