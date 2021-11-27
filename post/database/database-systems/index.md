
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

A relationis an unordered set that contain the relationship of attributes that represent entities.

-   A relation's primary keyuniquely identifies a single tuple.

-   foreign keyspecifies that an attribute from one relation has to map to a tuple in another relation.

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

**SQL:2016**:  JSON, Polymorphic tables

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

# 3. Database Storage (1)

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

The **page directory **is the mapping from page ids to page locations in the database files.

-   All changes must be recorded on disk to allow the DBMS to find on restart.

The **page table** is the mapping from page ids to a copy of the page in buffer pool frames.

-   This is an in-memory data structure that does not need to be stored on disk.

**Global Policies:**

-   Make decisions for all active txns.

**Local Policies:**

-   Allocate frames to a specific txn without considering the behavior of concurrent txns.

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

The DBMS chooses which pages to evict on a per txn/query basis. This minimizes the pollution of the buffer pool from each query.

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

$Number \ of \  passes \ =\   1 + ⌈\log_2N⌉ $

$Total\  I/O\  cost\ =\  2N \times (Nums \ of\ passes)$

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
Cost: $M+ ( ⌈M / (B-2) ⌉\times  N)$, if $B>M+2$, then will be $M+N$

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

-   Scan the outer relation and populate a hash table using the hash function **h****1**on the join attributes.

**Phase #2: Probe**

-   Scan the inner relation and use **h****1**on each tuple to jump to a location in the hash table and find a matching tuple.



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

- Build another hash table for $bucket_{R,i}$,  using hash function $h_2$ (with $h_2≠h_1$).
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

**Readings:** Chapter 13

>   Iterator Model

Each query plan operator implements a **Next()**function.

-   On each invocation, the operator returns either a single tuple or a **null**marker if there are no more tuples.

-   The operator implements a loop that calls **Next()**on its children to retrieve their tuples and then process them.

Also called **Volcano**or **Pipeline** Model.

This is used in almost every DBMS. Allows for tuple pipelining.

Some operators must block until their children emit all their tuples.

-   Joins, Subqueries, Order By



Output control works easily with this approach.





