---
title: "Redis Data Structure"
date: 2021-10-28T13:44:47+08:00
lastmod: 2021-10-28T13:44:47+08:00
draft: false
author: "Chasing1020"
comment: true
keywords: []
description: ""
tags: ['Redis']
categories: ['Note']
image: "redis.webp"
---

# Redis Data Structure

## 0. Redis Object

```C
struct RedisObject {
    int4 type;      // 4bits   \ 
    int4 enconding; // 4bits   = 4bytes
    int24 lru;      // 24bits /
    int32 refcount; // 4bytes
    void* ptr;      // 8bytes (64bit-system)
} robj;
```

RedisObject对于不通对象都是相同的，对于这样的结构，每个都需要16byte的空间。

Redis可以说是当代内存抠门学的设计典范之一。

-   下文的int4，int8代表位域，即type [member_name] : width ;来限制数据类型的宽度；

-   特定的结构体采用了\_\_attribute\_\_ ((\_\_packed\_\_))来取消优化对齐；

-   其中Generic (即\<T>) 借由TYPE_MASK的&运算来实现（当然对于C而言可以用宏，与C11中的\_Generic），这里当作伪代码使用。

## 1. SDS

Redis字符串简称SDS（Simple Dynamic String）。
C语言传统以NULL，即'\0'作为字符串结束符，这样使用strlen获取长度的复杂度是O(n)，所以Redis没有使用C的传统结束符，而是使用了SDS这样的数据结构。

```C
struct SDS<T> {
    T capacity;
    T len;
    byte flags;
    byte[] content;
}
```

这里的len和capacity类比于Go的[]byte切片，为了支持append内容，必然会涉及到分配新数组与复制的过程，将会带来不少的开销。

```C
sds sdscatlen(sds s, const void *t, size_len) {
    size_t curlen = sdslen(s);
    s = sdsMakeRoomFor(s, len);
    if (s == NULL) return NULL; // OOM
    mencpy(s+curlen, t, len);
    sdssetlen(s, curlen+len);
    s[curlen+len] = '\0';
    return s;
}
```

选择使用范型为了追求极限的性能优化，可以在较短时使用byte和short。

Redis设定String不能超过512MB，创建时的len和capacity一样长，不会分配多余空间。

## 2. Dict

```C
struct RedisDB{
    dict* dict;
    dict* expires;
    // ...
}
```

除了hash结构以外，Redis也有全局字典记录键值对。

```C
struct dictEntry {
    void* key;
    void* val;
    dictEntry* next;
}

struct dictht {
    dictEntry** table;
    long size;
    long used;
    // ...
}

struct dict {
    // ...
    dicht ht[2];
}
```

Redis的字典与Java的HashMap接近，采用分桶解决哈希冲突，即一维数组+二维链表的方式。

当hash表中元素等于一维数组的长度时，开始扩容，如果Redis在做bgsave，为了减少内存页的过多分离(COW)，就不会扩容，但是如果元素个数达到了5倍，还是会发生强制扩容。

扩容时，如果全部重新申请数组，并将链表元素挂在新的数组下，耗时O(n)，对于单线程而言很难接受，所以Redis采用渐进式扩容策略

```C
dictEntry *dictAddRaw(dict *d, void *key, dictEntry **existing){ 
    long index;
    dictEntry *entry;
    dictht *ht;
    if (dictisRehashing(d)) _dictRehashing(d);
    if ((index = _dictKeyIndex(d, key, dictHashKey(d,key), existing)) == -1)
        return NULL;
    ht = dictIsRehashing(d) ? &d->ht[1] : &d->ht[0];
    entry = zmalloc(sizeof(*entry))；
    entry->next = ht->table[index];
    ht->table[index] = entry;
    ht->used++;
    dictSetKey(d, entry, key);
    return entry;
}
```

此外，在客户端空闲时，Redis也设计了定时任务(databaseCron)，对字典进行主动搬迁。

Redis的Set采用的与字典相同的数据结构，不过是Value都为NULL(和Go一样)。

## 3. Zip List

当zset和hash对象在元素个数较少时，都在用压缩列表存储，能保证数据没有冗余。

