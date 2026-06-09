---
title: Performance Tuning & Troubleshooting
order: 3
icon: ⚡
---

## Key Concepts

### First Response When SQL Server is Slow

When someone says "SQL Server is slow" at 09:15 on a retail morning:

1. **Check active sessions** — `sys.dm_exec_requests` for what's running now
2. **Check blocking** — who is blocking whom?
3. **Check wait stats** — what is SQL Server waiting on?
4. **Check CPU, memory, IO** — resource pressure?
5. **Check recent deployments** — did something change?
6. **Check SQL Agent jobs** — is a heavy job running?

> [!warning]
> DON'T restart SQL Server as a first response. You lose all diagnostic evidence. Only restart after collecting data and exhausting other options.

### Wait Stats

Wait stats tell you **why queries are slow**. SQL Server is fast — it's usually waiting on something.

| Wait Type | What It Means | Common Cause |
|-----------|---------------|--------------|
| `PAGEIOLATCH_XX` | Waiting for disk IO | Slow storage, missing indexes, large scans |
| `LCK_M_XX` | Waiting on locks | Blocking, long transactions |
| `CXPACKET` | Parallelism skew | Skewed data distribution, need for MAXDOP tuning |
| `CXCONSUMER` | Parallel consumer wait | Similar to CXPACKET in SQL 2016+ |
| `ASYNC_NETWORK_IO` | Client consuming results too slowly | Application issue |
| `WRITELOG` | Waiting for log write | Slow log drive, too many log commits |
| `PAGELATCH_XX` | Waiting for in-memory page access | TempDB contention, allocation contention |

> **Junior mistake:** Looking at cumulative wait stats since last restart instead of current waits. Always check current waits during the problem window.

### Blocking vs Deadlock

| Blocking | Deadlock |
|----------|----------|
| Session A holds a lock, Session B waits | Two sessions each hold a lock the other needs |
| Resolves when A commits/rolls back | SQL Server chooses a victim (rolls back one session) |
| Can last minutes or hours | Resolves in seconds via victim selection |
| Fix: shorter transactions, proper indexes | Fix: consistent access order, retry logic |

### Query Store

Query Store is your best friend for **plan regression** analysis:

- Captures query text, plans, and runtime statistics
- Identifies when a plan changed and performance degraded
- Can force a known-good plan
- Available in SQL Server 2016+, enhanced in 2022 (leader/follower replicas)

```sql
-- Find regressed queries
SELECT qsq.query_id, qsp.plan_id,
       rs.avg_duration, rs.avg_cpu_time,
       rs.count_executions, rs.last_execution_time
FROM sys.query_store_query qsq
JOIN sys.query_store_plan qsp ON qsq.query_id = qsp.query_id
JOIN sys.query_store_runtime_stats rs ON qsp.plan_id = rs.plan_id
ORDER BY rs.last_execution_time DESC;
```

### Execution Plans

An execution plan is the compiled set of operations SQL Server uses to execute a query. The query optimizer evaluates thousands of possible plans and selects the one with the lowest estimated cost. Understanding how to read plans is the core skill of performance tuning.

#### Estimated vs Actual Plans

| | Estimated Plan | Actual Plan |
|---|---|---|
| When generated | During compilation | After execution completes |
| Row counts | Estimated (from statistics) | Actual (runtime) |
| Metrics | No runtime stats | Execution count, actual rows, actual rebinds |
| How to get | `SET SHOWPLAN_XML ON` | `SET STATISTICS XML ON` or Query Store |

**Always look at the actual plan.** The difference between estimated and actual rows reveals cardinality estimation problems — the single biggest cause of bad plans.

#### Reading a Plan — The Mental Model

```
1. Read right-to-left, top-to-bottom
2. Every operator feeds data to its parent (left)
3. The thickest arrow = the most rows = start here
4. Operator cost % is an estimate — don't tune by percentages alone
5. Look for warnings first (yellow triangle in SSMS, Warnings column in plan XML)
```

A graphical plan reads from **right to left** — each operator passes rows to the next one on its left:

