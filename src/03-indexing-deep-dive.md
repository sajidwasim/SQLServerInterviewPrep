---
title: Indexing Deep Dive
order: 4
icon: 📊
---

## Key Concepts

Indexes are the single highest-impact performance lever a DBA controls. A well-designed index can make a query run 100x faster. A missing or wrong index can bring production to its knees. This chapter gives you the depth needed for a senior DBA interview.

### B-Tree Structure — How Indexes Actually Work

SQL Server indexes use a **B-Tree** (balanced tree) structure. Below is a clustered index — the leaf level IS the data pages:

<svg viewBox="0 0 720 200" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;margin:16px 0;">
  <defs>
    <marker id="bt-arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#8b949e"/></marker>
  </defs>
  <rect width="720" height="200" rx="8" fill="var(--bg-secondary,#f6f8fa)" stroke="var(--border,#d0d7de)" stroke-width="1"/>
  <text x="360" y="20" text-anchor="middle" font-family="Inter,sans-serif" font-size="13" font-weight="700">Clustered Index B-Tree</text>
  <!-- Root node -->
  <rect x="285" y="30" width="150" height="30" rx="4" fill="#ddf4ff" stroke="#0969da" stroke-width="1.5"/>
  <text x="360" y="50" text-anchor="middle" font-family="Inter,sans-serif" font-size="11" font-weight="600" fill="#0550ae">Root Node</text>
  <!-- Arrows root→intermediate -->
  <line x1="310" y1="60" x2="180" y2="95" stroke="#8b949e" stroke-width="1.2" marker-end="url(#bt-arrow)"/>
  <line x1="410" y1="60" x2="540" y2="95" stroke="#8b949e" stroke-width="1.2" marker-end="url(#bt-arrow)"/>
  <!-- Intermediate nodes -->
  <rect x="100" y="98" width="150" height="30" rx="4" fill="#ddf4ff" stroke="#0969da" stroke-width="1.2"/>
  <text x="175" y="118" text-anchor="middle" font-family="Inter,sans-serif" font-size="10" font-weight="600" fill="#0550ae">Intermediate Level</text>
  <rect x="470" y="98" width="150" height="30" rx="4" fill="#ddf4ff" stroke="#0969da" stroke-width="1.2"/>
  <text x="545" y="118" text-anchor="middle" font-family="Inter,sans-serif" font-size="10" font-weight="600" fill="#0550ae">Intermediate Level</text>
  <!-- Arrows → leaf -->
  <line x1="130" y1="128" x2="70" y2="155" stroke="#8b949e" stroke-width="1.2" marker-end="url(#bt-arrow)"/>
  <line x1="220" y1="128" x2="260" y2="155" stroke="#8b949e" stroke-width="1.2" marker-end="url(#bt-arrow)"/>
  <line x1="500" y1="128" x2="440" y2="155" stroke="#8b949e" stroke-width="1.2" marker-end="url(#bt-arrow)"/>
  <line x1="590" y1="128" x2="640" y2="155" stroke="#8b949e" stroke-width="1.2" marker-end="url(#bt-arrow)"/>
  <!-- Leaf level = data pages -->
  <rect x="15" y="158" width="110" height="30" rx="4" fill="#dafbe1" stroke="#1a7f37" stroke-width="1.5"/>
  <text x="70" y="173" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" fill="#116329">Data Page</text>
  <text x="70" y="184" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" fill="#116329">(rows 1-200)</text>
  <rect x="210" y="158" width="110" height="30" rx="4" fill="#dafbe1" stroke="#1a7f37" stroke-width="1.5"/>
  <text x="265" y="173" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" fill="#116329">Data Page</text>
  <text x="265" y="184" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" fill="#116329">(rows 201-450)</text>
  <rect x="390" y="158" width="110" height="30" rx="4" fill="#dafbe1" stroke="#1a7f37" stroke-width="1.5"/>
  <text x="445" y="173" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" fill="#116329">Data Page</text>
  <text x="445" y="184" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" fill="#116329">(rows 451-700)</text>
  <rect x="585" y="158" width="110" height="30" rx="4" fill="#dafbe1" stroke="#1a7f37" stroke-width="1.5"/>
  <text x="640" y="173" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" fill="#116329">Data Page</text>
  <text x="640" y="184" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" fill="#116329">(rows 701-1000)</text>
  <!-- Callout -->
  <rect x="710" y="0" width="10" height="200" fill="transparent"/>
  <line x1="530" y1="130" x2="700" y2="145" stroke="#cf222e" stroke-width="1" stroke-dasharray="3,2"/>
  <text x="700" y="158" text-anchor="end" font-family="Inter,sans-serif" font-size="9" fill="#cf222e">Leaf = data</text>
