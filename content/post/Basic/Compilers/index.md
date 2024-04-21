---
title: "Compilers"
date: 2022-03-05T17:00:35+08:00
lastmod: 2022-03-05T17:00:35+08:00
draft: false
author: "Chasing1020"
comment: true
keywords: []
description: "The basic of compilers"
tags: ['Compilers']
categories: ['Note']
image: 'Compilers.webp'
---

# 1. Overview



# 2. Language Grammar

字母表（Alphabet）：$\sum$是一个有穷符号集合，包括字母、数字、标点等。

乘积（product）：字母表$\sum_1$和$\sum_2$的乘积（笛卡儿积）：$\sum_1\sum_2 = \{ab|a\in\sum_1, b\in\sum_2\}$

n次幂（power）：字母表$\sum$的n次幂：1. $\sum^0=\{\varepsilon\}$; 2. $\sum^n =\sum^{n-1}\sum, if\ n > 1$

正闭包（positive closure）：$\sum^+ = \sum \cup \sum^2 \cup\sum^3 \cup...$

克林闭包（Kleene closure）：即任意符号串（允许长度0）的集合$\sum^* = \sum^{0} + \sum^+ = \sum^0 \cup \sum \cup \sum^2 \cup \sum^3 \cup ...$

---

串（string）：设$\sum$是一个字母表，$\forall x\in \sum^*$，x称为$\sum$上的一个串，串是字母表中的符号的一个有穷序列。

串的长度（length）：s的长度，记作|s|，即s中符号的个数，长度为0记作空串。

连接（concatenation）：即y串附加到x串后面形成的串，空串是连接运算的单位元（identity）。

串的n次幂：将n个串s连接起来：1. $s^0=\varepsilon$; 2. $s^n = s^{n-1}s, n≥1$， 

---

文法的形式化定义：$G=(V_T,V_N,P,S)$，其中$V_T$：终结符集合；$V_N$：非终结符集合；P：产生式集合；S：开始符号

终结符（terminal symbol）：所有文法定义的语言的基本符号，即token。

-   Examples:

    - Identifier: strings of letters or digits, starting with a letter
    - Integer: a non-empty string of digits
    - Keyword: “else” or “if” or “begin” or …
    - Whitespace: a non-empty sequence of blanks, newlines, and tabs

非终结符（nonterminal）：表示语法成分的符号，也称为“语法变量”

产生式（production）：描述了将**终结符**和非终结符组合成串的方法产生式的一般形式：$\alpha\rightarrow\beta$。其中，$\alpha\in(V_T\cup V_N)^+$，且$\alpha$至少包含$V_N$中的一个元素：称为产生时的头部（head）或者左部（left side）；$\beta\in(V_T\cup V_N)^*$：称为产生式的体（body）或者右部（right side）。

开始符号（start symbol）：$S\in V_N$，表示的是该文法中最大的语法成分。

---

产生式的简写：对于一组具有相同左部$\alpha$的产生式$\alpha \rightarrow \beta_1,\alpha \rightarrow \beta_2,...,\alpha \rightarrow \beta_n$。

可以简单计为$\alpha \rightarrow \beta_1|\beta_2|...|\beta_n$。这里的$\beta_1,\beta_2,...,\beta_n$称为$\alpha$的候选式（candidate）。

终结符约定：字母表中前面的小写字母；运算符；标点符号；数字；粗体字符串

非终结符约定：字母表中前面的大写字母；S通常表示开始符号；小写、斜体的名字；代表程序构造的大写字母。

文法符号：排在后面的大写字母。

终结符号串：排在后面的小写字母（包括空串）。

文法符号串：小写希腊字母（包括空串）。

---

语言定义

