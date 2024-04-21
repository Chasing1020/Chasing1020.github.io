---
title: "Database Systems"
date: 2021-11-25T14:11:42+08:00
lastmod: 2021-11-25T14:11:42+08:00
draft: false
author: "Chasing1020"
comment: true
keywords: []
description: ""
tags: ['DataBase']
categories: ['Note']
image: "mysql.webp"
---

Reference Book: [**Database System Concepts Seventh Edition**](https://www.db-book.com/)

# 1. Relational Model

**Readings:** Chapters 1-2, 6

>   Definition

DataBase: Organized collection of inter-related data that models some aspect of the real-world.
Databases are the core component of most computer applications.

A database management system (DBMS) is software that allows applications to store and analyze information in a database.
A general-purpose DBMS is designed to allow the definition, creation, querying, update, and administration of databases.

Data Model: is a collection of concepts for describing the data in a database.
Schema: is a description of a particular collection of data, using a given data model.

>   Kinds of DataModels

| Type                                | Description              |
| ----------------------------------- | ------------------------ |
| Relational                          | Most DBMSs               |
| K-V, Graph, Document, Column-family | NoSQL                    |
| Array / Matrix                      | Machine Learning         |
| Hierarchical, Network, Multi-Value  | Obsolete / Legacy / Rare |

>   Relational Model

**Structure**: The definition of the database's relations and their contents.
**Integrity**: Ensure the database's contents satisfy constraints.
**Manipulation**: Programming interface for accessing and modifying a database's contents.

A relation is an unordered set that contain the relationship of attributes that represent entities.

-   A relation's primary key uniquely identifies a single tuple.

-   foreign key specifies that an attribute from one relation has to map to a tuple in another relation.

>   Data Manipulation Languages

Methods to store and retrieve information from a database.

**Procedural:** (Relational Algebra)

-  The query specifies the (high-level) strategythe DBMS should use to find the desired result.

**Non-Procedural (Declarative):** (Relational Calculus)

-  The query specifies only what data is wanted and not how to find it.

>   Relational Algebra

|Symbol|Operation|Description|
| ----- | -- |-- |
| σ | Select | Choose a subset of the tuples from a relation that satisfies a selection predicate. |
|π|Projection|Generate a relation with tuples that contains only the specified attributes.|
| ⋃ |Union|Generate a relation that contains all tuples that appear in either only one or both input relations.|
| ⋂ |Intersection|Generate a relation that contains only the tuples that appear in both of the inputrelations.|
| - |Difference|Generate a relation that contains only the tuples that appear in the first and not the second of the input relations.|
| × |Product| Generate a relation that contains all possible combinations of tuples from the input relations. |
| ⋈ |Join|Generate a relation that contains all tuples that are a combination of two tuples (one from each input relation) with a common value(s) for one or more attributes.|

Extra Operations:

Rename (ρ), Assignment (R←S), Duplicate Elimination (δ), Aggregation (γ), Sorting (τ), Division (R÷S). 

The relational model is independent of any query language implementation. **SQL** is the *de facto* standard (many dialects).

# 2. Advanced SQL

**Readings:** Chapters 3-5

>   SQL Standard

ANSI Standard in 1986. ISO in 1987. Structured Query Language

**SQL:2016**: JSON, Polymorphic tables

**SQL:2011**: Temporal DBs, Pipelined DML 

**SQL:2008**: Truncation, Fancy Sorting

**SQL:2003**: XML, Windows, Sequences, Auto-Gen IDs.

**SQL:1999**: Regex, Triggers, OO

Data Manipulation Language (DML): SELECT, INSERT, UPDATE, and DELETE statements.

Data Definition Language (DDL): Schema definitions for tables, indexes, views, and other objects.

Data Control Language (DCL): Security, access controls.

-   Important: SQL is based on **bags**(duplicates) not **sets**(no duplicates).

>   Aggregates

Functions that return a single value from a bag of tuples. Aggregate functions can (almost) only be used in the **SELECT** output list.

**AVG(col)**: Return the average col value.

**MIN(col)**: Return minimum col value.

**MAX(col)**: Return maximum col value.

**SUM(col)**: Return sum of values in col.

**COUNT(col)**: Return # of values for col.

>   Group by

Project tuples into subsets and calculate aggregates againsteach subset. 

Non-aggregated values in **SELECT** output clause must appear in **GROUPBY** clause.

Filters results based on aggregation computation. Like a **WHERE** clause for a **GROUPBY**.

>   String / Date / Time Operations

|            | String Case   | String Quotes  |
| ---------- | ------------- | -------------- |
| **SQL-92** | **Sensitive** | **SingleOnly** |
| Postgres   | Sensitive     | SingleOnly     |
| MySQL      | Insensitive   | Single/Double  |
| SQLite     | Sensitive     | Single/Double  |
| DB2        | Sensitive     | SingleOnly     |
| Oracle     | Sensitive     | Single Only    |

**LIKE** is used for string matching. String-matching operators.

'%' Matches any substring (including empty strings). '_' Match any one character.

SQL-92 defines string functions, whereas many DBMSs also have their own unique functions.

SQL standard says to use **||** operator to concatenate two or more strings together.

Operations to manipulate and modify **DATE**/**TIME** attributes.

Can be used in both output and predicates.

>   Output Redirection

Store query results in another table: 1.Table must not already be defined. 2.Table will have the same # of columns with the same types as the input.

Insert tuples from query into another table:

- Inner **SELECT** must generate the same columns as the target table.

- DBMSs have different options/syntax on what to do with integrity violations (e.g., invalid duplicates).

>   Output Control

Order the output tuples by the values in one or more of their columns.

Limit the # of tuples returned in output. Can set an offset to return a "range"

>   Nested Queries

Queries containing other queries.

They are often difficult to optimize. 

Inner queries can appear (almost) anywhere in query.

**ALL**: Must satisfy expression for all rows in the sub-query.

**ANY**: Must satisfy expression for at least one row in the sub-query.

**IN**: Equivalent to '**=ANY()**' .

**EXISTS**: At least one row is returned.

>   Window functions

Performs a "sliding" calculation across a set of tuples that are related.

Like an aggregation but tuples are not grouped into a single output tuples.

# 3. DataBase Storage (1)

**Readings:** Chapter 10.1-10.2, 10.5-10.6

>   Storage

Volatile Devices: (CPU Registers, CPU Caches, DRAM)

-   Volatile means that if you pull the power from the machine, then the data is lost. 
-   Volatile storage supports fast random access with byte-addressable locations. This means that the program can jump to any byte address and get the data that is there.
-   For our purposes, we will always refer to this storage class as "memory."

Non-Volatile Devices: (SSD, HDD, Network Storage)

-   Non-volatile means that the storage device does not require continuous power in order for the device to retain the bits that it is storing. 
-   It is also block/page addressable. This means that in order to read a value at a particular offset, the program first has to load the 4 KB page into memory that holds the value the program wants to read. 
-   Non-volatile storage is traditionally better at sequential access (reading multiple contiguous chunks of data at the same time). 
-   We will refer to this as "disk". We will not make a (major) distinction between solid-state storage (SSD) and spinning hard drives (HDD).

The DBMS assumes that the primary storage location of the database is on non-volatile disk.

The DBMS's components manage the movement of data between non-volatile and volatile storage.

Random access on non-volatile storage is usually much slower than sequential access. So DBMS will want to maximize sequential access.

-   Algorithms try to reduce number of writes to random pages so that data is stored in contiguous blocks.

-   Allocating multiple pages at the same time is called an extent.

>   DBMS vs OS

It is possible to use the OS by using mmap. Regarding correctness and performance reasons, mmap hits a page fault, the process will be blocked:

-   You never want to use mmap in your DBMS if you need to write. 

-   The DBMS (almost) always wants to control things itself and can do a better job at it since it knows more about the data being accessed and the queries being processed. 

It is possible to use the OS by using: 

-   madvise: Tells the OS know when you are planning on reading certain pages. 
-   mlock: Tells the OS to not swap memory ranges out to disk. 
-   msync: Tells the OS to flush memory ranges out to disk.

Why not use the OS? DBMS (almost) always wants to control things itself and can do a better job than the OS.

1.   Flushing dirty pages to disk in the correct order.

2.   Specialized prefetching.

3.   Buffer replacement policy.

4.   Thread/process scheduling.

>   Storage Manager

The DBMS’s storage manager is responsible for managing a database’s files. It represents the files as a collection of pages. It also keeps track of what data has been read and written to pages as well how much free space there is in these pages.

>   DataBase Pages

The DBMS organizes the database across one or more files in fixed-size blocks of data called pages. 

1.   Pages can contain different kinds of data (tuples, indexes, etc). 

2. Most systems will not mix these types within pages. 

3.   Some systems will require that pages are self-contained, meaning that all the information needed to read each page is on the page itself. 

Each page is given a unique identifier. If the database is a single file, then the page id can just be the file offset. Most DBMSs have an indirection layer that maps a page id to a file path and offset. The upper levels of the system will ask for a specific page number. Then, the storage manager will have to turn that page number into a file and an offset to find the page. 

Most DBMSs uses fixed-size pages to avoid the engineering overhead needed to support variable-sized pages. For example, with variable-size pages, deleting a page could create a hole in files that the DBMS cannot easily fill with new pages. There are three concepts of pages in DBMS: 

1.   Hardware page (usually 4 KB). 
2.   OS page (4 KB). 
3.   Database page (0.5-16 KB). (4KB: SqLite, DB2, Oracle; 8KB: SQL Server, PostgreSQL; 16KB: MySQL)

The storage device guarantees an atomic write of the size of the hardware page. 

A hardware page is the largest block of data that the storage device can guarantee failsafe writes. So if the hardware page is 4 KB and the system tries to write 4 KB to the disk, either all 4 KB will be written, or none of it will. 

This means that if our database page is larger than our hardware page, the DBMS will have to take extra measures to ensure that the data gets written out safely since the program can get partway through writing a database page to disk when the system crashes.

Example: MySQL Doublewrite Buffer: The doublewrite buffer is a storage area where `InnoDB` writes pages flushed from the buffer pool before writing the pages to their proper positions in the `InnoDB` data files. If there is an operating system, storage subsystem, or unexpected [**mysqld**](https://dev.mysql.com/doc/refman/5.7/en/mysqld.html) process exit in the middle of a page write, `InnoDB` can find a good copy of the page from the doublewrite buffer during crash recovery.

Although data is written twice, the doublewrite buffer does not require twice as much I/O overhead or twice as many I/O operations. Data is written to the doublewrite buffer in a large sequential chunk, with a single `fsync()` call to the operating system

>   DataBase Heap

A heap file is an unordered collection of pages with tuples that are stored in random order.

1.   Create / Get / Write / Delete Page

2.   Must also support iterating over all pages.

Maintain a header page at the beginning of the file that stores two pointers: HEAD of the free page list and the data page list.

Each page keeps track of how many free slots they currently have.

The DBMS maintains special pages that tracks the location of data pages in the database files. The directory also records the number of free slots per page. Must make sure that the directory pages are in sync with the data pages.

>   Page Layout

Every page contains a header of meta-data about the page's contents. Page Size, Checksum, DBMS Version, Transaction Visibility, Compression Information.

The most common layout scheme is called slotted pages. The slot array maps "slots" to the tuples' starting position offsets. The header keeps track of: 1. The # of used slots 2. The offset of the starting location of the last slot used.

Each tuple is assigned a unique record identifier. Most common: **page_id**+ **offset/slot**, Can also contain file location info. 

Each tuple is prefixed with a header that contains meta-data about it. Visibility info (concurrency control), Bit Map for **NULL** values.

DBMS can physically **denormalize** (e.g., "pre join") related tuples and store them together in the same page.

# 4. DataBase Storage (2)

**Readings:** Chapter 10.5-10.8

>   Data Represtentation

Instead of storing tuples in pages, the DBMS only stores log records.

The system appends log records to the file of how the database was modified:

1. Inserts store the entire tuple.

2.   Deletes mark the tuple as deleted.

3.   Updates contain the delta of just the attributes that were modified.

To read a record, the DBMS scans the log backwards and "recreates" the tuple to find what it needs. Build indexes to allow it to jump to locations in the log. And periodically compact the log.

Compaction coalesces larger log files into smaller files by removing unnecessary records.

Numeric data types with (potentially) arbitrary precision and scale. Used when rounding errors. Many different implementations. Example: NUMERIC, DECIMAL

-   Example: Store in an exact, variable-length binary representation with additional meta-data.

-   Can be less expensive if you give up arbitrary precision.

Most DBMSs don't allow a tuple to exceed the size of a single page.

To store values that are larger than a page, the DBMS uses separate **overflow** storage pages.

-   Postgres: TOAST (>2KB)

-   MySQL: Overflow (>1/2 size of page)

-   SQL Server: Overflow (>size of page)

Some systems allow you to store a really largevalue in an external file.Treated as a **BLOB** type.

-   Oracle: **BFILE** data type

-   Microsoft: **FILESTREAM** data type

The DBMS **can not** manipulate the contents of an external file. No durability protections. No transaction protections.

>   System Catalogs

A DBMS stores meta-data about databases in its internal catalogs.

-   Tables, columns, indexes, views; Users, permissions; Internal statistics

Almost every DBMS stores the database's catalog inside itself (i.e., as tables). You can query the DBMS’s internal **INFORMATION_SCHEMA** catalog to get info about the database.

-   ANSI standard set of read-only views that provide info about all the tables, views, columns, and procedures in a database

>   DataBase WorkLoads

**On-Line Transaction Processing (OLTP)**: 

-   Fast operations that only read/update a small amount of data each time. 

-   Simple queries that read/update a small amount of data that is related to a single entity in the database.
-   This is usually the kind of application that people build first.

**On-Line Analytical Processing (OLAP)**: 

-   Complex queries that read a lot of data to compute aggregates.

-   Complex queries that read large portions of the database spanning multiple entities.

**Hybrid Transaction + Analytical Processing**: OLTP + OLAP together on the same database instance

Ideal for OLTP workloads where queries tend to operate only on an individual entity and insert-heavy workloads.

The relational model does **not** specify that we have to store all of a tuple's attributes together in a single page.

>   N-ARY Storage Model

The DBMS can store tuples in different ways that are better for either OLTP or OLAP workloads.

We have been assuming the **n-ary storage model**(aka "row storage") so far this semester. 

Example: MySQL, PostgreSQL

**Advantages**

1.   Fast inserts, updates, and deletes.

2.   Good for queries that need the entire tuple.

**Disadvantages**

1.   Not good for scanning large portions of the table and/or a subset of the attributes.

Ideal for OLAP workloads where read-only queries perform large scans over a subset of the table’s attributes.

>   Decomposition Storage Model

The DBMS stores the values of a single attribute for all tuples contiguously in a page(aka "column store").

Ideal for OLAP workloads where read-only queries perform large scans over a subset of the table’s attributes.

**Advantages**

1. Reduces the amount wasted I/O because the DBMS only reads the data that it needs.

2.   Better query processing and data compression (more on this later).

**Disadvantages**

1.   Slow for point queries, inserts, updates, and deletes because of tuple splitting/stitching.

>   Conclusion

It is important to choose the right storage model for the target workload:

1.   OLTP = Row Store

2.   OLAP = Column Store

# 5. Buffer Pools

**Readings:** Chapter 10.5-10.8

>   Meta Data

Memory region organized as an array of fixed-size pages.An array entry is called a **frame**.

When the DBMS requests a page, an exact copy is placed into one of these frames.

The **page table** keeps track of pages that are currently in memory.

Also maintains additional meta-data per page:

1.   Dirty Flag, 2. Pin/Reference Counter

>   Locks and Latches

**Locks:**

1.   Protects the database's logical contents from other transactions.

2.   Held for transaction duration.

3. Need to be able to rollback changes.

**Latches:**

1.   Protects the critical sections of the DBMS's internal data structure from other threads.

2.   Held for operation duration.

3.   Do not need to be able to rollback changes.

>   Page directory

The **page directory** is the mapping from page ids to page locations in the database files.

-   All changes must be recorded on disk to allow the DBMS to find on restart.

The **page table** is the mapping from page ids to a copy of the page in buffer pool frames.

-   This is an in-memory data structure that does not need to be stored on disk.

**Global Policies:**

-   Make decisions for all active transactions.

**Local Policies:**

-   Allocate frames to a specific transactions without considering the behavior of concurrent transactions s.

-   Still need to support sharing pages.

>   Buffer Pool Optimizations

The DBMS does not always have a single buffer pool for the entire system.

-   Multiple buffer pool instances

-   Per-database buffer pool

-   Per-page type buffer pool

Helps reduce latch contention and improve locality.

- Embed an object identifier in record ids and then maintain a mapping from objects to specific buffer pools.

-   Hash the page id to select whichbuffer pool to access.

>    Prefetching

The DBMS can also prefetch pages based on a query plan.

1.   Sequential Scans, 2. Index Scans

>   Scan Sharing

Queries can reuse data retrieved from storage or operator computations.

-   Also called synchronized scans.

-   This is different from result caching.

Allow multiple queries to attach to a single cursor that scans a table.

- Queries do not have to be the same.

-   Can also share intermediate results.

If a query wants to scan a table and another query is already doing this, then the DBMS will attach the second query's cursor to the existing cursor.

The sequential scan operator will not store fetched pages in the buffer pool to avoid overhead.

- Memory is local to running query.

-   Works well if operator needs to read a large sequence of pages that are contiguous on disk.

-   Can also be used for temporary data (sorting, joins).

>   OS Page Caching

Most disk operations go through the OS API.

Unless you tell it not to, the OS maintains its own filesystem cache (i.e., the page cache).

Most DBMSs use direct I/O (**O_DIRECT**) to bypass the OS’s page cache.

- Redundant copies of pages.

- Different eviction policies.

- Loss of control over file I/O.

>   Buffer Replacement Policies

When the DBMS needs to free up a frame to make room for a new page, it must decide which page to evictfrom the buffer pool.

Goals: Correctness, Accuracy, Speed, Meta-data overhead

Maintain a single timestamp of when each page was last accessed.

When the DBMS needs to evict a page, select the one with the oldest timestamp.

-   Keep the pages in sorted order to reduce the search time on eviction.

Approximation of LRU that does not need a separate timestamp per page.

-   Each page has a reference bit.

-   When a page is accessed, set to 1.

Organize the pages in a circular buffer with a "clock hand":

- Upon sweeping, check if a page's bit is set to 1.

- If yes, set to zero. If no, then evict.

**Problems**

LRU and CLOCK replacement policies are susceptible to sequential flooding.

- A query performs a sequential scan that reads every page.

- This pollutes the buffer pool with pages that are read once and then never again.

In some workloads the most recently used page is the most unneeded page.

Track the history of last *K*references to each page as timestamps and compute the interval between subsequent accesses.

The DBMS then uses this history to estimate the next time that page is going to be accessed.

>   Localization

The DBMS chooses which pages to evict on a per transactions /query basis. This minimizes the pollution of the buffer pool from each query.

- Keep track of the pages that a query has accessed.

Example: Postgres maintains a small ring buffer that is private to the query.

The DBMS knows about the context of each page during query execution.

It can provide hints to the buffer pool on whether a page is important or not.

>   Diary Pages

**FAST:** If a page in the buffer pool is notdirty, then the DBMS can simply "drop" it.

**SLOW:** If a page is dirty, then the DBMS must write back to disk to ensure that its changes are persisted.

Trade-off between fast evictions versus dirty writing pages that will not be read again in the future.

>   Other Memory Pools

The DBMS needs memory for things other than just tuples and indexes.

These other memory pools may not always backed by disk. Depends on implementation.

-   Sorting + Join Buffers

-   Query Caches

-   Maintenance Buffers

- Log Buffers

-   Dictionary Caches

# 6. Hash Tables

**Readings:** Chapter 11.6-11.7

>   Definition

A **hash table** implements an unordered associative array that maps keys to values.

It uses a **hash function** to compute an offset into the array for a given key, from which the desired value can be found.

Space Complexity: **O(n)** Time Complexity:

- Average: **O(1)**

- Worst: **O(n)**

To find an entry, mod the key by the number of elements to find the offset in the array.

>   Hash Function

We do not want to use a crypto graphic hash function for DBMS hash tables.

We want something that is fast and has a low collision rate.
| Name                  | Usage                                                 |
| --------------------- | ----------------------------------------------------- |
| CRC-64(1975)          | Used in networking for error detection.               |
| MurmurHash(2008)      | Designed as a fast, general-purpose hash function.    |
| Google CityHash(2011) | Designed to be faster for short keys (<64 bytes).     |
| Facebook XXHash(2012) | From the creator of zstdcompression.                  |
| Google FarmHash(2014) | Newer version of CityHashwith better collision rates. |

>   Static Hash Shemes

1.   Lingering Probing Hashing

Resolve collisions by linearly searching for the next free slot in the table.

- To determine whether an element is present, hash to a location in the index and scan for it.

- Must store the key in the index to know when to stop scanning.

- Insertions and deletions are generalizations of lookups.

2.   Robin Hood Hashing

Variant of linear probe hashing that steals slots from "rich" keys and give them to "poor" keys.

- Each key tracks the number of positions they are from where its optimal position in the table.

- On insert, a key takes the slot of another key if the first key is farther away from its optimal position than the second key.

```C++
iterator find(const FindKey& key) {
  size_t index = hash_policy.index_for_hash(hash_object(key), num_slots_minus_one);
  EntryPointer it = entries + ptrdiff_t(index);
  for (int8_t distance = 0; it->distance_from_desired >= distance;
     ++distance, ++it) {
    if (compares_equal(key, it->value)) return {it};
  }
  return end();
}
```

3.   Cuckoo Hasing

Use multiple hash tables with different hash function seeds.

- On insert, check every table and pick anyone that has a free slot.

- If no table has a free slot, evict the element from one of them and then re-hash it find a new location.

Look-ups and deletions are always **O(1)** because only one location per hash table is checked.

>   Dynamic hashing Shemes

The previous hash tables require the DBMS to know the number of elements it wants to store.

- Otherwise, it must rebuild the table if it needs to grow/shrink in size.

Dynamic hash tables resize themselves on demand.

1.   Chained Hashing

Maintain a linked list of buckets for each slot in the hash table.

Resolve collisions by placing all elements with the same hash key into the same bucket.

- To determine whether an element is present, hash to its bucket and scan for it.

- Insertions and deletions are generalizations of lookups.

2.   Extendible Hashing

Chained-hashing approach where we split buckets instead of letting the linked list grow forever.

Multiple slot locations can point to the same bucket chain.

Reshuffle bucket entries on split and increase the number of bits to examine.

- Data movement is localized to just the split chain.

3.   Linear Hashing

The hash table maintains a pointer that tracks the next bucket to split.

- When any bucket overflows, split the bucket at the pointer location.

Use multiple hashes to find the right bucket for a given key.

Can use different overflow criterion:

- Space Utilization

- Average Length of Overflow Chains

# 7. Tree Indexes

**Readings:** Chapter 11.1-11.4

A **table index** is a replica of a subset of a table's attributes that are organized and/or sorted for efficient access using those attributes.

The DBMS ensures that the contents of the table and the index are logically synchronized.

There is a trade-off regarding the number of indexes to create per database.

- Storage Overhead

- Maintenance Overhead

People also use the term to generally refer to a class of balanced tree data structures:

- B-Tree(1971), B+Tree(1973), B\*Tree(1977?), Blink-Tree(1981)

A **B+Tree** is a self-balancing tree data structure that keeps data sorted and allows searches, sequential access, insertions, and deletions in **O(log n)**. 

- Generalization of a binary search tree, since a node can have more than two children. 

- Optimized for systems that read and write large blocks of data.

>   B+ Tree Properties

A B+Tree is an M-way search tree with the following properties: 

- It is perfectly balanced (i.e., every leaf node is at the same depth in the tree)

- Every node other than the root is at least half-full **M/2-1 ≤ #keys ≤ M-1**

- Every inner node with **k** keys has **k+1** non-null children

>   Nodes

Every B+ Treenode is comprised of an array of key/value pairs.

It contains level, slots, previous, next, sorted keys and values.

- The keys are derived from the attribute(s) that the index is based on. 

- The values will differ based on whether the node is classified as an **inner node** or a **leaf node.**

The arrays are (usually) kept in sorted key order.

Values Approach: 

1.   Record IDs(Used: PostgreSQL, SQLServer, DB2, Oracle): A pointer to the location of the tuple to which the index entry corresponds.
2.   Tuple Data(Used: SQLite, SQLServer, MySQL, Oracle): The leaf nodes store the actual contents of the tuple. Secondary indexes must store the Record ID as their values.

>   B Tree vs B+Tree

The original **B-Tree** from 1972 stored keys and values in all nodes in the tree.

- More space-efficient, since each key only appears once in the tree.

A **B+Tree** only stores values in leaf nodes. Inner nodes only guide the search process.

>   B+Tree Insert

Find correct leaf node **L**.Put data entry into **L**in sorted order.

If **L** has enough space, done!

Otherwise, split **L** keys into **L** and a new node **L2**

- Redistribute entries evenly, copy up middle key.

- Insert index entry pointing to **L2** into parent of **L**.

To split inner node, redistribute entries evenly, but push up middle key. 

Duplicate Keys

**Approach #1: Append Record ID**

- Add the tuple's unique Record ID as part of the key to ensure that all keys are unique.

- The DBMS can still use partial keys to find tuples.

**Approach #2: Overflow Leaf Nodes**

- Allow leaf nodes to spill into overflow nodes that contain the duplicate keys.

- This is more complex to maintain and modify.

>   B+Tree Delete

Start at root, find leaf **L** where entry belongs. Remove the entry. If **L**is at least half-full, done! If **L** has only **M/2-1** entries, then: 

- Try to re-distribute, borrowing from sibling (adjacent node with same parent as **L**).

- If re-distribution fails, merge **L** and sibling.

If merge occurred, must delete entry (pointing to **L** or sibling) from parent of **L**.

Some DBMSs do not always merge nodes when they are half full.

Delaying a merge operation may reduce the amount of reorganization.

It may also be better to just let smaller nodes exist and then periodically rebuild entire tree.

>   Clustered Indexs

The table is stored in the sort order specified by the primary key.

- Can be either heap-or index-organized storage.

Some DBMSs always use a clustered index.

- If a table does not contain a primary key, the DBMS will automatically make a hidden primary key.

Other DBMSs cannot use them at all.

Traverse to the left-most leaf page and then retrieve tuples from all leaf pages.

This will always be better than external sorting.

Retrieving tuples in the order they appear in a non-clustered index can be very inefficient.

The DBMS can first figure out all the tuples that it needs and then sort them based on their Page ID.

>   Node Size

The slower the storage device, the larger the optimal node size for a B+Tree.

- HDD: ~1MB

- SSD: ~10KB 

- In-Memory: ~512B

Optimal sizes can vary depending on the workload

- Leaf Node Scans vs. Root-to-Leaf Traversals.

>   Merge Threshold

Some DBMSs do not always merge nodes when they are half full.

Delaying a merge operation may reduce the amount of reorganization.

It may also be better to just let smaller nodes exist and then periodically rebuild entire tree.

>   Optimizations

1.   Perfix Compression

Sorted keys in the same leaf node are likely to have the same prefix.

Instead of storing the entire key each time, extract common prefix and store only unique suffix for each key.

2.   Deduplication

Non-unique indexes can end up storing multiple copies of the same key in leaf nodes.

The leaf node can store the key once and then maintain a list of tuples with that key (similar to what we discussed for hash tables).

3.   Bulk insert

The fastest way to build a new B+Treefor an existing table is to first sort the keys and then build the index from the bottom up.

# 8. Index Concurrency Control

**Readings:** Chapter 15.10

A **concurrency control** protocol is the method that the DBMS uses to ensure "correct" results for concurrent operations on a shared object.

|          | Locks                               | Latches                   |
| -------- | ----------------------------------- | ------------------------- |
| Separate | User Transactions                   | Threads                   |
| Protect  | Database Contents                   | In-Memory Data Structures |
| During   | Entire Transactions                 | Critical Sections         |
| Modes    | Shared,Exclusive, Update, Intention | Read, Write               |
| Deadlock | Detection & Resolution              | Avoidance                 |
| by       | Waits-for, Timeout, Aborts          | Coding Discipline         |
| Keptin   | LockManager                         | Protected Data Structure  |

>   Latch Mode

**Read Mode**

- Multiple threads can read the same object at the same time.

-   A thread can acquire the read latch if another thread has it in read mode.

**Write Mode**

-   Only one thread can access the object.

-   A thread cannot acquire a write latch if another thread has it in any mode.

>   Approach

1.   Blocking OS Mutex

Simple to use; Non-scalable (about 25ns per lock/unlock invocation); 

Example: std::mutex.

Reference: https://en.wikipedia.org/wiki/Futex

2.   Test-and-Set Spin Latch (TAS)

Very efficient (single instruction to latch/unlatch); Non-scalable, not cache-friendly, not OS-friendly; 

Example: std::atomic\<T\>. "do not use spinlocks in user space, unless you actually know what you're doing."

3.   Reader-Writer Latches

Allows for concurrent readers;
Must manage read/write queues to avoid starvation;
Can be implemented on top of spin latches.

>   Hash Table Latch

Easy to support concurrent access due to the limited ways threads access the data structure.

-   All threads move in the same direction and only access a single page/slot at a time.

-   Deadlocks are not possible.

To resize the table, take a global write latch on the entire table (e.g., in the header page).

1.   Approach #1: Page Latches: 

     Each page has its own reader-writer latch that protects its entire contents.

     Threads acquire either a read or write latch before they access a page.

2.   Approach #2: Slot Latches

     Each slot has its own latch.

     Can use a single-mode latch to reduce meta-data and computational overhead.

Atomic instruction that compares contents of a memory location **M** to a given value **V**

-   If values are equal, installs new given value **V’** in **M**

-   Otherwise, operation fails

>   B+ Tree Concurrency Control

We want to allow multiple threads to read and update a B+Treeat the same time.

We need to protect against two types of problems: 

-   Threads trying to modify the contents of a node at the same time.

-   One thread traversing the tree while another thread splits/merges nodes.

Protocol to allow multiple threads to access/modify B+Treeat the same time.

**Basic Idea:**

-   Get latch for parent

-   Get latch for child

-   Release latch for parent if "safe"

A **safe node** is one that will not split or merge when updated.

- Not full (on insertion)

-   More than half-full (on deletion)

**Find**: Start at root and go down; repeatedly,

-   Acquire **R** latch on child

- Then unlatch parent

**Insert/Delete**: Start at root and go down, obtaining **W** latches as needed. Once child is latched, check if it is safe:

-   If child is safe, release all latches on ancestors

>   Better Latching Algorithm

It depends on it that most modifications to a B+ Tree will not require a split or merge.

**Search**: Same as before.

**Insert/Delete**: 

-   Set latches as if for search, get to leaf, and set **W** latch on leaf.

-   If leaf is not safe, release all latches, and restart thread using previous insert/delete protocol with write latches.

This approach optimistically assumes that only leaf node will be modified; if not, **R** latches set on the first pass to leaf are wasteful.

>   Observation

The threads in all the examples so far have acquired latches in a "top-down" manner.

-   A thread can only acquire a latch from a node that is below its current node.

-   If the desired latch is unavailable, the thread must wait until it becomes available.

>   Leaf Node Scans

Latches do not support deadlock detection or avoidance. The only way we can deal with this problem is through coding discipline.

The leaf node sibling latch acquisition protocol must support a "no-wait" mode.

The DBMS's data structures must cope with failed latch acquisitions.

# 9. Sorting & Aggregations

**Readings:** Chapter 12.4-12.5

Just like it cannot assume that a table fits entirely in memory, a disk-oriented DBMS cannot assume that query results fit in memory.

We are going to rely on the buffer pool to implement algorithms that need to spill to disk.

We are also going to prefer algorithms that maximize the amount of sequential I/O.

>   External Merge Sort

Divide-and-conquer algorithm that splits data into separate **runs**, sorts them individually, and then combines them into longer sorted runs.

1.   Sorting

-   Sort chunks of data that fit in memory and then write back the sorted chunks to a file on disk.

2. Merging

-   Combine sorted runs into larger chunks. 

The DBMS has a finite number of **B** buffer pool pages to hold input and output data.

Steps: 

1. Read all B pages of the table into memory;

2.   Sort pages into runs and write them back to disk;

3.   Recursively merge pairs of runs into runs twice as long.
4.   Uses three buffer pages (2 for input pages, 1 for output)

In each pass, we read and writeevery page in the file.

$Number \ of \ passes \ =\  1 + ⌈\log_2N⌉ $

$Total\ I/O\ cost\ =\ 2N \times (Nums \ of\ passes)$

This algorithm only requires three buffer pool pages to perform the sorting ($B=3$): Two input pages, one output page.

But even if we have more buffer space available ($B > 3$), it does not effectively utilize them if the worker must block on disk I/O. Although we can get the equation: 

$Number\ of\ passes\ with\ N\ pages\ and\ B\ buffer\ pools\ =\ 1+⌈\log_B-1⌈N/ B⌉⌉$

>   Double Buffering Optimization

Prefetch the next run in the background and store it in a second buffer while the system is processing the current run.

-   Reduces the wait time for I/O requests at each step by continuously utilizing the disk.

>   B+ Trees for Sorting

If the table that must be sorted already has a B+Tree index on the sort attribute(s), then we can use that to accelerate sorting.

Retrieve tuples in desired sort order by simply traversing the leaf pages of the tree.

1.   Clustered B+ Tree

Traverse to the left-most leaf page, and then retrieve tuples from all leaf pages.

This is always better than external sorting because there is no computational cost, and all disk access is sequential.

2.   Unclustered B+ Tree

Chase each pointer to the page that contains the data.

This is almost always a bad idea. In general, one I/O per data record. 

>   Aggregations

Collapse values for a single attribute from multiple tuples into a single scalar value.

What if we do not need the data to be ordered?

-   Forming groups in **GROUPBY** (no ordering)

-   Removing duplicates in **DISTINCT** (no ordering)

Hashing is a better alternative in this scenario.

-   Only need to remove duplicates, no need for ordering.

-   Can be computationally cheaper than sorting.

Populate an ephemeral hash table as the DBMS scans the table. For each record, check whether there is already an entry in the hash table:

DISTINCT: Discard duplicate

GROUPBY: Perform aggregate computation

>   External Hashing Aggregate

**Phase #1 Partition**

-   Divide tuples into buckets based on hash key

- Write them out to disk when they get full

**Phase #2 ReHash**

-   Build in-memory hash table for each partition and compute the aggregation

>   Partition

Use a hash function $h_1$ to split tuples into **partitions** on disk.

-   A partition is one or more pages that contain the set of keys with the same hash value. 

-   Partitions are “spilled” to disk via output buffers.

Assume that we have B buffers.

We will use B-1 buffers for the partitions and 1 buffer for the input data.

>   ReHash

For each partition on disk:

- Read it into memory and build an in-memory hash table based on a second hash function $h_2$.

-   Then go through each bucket of this hash table to bring together matching tuples.

This assumes that each partition fits in memory.

# 10. Join Algorithms

**Readings:** Chapter 12.4-12.6

We will focus on performing binary joins (two tables) using **inner equi join** algorithms.

-   These algorithms can be tweaked to support other joins.

-   Multi-way joins exist primarily in research literature.

In general, we want the smaller table to always be the left table ("outer table") in the query plan.

**Decision #1: Output**

-   What data does the join operator emit to its parent operator in the query plan tree?

**Decision #2: Cost Analysis Criteria**

-   How do we determine whether one join algorithm is better than another?

Subsequent operators in the query plan never need to go back to the base tables to get more data.

>   Materialization

**Early Materialization:**

-   Copy the values for the attributes in outer and inner tuples into a new output tuple.

Subsequent operators in the query plan never need to go back to the base tables to get more data.

**Late Materialization:**

-   Only copy the joins keys along with the Record IDs of the matching tuples.

Ideal for column stores because the DBMS does not copy data that is not needed for the query.

>   Analysis Criteria

Assume:

-   **M** pages in table **R**, **m** tuples in **R**

-   **N** pages in table **S**, **n** tuples in **S**

**Cost Metric:** **# of IOs to compute join**

We will ignore output costs since that depends on the data and we cannot compute that yet.


$R\ ⨝\ S$ is the most common operation and thus must be carefully optimized.

$R\ \times\ S$ followed by a selection is inefficient because the cross-product is large.

There are many algorithms for reducing join cost, but no algorithm works well in all scenarios.

>   Nested Loop Join

1.   Stupid: For every tuple in **R**, it scans **S**once 
     Cost: $M + (m\ \times\ N)$

2.   Block Nested Loop Join: For every block in **R**, it scans **S** once.
     Cost: $M+(M\ \times\ N)$

If we have B buffers available:
1. Use B-2 buffers for scanning the outer table.
2. Use one buffer for the inner table, one buffer for storing
output.

This algorithm uses B-2 buffers for scanning R. 
Cost: $M+ ( ⌈M / (B-2) ⌉\times N)$, if $B>M+2$, then will be $M+N$

3.   Index Nested Join: Assume the cost of each index probe is some constant C per tuple.
     Cost: $M + (m \times C)$

>   Sort Merge Join

**Phase #1: Sort**

1.   Sort both tables on the join key(s).

2.   We can use the external merge sort algorithm that we talked about last class.

**Phase #2: Merge**

1. Step through the two sorted tables with cursors and emit matching tuples.

2.   May need to backtrack depending on the join type.

Sort Cost (R): $2M \times (1 + ⌈ logB-1 ⌈M/ B⌉ ⌉)$
Sort Cost (S): $2N \times (1 + ⌈ logB-1 ⌈N / B⌉ ⌉)$
Merge Cost: $(M+ N)$
Total Cost: Sort + Merge

The worst case for the merging phase is when the join attribute of all the tuples in both relations contains the same value.

The input relations may be sorted either by an explicit sort operator, or by scanning the relation using an index on the join key.

>   Hash Join

**Phase #1: Build**

-   Scan the outer relation and populate a hash table using the hash function **h1** on the join attributes.

**Phase #2: Probe**

-   Scan the inner relation and use **h1** on each tuple to jump to a location in the hash table and find a matching tuple.

**Approach #1: Full Tuple**

-   Avoid having to retrieve the outer relation's tuple contents on a match.

-   Takes up more space in memory.

**Approach #2: Tuple Identifier**

-   Could be to either the base tables or the intermediate output from child operators in the query plan.

- Ideal for column stores because the DBMS does not fetch data from disk that it does not need.

-   Also better if join selectivity is low.

Optimization: 
Create a Bloom Filterduring the build phase when the key is likely to not exist in the hash table.

-   Threads check the filter before probing the hash table. This will be faster since the filter will fit in CPU caches.

- Sometimes called (sideways information passing.)

>   Grace Hash Join

If the buckets do not fit in memory, then use **recursive partitioning**to split the tables into chunks that will fit.

- Build another hash table for $bucket_{R,i}$, using hash function $h_2$ (with $h_2≠h_1$).
-   Then probe it for each tuple of the other table's bucket at that level.

Cost of hash join?

- Assume that we have enough buffers.
-   Cost: $3(M+ N)$

**Partitioning Phase:**

-   Read+Write both tables
-   Cost: $2(M+N)$

**Probing Phase:**

-   Read both tables
-   $M+N$

> Summary
> 

| **Algorithm**           | **IO Cost**        | **Example**  |
| ----------------------- | ------------------ | ------------ |
| Simple Nested Loop Join | $M+(m\times N)$    | 1.3 hours    |
| Block Nested Loop Join  | $M+(M\times N)$    | 50 seconds   |
| Index Nested Loop Join  | $M+(M\times C)$    | Variable     |
| Sort-Merge Join         | $M+N+(sort\ cost)$ | 0.75 seconds |
| Hash Join               | $3\times(M+N)$     | 0.45 seconds |

Hashing is almost always better than sorting for operator execution.

Caveats:

-   Sorting is better on non-uniform data.

-   Sorting is better when result needs to be sorted.

# 11. Query Execution (1)

**Readings:** Chapter 12.1-12.3, 12.7

>   Iterator Model

Each query plan operator implements a **Next()** function.

-   On each invocation, the operator returns either a single tuple or a **null** marker if there are no more tuples.

-   The operator implements a loop that calls **Next()** on its children to retrieve their tuples and then process them.

Also called **Volcano** or **Pipeline** Model.

This is used in almost every DBMS. Allows for tuple pipelining. Some operators must block until their children emit all their tuples.

-   Joins, Subqueries, Order By

>   Materialization Model

Each operator processes its input all at once and then emits its output all at once.

-   The operator "materializes" its output as a single result.

-   The DBMS can push down hints (e.g., **LIMIT**) to avoid scanning too many tuples.

-   Can send either a materialized row or a single column.

The output can be either whole tuples (NSM) or subsets of columns (DSM).

Better for OLTP workloads because queries only access a small number of tuples at a time.

- Lower execution / coordination overhead.

-   Fewer function calls.

Not good for OLAP queries with large intermediate results.

>   Vectorization Model

Like the Iterator Model where each operator implements a **Next()** function, but: 

Each operator emits a **batch** of tuples instead of a single tuple.

- The operator's internal loop processes multiple tuples at a time.

-   The size of the batch can vary based on hardware or query properties.

Ideal for OLAP queries because it greatly reduces the number of invocations per operator.

Allows for operators to more easily use vectorized (SIMD) instructions to process batches of tuples.

>   Sequential Scan

For each page in the table:

-   Retrieve it from the buffer pool.

-   Iterate over each tuple and check whether to include it.

The DBMS maintains an internal **cursor** that tracks the last page / slot it examined.

This is almost always the worst thing that the DBMS can do to execute a query.

Sequential Scan Optimizations: Prefetching, Buffer Pool Bypass, Parallelization, Heap Clustering, Zone Maps, Late Materialization.

1.   Zone Maps: Pre-computed aggregates for the attribute values in a page. DBMS checks the zone map first to decide whether it wants to access the page.

2.   Late Materialization: DSM DBMSs can delay stitching together tuples until the upper parts of the query plan.

> Index Scan

The DBMS picks an index to find the tuples that the query needs.
Which index to use depends on:
-   What attributes the index contains
-   What attributes the query references
-   The attribute's value domains
-   Predicate composition
-   Whether the index has unique or non-unique keys


> Multi Index Scan

Set intersection can be done with bitmaps, hash tables, or Bloom filters.

Operators that modify the database (**INSERT**, **UPDATE**, **DELETE**) are responsible for checking constraints and updating indexes.

**UPDATE**/**DELETE**: 

- Child operators pass Record IDs for target tuples.
- Must keep track of previously seen tuples.

**INSERT**: 

-   **Choice #1**: Materialize tuples inside of the operator.

-   **Choice #2**: Operator inserts any tuple passed in from child operators.

Halloween Problem: Anomaly where an update operation changes the physical location of a tuple, which causes a scan operator to visit the tuple multiple times.

-   Can occur on clustered tables or index scans.

First discoveredby IBM researchers while working on System R on Halloween day in 1976.

>   Expression Evaluation

The DBMS represents a **WHERE** clause as an **expression tree**.

The nodes in the tree represent different expression types:

Comparisons (**=**, **<**, **>**, **!=**); Conjunction (**AND**), Disjunction (**OR**); Arithmetic Operators (**+**, **-**, *****, **/**, **%**); Constant Values; Tuple Attribute References.

Evaluating predicates in this manner is slow.

The DBMS traverses the tree and for each node that it visits it must figure out what the operator needs to do.

A better approach is to just evaluate the expression directly. (Think JIT compilation)

# 12. Query Execution (2)

**Readings:** Chapter 12.1-12.3, 12.7

>   Parallel DBMSs vs Distributed DBMSs

Database is spread out across multiple **resources** to improve different aspects of the DBMS.

Appears as a single logical database instance to the application, regardless of physical organization.

-   SQL query for a single-resource DBMS should generate same result on a parallel or distributed DBMS.

**Parallel DBMSs**

-   Resources are physically close to each other.

-   Resources communicate over high-speed interconnect.

-   Communication is assumed to be cheap and reliable.

**Distributed DBMSs**

- Resources can be far from each other.

-   Resources communicate using slow(er) interconnect.

-   Communication cost and problems cannot be ignored.

>   Process Model

A DBMS’s **process model** defines how the system is architected to support concurrent requests from a multi-user application.

A **worker** is the DBMS component that is responsible for executing tasks on behalf of the client and returning the results.

1.   Process per DBMS Worker

Each worker is a separate OS process.
- Relies on OS scheduler.
- Use shared-memory for global data structures.
- A process crash doesn’t take down entire system.
- Examples: IBM DB2, Postgres, Oracle

2.   Process Pool

A worker uses any free process from the pool.
- Still relies on OS scheduler and shared memory.
- Bad for CPU cache locality.
- Examples: IBM DB2, Postgres (2015).

3.   Thread per DBMS Worker

Single process with multiple worker threads.
- DBMS manages its own scheduling.
- May or may not use a dispatcher thread.
- Thread crash (may) kill the entire system.
- Examples: IBM DB2, MSSQL, MySQL, Oracle (2014).


Advantages of a multi-threaded architecture:
- Less overhead per context switch.
- Do not have to manage shared memory.
The thread per worker model does not mean that the DBMS supports intra-query parallelism.


> Inter- vs Intra- Query Parallelism

Inter-Query: Different queries are executed concurrently.
-   Increases throughput & reduces latency.
Intra-Query: Execute the operations of a single query in parallel.
-   Decreases latency for long-running queries.

Improve overall performance by allowing multiple queries to execute simultaneously.
If queries are read-only, then this requires little coordination between queries.
If multiple queries are updating the database at the same time, then this is hard to do correctly.

>   Inter Query Parallelism

Improve overall performance by allowing multiple queries to execute simultaneously.

If queries are read-only, then this requires little coordination between queries.

If multiple queries are updating the database at the same time, then this is hard to do correctly…

> Intra Query Parallelism

Improve the performance of a single query by executing its operators in parallel.
Think of organization of operators in terms of a producer/consumer paradigm.
There are parallel versions of every operator.
- Can either have multiple threads access centralized data structures or use partitioning to divide work up.

Parallel Grace Hash Join: Use a separate worker to perform the join for each level of buckets for **R** and **S** after partitioning.

>   Intra Operator(Horizontal)

Decompose operators into independent **fragments** that perform the same function on different subsets of data.

The DBMS inserts an **exchange** operator into the query plan to coalesce/split results from multiple children/parent operators.

Exchange Operator has three types as follows:

**Exchange Type #1 –Gather**

-  Combine the results from multiple workers into a single output stream.

**Exchange Type #2 –Distribute**

-  Split a single input stream into multiple output streams.

**Exchange Type #3 –Repartition**

-  Shuffle multiple input streams across multiple output streams.

>Inter Operator(Vertical)

Operations are overlapped in order to pipeline data from one stage to the next without materialization.

Workers execute operators from different segments of a query plan at the same time.

Also called **pipeline parallelism**.

>   **Bushy Parallelism**

Hybrid of intra-and inter-operator parallelism where workers execute multiple operators from different segments of a query plan at the same time.

Still need exchange operators to combine intermediate results from segments.

>   Observation

Using additional processes/threads to execute queries in parallel won't help if the disk is always the main bottleneck.

-   In fact, it can make things worse if each worker is working on different segments of the disk.

>   I/O Parallelism

Configure OS/hardware to store the DBMS's files across multiple storage devices.

-   Storage Appliances, RAID Configuration

This is **transparent** to the DBMS.

>   DataBase Partition

Some DBMSs allow you to specify the disk location of each individual database.

-  The buffer pool manager maps a page to a disk location.

This is also easy to do at the filesystem level if the DBMS stores each database in a separate directory.

-  The DBMS recovery log file might still be shared if transactions can update multiple databases.

>   Partitioning

Split single logical table into disjoint physical segments that are stored/managed separately.

Partitioning should (ideally) be transparent to the application.

-  The application should only access logical tables and not have to worry about how things are physically stored.

1.   Vertical Partioning

Store a table’s attributes in a separate location (e.g., file, disk volume).

Must store tuple information to reconstruct the original record.

2.   Horizontal Partioning

Divide table into disjoint segments based on some partitioning key. Hash Partitioning

-   Range Partitioning

-   Predicate Partitioning

# 13. Optimization (1)

**Readings:** Chapter 13

Remember that SQL is declarative. User tells the DBMS what answer they want, not how to get the answer.

First implementation of a query optimizer from the 1970s. People argued that the DBMS could never choose a query plan better than what a human could write.

**Heuristics / Rules**

- Rewrite the query to remove stupid / inefficient things.

-   These techniques may need to examine catalog, but they do notneed to examine data.

**Cost-based Search**

- Use a model to estimate the cost of executing a plan.

-   Evaluate multiple equivalent plans for a query and pick the one with the lowest cost.

>   Logical vs Physical Plans

The optimizer generates a mapping of a logical algebra expression to the optimal equivalent physical algebra expression.

Physical operators define a specific execution strategy using an access path.

-   They can depend on the physical format of the data that they process (i.e., sorting, compression).

-   Not always a 1:1 mapping from logical to physical.

>   Relational Algebra Equivalences

Two relational algebra expressions are equivalent if they generate the same set of tuples.

The DBMS can identify better query plans without a cost model.

This is often called query rewriting.

>   Predicate Pushdown

Example:

```sql
SELECT s.name, e.cid
FROM studnet AS s, enrolled AS e
WHERE s.id = e.sid
AND e.grade = 'A'
```

The algrbra expression is:

$\pi_{name,cid}(\sigma_{grade='A'}(student⋈enrolled))$

which is equal to the expression: 

$\pi_{name,cid}(student⋈\sigma_{grade={'A'}}(enrolled))$

**Selections Optimize:**

Perform filters as early as possible. Break a complex predicate, and push down: 

$\sigma_{p1 \wedge p2\wedge ...\wedge pn}(R)=\sigma_{p1}(\sigma_{p2}(...\sigma_{pn}(R)))$

**Joins Optimize:**

$R⋈S=S⋈R, \ (R⋈S⋈T) =R⋈(S⋈T)$

The number of different join orderings for an n-way join is a **Catalan Number** ($≈4^n$)

Exhaustive enumeration will be too slow.

**Projections Optimize** (Not important for a column store) **:**

-   Perform them early to create smaller tuples and reduce intermediate results (if duplicates are eliminated)
-   Project out all attributes except the ones requested or required (e.g., joining keys)

Let's see the example again: 
```sql
SELECT s.name, e.cid
FROM student AS s, enrolled AS e
WHERE s.sid = e.sid
AND e.grade = 'A'
```
$\pi_{name,cid}(student⋈\sigma_{grade={'A'}}(enrolled))$

$\pi_{name,cid}(\pi_{sid,name}(student)⋈\pi_{cid,sid}(\sigma_{grade={'A'}}(enrolled)))$

>   Logical Query Optimization

Transform a logical plan into an equivalent logical plan using pattern matching rules.

The goal is to increase the likelihood of enumerating the optimal plan in the search.

Cannot compare plans because there is no cost model but can "direct" a transformation to a preferred side.

Split Conjunctive predicates

```sql
SELECT ARTIST.NAME
FROM ARTIST, APPEARS, ALBUM
WHERE ARTIST.ID=APPEARS.ARTIST_ID
AND APPEARS.ALBUM_ID=ALBUM.ID
AND ALBUM.NAME="Andy's OG Remix"
```

Decompose predicates into their simplest forms to make it easier for the optimizer to move them around.

$\pi_{name}(\sigma_{id=artist\_id \wedge album\_id=album.id \wedge name="Andy's OG Remix"}(artist\times appears\times album))$

Using selections optimization, break a complex predicate, and push down:

$\pi_{name}(\sigma_{id=artist\_id }(\sigma_{album\_id=album.id }(\sigma_{name="Andy's OG Remix"}(artist\times appears\times album))))$

Move the predicate to the lowest applicable point in the plan:

$\pi_{name}(\sigma_{album\_id=album.id }(\sigma_{name="Andy's OG Remix"}album)\times(\sigma_{id=artist\_id }(artist\times appears))))$

Replace all Cartesian Products with inner joins using the join predicates:

$\pi_{name}(\sigma_{name="Andy's OG Remix"}album)⋈_{album\_id=album.id } (artist ⋈_{id=artist\_id} appears))$

Eliminate redundant attributes before pipeline breakers to reduce materialization cost:

$\pi_{name}(\pi_{id}(\sigma_{name="Andy's OG Remix"}album)⋈_{album\_id=album.id } $\\
$(\pi_{id}(\pi_{id, name}(artist) ⋈_{id=artist\_{id}} \pi_{artist_{id}, album_{id}}(appears))))$


> Nested Sub-Queries

The DBMS treats nested sub-queries in the where clause as functions that take parameters and return a single value or set of values.
Two Approaches:

- Rewrite to de-correlate and/or flatten them
- Decompose nested query and store result to temporary
table

```sql
SELECT name FROM sailors AS S
WHERE EXISTS (
  SELECT * FROM reserves AS R
  WHERE S.sid = R.sid
  AND R.day = '2018-10-15'
)

SELECT name
FROM sailors AS S, reserves AS R
WHERE S.sid = R.sid
AND R.day = '2018-10-15'
```

Decompose

```sql
-- For each sailor with the highest rating (over all sailors) and at least 
-- two reservations for red boats, find the sailor id and the earliest date 
-- on which the sailor has a reservation for a red boat.
SELECT S.sid, MIN(R.day)
FROM sailors S, reserves R, boats B
WHERE S.sid = R.sid
AND R.bid = B.bid
AND B.color = 'red'
AND S.rating = (SELECT MAX(S2.rating)
FROM sailors S2)
GROUP BY S.sid
HAVING COUNT(*) > 1
```

For harder queries, the optimizer breaks up queries into blocks and then concentrates on one block at a time.

Sub-queries are written to a temporary table that are discarded after the query finishes.

```sql
SELECT MAX(rating) FROM sailors -- Nested Block
```

An optimizer transforms a query's expressions (e.g., **WHERE** clause predicates) into the optimal/minimal set of expressions.

Implemented using if/then/else clauses or a pattern-matching rule engine.

-   Search for expressions that match a pattern.

-   When a match is found, rewrite the expression.

-   Halt if there are no more rules that match.

```sql
-- Impossible / Unnecessary Predicates
SELECT * FROM A WHERE 1 = 0; -- return empty set
SELECT * FROM A WHERE 1 = 1; -- remove where predicate

-- Join Elimination
SELECT A1.*
FROM A AS A1 JOIN A AS A2
ON A1.id = A2.id;
-- after optimize 
SELECT * FROM A;

SELECT * FROM A AS A1
WHERE EXISTS(SELECT val FROM A AS A2
WHERE A1.id = A2.id);
-- after optimize
SELECT * FROM A;

-- Merging Predicates
SELECT * FROM A
WHERE val BETWEEN 1 AND 100
OR val BETWEEN 50 AND 150;
-- after optimize
SELECT * FROM A
WHERE val BETWEEN 1 AND 150;
```

>   Cost-based Query Planning

Generate an estimate of the cost of executing a particular query plan for the current state of the database.

-  Estimates are only meaningful internally.

This is independent of the plan enumeration step that we will talk about next class.

**Choice #1: Physical Costs**

-   Predict CPU cycles, I/O, cache misses, RAM consumption, pre-fetching, etc…

-   Depends heavily on hardware.

**Choice #2: Logical Costs**

-   Estimate result sizes per operator.

- Independent of the operator algorithm.

- Need estimations for operator result sizes.

**Choice #3: Algorithmic Costs**

-   Complexity of the operator algorithm implementation.

>    Disk based DBMS cost Model

The number of disk accesses will always dominate the execution time of a query.

-   CPU costs are negligible.

-   Must consider sequential vs. random I/O.

This is easier to model if the DBMS has full control over buffer management.

-   We will know the replacement strategy, pinning, and assume exclusive access to disk.

>   Postages cost Model

Uses a combination of CPU and I/O costs that are weighted by “magic” constant factors.

Default settings are obviously for a disk-resident database without a lot of memory:

-   Processing a tuple in memory is **400x** faster than reading a tuple from disk.

-   Sequential I/O is **4x** faster than random I/O.

>   Example (IBM DB2 cost Model)

Database characteristics in system catalogs; Hardware environment (microbenchmarks); Storage device characteristics (microbenchmarks); Communications bandwidth (distributed only); Memory resources (buffer pools, sort heaps); Concurrency Environment(Average number of users, Isolation level / blocking, Number of available locks).

# 14. Optimization (2)

**Readings:** Chapter 13

>   Statistics

The DBMS stores internal statistics about tables, attributes, and indexes in its internal catalog.

Different systems update them at different times.

Manual invocations:

-   Postgres/SQLite: **ANALYZE**
-   Oracle/MySQL: **ANALYZETABLE**
-   SQL Server: **UPDATE STATISTICS**
-   DB2: **RUNSTATS**

>   Derivable Statistics

For each relation **R**, the DBMS maintains the following information:

- $N_R$: Number of tuples in **R**.

- $V(A,R)$: Number of distinct values for attribute **A**.

The **selection cardinality** $SC(A,R)$ is the average number of records with a value for an attribute **A** given $N_{R}/ V(A,R)$

Note that this formula assumes **data uniformity** where every value has the same frequency as all other values.

The **selectivity** (sel) of a predicate **P** is the fraction of tuples that qualify.

Equality Predicate: $sel (A=constant) = SC(P) / N_R$

Range Predicate: $sel(A>=a) = (A_{max}– a+1) / (A_{max}– A_{min}+1)$

Negation Query: $sel(not \ P) = 1 – sel(P)$

**Observation: Selectivity ≈ Probability**

Conjunction: $sel(P1 \wedge P2) = sel(P1) · sel(P2)$

Disjunction: $sel(P1 \vee P2)= sel(P1) + sel(P2) – sel(P1 \wedge P2)= sel(P1) + sel(P2)–sel(P1)·sel(P2)$

This assumes that the predicates are **independent**.

>   Result size estimation

Given a join of **R** and **S**, what is the range of possible result sizes in # of tuples?
General case: $R_{cols}\cap S_{cols}=\{A\}$ where A is not a primary key for either table.

Match each R-tuple with S-tuples: $estSize ≈ N_{R} · N_{S} / V(A, S)$

Symmetrically, for S: $estSize ≈ N_{R} · N_{S} / V(A, R) $

**Overall:** $estSize ≈ N_{R} · N_{S} / max({V(A,S), V(A,R)})$

>   Selection Cardinality

**Assumption #1: Uniform Data**

-  The distribution of values (except for the heavy hitters) is the same.

**Assumption #2: Independent Predicates**

-  The predicates on attributes are independent

**Assumption #3: Inclusion Principle**

-  The domain of join keys overlap such that each key in the inner relation will also exist in the outer table.

>   Sketches

Probabilistic data structures that generate approximate statistics about a data set.

Cost-model can replace histograms with sketches to improve its selectivity estimate accuracy.

Most common examples:

-   Count-Min Sketch(1988): Approximate frequency count of elements in a set.

- HyperLogLog(2007): Approximate the number of distinct elements in a set.

>   Sampling

Modern DBMSs also collect samples from tables to estimate selectivities.

Update samples when the underlying tables changes significantly.

>   Query Optimization

After performing rule-based rewriting, the DBMS will enumerate different plans for the query and estimate their costs. Like Single relation, Multiple relations, and Nested sub-queries.

It chooses the best plan it has seen for the query after exhausting all plans or some timeout.

Simple heuristics are often good enough for this. OLTP queries are especially easy.

Query planning for OLTP queries is easy because they are **sargable** (**S**earch **Arg**ument **Able**).

-   It is usually just picking the best index.

-   Joins are almost always on foreign key relationships with a small cardinality.

-   Can be implemented with simple heuristics.

>   Multi-Relation Query Planning

As number of joins increases, number of alternative plans grows rapidly

-   We need to restrict search space.

Fundamental decision in **System R**: only left-deep join trees are considered.

-   Modern DBMSs do not always make this assumption anymore.

Use **dynamic programming** to reduce the number of cost estimations.

1.   Enumerate the orderings. Example: Left-deep tree #1, Left-deep tree #2…

2.   Enumerate the plans for each operator. Example: Hash, Sort-Merge, Nested Loop…

3.   Enumerate the access paths for each table. Example: Index #1, Index #2, SeqScan…

# 15. Concurrency Control Theory

**Readings:** Chapter 14

A **transaction** is the execution of a sequence of one or more operations (e.g., SQL queries) on a database to perform some higher-level function.

A transactions may carry out many operations on the data retrieved from the database

The DBMS is onlyconcerned about what data is read/written from/to the database.

>   Strawman System

Execute each transactions one-by-one (i.e., serial order) as they arrive at the DBMS.

-  One and only one transactions can be running at the same time in the DBMS.

Before a transactions starts, copy the entire database to a new file and make all changes to that file.

-  If the transactions completes successfully, overwrite the original file with the new one.

-  If the transactions fails, just remove the dirty copy.

>   Correctness Criteria ACID

**Atomicity:** All actions in the transactions happen, or none happen.(“all or nothing”)

**Consistency:** If each transactions is consistent and the DB starts consistent, then it ends up consistent.(“it looks correct to me”)

**Isolation:** Execution of one transactions is isolated from that of other transactions s.(“as if alone”)

**Durability:** If a transactions commits, its effects persist.(“survive failures”)

>   Atomicity

DBMS guarantees that transactions are **atomic**. 

-  From user's point of view: transactions always either executes all its actions or executes no actions at all.

Mechanism For Ensuring Atomicity

**Approach #1: Logging**

-  DBMS logs all actions so that it can undo the actions of aborted transactions.

-  Maintain undo records both in memory and on disk.

-  Think of this like the black box in airplanes…

**Approach #2: Shadow Paging**

-  DBMS makes copies of pages and transactions smake changes to those copies. Only when the transactions commits is the page made visible to others.

-  Originally from System R.

>   Database Consistency

The "world" represented by the database is logicallycorrect. All questions asked about the data are given logicallycorrect answers.

If the database is consistent before the transaction starts (running alone), it will also be consistent after.

Transaction consistency is the application's responsibility. DBMS cannot control this.

>   Isolation

DBMS achieves concurrency by interleaving the actions (reads/writes of DB objects) of transactions s.

A **concurrency control**protocol is how the DBMS decides the proper interleaving of operations from multiple transactions.

Two categories of protocols:

-   **Pessimistic:** Don't let problems arise in the first place.

-   **Optimistic:** Assume conflicts are rare, deal with them after they happen.

**Serial Schedule**

-   A schedule that does not interleave the actions of different transactions.

**Equivalent Schedules**

- For any database state, the effect of executing the first schedule is identical to the effect of executing the second schedule.

-   Doesn't matter what the arithmetic operations are!

**Serializable Schedule**

-   A schedule that is equivalent to some serial execution of the transactions.

If each transaction preserves consistency, every serializable schedule preserves consistency.

There are different levels of serializability:

-   **Conflict Serializability** (**Most DBMSs try to support this.**)

-   **View Serializability** (**No DBMS can do this.**)

>   Depency Graphs

One node per transactions .

Edge from $T_i$ to $T_j$ if:

-   An operation $O_i$ of $T_i$ conflicts with an operation $O_j$ of $T_j$ and

- $O_i$ appears earlier in the schedule than $O_j$.

Alternative (weaker) notion of serializability.
Schedules $S_1$ and $S_2$ are view equivalent if:

-   If $T_1$ reads initial value of **A** in $S_1$, then $T_1$ also reads initial value of **A** in $S_2$.

-   If $T_1$ reads value of **A** written by $T_2$ in $S_1$, then $T_1$ also reads value of **A** written by $T_2$ in $S_2$.

-   If $T_1$ writes final value of **A** in $S_1$, then $T_1$ also writes final value of **A** in $S_2$.

Also known as a **precedence graph**. A schedule is conflict serializable if fits dependency graph is acyclic.

**View Serializability** allows for (slightly) more schedules than **Conflict Serializability** does.

-   But is difficult to enforce efficiently.

Neither definition allows all schedules that you would consider "serializable".

-   This is because they don't understand the meanings of the operations or the data (recall example #3)

>   Transaction

All the changes of committed transactions should be persistent.

-  No torn updates.

-  No changes from failed transactions.

The DBMS can use either logging or shadow paging to ensure that all changes are durable.

# 16. Two Phase Locking

**Readings:** Chapter 15.1-15.3, 15.9

**S-LOCK**: Shared locks for reads.

**X-LOCK**: Exclusive locks for writes.

Compatibility Matrix

|           | Shared | Exclusive |
| --------- | ------ | --------- |
| Shared    | ✅      | ❌         |
| Exclusive | ❌      | ❌         |

1.   Transactions request locks (or upgrades).

2.   Lock manager grants or blocks requests.

3.   Transactions release locks.

Lock manager updates its internal lock-table.

-  It keeps track of what transactions hold what locks and what transactions are waiting to acquire any locks.

Two-phase locking (2PL) is a concurrency control protocol that determines whether a transactions can access an object in the database on the fly.

The protocol does not need to know all the queries that a transactions will execute ahead of time.

**Phase #1: Growing**

-  Each transactions requests the locks that it needs from the DBMS’s lock manager.

-  The lock manager grants/denies lock requests.

**Phase #2: Shrinking**

-  The transactions is allowed to only release locks that it previously acquired. It cannot acquire new locks.

2PL on its own is sufficient to guarantee conflict serializability.

-  It generates schedules whose precedence graph is acyclic.

But it is subject to **cascading aborts**

>   Problems

There are potential schedules that are serializable but would not be allowed by 2PL.

-  Locking limits concurrency.

Dirty reads Solution: **Strong Strict 2PL (aka Rigorous 2PL)**

A schedule is **strict** if a value written by a transactions is not read or overwritten by other transactions suntil that transactions finishes.

Advantages:

-  Does not incur cascading aborts.

-  Aborted transactions scan be undone by just restoring original values of modified tuples.

>   Dead Lock Solution

Deadlocks Solution: **Detection** or **Prevention**

The DBMS creates a **waits-for** graph to keep track of what locks each transactions is waiting to acquire:

-  Nodes are transactions

-  Edge from $T_i$ to $T_j$ if $T_i$ is waiting for $T_j$ to release a lock.

The system periodically checks for cycles in **waits-for** graph and then decides how to break it.

When the DBMS detects a deadlock, it will select a "victim" transactions to rollback to break the cycle.

The victim transactions will either restart or abort(more common) depending on how it was invoked.

There is a trade-off between the frequency of checking for deadlocks and how long transactions have to wait before deadlocks are broken.

When a transactions tries to acquire a lock that is held by another transactions , the DBMS kills one of them to prevent a deadlock.

This approach does not require a waits-for graph or detection algorithm.

>   Intension Locks

Trade-off between parallelism versus overhead.

-  Fewer Locks, Larger Granularity vs. More Locks, Smaller Granularity.

An **intention lock** allows a higher-level node to be locked in **shared** or **exclusive** mode without having to check all descendent nodes.

If a node is locked in an intention mode, then some transactions is doing explicit locking at a lower level in the tree.

Intention-Shared (IS): Indicates explicit locking at lower level with shared locks.

Intention-Exclusive (IX): Indicates explicit locking at lower level with exclusive locks.

Shared+Intention-Exclusive (SIX): The subtree rooted by that node is locked explicitly in shared mode and explicit locking is being done at a lower level with exclusive-mode locks.

Compatibility Matrix

|         | **IS** | **IX** | **S** | **SIX** | **X** |
| ------- | ------ | ------ | ----- | ------- | ----- |
| **IS**  | ✅      | ✅      | ✅     | ✅       | ❌     |
| **IX**  | ✅      | ✅      | ❌     | ❌       | ❌     |
| **S**   | ✅      | ❌      | ✅     | ❌       | ❌     |
| **SIX** | ✅      | ❌      | ❌     | ❌       | ❌     |
| **X**   | ❌      | ❌      | ❌     | ❌       | ❌     |

Hierarchical locks are useful in practice as each transactions only needs a few locks. Intention locks help improve concurrency:
-   Intention-Shared (IS): Intent to get lock(s) at finer granularity.

-   Intention-Exclusive (IX): Intent to get X lock(s) at finer granularity.

-   Shared+Intention-Exclusive (SIX): Like and IX at the same time.

Lock escalation dynamically asks for coarser-grained locks when too many low-level locks acquired.

This reduces the number of requests that the lock manager must process.

>   Lock in Practice

You typically don't set locks manually in transactions s.

Sometimes you will need to provide the DBMS with hints to help it to improve concurrency. Explicit locks are also useful when doing major changes to the database.

1.   Explicitly locks a table.

Not part of the SQL standard.

-  Postgres/DB2/Oracle Modes: **SHARE**, **EXCLUSIVE**

-  MySQL Modes: **READ**, **WRITE**

2.   Perform a select and then sets an exclusive lock on the matching tuples.

Can also set shared locks:

-  Postgres: **FOR SHARE**

-  MySQL: **LOCK IN SHARE MODE**

# 17. Timestamp Ordering

**Readings:** Chapter 15.4-15.5

Every object Xis tagged with timestamp of the last transactions that successfully did read/write:

-   W-TS(X)–Write timestamp on X

-   R-TS(X)–Read timestamp on X

Check timestamps for every operation:

-   If transactions tries to access an object "from the future", it aborts and restarts.

>   Read

If $TS(T_{i}) < W-TS(X)$, this violates timestamp
order of $T_{i}$ with regard to the writer of $X$.

- Abort $T_{i}$ and restart it with a new TS.

Else:

-   Allow $T_{i}$ to read $X$.
-   Update $R-TS(X)$ to $max(R-TS(X), TS(T_{i}))$
-   Make a local copy of $X$ to ensure repeatable reads for $T_{i}$.

>   write

If $TS(T_{i})< R-TS(X)$ or $TS(T_{i})< W-TS(X)$

- Abort and restart $T_{i}$.

Else:

- Allow Tito write Xand update $W-TS(X)$
- Thomas Write Rule: Ignore the write to allow the transactions to continue executing without aborting.
- Also make a local copy of Xto ensure repeatable reads.

> Thomas Write Rule

Generates a schedule that is conflict serializable
if you do not use the Thomas Write Rule.
- No deadlocks because no transactions ever waits.
- Possibility of starvation for long transactions if short transactions keep causing conflicts.

>   Recoverable Schedules

A schedule is **recoverable** if transactions scommit only after all transactions swhose changes they read, commit.

Otherwise, the DBMS cannot guarantee that transactions read data that will be restored after recovering from a crash.

High overhead from copying data to transactions's workspace and from updating timestamps.

Long running transactions can get starved.

-   The likelihood that a transactions will read something from a newer transactions increases.

>   Optimistic Concurrency Control

**#1 –Read Phase**:

-   Track the read/write sets of transactions and store their writes in a private workspace.
-   The DBMS copies every tuple that the transactions accesses from the shared database to its workspace ensure repeatable reads.

**#2 –Validation Phase**:

-   When a transactions commits, check whether it conflicts with other transactions s.

-   When transactions $T_i$ invokes **COMMIT**, the DBMS checks if it conflicts with other transactions s.

    -   The DBMS needs to guarantee only serializable schedules are permitted.

    -   Checks other transactions sfor RW and WW conflicts and ensure that conflicts are in one direction (e.g., older-  younger).

    Two methods for this phase:

    - Backward Validation

    - Forward Validation

-   Backword: Check whether the committing transactions intersects its read/write sets with those of any transactions sthat have **already** committed.

-   Forward: Check whether the committing transactions intersects its read/write sets with any active transactions sthat have **not** yet committed.

**#3 –Write Phase:**

-   If validation succeeds, apply private changes to database. Otherwise abort and restart the transactions .


# 18. Multi-Version Concurrency Control

**Readings:** Chapter 15.6-15.7

The DBMS maintains multiple **physical** versions of a single **logical** object in the database:

-    When a transactions writes to an object, the DBMS creates a new version of that object. 

-    When a transactions reads an object, it reads the newest version that existed when the transactions started.

***Writers do not block readers. Readers do not block writers.***

Read-only transactions scan read a consistent snapshotwithout acquiring locks.

-    Use timestamps to determine visibility.

Easily support time-travelqueries.

MVCC is more than just a concurrency control protocol. It completely affects how the DBMS manages transactions and the database.

>   Concurrency Control

**Approach #1: Timestamp Ordering**

-    Assign transactions stimestamps that determine serial order.

**Approach #2: Optimistic Concurrency Control**

-    Three-phase protocol from last class.

-    Use private workspace for new versions.

**Approach #3: Two-Phase Locking**

>   Version Storage

-    transactions acquire appropriate lock on physical version before they can read/write a logical tuple.

The DBMS uses the tuples' pointer field to create a **version chain** per logical tuple.

-    This allows the DBMS to find the version that is visible to a particular transactions at runtime.

-    Indexes always point to the "head" of the chain.

**Approach #1: Append-Only Storage**

-    New versions are appended to the same table space.

**Approach #2: Time-Travel Storage**

-    Old versions are copied to separate table space.

**Approach #3: Delta Storage**

-    The original values of the modified attributes are copied into a separate delta record space.

Different storage schemes determine where/what to store for each version.

>   GC

Tuple Level: 

**Background Vacuuming:** Separate thread(s) periodically scan the table and look for reclaimable versions. Works with any storage.

**Cooperative Cleaning:** Worker threads identify reclaimable versions as they traverse version chain. Only works with O2N.

Transaction Level:

Each transactions keeps track of its read/write set.

The DBMS determines when all versions created by a finished transactions are no longer visible.

May still require multiple threads to reclaim the memory fast enough for the workload.

>   MVCC Indexes

Each index's underlying data structure must support the storage of non-unique keys. 

Use additional execution logic to perform conditional inserts for pkey/ unique indexes.

-   Atomically check whether the key exists and then insert.

Workers may get back multiple entries for a single fetch. They then must follow the pointers to find the proper physical version.

>   Implementations

|              | **Protocol**  | **VersionStorage** | **GarbageCollection** | **Indexes** |
| ------------ | ---------------- | --------------------- | ------------------------ | -------------- |
| Oracle       | **MV2PL**        | **Delta**             | **Vacuum**               | **Logical**    |
| Postgres     | **MV-2PL/MV-TO** | **Append-Only**       | **Vacuum**               | **Physical**   |
| MySQL-InnoDB | **MV-2PL**       | **Delta**             | **Vacuum**               | **Logical**    |
| HYRISE       | **MV-OCC**       | **Append-Only**       | **–**                    | **Physical**   |
| Hekaton      | **MV-OCC**       | **Append-Only**       | **Cooperative**          | **Physical**   |
| MemSQL       | **MV-OCC**       | **Append-Only**       | **Vacuum**               | **Physical**   |
| SAP HANA     | **MV-2PL**       | **Time-travel**       | **Hybrid**               | **Logical**    |
| NuoDB        | **MV-2PL**       | **Append-Only**       | **Vacuum**               | **Logical**    |
| HyPer        | **MV-OCC**       | **Delta**             | **transactions -level**  | **Logical**    |
| NoisePage    | **MV-OCC**       | **Delta**             | **transactions -level**  | **Logical**    |

# 19. Logging Protocols + Schemes

 **Readings:** Chapter 16.1-16.7

Recovery algorithms are techniques to ensure database consistency, transaction atomicity, and durability despite failures.

Recovery algorithms have two parts:

-   Actions during normal transactions processing to ensure that the DBMS can recover from a failure.

-   Actions after a failure to recover the database to a state that ensures atomicity, consistency, and durability.

>   Storage

**Volatile Storage:**

- Data does notpersist after power loss or program exit.

-   Examples: DRAM, SRAM

**Non-volatile Storage:**

-   Data persists after power loss and program exit.

- Examples: HDD, SDD

**Stable Storage:**

-   A non-existentform of non-volatile storage that survives all possible failures scenarios.

>   Redo vs Undo

**Undo**: The process of removing the effects of an incomplete or aborted transactions .

**Redo**: The process of re-instating the effects of a committed transactions for durability.

How the DBMS supports this functionality depends on how it manages the buffer pool.

Whether the DBMS allows an uncommitted transactions to overwrite the most recent committed value of an object in non-volatile storage.

**STEAL**: Is allowed.

**NO-STEAL**: Is notallowed.

Whether the DBMS requires that all updates made by a transactions are reflected on non-volatile storage before the transactions can commit.

**FORCE**: Is required.

**NO-FORCE**: Is notrequired.

This approach is the easiest to implement:

-  Never have to undochanges of an aborted transactions because the changes were not written to disk.

-    Never have to redo changes of a committed transactions because all the changes are guaranteed to be written to disk at commit time (assuming atomic hardware writes).

Previous example cannot support **write sets** that exceed the amount of physical memory available.

>   Shaow pages

To install the updates, overwrite the root so it points to the shadow, thereby swapping the master and shadow:

-  Before overwriting the root, none of the transactions 'supdates are part of the disk-resident database 

-  After overwriting the root, all the transactions 'supdates are part of the disk-resident database.

Supporting rollbacks and recovery is easy.

**Undo**: Remove the shadow pages. Leave the master and the DB root pointer alone.

**Redo**: Not needed at all.

Disadvantages

Copying the entire page table is expensive:

-  Use a page table structured like a B+tree.

-  No need to copy entire tree, only need to copy paths in the tree that lead to updated leaf nodes.

Commit overhead is high:

-  Flush every updated page, page table, and root.

-  Data gets fragmented.

-  Need garbage collection.

-  Only supports one writer transactions at a time or transactions sin a batch.

>   Write Ahead Log

Maintain a log file separate from data files that contains the changes that transactions smake to database.

-  Assume that the log is on stable storage.

-    Log contains enough information to perform the necessary undo and redo actions to restore the database.

DBMS must write to disk the log file records that correspond to changes made to a database object **before**it can flush that object to disk.

Buffer Pool Policy: **STEAL**+ **NO-FORCE**

The DBMS stages all a transactions 'slog records in volatile storage (usually backed by buffer pool).

All log records pertaining to an updated page are written to non-volatile storage beforethe page itself is over-written in non-volatile storage.

A transactions is not considered committed until allits log records have been written to stable storage.

*When should the DBMS write log entries to disk?*

-  When the transaction commits.

-  Can use group committo batch multiple log flushes together to amortize overhead.

*When should the DBMS write dirty records to disk?*

-  Every time the transactions executes an update?

-  Once when the transactions commits?

>   Logging Schemes

Logical logging requires less data written in each log record than physical logging.

Difficult to implement recovery with logical logging if you have concurrent transactions s.

-  Hard to determine which parts of the database may have been modified by a query before crash.

-  Also takes longer to recover because you must re-execute every transactions all over again.

Hybrid approach where log records target a single page but do not specify organization of the page.

-  Identify tuples based on their slot number.

-    Allows DBMS to reorganize pages after a log record has been written to disk.

This is the most popular approach.

>   Check Points

The WAL will grow forever.

After a crash, the DBMS must replay the entire log, which will take a long time.

The DBMS periodically takes a checkpoint where it flushes all buffers out to disk.

Output onto stable storage all log records currently residing in main memory.

Output to the disk all modified blocks.

Write a \<CHECKPOINT\> entry to the log and flush to stable storage.

Checkpointing too often causes the runtime performance to degrade.

-   System spends too much time flushing buffers.

But waiting a long time is just as bad:

-   The checkpoint will be large and slow.

-   Makes recovery time much longer.

# 20. Crash Recovery

**Readings:** Chapter 16.1-16.8

**A**lgorithms for **R**ecovery and **I**solation **E**xploiting **S**emantics

**Write-Ahead Logging:**

-  Any change is recorded in log on stable storage before the database change is written to disk.

-  Must use **STEAL**+ **NO-FORCE** buffer pool policies.

**Repeating History During Redo:**

-  On restart, retrace actions and restore database to exact state before crash.

**Logging Changes During Undo:**

-  Record undo actions to log to ensure action is not repeated in the event of repeated failures.

>   WAL Records

Every log record now includes a globally unique **log sequence number**(LSN).

| **Name**     | **Where** | **Definition**                                  |
| ------------ | --------- | ----------------------------------------------- |
| flushedLSN   | Memory    | Last LSN in log on disk                         |
| pageLSN      | $page_x$     | Newest update to $page_x$                          |
| recLSN       | $page_x$     | Oldest update to $page_x$ since it was last flushed |
| lastLSN      | $T_i$        | Latest record of transactions $T_i$                |
| MasterRecord | Disk      | LSN of latest checkpoint                        |

Each data page contains a pageLSN.

-   The **LSN** of the most recent update to that page.

System keeps track of flushedLSN.

-   The max **LSN** flushed so far.

Before page xcan be written to disk, we must flush log at least to the point where: 

-   $pageLSN_x ≤ flushedLSN$

>   Transaction Commit

Write COMMITrecord to log.

All log records up to transactions' COMMIT record are flushed to disk.

-    Log flushes are sequential, synchronous writes to disk.

-    Many log records per log page.

When the commit succeeds, write a special transactions' END record to log.

-   This does notneed to be flushed immediately.

A **CLR** describes the actions taken to undo the actions of a previous update record.

It has all the fields of an update log record plus the undoNextpointer (the next-to-be-undone LSN).

**CLRs** are added to log records but the DBMS does not wait for them to be flushed before notifying the application that the transactions aborted.

>    NON-FUZZY CHECKPOINTS

The DBMS halts everything when it takes a checkpoint to ensure a consistent snapshot:

-   Halt the start of any new transactions s.

- Wait until all active transactions sfinish executing.

- Flushes dirty pages on disk.

This is bad for runtime performance but makes recovery easy.

SLIGHTLY BETTER CHECKPOINTS

Pause modifying transactions swhile the DBMS takes the checkpoint.

-   Prevent queries from acquiring write latch on table/index pages.

-   Don't have to wait until all transactions sfinish before taking the checkpoint.

We must record internal state as of the beginning of the checkpoint.

-   **Active Transaction Table (ATT)**

- **Dirty Page Table (DPT)**

>   ACTIVE TRANSACTION TABLE

One entry per currently active transactions .

-  transactions Id: Unique transactions identifier.

-  status: The current "mode" of the transactions .

-  lastLSN: Most recent **LSN** created by transactions .

Entry removed after the transactions -END message.

transactions Status Codes:

R: Running

C: Committing

U: Candidate for Undo

A **fuzzy checkpoint** is where the DBMS allows active transactions sto continue the run while the system writes the log records for checkpoint.

- No attempt to force dirty pages to disk.

New log records to track checkpoint boundaries:

-   CHECKPOINT-BEGIN: Indicates start of checkpoint

-   CHECKPOINT-END: Contains **ATT**+ **DPT**.

>   ARIES

Start from last BEGIN-CHECKPOINTfound via MasterRecord.

**Analysis:** Figure out which transactions scommitted or failed since checkpoint.

**Redo:** Repeat allactions.

**Undo:** Reverse effects of failed transactions s.

# 21. Distributed Databases

**Approach #1: Homogenous Nodes**

-   Every node in the cluster can perform the same set of tasks (albeit on potentially different partitions of data).
-   Makes provisioning and failover "easier".

**Approach #2: Heterogenous Nodes**

-   Nodes are assigned specific tasks.

-   Can allow a single physical node to host multiple "virtual" node types for dedicated tasks.

For User, it is Transparent. Users should not be required to know where data is physically located, how tables are **partitioned** or **replicated**.

Split a table's tuples into disjoint subsets.

-   Choose column(s) that divides the database equally in terms of size, load, or usage.

-   Hash Partitioning, Range Partitioning

The DBMS can partition a database **physically**(shared nothing) or **logically** (shared disk).

>   TP Monitors

A **TP Monitor** is an example of a centralized coordinator for distributed DBMSs.

Originally developed in the 1970-80s to provide transactions between terminals and mainframe databases.

-   Examples: ATMs, Airline Reservations.

Many DBMSs now support the same functionality internally.

# 22. Distributed OLTP

If you do nottrust the other nodes in a distributed DBMS, then you need to use a Byzantine Fault Tolerantprotocol for transactions(blockchain).

When a multi-node transaction finishes, the DBMS needs to ask all the nodes involved whether it is safe to commit.

>   2PC Optimizations

**Early Prepare Voting**

-   If you send a query to a remote node that you know will be the last one you execute there, then that node will also return their vote for the prepare phase with the query result.

**Early Acknowledgement After Prepare**

-   If all nodes vote to commit a transaction, the coordinator can send the client an acknowledgement that their transaction was successful before the commit phase finishes.

Blocks if coordinator fails after the prepare message is sent, until coordinator recovers.

>   PAXOS

If the system elects a single leader that oversees proposing changes for some period, then it can skip the **Propose** phase.

-   Fall back to full Paxoswhenever there is a failure.

The system periodically renews who the leader is using another Paxosround.

-   Nodes must exchange log entries during leader election to make sure that everyone is up-to-date.

Non-blocking if a majority participants are alive, provided there is a sufficiently long period without further failures.

# 23. Distributed OLAP

Most shared-nothing distributed OLAP DBMSs are designed to assume that nodes do not fail during query execution. 

-   If one node fails during query execution, then the whole query fails.

The DBMS could take a snapshot of the intermediate results for a query during execution to allow it to recover if nodes fail.

All the optimizations that we talked about before are still applicable in a distributed environment.

-   Predicate Pushdown

-   Early Projections

- Optimal Join Orderings

Distributed query optimization is even harder because it must consider the physical location of data and network transfer costs.
