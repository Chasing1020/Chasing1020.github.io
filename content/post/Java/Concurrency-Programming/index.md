---
title: "Concurrency Programming"
date: 2021-12-05T14:16:11+08:00
lastmod: 2021-12-05T14:16:11+08:00
draft: false
author: "Chasing1020"
comment: true
keywords: []
description: ""
tags: ['Java']
categories: ['Note']
image: "philosophers.webp"
---

# 1. Implements

volatile：声明后所有线程看到的改变量的值是一样的。写操作时，会添加Lock前缀的汇编。

保证了1. 保证缓存行的数据写回内存；2. 写回的操作会使其他缓存失效。

synchronized：普通的方法，锁是实例；静态同步方法，锁是Class；同步方法块，锁是括号里的对象。

锁保存在对象头，如果是数组，则用三个字宽保存对象头，非数组则用两个自宽保存对象头。

| 长度        | 内容                   | 说明                           |
| ----------- | ---------------------- | ------------------------------ |
| 32bit/64bit | Mark Word              | 存储对象的hashCode或者是锁信息 |
| 32bit/64bit | Class Metadata Address | 存储到对象类型的指针           |
| 32bit/64bit | Array Length           | 数组的长度，（非数组无该字段） |

32位下对象头的存储结构

```
|----------------------------------------------------------------------------------------|--------------------|
|                                    Object Header (64 bits)                             |        State       |
|-------------------------------------------------------|--------------------------------|--------------------|
|                  Mark Word (32 bits)                  |      Klass Word (32 bits)      |                    |
|-------------------------------------------------------|--------------------------------|--------------------|
| identity_hashcode:25 | age:4 | biased_lock:1 | lock:2 |      OOP to metadata object    |       Normal       |
|-------------------------------------------------------|--------------------------------|--------------------|
|  thread:23 | epoch:2 | age:4 | biased_lock:1 | lock:2 |      OOP to metadata object    |       Biased       |
|-------------------------------------------------------|--------------------------------|--------------------|
|               ptr_to_lock_record:30          | lock:2 |      OOP to metadata object    | Lightweight Locked |
|-------------------------------------------------------|--------------------------------|--------------------|
|               ptr_to_heavyweight_monitor:30  | lock:2 |      OOP to metadata object    | Heavyweight Locked |
|-------------------------------------------------------|--------------------------------|--------------------|
|                                              | lock:2 |      OOP to metadata object    |    Marked for GC   |
|-------------------------------------------------------|--------------------------------|--------------------|
```

| 锁状态 | 25bit          | 4bit         | 1bit         | 2bit     |
| ------ | -------------- | ------------ | ------------ | -------- |
| 状态   | 对象的hashCode | 对象分代年龄 | 是否是偏向锁 | 锁标志位 |

64位下对象头的存储结构

```
|------------------------------------------------------------------------------------------------------------|--------------------|
|                                            Object Header (128 bits)                                        |        State       |
|------------------------------------------------------------------------------|-----------------------------|--------------------|
|                                  Mark Word (64 bits)                         |    Klass Word (64 bits)     |                    |
|------------------------------------------------------------------------------|-----------------------------|--------------------|
| unused:25 | identity_hashcode:31 | unused:1 | age:4 | biased_lock:1 | lock:2 |    OOP to metadata object   |       Normal       |
|------------------------------------------------------------------------------|-----------------------------|--------------------|
| thread:54 |       epoch:2        | unused:1 | age:4 | biased_lock:1 | lock:2 |    OOP to metadata object   |       Biased       |
|------------------------------------------------------------------------------|-----------------------------|--------------------|
|                       ptr_to_lock_record:62                         | lock:2 |    OOP to metadata object   | Lightweight Locked |
|------------------------------------------------------------------------------|-----------------------------|--------------------|
|                     ptr_to_heavyweight_monitor:62                   | lock:2 |    OOP to metadata object   | Heavyweight Locked |
|------------------------------------------------------------------------------|-----------------------------|--------------------|
|                                                                     | lock:2 |    OOP to metadata object   |    Marked for GC   |
|------------------------------------------------------------------------------|-----------------------------|--------------------|
```