给定文法$G=(V_T,V_N,P,S)$，如果$\alpha\rightarrow\beta\in P$，那么可以将$\gamma\alpha\delta$中的$\alpha$换成$\beta$。即重写为$\gamma\beta\delta$，记作$\gamma\alpha\delta\Rightarrow\gamma\beta\delta$。此时，称文法中的符号串$\gamma\alpha\delta$直接推导（directly derive）$\gamma\beta\delta$，即用产生式的右部替换产生式的左部。

如果有$\alpha_0 \Rightarrow \alpha_{1} , \alpha_{1}\Rightarrow \alpha_{2} ,...,  \alpha_{n-1} \Rightarrow \alpha_n $ ，则有$\alpha\_0\Rightarrow\alpha\_1\Rightarrow\alpha\_2\Rightarrow...\Rightarrow\alpha\_n$，称符号串$\alpha_0$经过n步推导出$\alpha_n$，可以简记为$\alpha_0\Rightarrow^n\alpha_n$。

特别地：$\alpha \Rightarrow^0 \alpha$，$\Rightarrow^+$ 表示经过正数步推导，$\Rightarrow^*$ 表示经过若干步（可以为0）推导。

句子的推导：从生成语言的角度，句子的规约：从识别语言的角度。

句型（sentential form）：如果$S\Rightarrow^* \alpha,\alpha \in (V_T\cup V_N)^* $，则称$\alpha$是G的一个句型。

-   句型可以包含终结符，也可以包含非终结符，也可能是空串。

句子（sentence）：如果$S\Rightarrow^* w,\ w\in V_T^*$，则称w是G的一个句子。

-   句子是不包含非终结符的句型。

语言的形式化定义：由文法G开始的符号S推导出的所有句子构成的集合称为文法G生成的语言，记为L(G)。即：$L(G)=\{w|S\Rightarrow^* w,\ w\in V_T^*\}$。

标识符：令$L=\{A,B,C,...,Z,a,b,c,...,z\},D=\{0,1,2,...,9\}$，则$L(L\cup D)^*$，表示的语言是标识符。

---

>   Chomsky文法分类体系

0型文法（Type-0 Grammar）：无限制文法（Unrestricted Grammer）/短语结构文法（Phrase Structure Grammer, PSG）：$\forall\alpha\rightarrow\beta\in P$，$\alpha$中至少包含一个非终结符。

-   0型语言：由0型文法G生成的语言L(G)

1型文法（Type-1 Grammar）：上下文有关文法（Context-Sensitive Grammar，CSG）：$\forall\alpha\rightarrow\beta\in P,\ |\alpha|≤|\beta|$，产生式的一般形式$\alpha_1A\alpha_2\rightarrow\alpha_1\beta\alpha_2(\beta ≠ \varepsilon)$

-   1型语言（上下文有关语言）：由1型文法G生成的语言L(G)，CSG中不包含$\varepsilon$产生式。

2型文法（Type-2 Grammar）：上下文无关文法（Context-Free Grammar, CFG）：$\forall\alpha\rightarrow\beta\in P, \alpha\in V_N$，产生式的一般形式$A\rightarrow\beta$

-   2型语言（上下文无关语言）：由2型文法G生成的语言L(G)

3型文法（Type-3 Grammar）：正则文法（Regular Grammar, RG），右线性（Right Linear）文法：$A\rightarrow wB\ or\ A\rightarrow w$，左线性（left Linear）文法：$A\rightarrow Bw\ or\ A\rightarrow w$，两者都称为正则文法。

-   3型语言（正则语言）：由3型文法G生成的语言L(G)

四种语言的关系，逐级限制，逐级包含：

1.   0型文法：$\alpha$中至少包含一个非终结符
2.   1型文法：$|\alpha|≤|\beta|$
3.   2型文法：$\alpha\in V_N$
4.   3型文法：$A\rightarrow wB\ or\ A\rightarrow w$（或$A\rightarrow Bw\ or\ A\rightarrow w$）

>   CFG 分析树

根节点标号既是文法开始符号

内部节点表示对一个产生式$A\rightarrow\beta$的应用

