---
title: "[NSDI20] Firecracker: Lightweight Virtualization for Serverless Applications"
date: 2024-05-07T10:52:23+08:00
math: true
slug: "NSDI20"
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

本篇文章来自 Amazon Web Services 的开源项目 firecracker。

传统观点认为，需要在安全性强、开销高的虚拟化和安全性较弱、开销最小的容器技术之间进行选择。为了实现安全性和轻量级的权衡，Firecracker 提供了一种新的虚拟化技术，称为 Virtual Machine Monitor(VMM)，专门应用于 Serverless 场景。

在多租户的场景下往往采用 QEMU/KVM 或者 Xen 的虚拟化技术，如 Kata Containers 采用了 QEMU/KVM，LightVM 采用了 Xen。以上虚拟化技术的缺点是资源占用较大，启动时间较长，而 Firecracker 则专注于 Serverless 场景，提供了一种轻量级的虚拟化技术。

相较于 QEMU，Firecracker 并不会提供 BIOS，没有设备/PCI 的模拟，也没有 VM 迁移，也没法启动任何操作系统内核，较为底层的实现，如附加设备或者 CPU 指令模拟等在典型的五服务器和容器工作负载中并不会使用到，所以也不需要实现。Firecracker 的 process-per-VM 模型也不支虚拟机编排，打包和管理，因为这个功能由更上层的 k8s，docker 和 containerd 实现。

# 隔离方案的选择

AWS Lambda 曾经采用的方案是，为每个用户都创建一个独立的虚拟机，然后每个用户的所有函数都运行在同一个虚拟机上，这样难以实现将工作负载有效打包到到固定资源大小的虚拟机中。同时 Lambda 还需要支持裸的二进制程序，更换 Firecracker 之后不需要重编译。

![Firecracker: Lightweight Virtualization for Serverless Applications-2024-05-07-10-52-42](https://s2.loli.net/2024/05/07/D5hzbUjrwAdOxSW.png)

图 1 展示了容器和虚拟化技术的差异，对于容器(a)，不受信的代码将被 seccomp-bpf 直接限制，同样的也会与其他容器共同与内核交互，如文件系统和页表缓存。在虚拟化中，不可信代码通常允许完全访问 Guest Kernel，允许使用所有内核功能，但明确将 Guest Kernel 视为不可信。硬件虚拟化和 VMM 限制 Guest Kernel 对特权域和主机内核的访问。

# Firecracker VMM

Firecracker VMM 继承自 Google 的 crosvm 同时删去了非常多不必要的代码。

![Firecracker: Lightweight Virtualization for Serverless Applications-2024-05-07-11-25-56](https://s2.loli.net/2024/05/07/ZMAVdmoYUI348vs.png)

图 2 展示了 Lambda 架构的简化视图。调用流量通过 Invoke REST API 到达前端，其中对请求进行身份验证并检查授权，并加载函数元数据。前端是一个横向扩展的无共享队列，任何前端都能够处理任何功能的流量。客户代码的执行发生在 Lambda 工作队列上，但为了提高缓存局部性、实现连接重用并分摊移动和加载客户代码的成本，单个函数的事件被粘性路由到尽可能少的 Worker。

![Firecracker: Lightweight Virtualization for Serverless Applications-2024-05-07-11-28-00](https://s2.loli.net/2024/05/07/29yHK1tQ4mkNLD8.png)

每个 Lambda Worker 提供多个槽，每个槽为函数提供预加载的执行环境。槽仅用于单个函数以及该函数的单个并发调用。当槽可用于某个功能时，工作管理器可以简单地执行其轻量级并发控制协议，并告诉前端该槽可供使用。如果没有可用的槽，无论是因为不存在槽还是因为功能的流量增加而需要额外的槽，工作器管理器调用放置服务来请求为该功能创建新的槽。放置服务反过来优化整个工作队列中单个功能的插槽放置，确保整个队列中 CPU、内存、网络和存储等资源的利用率均匀，并确保每个工作队列上的相关资源分配的潜力被最小化。一旦此优化完成（该任务通常需要不到 20 毫秒），放置服务就会联系工作线程，请求为函数创建一个槽。 Placement 服务使用基于时间的租赁协议将生成的槽租给 Worker Manager，使其能够在固定的时间内做出自主决策。

## 架构设计(以下内容来自于项目文档)

较于 QEMU，firecracker 是其一个替代品，它专门用于安全有效地运行无服务器功能和容器，仅此而已。firecracker 采用 Rust 编写，为客户操作系统提供了一个最小需求的设备模型，同时排除了非必要的功能(只有 5 个仿真设备可用: virtio-net，virtio-block，virtio-vsock，串行控制台和一个最小的键盘控制器，只用于停止 microVM)。这样，再加上一个简化的内核加载过程，就可以实现 < 125ms 的启动时间和 < 5MiB 的内存占用。Fireacker 进程还提供 RESTful 控制 API，处理 microVM 的资源速率限制，并提供 microVM 元数据服务，以便在主机和客户机之间共享配置数据。

![Firecracker Host Integration](https://github.com/firecracker-microvm/firecracker/blob/main/docs/images/firecracker_host_integration.png?raw=true)

当启动 firecracker 后，只有 kvm 运行在内核态，其中网络通过 TAP 与主机连接，同时模拟了主机的块设备与主机进行连接，其中 IMDS 代表 Instance metadata（实例元数据）是有关实例的数据，可用于配置或管理正在运行的实例。实例元数据分为类别，例如，主机名、事件和安全组。

![Firecracker Threat Containment](https://github.com/firecracker-microvm/firecracker/blob/main/docs/images/firecracker_threat_containment.png?raw=true)

每一个 firecracker 进程有且仅有一个 microVM。其中 firecracker 进程运行 API，VMM，vCPU(s)等线程。

从安全性的角度来看，所有 vCPU 线程一旦启动，就被认为正在运行恶意代码; 需要包含这些恶意线程。通过嵌套多个信任区域来实现包容，这些信任区域从最不受信任或最不安全(来宾 vCPU 线程)增加到最受信任或最安全(主机)。这些可信区域被强制实施鞭炮安全方面的屏障隔开。例如，所有出站网络流量数据都由 Fireacker I/O 线程从模拟网络接口复制到后台主机 TAP 设备，并且此时应用 I/O 速率限制。

# 总结

Firecracker 是一种轻量级的虚拟化技术，专门用于 Serverless 场景。在轻量级虚机场景，虚机进程提供了完整的虚拟化层和 Linux 内核（可选），此类的虚机主要包括 Cloud Hypervisor(https://www.cloudhypervisor.org/)、StratoVirt(https://gitee.com/openeuler/stratovirt)、Firecracker(https://firecracker-microvm.github.io) 。microVM 的挑战仍然在于进一步优化性能和密度、构建能够利用基于 MicroVM 的隔离的独特功能的调度程序，以及探索无服务器计算的替代操作系统和编程模型。