| 锁状态 | 25bit  | 31bit          | 1bit     |    4bit  |1bit|2bit|
| ------ | ------ | -------------- | -------- | ---- | ---|---|
| 状态 | unused | 对象的hashCode | cms_free | 对象分代年龄 |是否偏向锁|锁标志位|

可以设置参数-XX:+UseCompressedOops，来进行压缩，参考32bit的PAE实现，可以使JVM的内存超过4G，但不超过32G（超过32G，可以使用-XX:ObjectAlignmentInBytes，来限制压缩的大小，如当对象对齐为 16 字节时，最多可以使用 64 GB 的堆空间和压缩指针），经过压缩后：

```
|--------------------------------------------------------------------------------------------------------------|--------------------|
|                                            Object Header (96 bits)                                           |        State       |
|--------------------------------------------------------------------------------|-----------------------------|--------------------|
|                                  Mark Word (64 bits)                           |    Klass Word (32 bits)     |                    |
|--------------------------------------------------------------------------------|-----------------------------|--------------------|
| unused:25 | identity_hashcode:31 | cms_free:1 | age:4 | biased_lock:1 | lock:2 |    OOP to metadata object   |       Normal       |
|--------------------------------------------------------------------------------|-----------------------------|--------------------|
| thread:54 |       epoch:2        | cms_free:1 | age:4 | biased_lock:1 | lock:2 |    OOP to metadata object   |       Biased       |
|--------------------------------------------------------------------------------|-----------------------------|--------------------|
|                         ptr_to_lock_record                            | lock:2 |    OOP to metadata object   | Lightweight Locked |
|--------------------------------------------------------------------------------|-----------------------------|--------------------|
|                     ptr_to_heavyweight_monitor                        | lock:2 |    OOP to metadata object   | Heavyweight Locked |
|--------------------------------------------------------------------------------|-----------------------------|--------------------|
|                                                                       | lock:2 |    OOP to metadata object   |    Marked for GC   |
|--------------------------------------------------------------------------------|-----------------------------|--------------------|
```

偏向锁：大多数情况下，没有锁竞争，偏向锁在等到竞争时才会释放锁。有竞争时 ，会在全局安全点撤销偏向锁。

使用-XX:BiasedeLoackingStartupDelay=0，如果大多数锁处于竞争状态，可以使用-XX:UseBiasedLocking=false关闭，这样程序会默认进入轻量级锁的状态。

轻量级锁：使用CAS操作Mark Word，如果成功，就获得锁；释放时，CAS如果失败，就升级到重量级锁。

重量级锁：在这个状态下，所有获取锁的操作都会被阻塞，持有锁的线程释放后会唤醒这些线程。

| 锁       | 优点                                 | 缺点                            | 场景                           |
| -------- | ------------------------------------ | ------------------------------- | ------------------------------ |
| 偏向锁   | 加锁不用额外消耗，效率接近非同步方法 | 如果有锁竞争，会带来撤销消耗    | 只有一个线程访问的场景         |
| 轻量级锁 | 线程不会阻塞，提高相应速度           | 得不到锁竞争的线程会自旋消耗CPU | 追求响应时间，执行速度快       |
| 重量级锁 | 线程竞争不用自旋，不会消耗CPU        | 线程阻塞，响应时间缓慢          | 追求吞吐量，同步块执行速度较长 |

ABA问题解决：采用AtomicStampedReference来解决，判断是否时等于预期引用和预期标志，两个都成功则设置。

# 2. Memory Model

编译器优化重排序：不改变单线程程序语义的情况下，重新安排顺序。

指令级并行的重排序：指令级并行技术（Instruction-Level Parallelism），如果不存在数据依赖性，可以改变指令执行的顺序。