叶结点标号既可以是非终结符，也可以是终结符。从左到右排列叶结点得到的符号串称为是这颗树的产出（yield）或边缘（frontier）。

如果一个文法可以为某个句子生成多棵分析树，则称该文法存在二义性

# 3. Lexical Analysis

>   正则表达式定义

$\varepsilon$是一个RE，$L(\varepsilon) = {\varepsilon}$；如果$\alpha\in \sum$，则$\alpha$是一个RE，$L(\alpha) = {\alpha}$。

假设r, s都是RE，表示的语言分别是L(r), L(s)，则$r|s, rs, r*, (r)$都是RE。

正则语言（Regular language）或正则集合（Regular language）

| 定律                            | 描述                        |
| ------------------------------- | --------------------------- |
| $r | s = s | r$                 | \|可交换                    |
| $r|(s|t) = (r|s)|t$             | \|可结合                    |
| $r(st)=r(st)$                   | 连接可结合                  |
| $r(s|t) = rs|rt$                | 连接对\|可结合              |
| $\varepsilon r=r\varepsilon =r$ | $\varepsilon$是连接的单位元 |
| $r^* = (r｜\varepsilon )^*$     | 闭包中一定含有$\varepsilon$ |
| $r^{**} = r^*$                  | \*具有幂等性                |

正则文法和正则表达式等价，任意正则文法G，存在定义统一语言的正则表达式r，反之亦然。

正则定义（regular definition）：指具有如下形式的定义序列$d_1 \rightarrow r_1,d_2 \rightarrow r_2,...,d_n \rightarrow r_n$

-   其中每个$d_i$都是一个新符号，他们都不在字母表$\sum$中，而且各不相同。
-   每个$r_i$都是字母表$\sum \cup \{d_1, d2_, ..., d_i-1\}$上的正则表达式。
-   Exp: C语言的标识符
    -   $digit\rightarrow 0|1|2|...|9$
    -   $letter \rightarrow A|B|...|Z|a|b|...|z|$_
    -   $identification \rightarrow letter(letter|digit)*$

>   单词识别

有穷自动机（Finite Automata, FA）：系统根据当前状态和输入信息决定系统后继行为。

转换图（Transition Graph）：结点表示FA状态，初始状态用start表示，终止状态为双圈，有向边带标记表示转换条件。

确定的有穷自动机（Deterministic finite automata, DFA）：定义$M=(S,\sum,\delta,s_0 ,F)$

-   S：有穷状态集
-   $\sum$：输入字母表，即输入符号集合。$\varepsilon$不是$\sum$中的元素
-   $\delta$：将$S*\sum$映射到$S$的转换函数。$\forall s\in S, a\in \sum, \delta (s, a)$表示从状态s出发，沿着a边能到达的状态
-   $s_0$：开始状态，$s_0\in S$
-   $F$：接受状态集合，$F\subsetneqq S$

非确定的又穷自动机（Nondeterministic finite automata, NFA）：定义$M=(S,\sum,\delta,s_0 ,F)$

-   S：有穷状态集
-   $\sum$：输入字母表，即输入符号集合。$\varepsilon$不是$\sum$中的元素
-   $\delta$：将$S*\sum$映射到 $2^S$  的转换函数。$\forall s\in S, a\in \sum, \delta (s, a)$表示从状态s出发，沿着a边能到达的状态的集合
    -   如果是带有空边的NFA，则$\delta$：将$S*(\sum \cup\{\varepsilon\})$映射到 $2^S$  的转换函数。$\forall s\in S, a\in \sum \cup \{\varepsilon\}, \delta (s, a)$表示从状态s出发，沿着a边能到达的状态的集合
-   $s_0$：开始状态，$s_0\in S$
-   $F$：接受状态集合，$F\subsetneqq S$

