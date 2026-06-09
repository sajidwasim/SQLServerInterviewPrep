---
title: SQL Server Internals & Storage Engine
order: 5
icon: ⚙️
---

## Key Concepts

Understanding SQL Server internals separates a junior DBA from a senior one. Interviewers ask internals questions to test whether you understand **how** SQL Server works, not just **what** commands to run.

### Pages and Extents

SQL Server stores data in **8 KB pages**. Eight contiguous pages form one **64 KB extent**.

An 8 KB page has three regions — header, data, and row offset array:

<svg viewBox="0 0 720 210" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;margin:16px 0;">
  <rect width="720" height="210" rx="8" fill="var(--bg-secondary,#f6f8fa)" stroke="var(--border,#d0d7de)" stroke-width="1"/>
  <!-- Page header -->
  <text x="360" y="18" text-anchor="middle" font-family="Inter,sans-serif" font-size="13" font-weight="700">8 KB Page Structure</text>
  <rect x="40" y="28" width="500" height="24" rx="3" fill="#ddf4ff" stroke="#0969da" stroke-width="1"/>
  <text x="290" y="45" text-anchor="middle" font-family="Inter,sans-serif" font-size="10" font-weight="600" fill="#0550ae">Header (96 bytes)</text>
  <rect x="40" y="28" width="500" height="24" rx="3" fill="#ddf4ff" stroke="#0969da" stroke-width="1" opacity="0.3"/>
  <rect x="40" y="52" width="500" height="80" rx="3" fill="#dafbe1" stroke="#1a7f37" stroke-width="1"/>
  <text x="290" y="72" text-anchor="middle" font-family="Inter,sans-serif" font-size="10" font-weight="600" fill="#116329">Data Rows (variable)</text>
  <text x="290" y="88" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" fill="#116329">Row 1: OrderID=1001, CustomerID=42, Total=250.00</text>
  <text x="290" y="102" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" fill="#116329">Row 2: OrderID=1002, CustomerID=17, Total=89.95</text>
  <text x="290" y="116" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" fill="#116329">Row 3: OrderID=1003, CustomerID=88, Total=1340.00</text>
  <text x="290" y="130" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" fill="#8b949e">… more rows …</text>
  <rect x="40" y="132" width="500" height="24" rx="3" fill="#fff8c5" stroke="#d29922" stroke-width="1"/>
  <text x="290" y="149" text-anchor="middle" font-family="Inter,sans-serif" font-size="10" font-weight="600" fill="#7a5e00">Row Offset Array (2 bytes per row)</text>
  <!-- Side annotations -->
  <rect x="555" y="28" width="148" height="22" rx="3" fill="#f6f8fa" stroke="#d0d7de" stroke-width="1"/>
  <text x="629" y="43" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" fill="#8b949e">Page type, free space</text>
  <rect x="555" y="52" width="148" height="22" rx="3" fill="#f6f8fa" stroke="#d0d7de" stroke-width="1"/>
  <text x="629" y="67" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" fill="#8b949e">Stored sequentially</text>
  <rect x="555" y="132" width="148" height="22" rx="3" fill="#f6f8fa" stroke="#d0d7de" stroke-width="1"/>
  <text x="629" y="147" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" fill="#8b949e">Row offsets (grows downward)</text>
  <!-- Extent section -->
  <rect x="40" y="168" width="640" height="30" rx="4" fill="none" stroke="var(--border,#d0d7de)" stroke-width="1"/>
  <text x="55" y="188" font-family="Inter,sans-serif" font-size="10" font-weight="600">Extent (64 KB):</text>
  <rect x="140" y="171" width="60" height="24" rx="2" fill="#ddf4ff" stroke="#0969da" stroke-width="0.8"/><text x="170" y="188" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" fill="#0550ae">Page</text>
  <rect x="206" y="171" width="60" height="24" rx="2" fill="#ddf4ff" stroke="#0969da" stroke-width="0.8"/><text x="236" y="188" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" fill="#0550ae">Page</text>
  <rect x="272" y="171" width="60" height="24" rx="2" fill="#ddf4ff" stroke="#0969da" stroke-width="0.8"/><text x="302" y="188" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" fill="#0550ae">Page</text>
  <rect x="338" y="171" width="60" height="24" rx="2" fill="#ddf4ff" stroke="#0969da" stroke-width="0.8"/><text x="368" y="188" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" fill="#0550ae">Page</text>
  <rect x="404" y="171" width="60" height="24" rx="2" fill="#ddf4ff" stroke="#0969da" stroke-width="0.8"/><text x="434" y="188" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" fill="#0550ae">Page</text>
  <rect x="470" y="171" width="60" height="24" rx="2" fill="#ddf4ff" stroke="#0969da" stroke-width="0.8"/><text x="500" y="188" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" fill="#0550ae">Page</text>
  <rect x="536" y="171" width="60" height="24" rx="2" fill="#ddf4ff" stroke="#0969da" stroke-width="0.8"/><text x="566" y="188" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" fill="#0550ae">Page</text>
  <rect x="602" y="171" width="60" height="24" rx="2" fill="#ddf4ff" stroke="#0969da" stroke-width="0.8"/><text x="632" y="188" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" fill="#0550ae">Page</text>
  <text x="664" y="188" font-family="Inter,sans-serif" font-size="9" fill="#8b949e">= 1 extent</text>
