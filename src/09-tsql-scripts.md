---
title: T-SQL & DBA Scripts
order: 15
icon: 📝
---

## Key Concepts

### DBA T-SQL vs Application SQL

| Application SQL | DBA T-SQL |
|----------------|-----------|
| CRUD operations | System metadata queries |
| Business logic | DMV queries for diagnostics |
| Optimized for the app | Optimized for discovery and investigation |

DBA T-SQL is about **reading the system, not writing business data.** You query `sys.*`, `msdb.*`, DMVs, and Extended Events.

### Essential DMVs Every DBA Should Know

| DMV | What It Tells You |
|-----|------------------|
| `sys.dm_exec_requests` | What's running RIGHT NOW |
| `sys.dm_exec_sessions` | Who is connected |
| `sys.dm_os_wait_stats` | What SQL Server is waiting on |
| `sys.dm_db_index_usage_stats` | How indexes are used |
| `sys.dm_db_index_physical_stats` | Index fragmentation |
| `sys.dm_io_virtual_file_stats` | IO performance per data file |
| `sys.dm_exec_query_stats` | Historical query performance |
| `sys.dm_os_performance_counters` | OS-level performance counters |
| `sys.dm_tran_locks` | Current locks |
| `sys.dm_db_log_space_usage` | Transaction log usage |

### Blocking Chain Investigation

```sql
WITH blocking AS (
    SELECT r.session_id AS blocked_session,
           r.blocking_session_id AS blocking_session,
           r.wait_type, r.wait_time,
           r.wait_resource, r.command,
           t.text AS query_text
    FROM sys.dm_exec_requests r
    CROSS APPLY sys.dm_exec_sql_text(r.sql_handle) t
    WHERE r.blocking_session_id > 0
)
SELECT b.*,
       es.login_name, es.host_name, es.program_name
FROM blocking b
JOIN sys.dm_exec_sessions es ON b.blocked_session = es.session_id;
```

### Index Usage Analysis

```sql
SELECT OBJECT_NAME(i.object_id) AS table_name,
       i.name AS index_name,
       i.type_desc,
       s.user_seeks, s.user_scans, s.user_lookups,
       s.user_updates,
       s.last_user_seek, s.last_user_scan, s.last_user_lookup,
       s.last_user_update
FROM sys.dm_db_index_usage_stats s
JOIN sys.indexes i ON s.object_id = i.object_id
                   AND s.index_id = i.index_id
WHERE s.database_id = DB_ID()
ORDER BY (s.user_seeks + s.user_scans + s.user_lookups) DESC;

-- Unused indexes (write overhead, no reads)
SELECT OBJECT_NAME(i.object_id) AS table_name,
       i.name AS index_name,
       i.type_desc
FROM sys.indexes i
LEFT JOIN sys.dm_db_index_usage_stats s
    ON i.object_id = s.object_id AND i.index_id = s.index_id
WHERE i.type > 0
  AND i.object_id > 100
  AND (s.object_id IS NULL OR
       (s.user_seeks + s.user_scans + s.user_lookups = 0));
```

### Backup History Query

```sql
SELECT database_name,
       CASE type
           WHEN 'D' THEN 'Full'
           WHEN 'I' THEN 'Differential'
           WHEN 'L' THEN 'Log'
       END AS backup_type,
       backup_start_date, backup_finish_date,
       DATEDIFF(MINUTE, backup_start_date, backup_finish_date) AS duration_min,
       backup_size / 1048576 AS size_mb,
       compressed_backup_size / 1048576 AS compressed_size_mb,
       CASE WHEN backup_size = compressed_backup_size
            THEN 'No'
            ELSE 'Yes (' + CAST(
                 (1 - compressed_backup_size * 1.0 / backup_size) * 100 AS DECIMAL(5,1)
            ) + '% saved)'
       END AS compression
FROM msdb.dbo.backupset
WHERE database_name NOT IN ('master', 'model', 'msdb', 'tempdb')
ORDER BY backup_start_date DESC;
```

### Disk Space Check

```sql
SELECT DISTINCT
    vs.volume_mount_point,
    vs.total_bytes / 1073741824 AS total_gb,
    vs.available_bytes / 1073741824 AS free_gb,
    CAST(vs.available_bytes * 100.0 / vs.total_bytes AS DECIMAL(4,1)) AS free_pct,
    mf.type_desc AS file_type
FROM sys.master_files mf
CROSS APPLY sys.dm_os_volume_stats(mf.database_id, mf.file_id) vs
ORDER BY vs.volume_mount_point;
```

### Script Safety

> [!warning]
> Every script you run in production should be:
> 1. Reviewed by a peer
> 2. Tested in non-production
> 3. Run in a transaction (for changes) so you can rollback
> 4. Logged to a table or file
> 5. Approved through change management

```sql
-- Safe pattern for DDL changes
BEGIN TRANSACTION
    PRINT 'Adding IX_Orders_OrderDate';
    CREATE NONCLUSTERED INDEX IX_Orders_OrderDate
    ON dbo.Orders(OrderDate)
    INCLUDE (OrderAmount, CustomerID);
    
    -- Validate
    SELECT * FROM sys.indexes WHERE name = 'IX_Orders_OrderDate';
    
    IF @@ERROR = 0
        COMMIT TRANSACTION;
    ELSE
    BEGIN
        ROLLBACK TRANSACTION;
        PRINT 'Failed! Rolled back.';
    END
```

---

## Interview Q&A

**Q:** What's the most important DMV you use and why?

> `sys.dm_exec_requests` — it tells me exactly what's running on the server right now. Combined with `sys.dm_exec_sql_text` and `sys.dm_exec_query_plan`, I can see the query, its wait type, CPU time, blocking chain, and execution plan for any currently running session. This is the first place I look when someone says "SQL Server is slow."

**Q:** How do you safely run scripts in production?

> First, I never run an untested script in production. Every script is tested in dev/test first. For writes, I wrap everything in `BEGIN TRAN` / `ROLLBACK` first to verify the impact, then commit. I always have a rollback plan. I log the script execution — who ran it, when, what it did, and what the outcome was. I get change approval before touching production.

**Q:** What's the difference between DBA T-SQL and application T-SQL?

> DBA T-SQL is about querying the system — DMVs, system tables, metadata. It's diagnostic and investigative. Application T-SQL is about business data — CRUD operations. A DBA needs to write DMV queries to diagnose problems, but also needs to understand application queries to tune them. The core SQL skills are the same, but the target is different.