DFA和NFA唯一确定并且相互等价。且带有和不带有$\varepsilon$边的NFA等价。DFA每个状态都是NFA状态构成的一个集合。在Go中，采用scanner结构体next方法作为DFA的输入，获取程序Token。

```GO
// next advances the scanner by reading the next token.
func (s *scanner) next() {
	nlsemi := s.nlsemi
	s.nlsemi = false

redo:
	// skip white space
	s.stop()
	startLine, startCol := s.pos()
	for s.ch == ' ' || s.ch == '\t' || s.ch == '\n' && !nlsemi || s.ch == '\r' {
		s.nextch()
	}

	// token start
	s.line, s.col = s.pos()
	s.blank = s.line > startLine || startCol == colbase
	s.start()
	if isLetter(s.ch) || s.ch >= utf8.RuneSelf && s.atIdentChar(true) {
		s.nextch()
		s.ident()
		return
	}

	switch s.ch {
    	case -1: 
        // omit 
        default:
		s.errorf("invalid character %#U", s.ch)
		s.nextch()
		goto redo
	}

	return

assignop:
	if s.ch == '=' {
		s.nextch()
		s.tok = _AssignOp
		return
	}
	s.tok = _Operator
}

```

# 4. Sytax Analysis

>   自顶向下分析

从分析树的顶部向底部方向构造分析树，可以看成是从文法开始符号S推导出词串w的过程。

最左推导：每次选择每个句型的最左非终结符替换，$S\Rightarrow^*_{left most}\alpha$，则称$\alpha$是当前文法的最左句型（left- sentential form）。

最右推导：总是选择每个句型的最右非终结符进行替换。

预测分析：在输入中向前看固定个数符号来选择正确的A-产生式，不需要回溯，将向前看k个这些文法类可以记$LL(K)$文法类。

左递归文法：存在一个非终结符$A$，使得对某个串有$A\Rightarrow ^+A\alpha$，那么这个文法是左递归的，会使得递归下降分析器进入无限循环。

消除左递归：引入非终结符和$\_\varepsilon$产生式为代价。伪代码如下

```Go
A := make(NonTerminal, n)
for i := range A {
    for j := 0; j < i; j++ {
        // 将A[i]->A[j]y的产生式替换成产生式组A[i]->d[1]y|d[2]y|...|d[k]y
        // A[j]->d[1]|d[2]|...|d[k]，是所有A[j]产生式
    }
    // 消除A[i]产生式之间的立即左递归
}
```

提取左公因子算法：改写产生式来推迟决定，如果多个选项有公共最长前缀$\alpha, \alpha ≠ \varepsilon$，即存在非平凡（nontrivial）的公共前缀，则可以将所有A-产生式替换。

S_文法：不含$\varepsilon$产生式，候选式唯一，每个产生式右部以终结符开始，同一非终结符的各个候选式的首终结符都不同。

后继符号集：可能在某个句型中紧跟A后边的终结符a的集合，记为$FOLLOW(A)$，如果A是最右符号，则还要添加结束符"\$"。

-   $FOLLOW(A) = \{a|S\Rightarrow ^* \alpha Aa\beta, a\in V_T, \alpha,\beta \in (V_T \cup V_N )^* \}$

产生式的可选集：产生式$A\rightarrow \beta$的可选集是指可以用改产生式进行推导的对应输入符号的集合，记为$SELECT(A\rightarrow \beta)$。

-   $SELECT(A\rightarrow \alpha \beta) = \{\alpha\}; SELECT(A\rightarrow \varepsilon) = FOLLOW(A)$

q_文法：每个产生式的右部要么是$\varepsilon$要么是终结符开始，具有相同左部的产生式有不相交的可选集。

串首终结符集：给定一个文法符号串$\alpha$，$\alpha$串首终结符集$FIRST(\alpha)$被定义为可以从$\alpha$推导出的所有串终结符构成的集合。如果$\alpha\Rightarrow ^* \varepsilon$，则$\alpha$也在$FIRST(\alpha)$中。