</svg>

| Page Type | What It Stores |
|-----------|---------------|
| Data page | Table rows (clustered index leaf) |
| Index page | B-Tree index nodes |
| GAM | Global Allocation Map — which extents are allocated |
| SGAM | Shared GAM — which extents have free space |
| PFS | Page Free Space — space utilization per page |
| DCM | Differential Changed Map — changed since last full backup |
| BCM | Bulk Changed Map — changed by minimally logged operations |
| IAM | Index Allocation Map — which extents belong to an index |
| LOB | Large object data (TEXT, NTEXT, IMAGE, MAX types) |

### Allocation Maps — What They Do and Why They Matter

| Map | Tracks | Used By |
|-----|--------|---------|
| **GAM** | Which extents are allocated (1 = free, 0 = allocated) | Allocation and deallocation of extents |
| **SGAM** | Which extents have at least one free page (1 = mixed extent with free page) | Finding space for small objects (< 8 pages) |
| **PFS** | Free space per page (0–100% free, or IAM/page type) | Every INSERT/UPDATE needs an PFS check |
| **DCM** | Which extents have changed since last full backup | Differential backups |
| **BCM** | Which extents changed during minimally logged operations | Bulk-logged recovery model |

> **Interview insight:** When you understand GAM/SGAM, you can explain why **tempdb contention** happens — all temp tables allocate and deallocate pages rapidly, causing contention on GAM/SGAM/PFS pages. That's why you need multiple tempdb data files on multi-core servers.

### B-Tree Structure — Visual Walkthrough

For a clustered index on `Orders(OrderID)`:

```
                         Root Page
                  [1-100]  [101-200]  [201-300]
                 /           |              \
           Intermediate              Intermediate
     [1-50] [51-100]          [101-150] [151-200]
        /       \                /         \
     Leaf      Leaf           Leaf        Leaf
   (data pg)  (data pg)    (data pg)    (data pg)
```

- **Root page:** 1 page at top
- **Intermediate pages:** 2+ levels for large tables
- **Leaf pages:** The actual data (clustered) or index entries (nonclustered)
- **Page splits:** When a page is full and a new row must be inserted — half the rows move to a new page

### Page Splits — What They Cost

A page split happens when a page has no room for a new row during an INSERT or UPDATE that lengthens a row:

1. SQL Server allocates a new page
2. Moves ~50% of the rows from the full page to the new page
3. Updates the page linkages in the B-Tree
4. This causes fragmentation and generates transaction log records

**Minimize page splits by:**
- Choosing an ever-increasing clustered key (IDENTITY, SEQUENCE)
- Using appropriate FILLFACTOR for tables with random inserts
- Avoiding large UPDATEs that lengthen variable-length columns

### Forwarding Pointers (Heaps)

When a table has no clustered index (heap), rows can move to a different page during an UPDATE that lengthens the row. SQL Server leaves a **forwarding pointer** at the original location:

```
Original location: Page 1:312 (forward → Page 5:820)
New location:      Page 5:820
```

Over time, forwarding pointers create **forwarding chains** that degrade read performance significantly. This is one reason heaps can be bad for OLTP workloads.

```sql
-- Check forwarding pointers
SELECT OBJECT_NAME(object_id) AS table_name,
       forwarded_record_count
FROM sys.dm_db_index_physical_stats(
    DB_ID(), NULL, NULL, NULL, 'DETAILED')
WHERE forwarded_record_count > 0;
```

> [!tip]
> A clustered index eliminates forwarding pointers because the row position is defined by the key value, not the physical location. If you must use a heap, regularly check for forwarding pointers and rebuild if needed.

### Transaction Log Internals

The transaction log is a **write-ahead log** — the log is written before the data page.

