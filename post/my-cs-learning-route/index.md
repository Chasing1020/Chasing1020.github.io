
转眼间已经学习计算机一年半了，作为期间师弟想让我整理分享一下自己的计算机科学相关学习资料与路线，

本课程表中的课程不能代替大学课程，但它们能够帮助你进一步学习计算机科学，或者对这个领域建立初步理解。

从某种程度上，这条路线更能够作为大学课程课外的替代品，作为成为行业技术人员的必修课。

我们这个行业不同于其他行业，你可能需要一个好的笔记本电脑，一个好的键盘，你也需要一个好的身体，你更加需要一个稳固而又不放弃的探索心境，同时你也需要的是，如何能在众多人当中思维层次脱颖而出，这才是关键。

因此有了本文，希望本文能使大家有更清晰的学习规划并能少走一些弯路，同时本文也是对自己本科时计算机学习历程的追忆。

# 1. The Lesson We're Missing

这个标题灵感来源于，Website for the [The Missing Semester of Your CS Education](https://missing.csail.mit.edu/) class。对于我个人而言，这一章几乎都是来自于我曾经踩过的坑，与迷茫时所走的弯。从另一个角度来说，这也是成为计算机技术人才的必修课或者说是必备素养。

1.   [How To Ask Questions The Smart Way](http://www.catb.org/~esr/faqs/smart-questions.html): You don't have to be technically proficient to get our attention, **but you must demonstrate the traits that lead you to become proficient**: resourceful, thoughtful, observant, and willing to take the initiative to solve problems.
2.   [Academic Integrity](http://integrity.mit.edu/): **Honesty is the foundation of good academic work.** Whether you are working on a problem set, lab report, project or paper, avoid engaging in plagiarism, unauthorized collaboration, cheating, or facilitating academic dishonesty.
3.   [The Missing Semester of Your CS Education](https://missing.csail.mit.edu/): Classes teach you all about advanced topics within CS, from operating systems to machine learning, but there’s one critical subject that’s rarely covered, and is instead left to students to figure out on their own: proficiency with their tools.
4.   [Crash Course Computer Science](https://www.bilibili.com/video/BV1EW411u7th?from=search&seid=17600070968462478473&spm_id_from=333.337.0.0)([Youtube Link](https://www.youtube.com/watch?v=O5nskjZ_GoI&list=PLH2l6uzC4UEW0s7-KewFLBC1D0l6XRfye)): 这是我为数不多看了两遍以上的视频，虽然是计算机科普纪录片，我保证这比学校任何一节通识课的教育都更有效。Carrie Anne是一个非常优秀的老师，课程几乎设计计算机的所有领域，从历史到应用再到未来，涵盖的知识点非常的广。



1.   [《编码-隐匿在计算机软硬件背后的语言》](https://book.douban.com/subject/4822685/) 这本书对我理解计算机的原理的帮助很大，它通过浅显易懂的语言讲述计算机是怎样工作的，从十进制、二进制、串联并联电路讲起，继而构造加法器、触发器、存储器，最后讲到操作系统的概念，推荐将这本书作为计算机学习的入门资料，通过这本书可以了解到计算机最本质的东西。

# 2. Computer Systems

标题取为Computer Systems，实际上是因为我并没有实力将Computer Archtecture, Computer Organization, 

1.   [Intro to Computer Systems](https://www.cs.cmu.edu/afs/cs/academic/class/15213-f21/www/schedule.html): 被誉为必读书籍《CSAPP》的课程学习网站。

### 计算机语言

学习语言C语言 推荐[《C Primer Plus》](https://book.douban.com/subject/26792521/) C语言的概念以及语法，多动手编码练习

一本专门讲指针的书 [《征服C指针》](https://book.douban.com/subject/21317828/)

入门阶段后可以看的书 [《计算机程序的构造和解释》](https://book.douban.com/subject/1148282/) [《七周七语言》](https://book.douban.com/subject/10555435/)

### 算法与数据结构

掌握语法后学算法与数据结构 [《算法笔记》](https://book.douban.com/subject/26827295/) 刷题书 [《数据结构与算法分析-C语言描述》](https://book.douban.com/subject/1139426/)

[《算法图解》](https://book.douban.com/subject/26979890/) Python实现 [《算法》](https://book.douban.com/subject/19952400/) Java实现

### Linux

[《鸟哥的Linux私房菜》](https://book.douban.com/subject/30359954/) 可以作为参考资料，主要学习方式还是自己真正安装一个Linux发行版然后使用起来。

### 计算机网络

[《计算机网络-自顶向下方法》](https://book.douban.com/subject/30280001/) [《图解TCP/IP》](https://book.douban.com/subject/24737674/) [《HTTP权威指南》](https://book.douban.com/subject/10746113/)

### 计算机体系结构

[《深入理解计算机系统》](https://book.douban.com/subject/26912767/) 经典必读，对计算机的机制有整体的认知。

可以结合这本书 [《程序员的自我修养-链接、装载与库》](https://book.douban.com/subject/3652388/)

### 操作系统

[《现代操作系统》](https://book.douban.com/subject/27096665/) [《Operating Systems: Three Easy Pieces》](https://pages.cs.wisc.edu/~remzi/OSTEP/)

一个动手实践的课程，最新的版本是运行在RISC-V架构上的（当时在学校时候是看的x86版本的资料）： [《xv6: a simple, Unix-like teaching operating system》](https://pdos.csail.mit.edu/6.828/2020/xv6/book-riscv-rev1.pdf)

另一个操作系统的实践项目：[《x86架构操作系统内核的实现》](https://www.iczc.me/post/my-cs-learning-roadmap/x86架构操作系统内核的实现)，在之前可以先看[《x86汇编语言-从实模式到保护模式》](https://book.douban.com/subject/20492528/)，了解实模式保护模式这些概念。

### 其他

学习新的一门编程语言：

-   [《Essential C++》](https://book.douban.com/subject/24868427/)
-   [《Python编程-从入门到实践》](https://book.douban.com/subject/26829016/)
-   [《Go程序设计语言》](https://book.douban.com/subject/27044219/)
-   [《Java核心技术》](https://book.douban.com/subject/34898994/) 等

数据库：

-   [《数据库系统概念》](https://book.douban.com/subject/10548379/)
-   [《MySQL必知必会》](https://book.douban.com/subject/3354490/)

编译原理：

-   实践：

1.  使用Go实现：[《Writing An Interpreter In Go》](https://book.douban.com/subject/27034273/)
2.  使用C实现：[《手把手教你构建 C 语言编译器》](https://lotabout.me/2015/write-a-C-interpreter-0/)

-   理论：[《编译原理》](