-   $\forall \alpha \in (V_T \cup V_N)^+ , FIRST(\alpha)=\{a|\alpha \Rightarrow^* a\beta, a\in V_T, \beta \in (V_T \cup V_N)^*\}$
-   如果$\alpha \Rightarrow ^* \varepsilon$，那么$\varepsilon \in FIRST(\alpha)$
-   如果$\varepsilon \notin FIRST(\alpha)$，那么$SELECT(A\rightarrow \alpha) = FIRST(\alpha)$
-   如果$\varepsilon \in FIRST(\alpha)$，那么$SELECT(A\rightarrow \alpha)=(FIRST(\alpha)-\{\varepsilon\})\cup FOLLOW(A)$

$LL(1)$文法：文法G是$LL(1)$当前仅当任意两个相同的左部产生式$A\rightarrow \alpha|\beta$满足以下条件：

-   如果$\alpha$和$\beta$都不能推导出$\varepsilon$，则$FIRST(\alpha)\cap FRIST(\beta) = \Phi$
-   $\alpha$和$\beta$至多有一个能够推导出$\varepsilon$
-   如果$\beta \Rightarrow ^* \varepsilon$，则$FIRST(\alpha)\cap FOLLOW(A) = \Phi$
-   如果$\alpha \Rightarrow ^* \varepsilon$，则$FIRST(\beta)\cap FOLLOW(A) = \Phi$

递归的预测分析法：在递归下降分析中，根据预测分析表进行产生式的选择，为每个终结符编写对应过程

```go
func PredictRecursion() {
    A := SelectExpression() // A->X[1]X[2]...X[k]
    for i := 0; i < k; i++ {
        switch A.X[i].(type) {
            case NonTerminal:
            CallExpression(A.X[i])
            case Terminal:
            ReadNext()
            default:
            panic("type assert error")
        }
    }
}
```

非递归预测分析法：为预测分析表构造一个自动机。

预测分析法实现步骤：构造文法；改造文法，消除二义性、消除左递归、消除回溯；求每个变量的$FIRST, FOLLOW$集，进而得到$SELECT$集；检查是不是$LL(1)$文法，如果是，构造预测分析表；进行递归/非递归分析。

>   自底向上的语法分析

从分析树的底部向顶部方向构造分析树，可以看成是将输入串w规约为文法开始符号S的过程。

移入-归约：将输入串从左到右的扫描中，将0个或多个输入符号移入到栈的顶端，知道能进行归约为止。

LR文法（Knuth，1963）：最大的、可以构造出相应移入-归约语法分析器的文法类，LR(k)表示需要向前查看k个输入符号的LR分析。

-   采用“状态”的自动机表示句柄识别进度

LR(0)项目：右部某位置标有圆点的产生式，描述了句柄识别状态。

-   圆点后面为非终结符：移进项目
-   圆点后面为终结符：待约项目
-   圆点后面为空串：归约项目

增广语法：如果G是S开始符号的文法，则G的增光文法G'是G中加上开始符号S'和产生式$S'\rightarrow S$的文法，使得文法开始符号仅出现在一个产生式的左边，从而使得分析器只有一个接受状态。

项目集的闭包：给定项目集I，有

-   $CLOSURE(I) = I \cup \{B\rightarrow ·\gamma|A \rightarrow \alpha·B\beta \in CLOSURE(I), B\rightarrow \gamma \in P \}$

后继项目集闭包：给定项目集I对应文法符号X的后继项目集闭包

-   $GOTO(I, X) = CLOSURE(\{A\rightarrow \alpha X·\beta | A\rightarrow \alpha·X\beta \in I\})$

规范LR(0)项目集族（Canonical LR(0) Collection）：

-   <div>$C=\{ I_0 \}\cup \{I |\exists J\in C, X\in V_N \cup V_T, I=GOTO(J, X) \}$</div>

