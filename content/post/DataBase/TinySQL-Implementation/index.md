---
title: "TinySQL Implementation"
date: 2022-08-13T18:24:56+08:00
lastmod: 2022-08-22T18:24:56+08:00
draft: false
author: "Chasing1020"
comment: true
keywords: []
description: ""
tags: ['DataBase']
categories: ['Note']
image: "talent-plan.webp"
---

本次实现是关于 PingCap Talenet Plan 2022 TinySQL 学习营相关的实验解题思路。本次实验可以作为 CMU 15-445 的补充，主要内容为每周的讲座+通过Lab的所有测评 Case ，总体实现难度并不高，以下是每个 Project 实现的具体思路细节。

## Project 1

相当于是项目的 kick-off ，主要内容为项目的基本介绍，包括 SQL 关系代数入门与研究数据如何映射到 TinyKV 上。 具体来说，对每个表分配一个 TableID，每一行分配一个 RowID，其中 TableID 在整个集群内唯一，RowID 在表内唯一，这些 ID 都是 int64 类型。 本次项目实现非常简单，

## Project 2

本节为 Parser 部分，主要研究 TinySQL 是如何将文本转化为 AST 的。 本节利用 yacc 来进行 SQL 语法的补充，可以看出，ast.XXXStmt 结构体内包含的内容和相对应的语句语法都是一一对应的。 所有产生式也都是根据对应的 SQL 语法来编写的。这个文件最初是用工具从 BNF 转化生成的，此 Project 中补充的是 Join 的语法，针对测试用例中的 join, left join, right join, join on 编写 yacc 文件即可，即完成如下两种模式的匹配。

```
TableRef JoinType OuterOpt "JOIN" TableRef "ON" Expression
TableRef CrossOpt TableRef "ON" Expression
```

## Project 3

