---
title: Query Store Deep Dive
order: 2
icon: 📈
---

## Key Concepts

Query Store is the single most important feature Microsoft has added to SQL Server for performance troubleshooting. Think of it as a **flight recorder for your queries** — it captures query text, execution plans, and runtime statistics automatically. Without it, you're troubleshooting blind. With it, you can answer: *"Was this query always slow, or did something change?"*

### What Query Store Captures

```
Query Store
├── Query Text (normalized, parameterized)
├── Execution Plans (one query can have multiple plans over time)
├── Runtime Statistics (duration, CPU, IO, memory per plan)
├── Wait Statistics (SQL Server 2022+ — per-query waits)
└── Query Hints (SQL Server 2022+ — forced plan modifiers without code changes)
```

**Why this matters:** Before Query Store, plan regression meant: "The query was fast yesterday, slow today, and I have no idea what changed." With Query Store, you see the exact moment the plan changed, compare the old vs new plan, and force the old plan with one command.

### How Query Store Works Internally

Query Store stores data in the user database itself (in `PRIMARY` filegroup by default):

```
In-Memory Queue (captures runtime stats)
    ↓ (flushed periodically)
Query Store internal tables (sys.query_store_*)
    ↓ (queried directly)
sys.query_store_* DMVs
```

| Table | Stores | Size Impact |
|-------|--------|-------------|
| `sys.query_store_query` | Normalized query text | Small |
| `sys.query_store_plan` | Execution plan XML + hash | Large (plans can be several KB each) |
| `sys.query_store_runtime_stats` | Duration, CPU, IO, memory per plan+interval | Largest (one row per query per interval) |
| `sys.query_store_runtime_stats_interval` | Time windows for aggregation | Small |
| `sys.query_store_wait_stats` | Per-query wait time (SQL 2022+) | Medium |
| `sys.query_store_query_hints` | Applied query hints | Small |

### Configuration Options — Set These Right from Day 1

```sql
ALTER DATABASE [YourDB] SET QUERY_STORE = ON;
```

| Option | Default | Recommendation | Why |
|--------|---------|----------------|-----|
| `OPERATION_MODE` | `READ_WRITE` | `READ_WRITE` | Must be READ_WRITE to capture data |
| `CLEANUP_POLICY = (STALE_QUERY_THRESHOLD_DAYS = 30)` | 30 days | 7–30 days | Shorter for busy OLTP, longer for compliance |
| `DATA_FLUSH_INTERVAL_SECONDS` | 900 (15 min) | 60–300 (1–5 min) | Lower = less data loss on crash. 15 min means you lose 15 min of data |
| `INTERVAL_LENGTH_MINUTES` | 60 | 15–60 | Shorter = more granular runtime stats |
| `MAX_STORAGE_SIZE_MB` | 100 MB | 500–2000 MB | 100 MB fills fast on busy systems → QS auto-switches to READ_ONLY |
| `QUERY_CAPTURE_MODE` | `ALL` | `AUTO` | ALL captures everything (overhead). AUTO captures relevant queries |
| `SIZE_BASED_CLEANUP_MODE` | `AUTO` | `AUTO` | Purges old data when approaching MAX_STORAGE_SIZE |
| `MAX_PLANS_PER_QUERY` | 200 | 200 | Keep enough plans to see regressions |
| `WAIT_STATS_CAPTURE_MODE` (SQL 2022+) | `OFF` | `ON` | Per-query wait stats — game changer for troubleshooting |

> [!warning]
> **Default MAX_STORAGE_SIZE is 100 MB.** On any moderately busy database, this fills in days. QS silently switches to READ_ONLY mode and stops collecting data. Always increase this during setup.

### Query Store Capture Modes — Pick the Right One

| Mode | Behavior | When to Use |
|------|----------|-------------|
| `ALL` | Captures **every** query | Compliance, short-term debugging only |
| `AUTO` | Captures queries by **resource consumption** | **Default for production** — low overhead, captures what matters |
| `CUSTOM` | Fine-grained control via `QUERY_CAPTURE_MODE` sub-options | Need specific filtering (e.g., only capture queries over 10s duration) |
| `NONE` | Stops capturing new queries | Maintenance, before known large queries you don't want captured |