```C
struct ziplist<T> {
    int32 zlbytes;
    int32 zltail_offset;
    int16 zllength;
    T[] entries;
    int8 zlend;
}
struct entry {
    int<var> prevlen;
    int<var> encoding;
    optional byte[] content;
}
```

zltial_offset用于记录最后一个元素的偏移量，prevlen用于记录前一个entry的长度，倒序遍历时可以快速定位到下一个元素位置。

encoding字段为记录编码信息，做了相当复杂的设计，类似于UTF8编码，采用了前缀位类区分内容。

optional代表该字段是可选的，对于很小的整数而言，可能内容已经inline到encoding的尾部了。

每次插入ziplist都需要使用realloc拓展内存，将先前的内容进行拷贝，或者在原地址拓展。这种操作对于大内存的效率不高，所以ziplist并不适合存储大元素。



## 4. Quick List

```C
struct listNode<T> {
    listNode *prev;
    listNode *next;
    T value;
}
struct list {
    listNode *head;
    listNoed *tail;
    long length;
}
```

早期的Redis在元素少时使用ziplist，元素多时使用linkedlist，这样前后指针就需要16字节，浪费内存空间。

```C
struct ziplist<T> {
    int32 zlbytes;
    int32 zltail_offset;
    int16 zllength;
    T[] entries;
    int8 zlend;
}
struct ziplist_compressed {
    int32 size;
    byte[] compressed_data;
}
struct quicklistNode {
    quicklistNode* prev;
    quicklistNode* next;
    ziplist* zl;
    int32 size;
    int16 count;
    int2 encoding;
    // ...
}
struct quicklist {
    quicklistNode* head;
    quicklistNode* tail;
    long count;
    int nodes;
    int compressDepth;
    // ...
}
```

每个ziplist长度为8kb，超过这个值会新建一个ziplist。一般而言，Redis默认的压缩深度为0，可以采用LZF算法对内存进行压缩，可以选择压缩深度。

## 5. Skip List

对于zset这样的复合结构，需要hash存储kv，也需要对score排序，即需要SkipList数据结构

```C
struct zslnode {
    string value;
    double score;
    zslnode*[] forwards;
    zslnode* backward;
}
struct zsl {
    zslnode* header;
    int maxLevel;
    map<string, zslnode*> ht; 
}
```

每次查询时，从header最高层开始，遍历找到最后一个比当前层要小的元素，之后发生降层。

插入时，设置分到第n层的概率为$(1/2)^n$，即每一层晋升率为50%，(官方的源码中晋升率为25%，相对扁平)。

更新时，Redis采用的策略是：先删除再插入，能够较好调整位置。

如果score相同，Redis会将排序指标设计为Value(strcmp)，来防止性能退化至O(n)。

## 6. List Pack

Redis5.0更新了listpack来对ziplist进行优化

```C
struct listpack<T> {
    int32 total_bytes;
    int16 size;
    T[]   entries;
    int8 end;
}
struct lpentry {
    int<var> encoding;
    optional byte[] content;
    int<var> length;
}
```

listpack采用varint进行编码，不同的长度编码可以是1-5中任意一个。解决了ziplist级联更新的行为，元素间独立，不会对后续有影响。不过由于ziplist使用过广泛，现在只有Stream采用了listpack。

## 7. Rax

Radix Tree类比HttpRouter中的TireTree，被用于存储消息队列，其中消息前缀即是时间戳+序号。

```C
struct raxNode {
    int1 isKey;
    int1 isNull;
    int1 isCompressed;
    int29 size;
    byte[] data;
}
```

rax在结构上并不是严格的RadixTree，如果中间节点有多个子节点，路由就是一个字符。如果只有一个叶子节点，那么路由键就是字符串。

```C
struct data {
    optional struct {
        byte[] childKey;
        raxNode* childNode;
    } child;
    optional string value;
}
struct data {
    byte[] childKeys;
    raxNode*[] childNodes;
    optional string value;
}
```

如果叶子节点只有一个，就是压缩结构。反之则是存在多个路由键，一个键对应一个字符。