本节实现了 SQL DDL 中删除一列的操作，TinySQL 中的异步 schema 变更是参照了 Google F1 中的 schema 变更的算法。主要内容为参考论文原文 [Online, Asynchronous Schema Change in F1](http://static.googleusercontent.com/media/research.google.com/zh-CN//pubs/archive/41376.pdf)。 实验代码主要添加了 public –> write-only –> delete-only –> (reorg) –> absent 一系列转换的逻辑。 需要注意的是在最后检查 job.IsRollingback() ，以此判断调用FinishTableJob时是完成还是需要RollBack。

## Project 4

在优化这一部分，主要研究优化器的两种框架，如何使用统计信息进行数据分布的估算和索引的选择。

### Part 1

本部分主要关于 System R 优化器的实现，主要是实现 PredicatePushDown 这个方法。

优化器的入口为 plannercore.DoOptimize，在逻辑优化部分，先通过flag判断需要执行的内容，遍历优化的规则列表。

PredicatePushDown 这个方法为实际的逻辑计划实现谓词下推。这里实现了 LogicalAggregation 的谓词下推，先通过 group by 的列找到可以下推的 condtion，然后保留其中有用的列，最后将选出来的谓词进行下推即可。主要代码逻辑如下：


```go
for _, cond := range predicates {    
    switch cond.(type) {      
        // ...    
    case *expression.ScalarFunction:      
        newFunc := expression.ColumnSubstitute(cond, la.Schema(), exprsOriginal)     
        condsToPush = append(condsToPush, newFunc)
        // ...    
    }
} 
la.baseLogicalPlan.PredicatePushDown(condsToPush)
```

### Part 2

本次Part主要实现和代价选择相关的一些内容

#### 1. Count-Min Sketch

当结束启发式规则的筛选之后，我们仍然可能剩余多组索引等待筛选我们就需要知道每个索引究竟会过滤多少行数据。 实现 CM Sketch 算法，包括新增 value 以及查询 value。核心 insert 逻辑如下


```go
h1, h2 := murmur3.Sum128(bytes)
for i := range c.table {
    j := (h1 + h2*uint64(i)) % uint64(c.width)  // hash
}
```

新增 value 较为简单，算出 Hash 之后再将 table 中对应位置的 count 增加即可。[参考文章](https://pingcap.com/zh/blog/tidb-source-code-reading-12) TiDB 使用了 Count-Mean-Min Sketch 算法，引入了一个噪声值 (N - CM[i, j]) / (w-1) ，其中 N 为总数，w 为 table 宽度，再取所有行的值减去噪音之后的估计值的中位数作为最后的估计值。

#### 2. Join Reorder

本节实现了用动态规划算法找出最优 join 顺序。本次实验逻辑参考较多 TiDB 实现。主要实现两个函数 bfsGraph 和 dpGraph。主要步骤如下：

1. 以邻接表的方式建立 Join 图，记录下 joinGroupEqEdge 与 joinGroupNonEqEdge。
2. 从一个没有访问的点开始进行广度优先遍历，得到一个连通的 Join 节点序列，返回数组 visitID2NodeID。
3. 对于这些节点的 cost，进行动态规划算法得出最少 cost 的 Join 方案，如果还有没访问的节点，则进行循环。
4. 对所有 Join 方案调用 s.makeBushyJoin 得到最终结果。

#### 3. Access Path Selection

本节实现 Skyline Prune 启发式算法来排除效果一定更差的路径，重点在于实现 compareCandidates 函数。根据注释来实现：

1. 比较两个 candidate 的 col，覆盖范围更大的 candidate 更优。这里的 columnSet 数据结构为 intsets.Sparse，所以只需要判断 s2.Len() < s1.Len() && s2.SubsetOf(s1) 即可。
2. 比较两个 candidate 是否 match physical property，match 的那个更优，这里 isSingleScan 已经显示给出。
3. 比较两个 candidate 是否只需要扫面一次，只扫描一次的那个更优，同上，只需要比较 isMatchProp 即可。

最后综合以上三种情况，将三者比较的部分进行求和，即 accessResult + scanResult + matchResult 大于0且所有值均大于等于的情况下排除该分支。

## Project 5

### Part 1

#### 1. 实现向量化表达式

参考其他函数向量化方法编写，先获取数据，再编写主要逻辑，[参考 MySQL String 相关函数](https://dev.mysql.com/doc/refman/5.7/en/string-functions.html)，主要逻辑如下：

```go
result.ResizeInt64(n, false)
result.MergeNulls(buf)
i64s := result.Int64s()
for i := 0; i < n; i++ {
    if result.IsNull(i) {
        continue
    }
    i64s[i] = int64(len(buf.GetString(i)))
}
```
#### 2. 实现向量化 selection 的 Next

为 SelectionExec 实现 Next 方法，整体逻辑可以参考 unBatchedNext 方法，区别在于每次都是向量化批量处理，也就是说，和传统的 Volcano 模型的一次取一行相比，这里会通过 selected 数组循环判断，一次取一批数据。这个 selected 数组通过调用 VectorizedFilter 即可从 children 中拿到，实验代码数据结构为 SelectionExec.selected。理解 Next 的关键就是当前 Executor 节点的 input 是通过其 children 的 Next 拿到，向量化的作用则是每次是拿一批数据而不单单只是一行。在熏昏最后最后执行 expression.VectorizedFilter(e.ctx, e.filters, e.inputIter, e.selected) 进行 selected 数组的更新即可。

### Part 2

实现并行 Hash Join 算法。

#### 1. 实现 fetchAndBuildHashTable

首先调用 newHashRowContainer 生成一个新的 hash table，然后通过循环调用 Next 从 inner table 中获取数据（chunk），再将数据放入 hash table，直至没有更多数据即可。主要逻辑如下：

```go
e.rowContainer = newHashRowContainer(e.ctx, int(e.innerSideEstCount), hCtx, initList)
for {
    chk := chunk.NewChunkWithCapacity(retTypes(e.innerSideExec), e.maxChunkSize)
    err := Next(ctx, e.innerSideExec, chk)
    if err != nil {
        return err
    }
    if chk.NumRows() == 0 {
        return nil
    }
    if err = e.rowContainer.PutChunk(chk); err != nil {
        return err
    }
}
```

#### 2. 实现 runJoinWorker

这部分的核心在于分清楚各个 Channel 的功能与收发数据的时机。负责拿取 outer table 的数据并 probe inner table 建立的 hash 表进行 join 操作，并返回交过到 main thread，以下是几个主要需要用的 channel 变量及其用法：

closeCh： 用于结束 loop 的通道，select 监测到该信号直接退出循环。 outerResultChs： outer fetcher 通过此通道来向不同的 join worker 分发任务。 outerChkResourceCh：返回当前 worker 接收任务用的通道以及本 worker 用的 chunk，循环利用 chunk，避免重新分配内存。 joinChkResourceCh： outer table 的数据收集完毕后，通过此通道返回 hash join 的结果。 弄清楚各个 Channel 之间的关系以后 只需在循环中反复调用 e.join2Chunk(workerID, probeSideResult, hCtx, joinResult, selected) 根据具体情况发送 Channel 即可。

### Part 3

本节主要实现 Hash Aggregate。有点类似于 MapReduce 的思路，即把整个计算任务分配给多个 PartialWorker，然后按照 Key 预聚合，再Shuffle 给不同的 FinalWorker 进行 Value 的聚合，最后再返回给 Main 组合成最终结果。

#### 1. consumeIntermData

循环通过 w.getPartialResult(sc, w.groupKeys, w.partialResultMap) 拿到数据，再将数据聚合到对应的` af.MergePartialResult(sctx, prs[j], finalPartialResults[i][j])` 的位置，实现难度不大。

#### 2. shuffleIntermData

使用 int(murmur3.Sum32([]byte(groupKey))) % finalConcurrency 算出某个 Key 应该发给哪个 final worker，然后通过 outputChs 将这些 groupKeysSlice[i] 与 w.partialResultsMap，发送给对应 worker 即可。

## Project6

Percolator 提交协议的两阶段提交分为 Prewrite 和 Commit：Prewrite 实际写入数据，Commit 让数据对外可见。 在对 Key 进行写操作时，需要将其发送到正确的 Region 上才能够处理。主要代码逻辑如下：

```go
for i, k := range keys {
    if lastLoc == nil || !lastLoc.Contains(k) {
        var err error
        lastLoc, err = c.LocateKey(bo, k)
        if err != nil {
            return nil, first, err
        }
        if filter != nil && filter(k, lastLoc.StartKey) {
            continue
        }
    }
    if i == 0 {
        first = lastLoc.Region
    }
    regionVerIDMap[lastLoc.Region] = append(regionVerIDMap[lastLoc.Region], k)
}
```

在 Prewrite 阶段，对于一个 Key 的操作会写入两条记录。1. Default CF 中存储实际的 KV 数据；2.Lock CF 中存储了锁，包括 Key 和时间戳信息，会在 Commit 成功时清理。

Lock Resolver 的职责就是应对一个事务在提交过程中遇到 Lock 的情况。

这里的 buildPrewriteRequest 需要将请求的 Mutations 进行封装，此外 PrimaryLock 应赋值为 c.primary() 以防止 primaryKey 为 0 的场景。

```go
for _, key := range batch.keys {
    req.Mutations = append(req.Mutations, &c.mutations[string(key)].Mutation)
}

```

在 handleSingleBatch 逻辑里与 actionPrewrite 基本类似，需要注意的是在 actionCleanup 执行后将 c.mu.committed 赋值为 false。

对于 tikvSnapshot.Get 方法，添加如下逻辑：

1. 如果事务正在提交，等待一段时间并重试； 2. 如果事务已经结束并且带有锁，则进行异常处理

```go
msBeforeExpired, _, err := s.store.lockResolver.ResolveLocks(bo, 0, []*Lock{lock})
if err != nil {
    return nil, err
}
if msBeforeExpired > 0 {
    err = bo.BackoffWithMaxSleep(BoTxnLock, int(msBeforeExpired), errors.Errorf("2PC get   lockedKeys: %d", 1))
    if err != nil {
        return nil, errors.Trace(err)
    }
}
```



## Comments and Suggestions

如下为本次实验的一些改进建议，部分内容已提交pr。

1. 在 Project1-Part2 中， [DecodeIndexKeyPrefix](https://github.com/pingcap-incubator/tinysql/blob/course/tablecodec/tablecodec.go#L95) 操作可以在以下[枚举值](https://github.com/pingcap-incubator/tinysql/blob/course/tablecodec/tablecodec.go)中添加一项，方便对含索引的内容部分进行操作，反之则需要在代码中插入常数偏移值，不便维护。


```go
const (
    idLen     = 8
    prefixLen = 1 + idLen /*tableID*/ + 2
    // RecordRowKeyLen is public for calculating average row size.
    RecordRowKeyLen       = prefixLen + idLen /*handle*/
    tablePrefixLength     = 1
    recordPrefixSepLength = 2
    indexPrefixSepLength  = 2 // Add here
)

```

2. 在 Project2 中，参考 [MySQL 的手册](https://dev.mysql.com/doc/refman/8.0/en/join.html)，建议添加 join_specification 相关的测试用例，或者修改 parser.y 中如下注释，避免学生产生误解。

```go
joined_table: {
    table_reference {[INNER | CROSS] JOIN | STRAIGHT_JOIN} table_factor [join_specification]
  | table_reference {LEFT|RIGHT} [OUTER] JOIN table_reference join_specification
  | table_reference NATURAL [INNER | {LEFT|RIGHT} [OUTER]] JOIN table_factor
}
```

3. 在 Project3 中，在 AutoGrading Machine 上的测试结果应该调整与 Project6 无关，避免测试结果与本地存在差异使学生产生疑惑。

4. Project6 中，ttlEquals.ttlEquals 的测试代码 c.Assert(int(math.Abs(float64(x-y))), LessEqual, 2) 在新版苹果电脑上运行结果为错误，但是提交测评机结果正常，原因是 arm64 下 math.Abs() 返回值也是 uint（这部分测试用例的判断逻辑写的并不是很好，完全可以手写 abs 函数避免强转为 float64 过程中可能的错误），对于 runtime.GOARCH 的检测需增加 “arm64”。这部分内容已经提交 [Pull Request #145](https://github.com/talent-plan/tinysql/pull/145)。