```sql
-- Production recommendation
ALTER DATABASE [SalesDB]
SET QUERY_STORE (
    OPERATION_MODE = READ_WRITE,
    CLEANUP_POLICY = (STALE_QUERY_THRESHOLD_DAYS = 14),
    DATA_FLUSH_INTERVAL_SECONDS = 120,
    INTERVAL_LENGTH_MINUTES = 30,
    MAX_STORAGE_SIZE_MB = 1024,
    QUERY_CAPTURE_MODE = AUTO,
    SIZE_BASED_CLEANUP_MODE = AUTO,
    MAX_PLANS_PER_QUERY = 200
);

-- SQL Server 2022: enable wait stats
ALTER DATABASE [SalesDB]
SET QUERY_STORE (
    WAIT_STATS_CAPTURE_MODE = ON
);
```

### Plan Regression Detection — The Core Workflow

**Scenario:** A report that ran in 5 seconds yesterday now runs in 5 minutes. No code changes were deployed.

**Step 1: Enable Query Store** (if not already — this should already be on in production)

**Step 2: Find the regressed query**

```sql
-- Queries with the LARGEST increase in duration
SELECT TOP 10
    qsq.query_id,
    MAX(qsp.query_plan_hash) AS current_plan_hash,
    MAX(IIF(rsi.start_time < DATEADD(DAY, -1, GETDATE()), rs.avg_duration, NULL)) AS prev_avg_duration,
    MAX(IIF(rsi.start_time >= DATEADD(DAY, -1, GETDATE()), rs.avg_duration, NULL)) AS curr_avg_duration,
    MAX(IIF(rsi.start_time >= DATEADD(DAY, -1, GETDATE()), rs.count_executions, NULL)) AS curr_executions,
    qsq.query_text_id,
    qt.query_sql_text
FROM sys.query_store_query qsq
JOIN sys.query_store_query_text qt ON qsq.query_text_id = qt.query_text_id
JOIN sys.query_store_plan qsp ON qsq.query_id = qsp.query_id
JOIN sys.query_store_runtime_stats rs ON qsp.plan_id = rs.plan_id
JOIN sys.query_store_runtime_stats_interval rsi
    ON rs.runtime_stats_interval_id = rsi.runtime_stats_interval_id
WHERE qsp.is_forced_plan = 0
GROUP BY qsq.query_id, qsq.query_text_id, qt.query_sql_text
HAVING MAX(IIF(rsi.start_time >= DATEADD(DAY, -1, GETDATE()), rs.avg_duration, NULL)) >
       MAX(IIF(rsi.start_time < DATEADD(DAY, -1, GETDATE()), rs.avg_duration, NULL)) * 2
   AND MAX(IIF(rsi.start_time >= DATEADD(DAY, -1, GETDATE()), rs.count_executions, NULL)) > 2
ORDER BY (MAX(IIF(rsi.start_time >= DATEADD(DAY, -1, GETDATE()), rs.avg_duration, NULL)) -
          MAX(IIF(rsi.start_time < DATEADD(DAY, -1, GETDATE()), rs.avg_duration, NULL))) DESC;
```

**Step 3: View plan history for that query**

```sql
-- Check if the plan changed
SELECT qsp.plan_id, qsp.query_plan_hash,
       qsp.plan_type_desc, qsp.compatibility_level,
       qsp.force_failure_count,
       qsp.last_force_failure_reason,
       qsp.first_execution_time, qsp.last_execution_time,
       TRY_CAST(qsp.query_plan AS XML) AS plan_xml
FROM sys.query_store_plan qsp
WHERE qsp.query_id = @QueryID  -- from Step 2
ORDER BY qsp.last_execution_time DESC;

-- Compare performance per plan
SELECT qsp.plan_id, qsp.query_plan_hash,
       MAX(rs.avg_duration / 1000) AS max_avg_duration_ms,
       MIN(rs.avg_duration / 1000) AS min_avg_duration_ms,
       MAX(rs.avg_cpu_time / 1000) AS max_avg_cpu_ms,
       SUM(rs.count_executions) AS total_executions,
       MIN(rsi.start_time) AS first_seen,
       MAX(rsi.end_time) AS last_seen
FROM sys.query_store_plan qsp
JOIN sys.query_store_runtime_stats rs ON qsp.plan_id = rs.plan_id
JOIN sys.query_store_runtime_stats_interval rsi
    ON rs.runtime_stats_interval_id = rsi.runtime_stats_interval_id
WHERE qsp.query_id = @QueryID
GROUP BY qsp.plan_id, qsp.query_plan_hash
ORDER BY MAX(rs.avg_duration) DESC;
```