```
Checkpoint ──── writes dirty pages from buffer pool to disk
    │
Virtual Log Files (VLFs) ──── log is divided into segments
    │
Log Sequence Number (LSN) ──── every log record has a unique LSN
    │
Write-Ahead Logging (WAL) ──── log write happens BEFORE data page write
```

**VLF best practices:**
- Too many VLFs (from frequent small log autogrows) = slow operations and long recovery
- Target: < 50 VLFs for small DBs, < 1,000 for very large DBs
- Fix: set log to appropriate size, grow in large chunks, then shrink + regrow

```sql
-- Check VLF count
DBCC LOGINFO;

/* The result shows VLF count in the rows returned.
   If VLF count is > 1,000 on a busy system, consider
   rebuilding the log at an appropriate size. */
```

### Checkpoint Types

| Type | Behavior | When |
|------|----------|------|
| Automatic | Writes dirty pages based on recovery interval (default 60s) | Background |
| Manual | `CHECKPOINT` command | Explicit |
| Indirect | Per-database target recovery time (SQL 2016+) | Configured per DB |
| Internal | When log is X% full | Auto |

### Memory and Buffer Pool

The **buffer pool** is SQL Server's main memory area — it caches data pages from disk. Pages cycle through three states:

<svg viewBox="0 0 720 130" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;margin:16px 0;">
  <rect width="720" height="130" rx="8" fill="var(--bg-secondary,#f6f8fa)" stroke="var(--border,#d0d7de)" stroke-width="1"/>
  <text x="360" y="18" text-anchor="middle" font-family="Inter,sans-serif" font-size="13" font-weight="700">Buffer Pool — Page Lifecycle</text>
  <!-- Clean pages -->
  <rect x="20" y="30" width="200" height="50" rx="6" fill="#dafbe1" stroke="#1a7f37" stroke-width="2"/>
  <text x="120" y="50" text-anchor="middle" font-family="Inter,sans-serif" font-size="12" font-weight="700" fill="#116329">Clean Pages</text>
  <text x="120" y="66" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" fill="#116329">Match disk → can be evicted</text>
  <!-- Arrow to Dirty -->
  <line x1="220" y1="55" x2="258" y2="55" stroke="#d29922" stroke-width="2"/>
  <text x="240" y="50" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" fill="#d29922">modified</text>
  <!-- Dirty pages -->
  <rect x="260" y="30" width="200" height="50" rx="6" fill="#ffeef0" stroke="#cf222e" stroke-width="2"/>
  <text x="360" y="50" text-anchor="middle" font-family="Inter,sans-serif" font-size="12" font-weight="700" fill="#cf222e">Dirty Pages</text>
  <text x="360" y="66" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" fill="#cf222e">Modified — must be checkpointed</text>
  <!-- Arrow to Free -->
  <line x1="460" y1="55" x2="498" y2="55" stroke="#0969da" stroke-width="2"/>
  <text x="480" y="50" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" fill="#0969da">checkpoint</text>
  <!-- Free pages -->
  <rect x="500" y="30" width="200" height="50" rx="6" fill="#ddf4ff" stroke="#0969da" stroke-width="2"/>
  <text x="600" y="50" text-anchor="middle" font-family="Inter,sans-serif" font-size="12" font-weight="700" fill="#0550ae">Free Pages</text>
  <text x="600" y="66" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" fill="#0550ae">Available for new reads</text>
  <!-- Lazy writer -->
  <rect x="100" y="95" width="160" height="20" rx="4" fill="none" stroke="#d29922" stroke-width="1" stroke-dasharray="3,2"/>
  <text x="180" y="109" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" fill="#d29922">Lazy Writer (evicts clean pages)</text>
  <line x1="180" y1="95" x2="120" y2="82" stroke="#d29922" stroke-width="1" stroke-dasharray="3,2"/>
  <!-- PLE callout -->
  <rect x="400" y="95" width="200" height="20" rx="4" fill="none" stroke="#cf222e" stroke-width="1"/>
  <text x="500" y="109" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" fill="#cf222e">PLE = how long pages stay in cache</text>
</svg>

**Lazy writer** — process that frees buffer pool memory when SQL Server needs more. Frequent lazy writer activity = memory pressure.