<svg viewBox="0 0 720 140" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;margin:16px 0;">
  <defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#0969da"/>
    </marker>
    <marker id="arrowhead-data" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#1a7f37"/>
    </marker>
  </defs>
  <rect width="720" height="140" rx="8" fill="var(--bg-secondary,#f6f8fa)" stroke="var(--border,#d0d7de)" stroke-width="1"/>
  <line x1="640" y1="118" x2="85" y2="118" stroke="var(--text-muted,#8b949e)" stroke-width="1.5" stroke-dasharray="4,3" marker-end="url(#arrowhead)"/>
  <text x="360" y="132" text-anchor="middle" font-family="Inter,sans-serif" font-size="11" fill="var(--text-muted,#8b949e)">Reading direction (right → left)</text>
  <rect x="20" y="30" width="100" height="50" rx="6" fill="var(--accent-bg,#ddf4ff)" stroke="var(--accent,#0969da)" stroke-width="2"/>
  <text x="70" y="55" text-anchor="middle" font-family="Inter,sans-serif" font-size="12" font-weight="700" fill="var(--accent,#0969da)">SELECT</text>
  <text x="70" y="70" text-anchor="middle" font-family="Inter,sans-serif" font-size="10" fill="var(--accent-hover,#0550ae)">Cost: 0%</text>
  <line x1="120" y1="55" x2="175" y2="55" stroke="var(--accent,#0969da)" stroke-width="2" marker-end="url(#arrowhead)"/>
  <rect x="180" y="30" width="100" height="50" rx="6" fill="#fff8c5" stroke="#d29922" stroke-width="2"/>
  <text x="230" y="55" text-anchor="middle" font-family="Inter,sans-serif" font-size="12" font-weight="700" fill="#7a5e00">TOP 10</text>
  <text x="230" y="70" text-anchor="middle" font-family="Inter,sans-serif" font-size="10" fill="#7a5e00">Cost: 2%</text>
  <line x1="280" y1="55" x2="335" y2="55" stroke="#1a7f37" stroke-width="3" marker-end="url(#arrowhead-data)"/>
  <text x="307" y="45" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" fill="#1a7f37">691 rows</text>
  <rect x="340" y="15" width="170" height="80" rx="6" fill="#dafbe1" stroke="#1a7f37" stroke-width="2"/>
  <text x="425" y="38" text-anchor="middle" font-family="Inter,sans-serif" font-size="11" font-weight="700" fill="#116329">Clustered Index Scan</text>
  <text x="425" y="53" text-anchor="middle" font-family="Inter,sans-serif" font-size="10" fill="#116329">[SalesOrderDetail].[PK_…]</text>
  <text x="425" y="68" text-anchor="middle" font-family="Inter,sans-serif" font-size="10" fill="#116329">Cost: 98%</text>
  <text x="425" y="82" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" fill="var(--text-muted,#8b949e)">WHERE UnitPrice &gt; 1000</text>
  <rect x="340" y="98" width="170" height="20" rx="4" fill="none" stroke="#d29922" stroke-width="1" stroke-dasharray="3,2"/>
  <text x="425" y="112" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" fill="#7a5e00">⚠️ Thickest arrow = start here</text>
</svg>

The thickest data flow arrow points to the most expensive operator — that's where you start investigating.

**Key Lookup in action** — a nonclustered index finds matching rows, then fetches missing columns from the clustered index one row at a time:

<svg viewBox="0 0 720 145" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;margin:16px 0;">
  <defs>
    <marker id="kl-arrow" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#cf222e"/>
    </marker>
  </defs>
  <rect width="720" height="145" rx="8" fill="var(--bg-secondary,#f6f8fa)" stroke="var(--border,#d0d7de)" stroke-width="1"/>
  <!-- Nonclustered Index Seek -->
  <rect x="15" y="20" width="175" height="65" rx="6" fill="#dafbe1" stroke="#1a7f37" stroke-width="2"/>
  <text x="102" y="42" text-anchor="middle" font-family="Inter,sans-serif" font-size="11" font-weight="700" fill="#116329">Nonclustered Index Seek</text>
  <text x="102" y="57" text-anchor="middle" font-family="Inter,sans-serif" font-size="10" fill="#116329">IX_Orders_OrderDate</text>
  <text x="102" y="72" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" fill="#8b949e">Finds 1,200 rows matching date</text>
  <!-- Arrow to Key Lookup -->
  <line x1="190" y1="52" x2="245" y2="52" stroke="#cf222e" stroke-width="2.5" marker-end="url(#kl-arrow)"/>
  <!-- Row count label -->
  <text x="217" y="42" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" fill="#cf222e">1,200 rows</text>
  <!-- Key Lookup operator -->
  <rect x="250" y="15" width="175" height="75" rx="6" fill="#ffeef0" stroke="#cf222e" stroke-width="2"/>
  <text x="337" y="37" text-anchor="middle" font-family="Inter,sans-serif" font-size="12" font-weight="700" fill="#cf222e">Key Lookup</text>
  <text x="337" y="52" text-anchor="middle" font-family="Inter,sans-serif" font-size="10" fill="#cf222e">Clustered Index</text>
  <text x="337" y="67" text-anchor="middle" font-family="Inter,sans-serif" font-size="10" fill="#cf222e">PK_Orders</text>
  <text x="337" y="82" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" fill="#cf222e">Executed 1,200 times</text>
  <!-- Right side: explanation -->
  <rect x="460" y="15" width="240" height="115" rx="6" fill="#fff8c5" stroke="#d29922" stroke-width="1"/>
  <text x="580" y="35" text-anchor="middle" font-family="Inter,sans-serif" font-size="11" font-weight="700" fill="#7a5e00">Why this is expensive</text>
  <text x="470" y="53" font-family="Inter,sans-serif" font-size="10" fill="#7a5e00">• Nonclustered index has OrderDate</text>
  <text x="470" y="68" font-family="Inter,sans-serif" font-size="10" fill="#7a5e00">  but NOT TotalAmount, CustomerName</text>
  <text x="470" y="83" font-family="Inter,sans-serif" font-size="10" fill="#7a5e00">• Each lookup = random I/O</text>
  <text x="470" y="98" font-family="Inter,sans-serif" font-size="10" fill="#7a5e00">• 1,200 lookups × 2-5ms each</text>
  <text x="470" y="115" font-family="Inter,sans-serif" font-size="10" font-weight="700" fill="#cf222e">Fix: INCLUDE missing columns</text>
</svg>

One **Key Lookup** is cheap. Thousands executed in a loop are catastrophic — it's the most common performance problem found in production plans.

#### Key Operators

| Operator | What It Does | When It's Good | Red Flags |
|----------|-------------|---------------|-----------|
| **Index Seek** | Navigates the B-tree to find matching rows | Highly selective predicates (≤10% of rows) | Still expensive if filtering too many rows |
| **Index Scan** | Reads all leaf-level pages | Small table, or retrieving >30% of rows | Large table with a WHERE clause — missing index |
| **Table Scan** | Reads entire heap | Very small table | Large heap with no clustered index |
| **Key Lookup** | For each row from nonclustered index, fetches the row from the clustered index | Only a few lookups | Thousands of lookups = need covering index |
| **RID Lookup** | Same as Key Lookup but against a heap | Only a few lookups | Thousands of lookups = need clustered index |
| **Nested Loops** | For each outer row, probe inner side | Small outer input (<100 rows) | Large outer × large inner = millions of iterations |
| **Hash Match** | Build hash table, probe for matches | Large unsorted inputs, no useful indexes | Spill to tempdb (hash table doesn't fit in memory) |
| **Merge Join** | Sort both inputs, march through | Both inputs sorted on join key | Extra Sort operator added before the join = expensive |
| **Sort** | Reorder rows | Needed for ORDER BY, but ideally indexed | Spill to tempdb, or sorting large result sets |
| **Spool** | Store intermediate results for reuse | Avoiding repeated expensive scans | Often indicates a suboptimal plan |
| **Compute Scalar** | Calculate an expression | Simple arithmetic | Row-by-row function invocation (UDF, CAST on column) |

<svg viewBox="0 0 740 160" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;margin:16px 0;">
  <defs>
    <marker id="warn-line" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
      <polygon points="0 0, 8 3, 0 6" fill="#cf222e"/>
    </marker>
  </defs>
  <rect width="740" height="160" rx="8" fill="var(--bg-secondary,#f6f8fa)" stroke="var(--border,#d0d7de)" stroke-width="1"/>
  <text x="370" y="22" text-anchor="middle" font-family="Inter,sans-serif" font-size="13" font-weight="700">Three Most Common Plan Problems</text>
  <!-- Problem 1: Key Lookup -->
  <rect x="12" y="35" width="232" height="115" rx="6" fill="#ffeef0" stroke="#cf222e" stroke-width="1.5"/>
  <rect x="12" y="35" width="232" height="22" rx="6" fill="#cf222e"/>
  <rect x="12" y="47" width="232" height="10" fill="#cf222e"/>
  <text x="128" y="51" text-anchor="middle" font-family="Inter,sans-serif" font-size="11" font-weight="700" fill="#fff">Key Lookup Avalanche</text>
  <text x="22" y="72" font-family="Inter,sans-serif" font-size="10" fill="#1f2328">Nonclustered index covers WHERE</text>
  <text x="22" y="87" font-family="Inter,sans-serif" font-size="10" fill="#1f2328">but SELECT needs 10 more columns.</text>
  <text x="22" y="102" font-family="Inter,sans-serif" font-size="10" fill="#1f2328">1 lookup per row × 500K rows.</text>
  <text x="22" y="120" font-family="Inter,sans-serif" font-size="10" font-weight="700" fill="#cf222e">Fix: INCLUDE columns</text>
  <!-- Problem 2: Implicit Conversion -->
  <rect x="254" y="35" width="232" height="115" rx="6" fill="#fff8c5" stroke="#d29922" stroke-width="1.5"/>
  <rect x="254" y="35" width="232" height="22" rx="6" fill="#d29922"/>
  <rect x="254" y="47" width="232" height="10" fill="#d29922"/>
  <text x="370" y="51" text-anchor="middle" font-family="Inter,sans-serif" font-size="11" font-weight="700" fill="#fff">Implicit Conversion</text>
  <text x="264" y="72" font-family="Inter,sans-serif" font-size="10" fill="#1f2328">WHERE VarcharCol = N'value'</text>
  <text x="264" y="87" font-family="Inter,sans-serif" font-size="10" fill="#1f2328">SQL converts column, not literal.</text>
  <text x="264" y="102" font-family="Inter,sans-serif" font-size="10" fill="#1f2328">Index Scan instead of Seek.</text>
  <text x="264" y="120" font-family="Inter,sans-serif" font-size="10" font-weight="700" fill="#7a5e00">Fix: Align data types</text>
  <!-- Problem 3: Spill to Tempdb -->
  <rect x="496" y="35" width="232" height="115" rx="6" fill="#ddf4ff" stroke="#0969da" stroke-width="1.5"/>
  <rect x="496" y="35" width="232" height="22" rx="6" fill="#0969da"/>
  <rect x="496" y="47" width="232" height="10" fill="#0969da"/>
  <text x="612" y="51" text-anchor="middle" font-family="Inter,sans-serif" font-size="11" font-weight="700" fill="#fff">Spill to Tempdb</text>
  <text x="506" y="72" font-family="Inter,sans-serif" font-size="10" fill="#1f2328">Hash/Sort runs out of memory.</text>
  <text x="506" y="87" font-family="Inter,sans-serif" font-size="10" fill="#1f2328">Data overflows to disk.</text>
  <text x="506" y="102" font-family="Inter,sans-serif" font-size="10" fill="#1f2328">10x-100x slower.</text>
  <text x="506" y="120" font-family="Inter,sans-serif" font-size="10" font-weight="700" fill="#0969da">Fix: Update stats / add index</text>
</svg>

**1. Key Lookup Avalanche**

A nonclustered index covers the WHERE clause but not all SELECT columns. SQL Server does one lookup per matching row.

```
Fix: Add missing columns as INCLUDE in the nonclustered index:
CREATE INDEX IX_Orders_OrderDate ON Orders(OrderDate) INCLUDE (TotalAmount, CustomerName);
```

**2. Parameter Sniffing**

The plan is optimized for the first set of parameter values. When different values are used later, the same plan performs poorly.

```
Fix options (see Parameter Sniffing section below for tradeoffs):
- WITH RECOMPILE
- OPTION (OPTIMIZE FOR UNKNOWN)
- OPTION (OPTIMIZE FOR (@Param = value))
- Query Store plan forcing
```

**3. Implicit Conversion**

WHERE clause compares different data types (e.g., `WHERE varchar_col = N'value'`). SQL Server converts the **column** to the literal's type, making the index seek impossible.

```
Spot it: Plan shows a warning icon on the SELECT operator, or Index Scan instead of Seek
Fix: Align data types — or change the literal: WHERE varchar_col = 'value'
```

**4. Spills to Tempdb**

Hash Join or Sort operator exceeds its memory grant. Data overflows to tempdb — 10x-100x slower.

```
Spot it: Warning icon on the operator, or sort warnings in the plan
Fix: Update statistics (better cardinality estimate → better memory grant),
      add indexes (avoid sorting), or increase the memory grant via query hint
```

**5. Cardinality Estimation Error**

Estimated rows ≠ Actual rows by a large factor (e.g., estimated 10, actual 1,000,000).

```
Threshold: If actual rows > 10× estimated rows, the plan is likely suboptimal
Causes: Stale statistics, multi-column correlation, complex predicates, ascending keys
Check: STATS_DATE() for the relevant index/statistics
Fix: Update statistics, use the legacy CE (trace flag 9481), or rewrite the query
```

**6. Row Goal Spooling**

When a query has a TOP or EXISTS, SQL Server optimizes for early row retrieval. The plan looks good for "stop after first few rows" but is terrible for processing the full result set.

```
Spot it: Nested Loops with a TOP applied, or a Spool that delays actual row count discovery
Fix: Remove the row goal (change TOP to a larger number), or add OPTION (OPTIMIZE FOR UNKNOWN)
```

#### How to Capture an Actual Plan

```sql
-- Method 1: Capture inline (best for ad-hoc investigation)
SET STATISTICS XML ON;
-- run the slow query here
SET STATISTICS XML OFF;

-- Method 2: Retrieve from plan cache (works after the fact)
SELECT TOP 10
    qt.text AS query_text,
    qp.query_plan,
    qs.total_worker_time / qs.execution_count AS avg_cpu_ms,
    qs.total_logical_reads / qs.execution_count AS avg_reads,
    qs.execution_count
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) qt
CROSS APPLY sys.dm_exec_query_plan(qs.plan_handle) qp
ORDER BY avg_cpu_ms DESC;

-- Method 3: Query Store (historical plan tracking)
SELECT qsp.query_plan,
       qsp.is_forced_plan,
       rs.avg_duration, rs.avg_cpu_time
FROM sys.query_store_query qsq
JOIN sys.query_store_plan qsp ON qsq.query_id = qsp.query_id
JOIN sys.query_store_runtime_stats rs ON qsp.plan_id = rs.plan_id
WHERE qsq.query_id = @QueryID
ORDER BY rs.last_execution_time DESC;

-- Method 4: Currently running query's plan (real-time)
SELECT r.session_id,
    qt.text,
    qp.query_plan,
    r.wait_type, r.wait_time,
    r.cpu_time, r.total_elapsed_time
FROM sys.dm_exec_requests r
CROSS APPLY sys.dm_exec_sql_text(r.sql_handle) qt
CROSS APPLY sys.dm_exec_query_plan(r.plan_handle) qp
WHERE r.status NOT IN ('background', 'sleeping');
```

Operator costs in a plan are relative percentages — a "32%" operator with 1.2 million executions is far more expensive than a "45%" operator that runs once:

<svg viewBox="0 0 720 110" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;margin:16px 0;">
  <rect width="720" height="110" rx="8" fill="var(--bg-secondary,#f6f8fa)" stroke="var(--border,#d0d7de)" stroke-width="1"/>
  <text x="360" y="20" text-anchor="middle" font-family="Inter,sans-serif" font-size="12" font-weight="700">Don't tune by percentage cost alone</text>
  <!-- Operator 1: Index Seek (45% cost) -->
  <rect x="10" y="32" width="220" height="30" rx="4" fill="#dafbe1" stroke="#1a7f37" stroke-width="1"/>
  <text x="120" y="52" text-anchor="middle" font-family="Inter,sans-serif" font-size="10" fill="#116329">Index Seek — 45% cost — 1 execution</text>
  <text x="120" y="70" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" fill="#8b949e">Looks expensive but runs once</text>
  <!-- Arrow -->
  <line x1="230" y1="47" x2="255" y2="47" stroke="#d0d7de" stroke-width="1"/>
  <!-- Operator 2: Key Lookup (32% cost) -->
  <rect x="260" y="32" width="220" height="30" rx="4" fill="#ffeef0" stroke="#cf222e" stroke-width="1"/>
  <text x="370" y="52" text-anchor="middle" font-family="Inter,sans-serif" font-size="10" fill="#cf222e">Key Lookup — 32% cost — 1.2M exec</text>
  <text x="370" y="70" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" fill="#8b949e">Actually the real problem!</text>
  <!-- Comparison arrow -->
  <line x1="480" y1="47" x2="505" y2="47" stroke="#d0d7de" stroke-width="1"/>
  <!-- Verdict -->
  <rect x="510" y="32" width="195" height="30" rx="4" fill="#fff8c5" stroke="#d29922" stroke-width="1"/>
  <text x="607" y="52" text-anchor="middle" font-family="Inter,sans-serif" font-size="10" font-weight="700" fill="#7a5e00">Cost % is misleading</text>
  <text x="607" y="70" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" fill="#7a5e00">Always check actual execution count</text>
  <!-- Bottom bar: actual time breakdown -->
  <rect x="10" y="82" width="700" height="20" rx="4" fill="none" stroke="var(--border,#d0d7de)" stroke-width="1"/>
  <rect x="11" y="83" width="630" height="18" rx="3" fill="#ffeef0"/>
  <text x="325" y="96" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" font-weight="700" fill="#cf222e">Actual runtime: 4h 23min — dominated by the "32%" operator</text>
</svg>

#### Plan Analysis Checklist

When reviewing an execution plan, check in order:

1. **Warnings** — implicit conversion, spills, missing index, no statistics
2. **Actual vs estimated rows** — any operator where ratio > 10:1
3. **Thickest arrows** — which operator passes the most rows?
4. **Key Lookups** — how many? Can you add INCLUDE columns?
5. **Scans on large tables** — why no seek? Missing index?
6. **Joins** — are the join types appropriate for the row counts (Nested Loops vs Hash vs Merge)?
7. **Sorts** — can the sort be eliminated with an index?
8. **Memory grant** — is it excessive? Actual grant vs required grant ratio

### Parameter Sniffing

When a stored procedure performs differently for different parameter values:

```sql
-- Check for parameter sniffing
-- Same query, different performance for different values?
-- Possible fixes (each has tradeoffs):
EXEC dbo.usp_GetSales @StoreID WITH RECOMPILE;          -- No plan caching
EXEC dbo.usp_GetSales @StoreID OPTION (OPTIMIZE FOR UNKNOWN); -- Uses average
EXEC dbo.usp_GetSales @StoreID OPTION (OPTIMIZE FOR (@StoreID = 123)); -- Target specific
```

### In-Memory OLTP

In-Memory OLTP is SQL Server's premier technology for optimizing transaction processing, data ingestion, data load, and transient data scenarios. Customers have seen up to **30x performance gains** — not because data lives in memory, but because storage, access, and processing algorithms were redesigned from the ground up for in-memory and high-concurrency computing.

**Key principles:**

- Memory-optimized tables eliminate lock and latch contention between concurrent transactions by using an **optimistic, multi-version concurrency model**
- All transactions are fully durable by default — changes are written to the transaction log on commit, just like disk-based tables
- In-Memory OLTP works with all HA/DR capabilities: AGs, FCI, backup/restore

**The four object types:**

| Object | Description | Durability |
|--------|-------------|------------|
| Memory-optimized table | User data stored in memory with optimized access | Fully durable (SCHEMA_AND_DATA) |
| Non-durable table | Transient data, caching, intermediate results | SCHEMA_ONLY (no IO, no log writes) |
| Memory-optimized table type | For TVPs, table variables, intermediate results in procs | SCHEMA_ONLY |
| Natively compiled T-SQL | Stored procedures, triggers, scalar UDFs compiled to machine code | — |

#### Scenario 1: High-Throughput / Low-Latency Transaction Processing

This is the **core scenario**. Trading platforms, sports betting, mobile gaming, ad delivery — any workload with large volumes of concurrent transactions that demand consistent low latency.

```sql
-- Memory-optimized table for a high-throughput catalog
CREATE TABLE dbo.ProductCatalog (
    ProductID   INT IDENTITY PRIMARY KEY NONCLUSTERED,
    SKU         NVARCHAR(50) NOT NULL INDEX idx_sku HASH WITH (BUCKET_COUNT = 1000000),
    StockLevel  INT NOT NULL,
    LastUpdated DATETIME2 NOT NULL
) WITH (MEMORY_OPTIMIZED = ON);

-- Natively compiled stored procedure
CREATE PROCEDURE dbo.usp_UpdateStock
    @SKU NVARCHAR(50),
    @Quantity INT
WITH NATIVE_COMPILATION, SCHEMABINDING
AS
BEGIN ATOMIC WITH (TRANSACTION ISOLATION LEVEL = SNAPSHOT, LANGUAGE = N'us_english')
    UPDATE dbo.ProductCatalog
    SET StockLevel = @Quantity, LastUpdated = SYSDATETIME()
    WHERE SKU = @SKU;
END;
```

**Implementation approach:** Start with the [transaction performance analysis report](https://learn.microsoft.com/en-us/sql/relational-databases/in-memory-oltp/determining-if-a-table-or-stored-procedure-should-be-ported-to-in-memory-oltp) to identify the right objects to migrate, then use the Memory Optimization Advisor and Native Compilation Advisor.

#### Scenario 2: Data Ingestion / IoT

Ingesting sensor readings, events, or batch updates from many concurrent sources. Memory-optimized tables absorb high-volume inserts without contention.

```sql
-- Ingestion table with periodic offload
CREATE TABLE dbo.SensorReadings (
    ReadingID    BIGINT IDENTITY PRIMARY KEY NONCLUSTERED,
    DeviceID     INT NOT NULL,
    ReadingValue FLOAT NOT NULL,
    ReadingTime  DATETIME2 NOT NULL INDEX idx_time NONCLUSTERED
) WITH (MEMORY_OPTIMIZED = ON);

-- Batch offload to disk-based columnstore for historical analysis
INSERT INTO dbo.SensorReadings_History WITH (TABLOCK)
SELECT * FROM dbo.SensorReadings
WHERE ReadingTime < DATEADD(HOUR, -24, GETUTCDATE());

DELETE FROM dbo.SensorReadings
WHERE ReadingTime < DATEADD(HOUR, -24, GETUTCDATE());
```

**Alternative:** Use a [temporal memory-optimized table](https://learn.microsoft.com/en-us/sql/relational-databases/tables/system-versioned-temporal-tables-with-memory-optimized-tables) — historical data lives on disk automatically, managed by the system.

#### Scenario 3: Caching and Session State

Non-durable memory-optimized tables (`DURABILITY = SCHEMA_ONLY`) are ideal for ASP.NET session state and mid-tier caching. One customer (bwin) achieved **1.2 million requests per second** using In-Memory OLTP for session state.

```sql
-- Non-durable table for session cache
CREATE TABLE dbo.SessionCache (
    SessionID    NVARCHAR(88) NOT NULL PRIMARY KEY NONCLUSTERED
                 HASH WITH (BUCKET_COUNT = 5000000),
    UserData     VARBINARY(MAX) NOT NULL,
    ExpiresAt    DATETIME2 NOT NULL INDEX idx_expires NONCLUSTERED
) WITH (MEMORY_OPTIMIZED = ON, DURABILITY = SCHEMA_ONLY);

-- Cleanup old sessions (non-durable = no log IO)
CREATE PROCEDURE dbo.usp_CleanSessions
WITH NATIVE_COMPILATION, SCHEMABINDING
AS
BEGIN ATOMIC WITH (TRANSACTION ISOLATION LEVEL = SNAPSHOT, LANGUAGE = N'us_english')
    DELETE FROM dbo.SessionCache WHERE ExpiresAt < SYSDATETIME();
END;
```

#### Scenario 4: TempDB Object Replacement

Replace traditional `#temp` tables, table variables, and TVPs with memory-optimized equivalents. This **reduces CPU and completely removes log IO** from tempdb operations.

```sql
-- Memory-optimized table type (replaces traditional TVP)
CREATE TYPE dbo.OrderImport AS TABLE (
    OrderID    INT NOT NULL INDEX idx_oid HASH WITH (BUCKET_COUNT = 1048576),
    ProductID  INT NOT NULL,
    Quantity   INT NOT NULL,
    UnitPrice  MONEY NOT NULL,
    INDEX idx_pid NONCLUSTERED (ProductID)
) WITH (MEMORY_OPTIMIZED = ON);

-- Natively compiled proc using the TVP
CREATE PROCEDURE dbo.usp_BulkImportOrders
    @Orders dbo.OrderImport READONLY
WITH NATIVE_COMPILATION, SCHEMABINDING
AS
BEGIN ATOMIC WITH (TRANSACTION ISOLATION LEVEL = SNAPSHOT, LANGUAGE = N'us_english')
    INSERT INTO dbo.Orders (OrderID, ProductID, Quantity, UnitPrice)
    SELECT OrderID, ProductID, Quantity, UnitPrice FROM @Orders;
END;
```

One customer improved performance by **40%** just by replacing traditional TVPs with memory-optimized TVPs.

#### Scenario 5: ETL Staging

Use non-durable memory-optimized tables for ETL staging — completely remove IO during the load phase, then use natively compiled procs for in-memory transformations.

```sql
-- Staging table (no IO, no log writes)
CREATE TABLE dbo.StagingSales (
    BatchID    INT NOT NULL INDEX idx_batch HASH WITH (BUCKET_COUNT = 1024),
    SaleData   NVARCHAR(MAX) NOT NULL,
    Processed  BIT NOT NULL DEFAULT 0
) WITH (MEMORY_OPTIMIZED = ON, DURABILITY = SCHEMA_ONLY);
```

#### Setup Requirements

```sql
-- 1. Add MEMORY_OPTIMIZED_DATA filegroup
ALTER DATABASE CurrentDB
ADD FILEGROUP InMemory CONTAINS MEMORY_OPTIMIZED_DATA;

ALTER DATABASE CurrentDB
ADD FILE (NAME = 'InMemoryData',
          FILENAME = 'E:\Data\InMemoryData')
TO FILEGROUP InMemory;

-- 2. Recommended settings
ALTER DATABASE CURRENT
SET MEMORY_OPTIMIZED_ELEVATE_TO_SNAPSHOT = ON;
ALTER DATABASE CURRENT
SET COMPATIBILITY_LEVEL = 160;  -- SQL Server 2022
```

#### What a Junior DBA Might Misunderstand

- **"It's fast because it's in memory"** — No. It's fast because of optimized algorithms (lock/latch-free data structures, native compilation). Memory helps, but the algorithmic redesign is the real driver.
- **"Data is lost on restart"** — By default, memory-optimized tables are fully durable. Only `DURABILITY = SCHEMA_ONLY` tables lose data on restart (by design, for transient use).
- **"It solves all performance problems"** — In-Memory OLTP is not suitable for large-range aggregation (columnstore is better for that). It excels at point lookups, small-range queries, and high-concurrency inserts/updates.
- **"Migrate everything"** — Use the transaction performance analysis report to target specific hot tables. Porting the entire database is rarely necessary or beneficial.

### Index Tuning

- **Clustered index** — physical order of the table, one per table
- **Nonclustered index** — separate structure, covers specific queries
- **Included columns** — add to nonclustered to cover queries without key lookups
- **Don't create indexes blindly** — measure with `sys.dm_db_index_usage_stats`

```sql
-- Find unused indexes
SELECT OBJECT_NAME(i.object_id) AS table_name,
       i.name AS index_name,
       s.user_seeks, s.user_scans, s.user_lookups, s.user_updates
FROM sys.indexes i
LEFT JOIN sys.dm_db_index_usage_stats s
    ON i.object_id = s.object_id AND i.index_id = s.index_id
WHERE i.type > 0
  AND s.object_id IS NULL;  -- Never used since last restart
```

### Statistics

Stale statistics → bad cardinality estimates → bad execution plans. Update after significant data changes.

```sql
-- Check statistics freshness
SELECT name AS stats_name, STATS_DATE(object_id, stats_id) AS last_updated
FROM sys.stats
WHERE object_id = OBJECT_ID('dbo.SalesOrder');
```

---

## Interview Q&A

**Q:** When someone says "the database is slow," what's your troubleshooting methodology?

> First, I check what's running right now — `sys.dm_exec_requests` — to see active sessions, blocking, and wait types. I look at wait stats first because SQL Server is usually waiting on something: IO, locks, network. Then I check CPU and memory pressure. I also look for recent changes — deployments, schema modifications, index maintenance — because that's usually the trigger. I collect evidence before making any changes.

**Q:** How do you identify and fix a deadlock?

> I enable deadlock capture — either via the system_health Extended Events session or by using trace flag 1222. The deadlock graph shows the two transactions and the resources involved. Common fixes are ensuring transactions access resources in the same order, keeping transactions short, adding appropriate indexes, and implementing retry logic in the application.

**Q:** How do you decide which indexes to create?

> I start with the workload — the slow queries. I look at the execution plan for missing index warnings, scans on large tables, and key lookups. But I don't create indexes blindly. I check `sys.dm_db_index_usage_stats` to see if similar indexes already exist or would be duplicated. I also consider the write impact — every index adds overhead to INSERT/UPDATE/DELETE. I test the index in a non-production environment first and measure the improvement.

**Q:** You see an execution plan with 40% on an Index Seek, 30% on a Key Lookup, and 30% on a Nested Loops join. What do you do?

> I ignore the percentage costs and look at actual row counts. If the Key Lookup is executed once per row from the Index Seek, and there are 500,000 rows, that's 500,000 lookups — expensive. I check if adding INCLUDE columns to the nonclustered index covers the SELECT list and eliminates the lookup. If the Nested Loops join has a large outer input, I check whether a Hash Match would be more efficient — but the real fix is usually the covering index. I also check the estimated vs actual rows at every operator to catch cardinality estimation errors.

**Q:** How do you find queries with implicit conversion issues?

> I search the plan cache for plans containing `CONVERT_IMPLICIT` in the plan XML. The query `SELECT qp.query_plan FROM sys.dm_exec_query_stats ... WHERE CAST(query_plan AS NVARCHAR(MAX)) LIKE '%CONVERT_IMPLICIT%'` returns all affected plans. The fix is aligning data types — if the column is VARCHAR, the parameter should be VARCHAR, not NVARCHAR. If the column has a different collation than the database default, that also causes conversion. The tell-tale sign in the plan is an Index Scan instead of an Index Seek on a highly selective predicate.

---

## T-SQL Quick Reference

```sql
-- Current active requests with wait info
SELECT session_id, command, cpu_time, total_elapsed_time,
       reads, writes, logical_reads, wait_type, wait_time,
       blocking_session_id, text
FROM sys.dm_exec_requests
CROSS APPLY sys.dm_exec_sql_text(sql_handle)
WHERE status NOT IN ('background', 'sleeping');

-- Top waits since last restart
SELECT wait_type, wait_time_ms / 1000 AS wait_sec,
       signal_wait_time_ms / 1000 AS signal_wait_sec,
       waiting_tasks_count,
       (wait_time_ms - signal_wait_ms) * 100.0 / SUM(wait_time_ms) OVER() AS pct
FROM sys.dm_os_wait_stats
WHERE wait_type NOT IN ('BROKER_EVENTHANDLER', 'BROKER_RECEIVE_WAITFOR', ...)
ORDER BY wait_time_ms DESC;

-- Memory grants
SELECT session_id, requested_memory_kb, granted_memory_kb,
       required_memory_kb, query_cost, timeout_sec
FROM sys.dm_exec_query_memory_grants;

-- IO stats per database
SELECT DB_NAME(database_id) AS db_name,
       SUM(num_of_reads) AS total_reads,
       SUM(num_of_writes) AS total_writes,
       SUM(num_of_bytes_read / 1048576) AS read_mb,
       SUM(num_of_bytes_written / 1048576) AS write_mb,
       SUM(io_stall_ms) AS total_io_stall_ms
FROM sys.dm_io_virtual_file_stats(NULL, NULL)
GROUP BY database_id
ORDER BY total_io_stall_ms DESC;

-- Top 10 queries by avg CPU from plan cache
SELECT TOP 10 qt.text AS query_text,
    qs.total_worker_time / qs.execution_count / 1000 AS avg_cpu_ms,
    qs.total_logical_reads / qs.execution_count AS avg_reads,
    qs.execution_count,
    qs.last_execution_time,
    qp.query_plan
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) qt
CROSS APPLY sys.dm_exec_query_plan(qs.plan_handle) qp
WHERE qs.execution_count > 10
ORDER BY avg_cpu_ms DESC;

-- Implicit conversion detection (query with mismatched data types)
SELECT qt.text, qp.query_plan, qs.total_worker_time
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) qt
CROSS APPLY sys.dm_exec_query_plan(qs.plan_handle) qp
WHERE CAST(qp.query_plan AS NVARCHAR(MAX)) LIKE '%CONVERT_IMPLICIT%'
ORDER BY qs.total_worker_time DESC;

-- Actual vs estimated row count comparison
-- Run SET STATISTICS XML ON first, then query
WITH XMLNAMESPACES (DEFAULT 'http://schemas.microsoft.com/sqlserver/2004/07/showplan')
SELECT
    node.value('@Statement', 'NVARCHAR(MAX)') AS statement,
    node.value('@EstimateRows', 'FLOAT') AS estimated_rows,
    node.value('@ActualRows', 'FLOAT') AS actual_rows,
    node.value('@NodeId', 'INT') AS node_id
FROM (SELECT CAST(qp.query_plan AS XML) AS plan_xml
      FROM sys.dm_exec_query_stats qs
      CROSS APPLY sys.dm_exec_query_plan(qs.plan_handle) qp
      WHERE qs.sql_handle = 0x...) AS t
CROSS APPLY t.plan_xml.nodes('//RelOp') AS r(node)
WHERE node.value('@ActualRows', 'FLOAT') > node.value('@EstimateRows', 'FLOAT') * 10;
```