</svg>

**Clustered index:** The leaf level IS the data pages (the actual rows). The index _is_ the table.

**Nonclustered index:** The leaf level contains index key columns + bookmark (clustered index key or RID) pointing to the data row.

### Clustered Index — Deep Dive

Choosing the wrong clustered key is one of the most expensive mistakes you can make. SQL Server adds the clustered key to every nonclustered index as a lookup mechanism — so a wide clustered key bloats every nonclustered index.

**Characteristics of a good clustered key:**

| Property | Why | Example |
|----------|-----|---------|
| **Narrow** | Clustered key is copied to all NC indexes | `INT` (4 bytes) vs `GUID` (16 bytes) |
| **Unique** | SQL Server adds a 4-byte uniquifier if not unique | Identity, sequence |
| **Static** | Updates to clustered key cascade to NC indexes | Ever-increasing values are ideal |
| **Ever-increasing** | Reduces page splits | `IDENTITY`, `SEQUENCE`, `DATETIME` |
| **Used for range scans** | Clustered index is fastest for range queries | `OrderDate`, `OrderID` |

> [!warning]
> **GUID as clustered index** — `NEWID()` generates random GUIDs causing massive fragmentation and page splits. If you must use GUID, use `NEWSEQUENTIALID()` or make the clustered key something else.

```sql
-- Good candidate for clustered index
CREATE CLUSTERED INDEX CX_Orders_OrderDate_OrderID
ON dbo.Orders(OrderDate, OrderID);
-- Narrow, ever-increasing, supports range queries like "orders this month"
```

### Nonclustered Index — Deep Design

A nonclustered index is a **subset of columns** with a pointer back to the full row. Think of it like the index in a book — it tells you where to find the full content.

**Key decisions:**

```
Key columns      → Used in WHERE, JOIN, ORDER BY, GROUP BY
Included columns → Only in SELECT (not used for search or sorting)
Filter condition → Only index rows matching a predicate
```

```sql
-- Covering index: all columns needed by the query are IN the index
CREATE NONCLUSTERED INDEX IX_Orders_CustomerID
ON dbo.Orders(CustomerID, OrderDate DESC)
INCLUDE (OrderAmount, OrderStatus, ShippingAddress);
-- No key lookups needed for queries selecting these columns
```

**How to design a covering index for a specific query:**

1. Identify the query's WHERE predicates → key columns
2. Identify ORDER BY → key columns (same order) or included
3. Identify SELECT columns → included columns
4. Check if the index is covering (no key lookups in the plan)

### Key Lookups — The Silent Performance Killer

When a nonclustered index is used but doesn't cover the query, SQL Server does a **key lookup** (clustered) or **RID lookup** (heap) to fetch the missing columns.

```
Index Seek (IX_Orders_CustomerID)  →  finds 10,000 rows
    ↓
Key Lookup (clustered index)  →  for each row, go lookup the full row
    ↓
10,000 random I/Os  →  SLOW!
```

**Fix:** Add missing columns as INCLUDE columns in the nonclustered index.

### Columnstore Indexes

Columnstore indexes store data **by column, not by row**. They compress extremely well and are optimized for analytic / reporting queries that scan large ranges.

| | Rowstore (B-Tree) | Columnstore |
|---|---|---|
| Storage | By row | By column |
| Best for | OLTP, point lookups, small scans | Analytics, aggregations, large scans |
| Compression | Moderate | Excellent (5-10x) |
| Update pattern | Frequent updates | Batch updates preferred |

```sql
-- Columnstore for analytics workload
CREATE CLUSTERED COLUMNSTORE INDEX CCI_Sales
ON dbo.Sales WITH (MAXDOP = 2);

-- Nonclustered columnstore on an existing rowstore table
CREATE NONCLUSTERED COLUMNSTORE INDEX NCCI_Sales_Analytics
ON dbo.Sales(ProductID, SaleDate, Amount, CustomerID);
```

### Filtered Indexes

A filtered index covers only a subset of rows. It's smaller, faster to maintain, and can be more efficient.