```sql
-- Buffer pool health
SELECT COUNT(*) AS cached_pages,
       COUNT(*) * 8 / 1024 AS cached_mb,
       AVG(free_space_in_bytes) AS avg_free_bytes
FROM sys.dm_os_buffer_descriptors
WHERE database_id = DB_ID();

-- Page life expectancy (PLE) — target > 300 seconds
SELECT cntr_value AS page_life_expectancy_sec
FROM sys.dm_os_performance_counters
WHERE object_name LIKE '%Buffer Manager%'
  AND counter_name = 'Page life expectancy';

-- Checkpoint pages written
SELECT cntr_value AS pages_written_sec
FROM sys.dm_os_performance_counters
WHERE object_name LIKE '%Buffer Manager%'
  AND counter_name = 'Checkpoint pages/sec';
```

### TempDB Internals

TempDB is shared across all databases and is a common bottleneck:

```sql
-- TempDB contention
SELECT session_id, wait_type, wait_time, wait_resource
FROM sys.dm_exec_requests
WHERE wait_type LIKE '%PAGELATCH%'
  AND wait_resource LIKE '%tempdb%';

-- Check tempdb file configuration
SELECT name, physical_name, size / 128 AS size_mb,
       growth / 128 AS growth_mb,
       is_percent_growth
FROM sys.master_files
WHERE database_id = 2;
```

**Best practice:** On servers with 8+ logical cores, create multiple tempdb data files equal to the number of cores (or start with 4–8). This reduces allocation contention on GAM/SGAM/PFS pages.

---

## Interview Q&A

**Q:** What happens when you INSERT a row into a table with a clustered index?

> SQL Server navigates the B-Tree from the root to find the correct leaf page based on the clustered key value. If the page has space, the row is inserted directly. If the page is full, half the rows move to a new page (page split), which updates page linkages and generates log records. The PFS page is updated to reflect free space change. The GAM shows the new extent as allocated.

**Q:** What's the difference between a heap and a clustered index?

> A heap has no logical order — rows are stored as they're inserted. A clustered index defines the physical order of rows in the B-Tree. Heaps can cause forwarding pointers on UPDATE (if the row lengthens and moves), while clustered indexes avoid this. Heaps are fine for staging tables or queues where you truncate frequently. For most OLTP tables, a clustered index is better.

**Q:** Why does tempdb need multiple data files on modern hardware?

> When many sessions create and drop temp tables simultaneously, they allocate/deallocate pages from tempdb. This creates contention on GAM, SGAM, and PFS pages — visible as PAGELATCH waits. Multiple data files reduce contention because different sessions can allocate from different files. A general guideline: start with 4–8 equal-sized files for 8+ cores, and monitor for PAGELATCH waits.

**Q:** Explain write-ahead logging.

> Write-ahead logging means the transaction log record is written to disk BEFORE the data page modification is written. If the server crashes, SQL Server uses the log during recovery to redo committed transactions and undo uncommitted ones. This guarantees data integrity even without writing data pages after every transaction. The log write is sequential (fast), while data page writes are random (slow).

---

## T-SQL Quick Reference

```sql
-- Page type distribution for current database
SELECT allocated_page_page_type,
       CASE allocated_page_page_type
           WHEN 1 THEN 'Data page'
           WHEN 2 THEN 'Index page'
           WHEN 3 THEN 'LOB page'
           WHEN 4 THEN 'Row overflow page'
           WHEN 7 THEN 'Mapping page'
           WHEN 8 THEN 'GAM'
           WHEN 9 THEN 'SGAM'
           WHEN 10 THEN 'PFS'
           WHEN 11 THEN 'DCM'
           WHEN 12 THEN 'BCM'
           WHEN 13 THEN 'IAM'
           ELSE 'Unknown'
       END AS page_type_desc,
       COUNT(*) AS page_count
FROM sys.dm_db_database_page_allocations(DB_ID(), NULL, NULL, NULL, 'LIMITED')
GROUP BY allocated_page_page_type
ORDER BY allocated_page_page_type;

-- Check VLFs
DBCC LOGINFO;

-- Buffer pool by database
SELECT DB_NAME(database_id) AS database_name,
       COUNT(*) * 8 / 1024 AS buffer_pool_mb
FROM sys.dm_os_buffer_descriptors
GROUP BY database_id
ORDER BY buffer_pool_mb DESC;

-- Check for forwarding pointers
SELECT OBJECT_NAME(object_id) AS table_name,
       index_type_desc, forwarded_record_count
FROM sys.dm_db_index_physical_stats(
    DB_ID(), NULL, NULL, NULL, 'DETAILED')
WHERE forwarded_record_count > 0;

-- Recovery model and log reuse
SELECT name, recovery_model_desc,
       log_reuse_wait_desc,
       (size * 8) / 1024 AS log_size_mb
FROM sys.master_files
WHERE type_desc = 'LOG'
ORDER BY name;
```
