
# 1. Relational Model

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

→ The query specifies the (high-level) strategythe DBMS should use to find the desired result.

**Non-Procedural (Declarative):** (Relational Calculus)

→ The query specifies only what data is wanted and not how to find it.

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

Functions that return a single value from a bag of tuples. Aggregate functions can (almost) only be used in the **SELECT**output list.

**AVG(col)**: Return the average col value.

**MIN(col)**: Return minimum col value.

**MAX(col)**: Return maximum col value.

**SUM(col)**: Return sum of values in col.

**COUNT(col)**: Return # of values for col.

>   Group by

Project tuples into subsets and calculate aggregates againsteach subset. 

Non-aggregated values in **SELECT**output clause must appear in **GROUPBY** clause.

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

Operations to manipulate and modify **DATE**/**TIME**attributes.

Can be used in both output and predicates.

>   Output Redirection

Store query results in another table: 1.Table must not already be defined. 2.Table will have the same # of columns with the same types as the input.

Insert tuples from query into another table:

→Inner **SELECT** must generate the same columns as the target table.

→DBMSs have different options/syntax on what to do with integrity violations (e.g., invalid duplicates).

>   Output Control

Order the output tuples by the values in one or more of their columns.

Limit the # of tuples returned in output. Can set an offset to return a “range”

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

Maintain a header pageat the beginning of the file that stores two pointers: HEAD of the free page list and the data page list.

Each page keeps track of how many free slots they currently have.

The DBMS maintains special pages that tracks the location of data pages in the database files. The directory also records the number of free slots per page. Must make sure that the directory pages are in sync with the data pages.

>   Page Layout

Every page contains a headerof meta-data about the page's contents. Page Size, Checksum, DBMS Version, Transaction Visibility, Compression Information.

The most common layout scheme is called slotted pages. The slot array maps "slots" to the tuples' starting position offsets. The header keeps track of: 1. The # of used slots 2. The offset of the starting location of the last slot used.

Each tuple is assigned a unique record identifier. Most common: **page_id**+ **offset/slot**, Can also contain file location info. 

Each tuple is prefixed with a headerthat contains meta-data about it. Visibility info (concurrency control), Bit Map for **NULL** values.

DBMS can physically **denormalize** (e.g., "pre join") related tuples and store them together in the same page.

# 4. DataBase Storage (2)

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

To store values that are larger than a page, the DBMS uses separate **overflow**storage pages.

-   Postgres: TOAST (>2KB)

-   MySQL: Overflow (>$1/2$ size of page)

-   SQL Server: Overflow (>size of page)

Some systems allow you to store a really largevalue in an external file.Treated as a **BLOB**type.

-   Oracle: **BFILE**data type

-   Microsoft: **FILESTREAM**data type

The DBMS **cannot** manipulate the contents of an external file. No durability protections. No transaction protections.

>   System Catalogs

A DBMS stores meta-data about databases in its internal catalogs.

-   Tables, columns, indexes, views; Users, permissions; Internal statistics

Almost every DBMS stores the database's catalog inside itself (i.e., as tables). You can query the DBMS’s internal **INFORMATION_SCHEMA**catalog to get info about the database.

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

The DBMS stores the values of a single attribute for all tuples contiguously in a page.

→Also known as a "column store"

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