**Step 4: Force the known-good plan**

```sql
-- Force the old plan (the one that was fast)
EXEC sys.sp_query_store_force_plan
    @query_id = @QueryID,
    @plan_id = @OldPlanID;  -- from Step 3

-- Verify the force
SELECT query_id, plan_id, is_forced_plan,
       force_failure_count, last_force_failure_reason
FROM sys.query_store_plan
WHERE query_id = @QueryID;

-- Unforce if needed
EXEC sys.sp_query_store_unforce_plan
    @query_id = @QueryID,
    @plan_id = @OldPlanID;
```

> [!tip]
> Plan forcing is powerful but not permanent. A new index, updated statistics, or a version upgrade may make the forced plan obsolete. Always investigate WHY the plan changed (stale stats, parameter sniffing, cardinality estimator change) and fix the root cause. Track forced plans and review them monthly.

### Plan Forcing — When It Works and When It Doesn't

| Works | Doesn't Work |
|-------|--------------|
| Plan regression after stats update | Query uses features not supported by plan forcing |
| Parameter sniffing causing bad plans | Temporary objects (#temp tables) with different schemas |
| CE version change after upgrade | Queries with RECOMPILE hint |
| Index changes causing different plans | Distributed queries (linked servers) |

```sql
-- Check for force failures
SELECT query_id, plan_id,
       is_forced_plan, force_failure_count,
       last_force_failure_reason_desc
FROM sys.query_store_plan
WHERE is_forced_plan = 1
  AND force_failure_count > 0;
```

### Query Store for Always On (SQL Server 2022)

SQL Server 2022 added Query Store for **secondary replicas**:

```sql
-- Enable on primary — automatically applies to all replicas
ALTER DATABASE [SalesDB] SET QUERY_STORE = ON;

-- On the secondary replica, Query Store now captures queries
-- that run on the secondary (read-only workloads)
```

**Before 2022:** Query Store only captured queries on the primary. Reporting queries running on secondaries were invisible.

**After 2022:** Queries on readable secondaries are captured in the secondary's Query Store. This is critical for troubleshooting "why is the reporting query slow on the secondary?"

```sql
-- Check which replica's QS you're querying
SELECT DATABASEPROPERTYEX(DB_NAME(), 'Updateability') AS replica_type;
-- ONLINE = primary, READ_ONLY = secondary
```

### Parameter-Sensitive Plan Optimization (PSP) — SQL 2022+ 

SQL Server 2022 introduced automatic handling of parameter-sensitive plans — the #1 cause of plan regressions:

```sql
-- PSP automatically creates multiple plans for the same query
-- based on the parameter value's cardinality

-- Check if PSP is active for a query
SELECT qsq.query_id, qsq.object_id,
       qsp.plan_id, qsp.query_plan_hash,
       qsp.is_forced_plan,
       qsq.last_compile_start_time,
       qsp.plan_forcing_type_desc
FROM sys.query_store_query qsq
JOIN sys.query_store_plan qsp ON qsq.query_id = qsp.query_id
WHERE qsp.plan_forcing_type_desc = 'AUTO';  -- PSP automatically forced
```

### Query Store Hints (SQL Server 2022+) — Tune Without Changing Code

The most powerful new feature in SQL Server 2022. You can apply query hints without touching the application code:

```sql
-- Add a hint via Query Store (no app change needed)
EXEC sys.sp_query_store_set_hints
    @query_id = @QueryID,
    @query_hints = N'OPTION (RECOMPILE)';

-- Set MAXDOP for a single query
EXEC sys.sp_query_store_set_hints
    @query_id = @QueryID,
    @query_hints = N'OPTION (MAXDOP 1)';

-- Set multiple hints
EXEC sys.sp_query_store_set_hints
    @query_id = @QueryID,
    @query_hints = N'OPTION (USE HINT(''DISABLE_PARAMETER_SNIFFING''), MAXDOP 1)';

-- View active hints
SELECT qsh.query_id, qsh.query_hint_text,
       qsq.last_compile_start_time,
       qt.query_sql_text
FROM sys.query_store_query_hints qsh
JOIN sys.query_store_query qsq ON qsh.query_id = qsq.query_id
JOIN sys.query_store_query_text qt ON qsq.query_text_id = qt.query_text_id;

-- Remove a hint
EXEC sys.sp_query_store_clear_hints @query_id = @QueryID;
```

**Supported hints include:**
`RECOMPILE`, `MAXDOP N`, `OPTIMIZE FOR UNKNOWN`, `DISABLE_PARAMETER_SNIFFING`, `HASH JOIN`, `LOOP JOIN`, `MERGE JOIN`, `FAST N`, `MAX_GRANT_PERCENT`, `MIN_GRANT_PERCENT`, `DISABLE_BATCH_MODE`, `DISABLE_ROW_MODE`

### Wait Stats in Query Store (SQL 2022+)

Per-query wait statistics — the #1 ask from DBAs for years:

```sql
-- See what each query is waiting on
SELECT qsq.query_id,
       qsws.wait_category_desc,
       SUM(qsws.total_query_wait_time_ms) AS total_wait_ms,
       SUM(qsws.avg_query_wait_time_ms) AS avg_wait_ms,
       COUNT(DISTINCT qsp.plan_id) AS plans_used
FROM sys.query_store_wait_stats qsws
JOIN sys.query_store_query qsq ON qsws.query_id = qsq.query_id
JOIN sys.query_store_plan qsp ON qsws.plan_id = qsp.plan_id
GROUP BY qsq.query_id, qsws.wait_category_desc
ORDER BY qsq.query_id, total_wait_ms DESC;

-- Wait categories available:
-- Unknown, CPU, Worker Thread, Lock, Latch, Buffer IO, Log IO, Network IO,
-- Parallelism, Memory, Query Stats, Trampoline, Preemptive, Concurrency,
-- System, DTC, Full Text Query, Other
```

### Query Store DMV Reference

| DMV | Purpose |
|-----|---------|
| `sys.query_store_query` | One row per query (normalized text + context) |
| `sys.query_store_query_text` | The actual SQL text |
| `sys.query_store_plan` | One row per plan version per query |
| `sys.query_store_runtime_stats` | Duration, CPU, IO, memory per plan + interval |
| `sys.query_store_runtime_stats_interval` | Time window definitions |
| `sys.query_store_wait_stats` | Per-query wait stats (SQL 2022+) |
| `sys.query_store_query_hints` | Applied query hints (SQL 2022+) |
| `sys.database_query_store_options` | Current QS configuration for the database |
| `sys.query_store_plan_forcing_locations` | Where forced plans are tracked |
| `sys.query_store_replicas` | QS state per replica (SQL 2022+, AG) |

### Management and Maintenance

```sql
-- Check current Query Store status
SELECT desired_state_desc, actual_state_desc,
       readonly_reason, current_storage_size_mb,
       max_storage_size_mb, flush_interval_seconds,
       interval_length_minutes, stale_query_threshold_days,
       query_capture_mode_desc, size_based_cleanup_mode_desc,
       wait_stats_capture_mode_desc
FROM sys.database_query_store_options;

-- If QS is READ_ONLY, check why:
SELECT readonly_reason,
       CASE readonly_reason
           WHEN 1 THEN 'Database is READ_ONLY'
           WHEN 2 THEN 'Database is single-user'
           WHEN 4 THEN 'Database is emergency mode'
           WHEN 8 THEN 'Database is AG secondary'
           WHEN 65536 THEN 'Max storage reached'
           WHEN 131072 THEN 'Size-based cleanup disabled and max storage reached'
           WHEN 262144 THEN 'Total size of query text exceeds 2^31 bytes'
       END AS reason_description
FROM sys.database_query_store_options;

-- Manually flush in-memory data to disk
EXEC sys.sp_query_store_flush_db;

-- Force cleanup (if auto cleanup isn't keeping up)
ALTER DATABASE [SalesDB]
SET QUERY_STORE (CLEANUP_POLICY = (STALE_QUERY_THRESHOLD_DAYS = 7));
-- Run cleanup manually
EXEC sys.sp_query_store_force_cleanup;

-- Remove Query Store data (last resort — all history lost)
ALTER DATABASE [SalesDB] SET QUERY_STORE = OFF;
ALTER DATABASE [SalesDB] SET QUERY_STORE CLEAR;
ALTER DATABASE [SalesDB] SET QUERY_STORE = ON;

-- Move Query Store to a different filegroup
ALTER DATABASE [SalesDB]
SET QUERY_STORE (QUERY_STORE_FILEGROUP = 'QSData');
```

### Common Mistakes

| Mistake | Consequence | Fix |
|---------|-------------|-----|
| Default 100 MB max size | QS fills up, silently stops capturing | Set to 512–2048 MB |
| QUERY_CAPTURE_MODE = ALL on busy OLTP | High overhead, fills storage faster | Use AUTO |
| Not checking QS on secondaries (pre-2022) | Missing read-only workload analysis | Upgrade or use XEvents for secondaries |
| Plan forcing without root cause | Masking the real problem | Always investigate why plan changed |
| Not monitoring force failures | Query silently used bad plan | Check `force_failure_count` regularly |
| Using default 30-day retention on busy DB | Storage fills faster | Tune based on workload volume |
| Enabling WAIT_STATS on SQL 2019 or earlier | Feature doesn't exist — no error, just no data | Check version first |
| QS on system databases | Not supported for master, model, msdb, tempdb | Only enable on user databases |

### `sp_QuickieStore` — Community Tool

Erik Darling's `sp_QuickieStore` is the fastest way to get answers from Query Store:

```sql
EXEC sp_QuickieStore @database_name = 'SalesDB',
                     @sort_order = 'cpu',
                     @top = 10;
-- Returns: top 10 CPU-consuming queries with plans, stats, and recommendations
```

---

## Interview Q&A

**Q:** What is Query Store and why is it important?

> Query Store is a built-in flight recorder for SQL Server queries. It automatically captures query text, execution plans, and runtime statistics. Before Query Store, plan regression meant a query went from fast to slow and we had no idea why. With Query Store, I can see exactly when a plan changed, compare the old and new plans, and force the good plan in seconds. It's the first thing I enable on any production database.

**Q:** How do you configure Query Store for a busy OLTP database?

> I never use the defaults. The default MAX_STORAGE_SIZE of 100 MB fills up in hours on a busy system. I set it to 1024 MB with DATA_FLUSH_INTERVAL_SECONDS of 120 (every 2 minutes instead of the default 15). I use QUERY_CAPTURE_MODE = AUTO so we're only capturing relevant queries, not every single statement. I set STALE_QUERY_THRESHOLD_DAYS to 14 for OLTP (long enough to catch regressions, short enough to manage storage). On SQL Server 2022, I enable WAIT_STATS_CAPTURE_MODE = ON for per-query wait analysis.

**Q:** When would you force a plan and when would you not?

> I force a plan as an **immediate fix** — when a query regressed and the business is affected NOW. But I always follow up with root cause analysis. Was it stale statistics? Parameter sniffing? A CE version change? The forced plan is a bridge, not a destination. I tag forced plans for monthly review and unforce them once the root cause is addressed. In SQL 2022, I prefer Query Store Hints over plan forcing because hints are more flexible and don't depend on a specific plan hash.

**Q:** How do you detect plan regressions using Query Store?

> I run a query that compares average duration for each query between yesterday and today, looking for queries where duration increased by more than 2x with more than 2 executions. Then I check if the plan_id changed during that window. If the plan changed and duration spiked, I have a regression. I view both plans side by side to understand what changed — different join type? Different index? Different cardinality estimate? Then I force the old plan and investigate the root cause.

**Q:** What's new in Query Store for SQL Server 2022?

> Three major additions. **First**, Query Store on secondary replicas — now we can capture queries running on readable secondaries, which was invisible before. **Second**, wait statistics per query — we can see exactly what each query is waiting on (IO, locks, CPU, network). **Third**, Query Store Hints — we can apply query hints like MAXDOP, RECOMPILE, or DISABLE_PARAMETER_SNIFFING at the query level without changing application code. These three features make SQL Server 2022's Query Store the most powerful version yet.

---

## T-SQL Quick Reference

```sql
-- Enable Query Store (production-ready config)
ALTER DATABASE [YourDB] SET QUERY_STORE (
    OPERATION_MODE = READ_WRITE,
    CLEANUP_POLICY = (STALE_QUERY_THRESHOLD_DAYS = 14),
    DATA_FLUSH_INTERVAL_SECONDS = 120,
    INTERVAL_LENGTH_MINUTES = 30,
    MAX_STORAGE_SIZE_MB = 1024,
    QUERY_CAPTURE_MODE = AUTO,
    SIZE_BASED_CLEANUP_MODE = AUTO,
    MAX_PLANS_PER_QUERY = 200
);

-- Find queries with multiple plans (plan changes)
SELECT qsq.query_id, qt.query_sql_text,
       COUNT(DISTINCT qsp.plan_id) AS plan_count,
       MIN(qsp.first_execution_time) AS first_plan,
       MAX(qsp.last_execution_time) AS latest_plan
FROM sys.query_store_query qsq
JOIN sys.query_store_query_text qt ON qsq.query_text_id = qt.query_text_id
JOIN sys.query_store_plan qsp ON qsq.query_id = qsp.query_id
GROUP BY qsq.query_id, qt.query_sql_text
HAVING COUNT(DISTINCT qsp.plan_id) > 3
ORDER BY plan_count DESC;

-- Top 10 queries by total duration
SELECT TOP 10 qt.query_sql_text,
       SUM(rs.avg_duration * rs.count_executions) / 1000 AS total_duration_sec,
       SUM(rs.count_executions) AS execution_count,
       AVG(rs.avg_duration / 1000) AS avg_duration_ms,
       AVG(rs.avg_cpu_time / 1000) AS avg_cpu_ms,
       AVG(rs.avg_logical_io_reads) AS avg_logical_reads
FROM sys.query_store_query qsq
JOIN sys.query_store_query_text qt ON qsq.query_text_id = qt.query_text_id
JOIN sys.query_store_plan qsp ON qsq.query_id = qsp.query_id
JOIN sys.query_store_runtime_stats rs ON qsp.plan_id = rs.plan_id
WHERE rs.last_execution_time >= DATEADD(DAY, -7, GETDATE())
GROUP BY qt.query_sql_text, qsq.query_id
ORDER BY total_duration_sec DESC;

-- Check QS health
SELECT actual_state_desc, readonly_reason,
       current_storage_size_mb, max_storage_size_mb,
       stale_query_threshold_days, query_capture_mode_desc,
       wait_stats_capture_mode_desc
FROM sys.database_query_store_options;

-- SQL Server 2022: Query Store hints
EXEC sys.sp_query_store_set_hints
    @query_id = 42,
    @query_hints = N'OPTION (USE HINT(''DISABLE_PARAMETER_SNIFFING''), MAXDOP 1)';

-- SQL Server 2022: Wait stats per query
SELECT TOP 10 qsq.query_id,
       qsws.wait_category_desc,
       SUM(qsws.total_query_wait_time_ms) / 1000 AS total_wait_sec
FROM sys.query_store_wait_stats qsws
JOIN sys.query_store_query qsq ON qsws.query_id = qsq.query_id
GROUP BY qsq.query_id, qsws.wait_category_desc
ORDER BY total_wait_sec DESC;
```

### Recommended Reading

| Resource | Why |
|----------|-----|
| [Microsoft Learn — Query Store](https://learn.microsoft.com/en-us/sql/relational-databases/performance/monitoring-performance-by-using-the-query-store) | Official documentation with all DMV references |
| [Brent Ozar — Query Store](https://www.brentozar.com/sql/query-store/) | Practical usage patterns and troubleshooting |
| [Erik Darling — sp_QuickieStore](https://github.com/erikdarlingdata/DarlingData/tree/main/sp_QuickieStore) | The fastest way to find regressed queries |