LR(0)自动机：文法$G=(V_N, V_T, P, S)$，则LR(0)自动机定义如下

-   $M=(C, V_N\cup V_T, GOTO, I_0,F)$
    -   $C =\{ I_0 \}\cup \{I|\exists J\in C, X\in V_N \cup V_T, I = GOTO(J,X) \}$
    -   $I_0=CLOSURE(\{S'\rightarrow .S\})$
    -   $F=\{CLOSURE(\{S'\rightarrow S.\})\}$

SLR分析：已知项目集I有m个移进项目，n个归约项目

$A_1 \rightarrow \alpha_1 · a_1 \beta_1; A_2 \rightarrow \alpha_2 · a_2 \beta_2;...;A_m \rightarrow \alpha_m · a_m \beta_m.$

$B_1\rightarrow \gamma_1; B_2\rightarrow \gamma_2; ... ;B_n\rightarrow \gamma_n;$

如果集合${a_1,a_2,...,a_m}$和$FOLLOW(B_1), FOLLOW(B_2), ..., FOLLOW(B_n)$两两不相交，按原则如果a是下一个输入，$if\ a \in \{ a_1,a_2,...,a_n \}$，则移进a，$if\ a\in \cup FOLLOW(B_i)$，则用$B_i\rightarrow \gamma_i$归约，否则报错。

LR(1)项目：$[A\rightarrow \alpha ·\beta]$，的项称为LR(1)项，其中a是一个终结符，表示当前状态下A必须紧跟的终结符，称为该项的展望符。

-   $CLOUSURE(I)=I\cup\{[B\rightarrow ·\gamma,b]|[A\rightarrow \alpha·B\beta, a]\in CLOSURE(I), B\rightarrow \gamma \in P, b \in FIRST(\beta a) \}$

-   $GOTO(I,X)=CLOSURE(\{[A\rightarrow \alpha X·\beta, a]|[A\rightarrow \alpha ·X \beta ]\in I\})$

LALR(lookahead-LR)分析思想：找具有相同核心的LR(1)项集，合并；最终分析表如果没有冲突，则为LALR(1)文法。

-   形式上与LR(1)相同，大小和LR(0)/SLR相当，分析能力SLR<LALR(1)<LR(1)



# 5. Sytax-Directed Translation

面向文法翻译：以CFG的文法符号设置语义属性，用来表述语法成分对应的语义信息，基于语义规则来进行计算。

语法制导定义（Syntax-Directed Definitions, SDD）：将每个文法符号和语义属性集合相关联，每个产生式和一组语义规则相关联。

语法制导翻译方案（Syntax-Directed Translation, SDT）：在产生式右部嵌入程序片段的CFG（位置距决定执行时间），被称之为语义动作，是SDD具体的方案。

综合属性：只能通过子结点或者本身的属性值来定义，终结符可以具有综合属性（由词法分析器提供的词法值）。

继承属性：在分析树上继承属性只能由该结点的父亲，兄弟或者自身属性值来定义。

属性文法：没有副作用SDD。

属性值计算顺序：将有向图变为拓扑排序，从无依赖的结点出发。

S-SDD：仅仅使用综合属性的SDD，可以自底向上顺序来计算它各个节点的属性值。将每一个语义动作放在产生式最后即可转换为SDT。

L-SDD：在各属性之间，依赖图的边可以从左到右但是不能从右到左，不能从右到左，每一个S-SDD都是L-SDD。将继承属性紧靠在出现之前的位置，综合属性放在最右端即可转换为SDT。

# 6. Intermediate Code Generation

类型表达式（Type Expressions）：可以为其命名，类型名也是表达式，包括数组构造符、指针、笛卡尔积、函数构造符、记录构造符（结构体内的标识符与类型信息的笛卡尔积）。

语义分析期间，对每一个标识符都会收集类型信息，确定这个类型的宽度，并分配一个相对地址，保存在符号表的记录中。























