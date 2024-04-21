---
title: "TCP Congestion Control"
date: 2022-01-18T22:37:50+08:00
lastmod: 2022-01-18T22:37:50+08:00
draft: false
author: "Chasing1020"
comment: true
keywords: []
description: ""
tags: ['Network']
categories: ['Note']
image: "tcp.webp"
---

# 1. Overview

最初的TCP因为不支持拥塞控制而频繁被丢弃数据包，协议栈被投入使用8年后，Van Jacobson在1988年将 [TCP 拥塞控制](http://www.cs.binghamton.edu/~nael/cs428-528/deeper/jacobson-congestion.pdf)引入网络。

IP层并没有提供拥塞控制功能，各个主机不知道什么是合理的速度。理想场景利用负反馈控制窗口，每一个TCP连接，引入变量`CongestionWindow`与`SlowStartThreshold`。

# 2. Tahoe

定义拥塞发生事件：超时或者是3个冗余ACK。MSS：Maximum Segment Size

SlowStart（SS）状态：

-   每一次RTT，cwnd\>\>=1，保持SS。
-   超时或者是3-ACK：重发，cwnd=1MSS，ssthresh=cwnd\>\>1，保持SS。
-   如果达到警戒阈值，进入CA。

CongestionAvoidance（CA）状态：

-   每一次RTT，cwnd倍增，保持CA。
-   超时或者是3-ACK：重发，cwnd=1MSS，进入SS。

# 3. Reno

定义新的状态：FastRecovery，考虑到2-ACK必定乱序造成的，丢包肯定会造成2-ACK。但是超时的情况下必定会进入SS。

SlowStart（SS）状态：

-   每一次RTT，cwnd倍增。
-   超时：重发，cwnd=1MSS，ssthresh=cwnd\>\>1，保持SS。
-   3-ACK：`快速重传`，ssthresh=cwnd\>\>1，cwnd=ssthresh+3，进入FR。
-   如果达到警戒阈值，进入CA。

CongestionAvoidance（CA）状态：

-   每一次RTT，cwnd倍增。

-   超时：重发，cwnd=1MSS，进入SS。

-   3-ACK：ssthresh=cwnd\>\>1，cwnd=ssthresh+3，重传，进入FR。

FastRecovery（FR）状态：

-   dupACK: cwnd=cwnd+1MSS，保持FR。
-   newACK：cwnd=ssthresth，进入CA。
-   超时：ssthtresh=cwnd\>\>1，cwnd=1，重传，进入SS。

# 4. New Reno

Reno存在的问题：从FR恢复过快，但是实际上在拥塞时分组是成串被丢弃的，后面段的丢失，超时后还是会进入进入SS，使得cwnd又回到1。

改进：由发送方记住缺少确认的段，当这些缺少的段都被确认后，再走出FR状态。

FastRecovery（FR）状态：

-   dupACK：同上，cwnd=cwnd+1，保持FR

-   部分确认（PACK）：收到部分新确认，保持FR

       - 发送确认后面的段，冗余ACK数量=0， 定时器复位不要超时了， cwnd=cwnd+1 

       - 有新段可以发送，发送新的段

-   恢复确认（RACK）：收到所有拥塞时未确认的段确认，cwnd = ssthresh ，定时器复位，进入CA阶段

存在问题：只能恢复一个段的丢失。

考虑[RFC793](https://datatracker.ietf.org/doc/html/rfc793)，在TCP头部保留有Options

```txt
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|          Source Port          |        Destination Port       |
|             16 bit            |             16 bit            |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                         Sequence Number                       |
|                              32 bit                           |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                       Acknowledgment Number                   |
|                              32 bit                           |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
| Data  |          |U|A|P|R|S|F|                                |
|Offset | Reserved |R|C|S|S|Y|I|            Window              |
|       |          |G|K|H|T|N|N|                                |
|4 bits |  6 bits  |  6 bits   |            16 bit              |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|            Checksum          |          Urgent Pointer        |
|             16 bits          |             16 bits            |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|            Options           |          Padding               |
|        variable length       |                                |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                            data                               |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

通过SACK，如接收方给出哪些段收到了，哪些段乱序到达了等信息给发送方。发送端一次发送多个丢失段，每RTT可以重传多个丢失段，提升效率。修改TCP首部的Options如下：

```txt
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|     nop      |     nop       |    SACK(5)   |     L = 10      |
|    8 bits    |    8 bits     |    8 bits    |     8 bits      |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                          Left Edge                            |
|                            32 bit                             |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                          Right Edge                           |
|                            32 bit                             |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

SACK（Several ACK）：在NewReno的基础上，使用pipe=待确认的段数量（ 在管道中已发送出去的段数） th=cwnd\>\>1，cwnd=th+3。pipe不能够太满，也不能够太少。

# 5. Cubic

WIP