```sql
-- Only index active orders (99% of queries filter by Active = 1)
CREATE NONCLUSTERED INDEX IX_Orders_Active
ON dbo.Orders(CustomerID, OrderDate DESC)
WHERE Status = 'Active';
-- This index is tiny compared to an unfiltered one
```

**Use cases:** Soft-delete patterns (`WHERE IsDeleted = 0`), status fields with skewed distributions, partitioned access patterns.

### Index Maintenance — Fragmentation

Fragmentation occurs when index pages are not in logical order or have empty space.

| Fragmentation % | Action |
|----------------|--------|
| 0–5% | Ignore |
| 5–30% | `ALTER INDEX ... REORGANIZE` |
| > 30% | `ALTER INDEX ... REBUILD` |

```sql
-- Check fragmentation
SELECT OBJECT_NAME(ps.object_id) AS table_name,
       i.name AS index_name,
       ps.avg_fragmentation_in_percent,
       ps.page_count,
       ps.avg_page_space_used_in_percent
FROM sys.dm_db_index_physical_stats(
    DB_ID(), NULL, NULL, NULL, 'LIMITED') ps
JOIN sys.indexes i ON ps.object_id = i.object_id
                   AND ps.index_id = i.index_id
WHERE ps.page_count > 1000
ORDER BY ps.avg_fragmentation_in_percent DESC;

-- Rebuild with fill factor and online option
ALTER INDEX IX_Orders_CustomerID
ON dbo.Orders REBUILD WITH (
    FILLFACTOR = 90,
    ONLINE = ON,           -- Enterprise Edition only
    SORT_IN_TEMPDB = ON,
    MAXDOP = 4
);
```

> [!tip]
> Fragmentation matters less than most DBAs think. A fragmented index with 30% fragmentation is often no slower than a defragmented one — if the data is in memory. Focus on **missing indexes** before fragmentation. Brent Ozar ranks fragmentation as a "medium" concern, not a top priority.

### Fill Factor

When to change from the default (0 = full pages):

- **OLTP with heavy inserts/updates** → reduce fill factor (70–90) to leave room for page splits
- **Read-only / reporting** → leave at 0 (full pages) for maximum density

```sql
-- Set fill factor at index creation
CREATE NONCLUSTERED INDEX IX_Orders_CustomerID
ON dbo.Orders(CustomerID)
WITH (FILLFACTOR = 85);
```

### Index Analysis DMVs — Your Daily Toolkit

```sql
-- Missing indexes (most impactful first)
SELECT migs.avg_user_impact, migs.avg_total_user_cost,
       migs.unique_compiles,
       mid.statement AS table_name,
       mid.equality_columns,
       mid.inequality_columns,
       mid.included_columns,
       migs.user_seeks, migs.user_scans
FROM sys.dm_db_missing_index_groups mig
JOIN sys.dm_db_missing_index_group_stats migs
    ON mig.index_group_handle = migs.group_handle
JOIN sys.dm_db_missing_index_details mid
    ON mig.index_handle = mid.index_handle
WHERE mid.database_id = DB_ID()
ORDER BY migs.avg_user_impact * migs.avg_total_user_cost DESC;

-- Unused indexes (overhead, no benefit)
SELECT OBJECT_NAME(i.object_id) AS table_name,
       i.name AS index_name,
       s.user_seeks, s.user_scans, s.user_lookups,
       s.user_updates,
       (s.user_updates - s.user_seeks - s.user_scans - s.user_lookups)
           AS write_overhead
FROM sys.dm_db_index_usage_stats s
RIGHT JOIN sys.indexes i
    ON s.object_id = i.object_id AND s.index_id = i.index_id
WHERE i.type > 0
  AND i.object_id > 100
  AND (s.object_id IS NULL
       OR (s.user_seeks + s.user_scans + s.user_lookups = 0))
ORDER BY OBJECT_NAME(i.object_id);

-- Duplicate indexes (same key columns, different names)
SELECT OBJECT_NAME(a.object_id) AS table_name,
       a.index_id AS idx1_id, a.name AS idx1_name,
       b.index_id AS idx2_id, b.name AS idx2_name,
       STUFF((SELECT ', ' + c.name
              FROM sys.index_columns ic
              JOIN sys.columns c
                  ON ic.object_id = c.object_id
                 AND ic.column_id = c.column_id
              WHERE ic.object_id = a.object_id
                AND ic.index_id = a.index_id
              ORDER BY ic.index_column_id, ic.key_ordinal
              FOR XML PATH('')), 1, 2, '') AS key_columns
FROM sys.indexes a
JOIN sys.indexes b
    ON a.object_id = b.object_id
   AND a.index_id < b.index_id
   AND a.type = b.type;
```

