---
title: Production DBA Toolkit
order: 6
icon: 🧰
---

## Key Concepts

A senior DBA doesn't just know commands — they have a toolkit of battle-tested scripts and tools for rapid diagnosis. This chapter covers the most important ones from the top SQL Server resources.

> [!tip]
> **Study recommendation:** Install and run these tools on a practice SQL Server before your interview. Hands-on familiarity with the First Responder Kit is a strong signal to interviewers.

### Brent Ozar's First Responder Kit

The most widely used free DBA toolkit. Download from [BrentOzar.com](https://www.brentozar.com/first-aid/). It includes:

#### sp_Blitz — Health Check

A comprehensive SQL Server health check that identifies common misconfigurations and risks in under 5 minutes.

```sql
EXEC sp_Blitz @OutputType = 'TABLE';
-- Or check one priority level:
EXEC sp_Blitz @Priorities = 'HIGH';
```

**What it checks:** Missing backups, no query store, default MAXDOP, no tempdb data files, missing security, outdated stats, corrupted databases, unsupported builds, and 100+ other checks.

> **Interview tip:** Mentioning sp_Blitz shows you practice proactive health checks, not reactive firefighting.

#### sp_BlitzIndex — Index Analysis

The most thorough index analysis tool available. Identifies:

```sql
EXEC sp_BlitzIndex @DatabaseName = 'YourDB',
                   @Mode = 4;  -- 4 = complete analysis
```

**What it finds:**
- Missing indexes (better than the DMV — it cross-references existing indexes)
- Unused indexes with write overhead
- Duplicate indexes (same keys, different names)
- Heaps with forwarding pointers
- Extremely fragmented indexes
- Indexes with high key column width
- Partitioned index issues

#### sp_BlitzCache — Query Plan Analysis

Analyzes the plan cache to find the most expensive queries:

```sql
EXEC sp_BlitzCache @SortOrder = 'cpu',
                   @Top = 25;
```

**Key metrics:** CPU, duration, reads, writes, execution count, plan size, implicit conversions, parameter sniffing, forced serialization, and missing indexes discovered in plans.

#### sp_BlitzFirst — Real-Time Diagnostics

Captures a point-in-time snapshot of server health:

```sql
EXEC sp_BlitzFirst @SinceStartup = 0;
-- Shows current waits, running queries, file stats, and recommendations
```

### sp_WhoIsActive — Who's Running Right Now

Adam Machanic's sp_WhoIsActive is the gold standard for seeing what's running on a SQL Server (more detailed than sp_who2):

```sql
EXEC sp_WhoIsActive @ShowSystemSpids = 0,
                    @GetTasksInfo = 1,
                    @GetPlans = 1,
                    @GetTransactionInfo = 1;
```

**What it shows per session:**
- Query text and execution plan
- Wait type, wait time, and resource
- Blocking chain (who is blocking whom)
- Transaction log usage per session
- TempDB usage per session
- Query plan handle (can retrieve the actual plan)
- Session metadata (host, program, login, database)

**Common patterns to look for:**

```sql
-- Find the head blocker (most deeply nested)
EXEC sp_WhoIsActive @FindBlockLeaders = 1;

-- Filter by wait type
EXEC sp_WhoIsActive @Filter_Type = 'wait',
                    @Filter = 'PAGEIOLATCH_EX';

-- Show sleeping sessions with open transactions
EXEC sp_WhoIsActive @ShowSleepingSessions = 2;
```

### sp_HumanEvents — Simplified Extended Events

Brent Ozar's sp_HumanEvents makes Extended Events accessible without complex XML:

```sql
-- Capture queries that take longer than 30 seconds
EXEC sp_HumanEvents @EventType = 'query', @QueryDuration = 30000;

-- Capture deadlocks
EXEC sp_HumanEvents @EventType = 'deadlock';

-- Capture wait stats for a specific query
EXEC sp_HumanEvents @EventType = 'wait', @QueryDuration = 10000;
```

### SQLSkills Wait Stats Library

Paul Randal and the SQLSkills team provide a comprehensive wait type categorization:

| Wait Category | Key Waits | What It Means |
|--------------|-----------|---------------|
| **IO** | `PAGEIOLATCH_*`, `WRITELOG`, `ASYNC_IO_COMPLETION` | Storage is slow or overloaded |
| **Locking** | `LCK_M_*` | Blocking, long transactions |
| **Latch** | `PAGELATCH_*`, `LATCH_*` | Internal contention (often tempdb or allocation) |
| **CPU** | `SOS_SCHEDULER_YIELD` | CPU pressure, need more cores or tune queries |
| **Network** | `ASYNC_NETWORK_IO` | Client consuming results too slowly |
| **Memory** | `RESOURCE_SEMAPHORE` | Query memory grant waits, memory pressure |
| **Compilation** | `SQLTRACE_INCREMENTAL_FLUSH_SLEEP`, `RESOURCE_GOVERNOR_*` | Plan compilation or resource governor throttling |

### Ola Hallengren Maintenance Solution — Deep Dive

Not just a script — it's an **architecture** for production maintenance:

```sql
-- Full backup all user databases, with compression, verify
EXEC dbo.DatabaseBackup
    @Databases = 'USER_DATABASES',
    @Directory = 'E:\Backups',
    @BackupType = 'FULL',
    @Compress = 'Y',
    @Verify = 'Y',
    @CheckSum = 'Y',
    @CleanupTime = 48,
    @LogToTable = 'Y';

-- Log backups every 15 minutes for critical databases
EXEC dbo.DatabaseBackup
    @Databases = 'SalesDB,InventoryDB',
    @Directory = 'E:\Backups\Log',
    @BackupType = 'LOG',
    @Compress = 'Y',
    @CleanupTime = 1440,  -- Keep 24 hours of logs
    @LogToTable = 'Y';

-- Index and statistics maintenance (intelligent)
EXEC dbo.IndexOptimize
    @Databases = 'USER_DATABASES',
    @FragmentationLow = NULL,
    @FragmentationMedium = 'INDEX_REORGANIZE',
    @FragmentationHigh = 'INDEX_REBUILD_ONLINE',
    @FragmentationLevel1 = 5,
    @FragmentationLevel2 = 30,
    @UpdateStatistics = 'ALL',
    @OnlyModifiedStatistics = 'Y',
    @LogToTable = 'Y';

-- Integrity check
EXEC dbo.DatabaseIntegrityCheck
    @Databases = 'USER_DATABASES',
    @CheckCommands = 'CHECKDB',
    @LogToTable = 'Y';
```

**Key design features:**
- CommandLog table records every operation — provides an audit trail and job history
- Awareness of Always On AGs (backs up on preferred replica, skips secondaries)
- Awareness of log shipping (doesn't break log shipping chain)
- Handles multiple file groups, read-only databases, and partial availability
- Per-index decisions on rebuild vs reorganize based on actual fragmentation

### Custom Daily DBA Dashboard Query

```sql
-- One query to check server health in 5 seconds
SELECT 'Server Info' AS category, @@VERSION AS info
UNION ALL
SELECT 'Server Uptime', CONVERT(VARCHAR, DATEDIFF(DAY, sqlserver_start_time, GETDATE())) + ' days'
FROM sys.dm_os_sys_info
UNION ALL
SELECT 'Databases Online',
       CAST(COUNT(*) AS VARCHAR) + ' of ' + CAST((SELECT COUNT(*) FROM sys.databases) AS VARCHAR)
FROM sys.databases WHERE state = 0
UNION ALL
SELECT 'Failed Jobs (24h)',
       CAST(COUNT(*) AS VARCHAR) FROM msdb.dbo.sysjobhistory h
JOIN msdb.dbo.sysjobs j ON h.job_id = j.job_id
WHERE h.run_status = 0 AND h.step_id = 0
  AND h.run_date >= CONVERT(VARCHAR, DATEADD(DAY, -1, GETDATE()), 112)
UNION ALL
SELECT 'Backups Not Run (24h)',
       CAST(COUNT(*) AS VARCHAR) FROM sys.databases d
WHERE d.name NOT IN ('tempdb')
  AND d.state = 0
  AND NOT EXISTS (
      SELECT 1 FROM msdb.dbo.backupset bs
      WHERE bs.database_name = d.name
        AND bs.backup_start_date >= DATEADD(HOUR, -24, GETDATE())
        AND bs.type = 'D'
  )
UNION ALL
SELECT 'Blocking Sessions',
       CAST(COUNT(*) AS VARCHAR) FROM sys.dm_exec_requests
WHERE blocking_session_id > 0
UNION ALL
SELECT 'Current PLE (sec)',
       cntr_value FROM sys.dm_os_performance_counters
WHERE object_name LIKE '%Buffer Manager%'
  AND counter_name = 'Page life expectancy'
UNION ALL
SELECT 'Disk Free (C:\)',
       CAST(available_bytes / 1073741824 AS VARCHAR) + ' GB free'
FROM sys.dm_os_volume_stats(DB_ID(), 1);
```

### Monitoring Baseline Scripts

Capture these metrics regularly to build a performance baseline:

```sql
-- Wait stats snapshot
INSERT INTO dbo.WaitStatsBaseline (capture_date, wait_type, wait_ms, signal_wait_ms, waiting_tasks)
SELECT GETDATE(), wait_type, wait_time_ms, signal_wait_time_ms, waiting_tasks_count
FROM sys.dm_os_wait_stats
WHERE wait_type NOT IN ('BROKER_EVENTHANDLER', 'BROKER_RECEIVE_WAITFOR', ...);

-- Database size snapshot
INSERT INTO dbo.DBSizeBaseline (capture_date, db_name, file_type, size_mb, growth_mb)
SELECT GETDATE(), DB_NAME(database_id), type_desc, size * 8 / 1024,
       CASE WHEN is_percent_growth = 1 THEN growth ELSE growth * 8 / 1024 END
FROM sys.master_files;

-- Query performance snapshot from Query Store
INSERT INTO dbo.QueryPerformanceBaseline (capture_date, query_id, avg_duration_ms, avg_cpu_ms, executions)
SELECT GETDATE(), qsq.query_id, rs.avg_duration / 1000, rs.avg_cpu_time / 1000, rs.count_executions
FROM sys.query_store_query qsq
JOIN sys.query_store_plan qsp ON qsq.query_id = qsp.query_id
JOIN sys.query_store_runtime_stats rs ON qsp.plan_id = rs.plan_id
CROSS JOIN sys.query_store_runtime_stats_interval rsi
WHERE rs.runtime_stats_interval_id = rsi.runtime_stats_interval_id
  AND rsi.start_time >= DATEADD(HOUR, -1, GETDATE());
```

---

## Interview Q&A

**Q:** What's in your DBA toolkit? What scripts do you run first?

> My first tool is sp_WhoIsActive — it shows me what's running right now, including wait types, blocking chains, and the actual query plan. For health checks, I use sp_Blitz which catches 90% of common misconfigurations in seconds. For index analysis, sp_BlitzIndex — it's far more useful than the built-in DMVs because it cross-references indexes and shows duplicates, overlapping, and missing indexes together. I also rely on Ola Hallengren's scripts for backup, integrity, and maintenance automation.

**Q:** How do you use the First Responder Kit in your daily work?

> I run sp_Blitz weekly on every server — it catches issues before they become incidents. When someone reports a slow query, I run sp_BlitzCache to find the most expensive queries in the plan cache, then sp_BlitzIndex to see if the indexing strategy supports them. For real-time issues, sp_BlitzFirst captures a point-in-time snapshot. And sp_HumanEvents makes Extended Events accessible — I can capture deadlocks, slow queries, or wait stats without writing complex XML.

**Q:** What do you monitor daily on your SQL Servers?

> I have a dashboard query that checks: all databases online, backups in the last 24 hours, failed SQL Agent jobs, blocking sessions, current page life expectancy (PLE), disk free space, and log reuse wait states. I capture this into a table every hour to build baselines. I also review wait stats weekly — shifts in wait patterns are early warning signs of storage issues or query regression.

**Q:** How do you build a baseline and why does it matter?

> I capture wait stats, database sizes, query performance (from Query Store), and job durations into baseline tables daily. After 30 days, I know what's "normal" for each server. When someone says "it's slow," I compare current metrics to the baseline. If PAGEIOLATCH is 50% of waits when it's usually 10%, I know the storage is the bottleneck — no guesswork. Baselines also help capacity planning and change validation.

---

## T-SQL Quick Reference

```sql
-- Download and install First Responder Kit (one-time)
-- From https://github.com/BrentOzar/SQLServerFirstResponderKit
-- Run Install-ResponderKit.sql on each monitored server

-- sp_WhoIsActive (download separately from Adam Machanic's site)
-- https://github.com/amachanic/sp_whoisactive
EXEC sp_WhoIsActive @ShowSystemSpids = 0,
                    @GetPlans = 1,
                    @Sort_order = '[blocked_session_count] DESC';

-- Extended Events quick capture (no sp_HumanEvents needed)
CREATE EVENT SESSION [SlowQueries] ON SERVER
ADD EVENT sqlserver.sql_statement_completed (
    ACTION(sqlserver.sql_text, sqlserver.query_hash)
    WHERE duration > 10000000  -- 10 seconds in microseconds
)
ADD TARGET package0.event_file(SET filename = 'E:\XE\SlowQueries.xel')
WITH (MAX_MEMORY = 4096 KB, STARTUP_STATE = ON);
ALTER EVENT SESSION [SlowQueries] ON SERVER STATE = START;

-- Quick wait stats analysis (like sp_BlitzFirst approach)
WITH waits AS (
    SELECT wait_type, wait_time_ms / 1000 AS wait_sec,
           waiting_tasks_count,
           (wait_time_ms - signal_wait_time_ms) * 1.0 / wait_time_ms * 100 AS resource_pct
    FROM sys.dm_os_wait_stats
    WHERE wait_type NOT IN ('BROKER_EVENTHANDLER', 'BROKER_RECEIVE_WAITFOR', ...)
      AND wait_time_ms > 0
)
SELECT TOP 10 wait_type, wait_sec, waiting_tasks_count,
       CAST(resource_pct AS DECIMAL(4,1)) AS resource_wait_pct
FROM waits
ORDER BY wait_sec DESC;
```
