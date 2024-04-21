---
title: "Kubernetes"
date: 2021-10-29T15:40:00+08:00
lastmod: 2021-10-29T15:40:00+08:00
draft: false
author: "Chasing1020"
comment: true
keywords: []
description: ""
tags: ['Cloud']
categories: ['Note']
image: "Kubernetes.webp"
---

# Kubernetes

场景：管理容器化的工作负载和服务，可促进声明式配置和自动化

功能：**服务发现和负载均衡**、**存储编排**、**自动部署和回滚**、**自动完成装箱计算**、**自我修复**、**密钥与配置管理**

## 1. Component

一个 Kubernetes 集群由一组被称作节点的机器组成。这些节点上运行 Kubernetes 所管理的容器化应用。集群具有至少一个工作节点。

工作节点托管作为应用负载的组件的 Pod 。控制平面管理集群中的工作节点和 Pod 。 为集群提供故障转移和高可用性，这些控制平面一般跨多主机运行，集群跨多个节点运行。

![Kubernetes 组件](https://d33wubrfki0l68.cloudfront.net/2475489eaf20163ec0f54ddc1d92aa8d4c87c96b/e7c81/images/docs/components-of-kubernetes.svg)

### 1.1. Control Plane Components

控制面板用于控制整个集群的工作，其包含多个组件，可以运行在单个主机上或者通过副本分别不是在多个主节点用以确保高可用

#### kube-apiserver

API 服务器是 Kubernetes 控制面的组件， 该组件公开了 Kubernetes API。 API 服务器是 Kubernetes 控制面的前端。

#### etcd

etcd 是兼具一致性和高可用性的键值数据库，可以作为保存 Kubernetes 所有集群数据的后台数据库。

#### kube-scheduler 

控制平面组件，负责监视新创建的、未指定运行节点（node）的 Pods，选择节点让 Pod 在上面运行。

#### kube-controller-manager

从逻辑上讲，每个控制器都是一个单独的进程， 但是为了降低复杂性，它们都被编译到同一个可执行文件，并在一个进程中运行。

- 节点控制器（Node Controller）: 负责在节点出现故障时进行通知和响应
- 任务控制器（Job controller）: 监测代表一次性任务的 Job 对象，然后创建 Pods 来运行这些任务直至完成
- 端点控制器（Endpoints Controller）: 填充端点(Endpoints)对象(即加入 Service 与 Pod)
- 服务帐户和令牌控制器（Service Account & Token Controllers）: 为新的命名空间创建默认帐户和 API 访问令牌

#### cloud-controller-manager
云控制器管理器是指嵌入特定云的控制逻辑的 控制平面组件。 云控制器管理器使得你可以将你的集群连接到云提供商的 API 之上， 并将与该云平台交互的组件同与你的集群交互的组件分离开来。
cloud-controller-manager 仅运行特定于云平台的控制回路。 如果你在自己的环境中运行 Kubernetes，或者在本地计算机中运行学习环境， 所部署的环境中不需要云控制器管理器。

### 1.2. Node Component

#### kubelet

一个在集群中每个[节点（node）](https://kubernetes.io/zh/docs/concepts/architecture/nodes/)上运行的代理。 它保证[容器（containers）](https://kubernetes.io/zh/docs/concepts/overview/what-is-kubernetes/#why-containers)都 运行在 [Pod](https://kubernetes.io/docs/concepts/workloads/pods/pod-overview/) 中。

kubelet 接收一组通过各类机制提供给它的 PodSpecs，确保这些 PodSpecs 中描述的容器处于运行状态且健康。 kubelet 不会管理不是由 Kubernetes 创建的容器。

#### kube-proxy

[kube-proxy](https://kubernetes.io/zh/docs/reference/command-line-tools-reference/kube-proxy/) 是集群中每个节点上运行的网络代理， 实现 Kubernetes [服务（Service）](https://kubernetes.io/zh/docs/concepts/services-networking/service/) 概念的一部分，负责组件之间的负载均衡网络流量。

kube-proxy 维护节点上的网络规则。这些网络规则允许从集群内部或外部的网络会话与 Pod 进行网络通信。

#### Container Runtime

容器运行环境是负责运行容器的软件。

Kubernetes 支持多个容器运行环境: [Docker](https://kubernetes.io/zh/docs/reference/kubectl/docker-cli-to-kubectl/)、 [containerd](https://containerd.io/docs/)、[CRI-O](https://cri-o.io/#what-is-cri-o) 以及任何实现 [Kubernetes CRI (容器运行环境接口)](https://github.com/kubernetes/community/blob/master/contributors/devel/sig-node/container-runtime-interface.md)。

### 1.3. Objects

在 Kubernetes 系统中，*Kubernetes 对象* 是持久化的实体。 Kubernetes 使用这些实体去表示整个集群的状态。特别地，它们描述了如下信息：

-   哪些容器化应用在运行（以及在哪些节点上）
-   可以被应用使用的资源
-   关于应用运行时表现的策略，比如重启策略、升级策略，以及容错策略

## 2. Minikube Quick Start

```shell
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

minikube start

minikube dashboard
```

在浏览器出现minikube仪表盘即安装成功。

使用 `kubectl create` 命令创建管理 Pod 的 Deployment。该 Pod 根据提供的 Docker 镜像运行 Container。

```shell
kubectl create deployment hello-node --image=k8s.gcr.io/echoserver:1.4
```

查看 Deployment：

```shell
kubectl get deployments
```

查看 Pod：

```shell
kubectl get pods
```

输出结果类似于这样：

```
NAME                          READY     STATUS    RESTARTS   AGE
hello-node-5f76cf6ccf-br9b5   1/1       Running   0          1m
```

每当运行kubectl时，即像RESTAPI服务器发送请求，创建Pod并且调度到工作节点，kubetlet收到通知，再去告诉Docker运行镜像

## 3. Pod

### 3.1. Basic

Pod作为一组并置的容器，代表了k8s中的基本构建模型，一个Pod的所有容器只能运行在同一个节点上。

无论是IPC还是本地文件通信，在一个独立机器上显得十分合理。

同一个Pod下的所有容器共享Linux的namespace与network interface，因此可以通过IPC进行通信。同一个Pod下的端口号会发生冲突，但是一个Pod中的所有容器也有相同的loopback网络接口，即可以使用localhost与其他容器进行通信。在Pod之间都在一个共享的网络地址空间中，即不需要经过NAT转换。

Pod常用的命令

```bash
kubectl explain pods
kubetcl create -f xx.yaml
kubectl get po xx -o json
kubectl delete po xx
kubectl logs xx
kubectl port-forward xx 8888:8080
kubetcl get ns
kubectl create namespace mynamespace
```

通过yaml定义的Pod，包含metadata：名称命名空间，标签；spec：Pod实际说明，包括容器，数据卷等；status：Pod当前信息，所处条件，容器状态。

此外，还可以手动给Pod添加标签，每一个Pod有两种标签，在yaml的metadata处为Pod附加标签

app：指定app属于哪个应用、组建或者微服务

rel：显示Pod运行应用程序版本stable、beta、canary

### 3.2. Workloads Controller

#### 3.2.1 Liveness Probe

通过存活探针liveness probe检测容器是否正在运行，常用方式有：HTTP GET、TCP socket、Exec command。

在spec.containers下面定义livenessProbe并设置path

```bash
kubectl describe po kubia-liveness
```

#### 3.2.2. ReplicatoinController

ReplicationController用于确保pod始终是可以运行状态，如果Pod以任何原因消失，那么ReplicationController会注意到缺少，并创建一个Pod替代。运行时，Replication会持续监控正在运行的Pod列表，保证相对应的类型的Pod与预期相符，就算有多余Pod也会删除。

可以确保一个（或多个）Pod持续运行，方法是在现有Pod丢失时启动新的Pod。

通过创建kind: ReplicationController来定义，spec.replicas: x决定目标数目，template下定义创建新的Pod所用的模版。

```bash
kubectl get pods
kubectl get rc
kubectl describe rc kubia
kubectl label pod xx app=foo --overwrite # 修改后将不再由该RC管理
kubectl edit rc kubia
# 当然，可以使用export KUBE_EDITOR="/usr/bin/vim"来决定编辑器
kubectl scale rc kubia --replicas=10 # 扩容
```

其主要由三个部分构成：

label selector：确定当前ReplicationController作用域下有多少Pod

replica count：副本个数，指定运行的数量

pod template：用于创建新的pod副本

#### 3.2.3. ReplicaSet

相较于ReplicationController，ReplicaSet具有类似的行为，但是可以更好地表达Pod选择器，可以允许匹配缺少某个标签的Pod，或者包含特定标签名的Pod。

其包含四个特定字段：

In：label的值必须与其中一个指定的values匹配

NotIn：Label的值与任何一个values不匹配。

Exists：Pod必须包含一个指定名称的标签，使用此运算符不应该包括values字段。

DosNotExist：Pod不得包含有指定名称的标签，同样不包括values字段。

#### 3.2.4. DaemonSet

*DaemonSet* 确保全部（或者某些）节点上运行一个 Pod 的副本。 当有节点加入集群时， 也会为他们新增一个 Pod 。 当有节点从集群移除时，这些 Pod 也会被回收。删除 DaemonSet 将会删除它创建的所有 Pod。

DaemonSet 的一些典型用法：

-   在每个节点上运行集群守护进程
-   在每个节点上运行日志收集守护进程
-   在每个节点上运行监控守护进程

通过给Node打上标签

```bash
kubectl label node xx disk=ssd
```

即可以对该节点保证运行设定好的校验ssd的Pod。

#### 3.2.5. Jobs

Job 会创建一个或者多个 Pods，并将继续重试 Pods 的执行，直到指定数量的 Pods 成功终止。 随着 Pods 成功结束，Job 跟踪记录成功完成的 Pods 个数。 当数量达到指定的成功个数阈值时，任务（即 Job）结束。 删除 Job 的操作会清除所创建的全部 Pods。 挂起 Job 的操作会删除 Job 的所有活跃 Pod，直到 Job 被再次恢复执行。

一种简单的使用场景下，你会创建一个 Job 对象以便以一种可靠的方式运行某 Pod 直到完成。 当第一个 Pod 失败或者被删除（比如因为节点硬件失效或者重启）时，Job 对象会启动一个新的 Pod。

你也可以使用 Job 以并行的方式运行多个 Pod。

在Job中可以定义运行多个Pod示例，包括顺序，并行，CronJob等

## 4. Service

由于Pod的可变动性，导致其随时会被启动或者关闭，并且在Pod启动钱，会给已经调度到节点上的Pod分配IP地址，且由于水平伸缩的特性，多个Pod可能会提供相同的服务。

通过创建yml文件定义service

```bash
kubectl get svc
```

可以通过创建服务，来让一个单一稳定的IP访问到Pod，在服务的整个生命周期内，这个地址会保持不变，在服务后的Pod可以删除重建，但是对外的IP不会变化。

为了外部连接k8s的服务，在服务和pod之间不会直接相连的，而是存在一个endpoint资源，用以暴露服务ip和端口的列表。

将服务暴露给客户端，有如下几种方式：

-   NodePort：每个集群节点都会打开一个端口，并将在该端口上接受到的流量重定向到基础服务。
-   LoadBalance：使得服务可以通过一个专用的负载均衡器进行访问，
-   Ingress：通过一个IP地址公开多个服务





