### Indexing Patterns for Common Query Types

| Query Pattern | Index Strategy |
|---------------|---------------|
| `WHERE col = @val` (equality) | Nonclustered index on `col`, INCLUDE other SELECT columns |
| `WHERE col BETWEEN @a AND @b` (range) | Clustered on `col` if range is common, or nonclustered with INCLUDE |
| `ORDER BY col1, col2` | Index key must match order: `(col1, col2)` same direction |
| `JOIN table ON a.col = b.col` | Index on `b.col` (foreign key column) |
| `WHERE a = @a AND b = @b` (multi-column equality) | Composite index on `(a, b)` — column order matters |
| `WHERE a = @a ORDER BY b` | Composite index on `(a, b)` — covers both predicate and sort |
| `SELECT COUNT(*) FROM big_table` | Use a narrow nonclustered index instead of clustered scan |
| `WHERE Status = @s AND CreatedDate > @d` | Filtered index on `(CreatedDate)` WHERE Status = 'X' |

### Common Indexing Mistakes — Interview Answers

**1. Over-indexing:** Every index slows down INSERT/UPDATE/DELETE. A table with 10 indexes may have great SELECT performance but terrible write performance.

**2. Wrong key column order:** Index on `(OrderDate, CustomerID)` vs `(CustomerID, OrderDate)` — the first helps date-range queries, the second helps lookups by customer. You need to know the workload.

**3. Ignoring included columns:** Key columns go in the index tree (searchable), included columns go at the leaf (cover the SELECT). Putting everything in key columns wastes space and slows maintenance.

**4. Blindly following missing index DMVs:** The DMV doesn't know about existing indexes. It may suggest indexes you already have (with different columns) or suggest overlapping indexes.

**5. Rebuilding indexes too often:** Weekly rebuilds on a 10 TB database are wasteful. Check fragmentation first. Many OLTP indexes stay below 10% fragmentation for months.

---

## Interview Q&A

**Q:** How do you design an index strategy for a new table?

> I don't design indexes before the workload exists — that's guessing. I start with the primary key as the clustered index, put foreign key indexes for joins, and then monitor. As queries emerge, I look at the most expensive ones in Query Store or the plan cache. For each slow query, I create a covering index tailored to the WHERE, JOIN, and SELECT columns. I check for duplicates before creating. I also monitor index usage — if an index has zero reads but many writes, I drop it.

**Q:** When would you use a clustered vs nonclustered index for the primary key?

> By default, SQL Server makes the primary key clustered. But if the table has a wide or random primary key (like a GUID or a string), I make the PK nonclustered and choose a different clustered key — typically a narrow, ever-increasing INT identity. This keeps all nonclustered indexes narrow (since they carry the clustered key) and avoids fragmentation from random inserts.

**Q:** How do you decide between rebuilding and reorganizing an index?

> Reorganize for moderate fragmentation (5–30%) — it's online by default and uses fewer resources. Rebuild for heavy fragmentation (> 30%) — it creates a new index and can be done ONLINE in Enterprise Edition. I check fragmentation using `sys.dm_db_index_physical_stats` and base the decision on page count and fragmentation level. I also consider the index size — a 2 GB index at 40% fragmentation may need a rebuild; a 500 GB index at 40% may need a different approach entirely.

**Q:** What's your approach to columnstore indexes?

> Columnstore is fantastic for analytics and reporting queries that scan millions of rows. But it's not for OLTP — singleton lookups and frequent small updates perform poorly on columnstore. I use columnstore on dedicated reporting tables or as a secondary nonclustered columnstore on OLTP tables for mixed workloads (SQL Server 2016+ supports updateable NCCI). I always test compression savings and query performance before deploying.

---

## Recommended Reading

| Resource | Why |
|----------|-----|
| [Brent Ozar — Indexing](https://www.brentozar.com/sql/indexing/) | Practical, production-focused indexing guidance |
| [SQLSkills — Index Internals](https://www.sqlskills.com/blogs/paul/) | Paul Randal's deep internals on indexes |
| [Microsoft Learn — Index Architecture](https://learn.microsoft.com/en-us/sql/relational-databases/indexes/) | Official documentation |