内存系统的重排序：读/写缓冲区，使得读写操作可能的乱序。

屏障类型：LoadLoadBarriers，StoreStoreBarriers，LoadStoreBarriers，StoreLoadBarriers

其中StoreLoadBarriers拥有其他三个屏障的效果，作为全能型屏障。这个屏障开销昂贵，需要将写缓冲的数据全部刷新到内存中。

JDK5开始，采用JSR133原则，使用happens-before来解释内存的可见性：

1.   程序顺序规则：一个线程中的每一个操作，happens-before于后边的操作
2.   监视器锁规则：解锁操作happens-before于上锁操作
3.   volatile变量规则：对volatile修饰变量的写操作，happens-before于读操作
4.   传递性：A happens-before B，B happens-before C，则有A happens-before C

数据依赖性：对同一个变量的写写，写读，读写操作，存在数据依赖，编译器和处理器会遵守数据依赖性。

as-if-serial：排序结果不能影响本来的执行结果。编译器，runtime，处理器都会遵守。

JMM不保证对64位的long和double类型的写操作具有原子性，会把64位的写操作拆成两个32位的操作，虽然这违反了顺序一致性模型。

volatile的写操作前面加StoreStore屏障，后面加StoreLoad屏障；

volatile的写操作后面加LoadLoad屏障，后面加LoadStore屏障。编译器能够通过具体情况省略不必要的屏障。

Java同步器框架AbstractQueuedSynchronizer。

final域保证构造函数内的final域的写入和引用赋值给另一个引用变量这个操作不可以重排序；第一次读final域对象的引用和读取final域中的操作不能重排序。

构造函数final域的写操作，在return前，会插入StoreStore屏障，读final域前会加上LoadLoad屏障，禁止final的写操作重排序到构造函数之外。保证了final读取到的值不会发生改变。

双重锁检查的机制instance = new Instance();实际上会被拆成三行伪代码，在2，3之间会可能发生重排序。

```java
memory = allocate();  // 1. 分配对象的内存空间
ctorInstance(memory); // 2. 初始化对象，完成后instance != null
instance = memory;    // 3. 设置instance指向刚分配的内存地址
```

回顾类加载的时机：**加载**（通过全限定名获取二进制字节流，转化为方法区运行时数据结构，生成java.lang.Class对象），**验证**（文件格式，元数据，字节码，符号引用），**准备**（正式分配内存并且初始化值，对应上述代码的1，2步骤），**解析**（将常量池的符号引用替换为直接引用；符号引用就是一组符号来描述目标，可以是任何字面量。**直接引用**就是直接指向目标的指针、相对偏移量或一个间接定位到目标的句柄。），**初始化**（初始化阶段是执行初始化方法 \<clinit\> ()方法的过程，对静态变量/代码块进行初始化，会保证多线程安全性），使用，卸载。

使用volatile后，可以防止2，3之间的重排序。

# 3. Basic

suspend(), resume(), stop()标记为deprecated，调用后不一定会释放占有的资源。

使用wait(), notify(), notifyAll()之前需要对调用对象加锁。

管道输入输出流，输出与输入进行绑定

# 4. Lock

AbstractQueuedSynchronizer通过内置的FIFO来实现资源获取线程的排队工作。

当前线程信息和等待状态构造成一个结点，加入队列，同时阻塞线程。同步状态释放时，首结点中的线程将会被唤醒。在尾部加入时，采用CAS判断插入到“应该插入的位置”。

acquire(int arg)获取同步状态，对中断不敏感。读acquiredShared获取共享式的同步状态。

重入锁在获取n次，并释放n次后，其他线程能够获取到该锁，默认非公平，通过组合自定义同步器来实现锁的获取与释放。

读写锁，写状态位S&0x0000FFFF，读状态为S>>>16，写锁相当于一个支持重进入的排他锁。



































