---
title: Monitoring, Alerting & Observability
order: 17
icon: 📡
---

## Key Concepts

In a 24/7 enterprise environment, monitoring is how you know about problems before users do. The XYZ JD emphasizes *"stable operations"* and *"proactive development"* — both depend on solid monitoring. This chapter covers what to monitor, how to alert, and how to build observability that supports on-call operations.

### The Five Golden Signals (Google SRE)

Apply these to every SQL Server:

| Signal | SQL Server Equivalent | What It Detects |
|--------|----------------------|-----------------|
| **Latency** | Query duration, wait times | Slow queries, blocking, IO bottlenecks |
| **Traffic** | Batch requests/sec, user connections | Load spikes, connection pool growth |
| **Errors** | Error log severity 16+, job failures | Corruption, permission issues, job failures |
| **Saturation** | CPU, memory, disk IOPS, log usage | Capacity nearing limits |
| **Availability** | Database status, AG health, server ping | Outages, failovers, suspect databases |

### What to Monitor — Tiered Approach

<svg viewBox="0 0 720 195" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;margin:16px 0;">
  <rect width="720" height="195" rx="8" fill="var(--bg-secondary,#f6f8fa)" stroke="var(--border,#d0d7de)" stroke-width="1"/>
  <text x="360" y="20" text-anchor="middle" font-family="Inter,sans-serif" font-size="13" font-weight="700">Alerting Tiers — Escalation Matrix</text>
  <!-- Tier 1 RED -->
  <rect x="15" y="32" width="222" height="150" rx="6" fill="#ffeef0" stroke="#cf222e" stroke-width="2"/>
  <rect x="15" y="32" width="222" height="22" rx="6" fill="#cf222e"/>
  <rect x="15" y="48" width="222" height="6" fill="#cf222e"/>
  <text x="126" y="48" text-anchor="middle" font-family="Inter,sans-serif" font-size="11" font-weight="700" fill="#fff">Tier 1 — Page immediately</text>
  <text x="22" y="68" font-family="Inter,sans-serif" font-size="9" fill="#1f2328">• SQL Server service is down</text>
  <text x="22" y="82" font-family="Inter,sans-serif" font-size="9" fill="#1f2328">• Database SUSPECT / EMERGENCY</text>
  <text x="22" y="96" font-family="Inter,sans-serif" font-size="9" fill="#1f2328">• AG not synchronized</text>
  <text x="22" y="110" font-family="Inter,sans-serif" font-size="9" fill="#1f2328">• Log file &gt; 90% full</text>
  <text x="22" y="124" font-family="Inter,sans-serif" font-size="9" fill="#1f2328">• Disk free &lt; 10%</text>
  <text x="22" y="138" font-family="Inter,sans-serif" font-size="9" fill="#1f2328">• DBCC CHECKDB corruption</text>
  <text x="22" y="152" font-family="Inter,sans-serif" font-size="9" fill="#1f2328">• AG failover occurred</text>
  <text x="22" y="170" font-family="Inter,sans-serif" font-size="8" fill="#cf222e">🚨 Immediate response required</text>
  <!-- Tier 2 YELLOW -->
  <rect x="249" y="32" width="222" height="150" rx="6" fill="#fff8c5" stroke="#d29922" stroke-width="2"/>
  <rect x="249" y="32" width="222" height="22" rx="6" fill="#d29922"/>
  <rect x="249" y="48" width="222" height="6" fill="#d29922"/>
  <text x="360" y="48" text-anchor="middle" font-family="Inter,sans-serif" font-size="11" font-weight="700" fill="#fff">Tier 2 — Create ticket</text>
  <text x="256" y="68" font-family="Inter,sans-serif" font-size="9" fill="#1f2328">• Failed SQL Agent jobs</text>
  <text x="256" y="82" font-family="Inter,sans-serif" font-size="9" fill="#1f2328">• Backups failed / incomplete</text>
  <text x="256" y="96" font-family="Inter,sans-serif" font-size="9" fill="#1f2328">• PLE &lt; 300 (memory pressure)</text>
  <text x="256" y="110" font-family="Inter,sans-serif" font-size="9" fill="#1f2328">• Blocking &gt; 30 seconds</text>
  <text x="256" y="124" font-family="Inter,sans-serif" font-size="9" fill="#1f2328">• Deadlocks &gt; 10/min</text>
  <text x="256" y="138" font-family="Inter,sans-serif" font-size="9" fill="#1f2328">• Queries &gt; 30 minutes</text>
  <text x="256" y="152" font-family="Inter,sans-serif" font-size="9" fill="#1f2328">• Autogrowth events</text>
  <text x="256" y="170" font-family="Inter,sans-serif" font-size="8" fill="#7a5e00">⚠️ Review within business hours</text>
  <!-- Tier 3 GREEN -->
  <rect x="483" y="32" width="222" height="150" rx="6" fill="#dafbe1" stroke="#1a7f37" stroke-width="2"/>
  <rect x="483" y="32" width="222" height="22" rx="6" fill="#1a7f37"/>
  <rect x="483" y="48" width="222" height="6" fill="#1a7f37"/>
  <text x="594" y="48" text-anchor="middle" font-family="Inter,sans-serif" font-size="11" font-weight="700" fill="#fff">Tier 3 — Weekly review</text>
  <text x="490" y="68" font-family="Inter,sans-serif" font-size="9" fill="#1f2328">• Wait stats shifts</text>
  <text x="490" y="82" font-family="Inter,sans-serif" font-size="9" fill="#1f2328">• Query Store regressions</text>
  <text x="490" y="96" font-family="Inter,sans-serif" font-size="9" fill="#1f2328">• Index fragmentation trends</text>
  <text x="490" y="110" font-family="Inter,sans-serif" font-size="9" fill="#1f2328">• Database growth rate</text>
  <text x="490" y="124" font-family="Inter,sans-serif" font-size="9" fill="#1f2328">• Login failure trends</text>
  <text x="490" y="138" font-family="Inter,sans-serif" font-size="9" fill="#1f2328">• Performance degradation</text>
  <text x="490" y="152" font-family="Inter,sans-serif" font-size="9" fill="#1f2328">• Schema changes (DDL)</text>
  <text x="490" y="170" font-family="Inter,sans-serif" font-size="8" fill="#1a7f37">📊 Proactive capacity planning</text>
</svg>

### Monitoring Tools Landscape

| Tool | Type | Best For |
|------|------|----------|
| **SQL Server Agent Alerts** | Built-in | Simple threshold alerts (SQL) |
| **Windows Performance Monitor** | Built-in (OS) | Counter-based monitoring (OS+SQL) |
| **Extended Events** | Built-in (SQL) | Custom event capture, deadlock graphs |
| **SQL Server Audit** | Built-in | Compliance, permission changes, login tracking |
| **Management Data Warehouse** | Built-in | Historical baseline of perf counters |
| **SCOM** | Microsoft | Enterprise monitoring, many server types |
| **Datadog / New Relic** | Cloud/SaaS | Modern observability, dashboards, APM |
| **SolarWinds DPA** | Third-party | SQL Server-specific deep monitoring |
| **Grafana + Telegraf + InfluxDB** | Open-source | Custom dashboards, low cost |
| **Brent Ozar First Responder Kit** | Free | Point-in-time health checks, trend analysis |

### Building a SQL Server Alert Strategy

**Rule:** Every alert must have a clear action. If you don't know what to do when the alert fires, it's noise.

```text
Good alert:    "Disk D: on SQLSRV01 is at 92% — has 8 GB free.
               Action: check log growth, run log backup, add space if needed."
Bad alert:     "SQL Server is slow"
Noise alert:   "SQL Server has been running for 7 days" (informational, not actionable)
```

**Alert threshold tips:**
- Disk space: alert at 20% free, warning at 10%, critical at 5%
- Job failures: alert on every failure (but allow retries first)
- PLE: alert < 300 seconds for 5+ minutes (brief dips are normal)
- Log growth: monitor autogrowth events (many small grows = misconfigured log)
- Blocking: alert on blocking chains > 60 seconds

### Dashboard Design

A useful operations dashboard answers these questions in 10 seconds:

```
┌──────────────────────────────────────────────┐
│  SQL Server Operations Dashboard             │
│══════════════════════════════════════════════│
│  🔴 Database suspect?        │  OK           │
│  🟢 Last backup              │ 2h ago        │
│  🟢 Job failures (24h)       │ 0             │
│  🟢 Disk free (C:)            │ 45 GB         │
│  🟢 AG synchronized          │ Yes           │
│  🟡 PLE                      │ 420 sec       │
│  🟢 Top wait                 │ SOS_YIELD     │
│  🟢 Blocking count           │ 0             │
└──────────────────────────────────────────────┘
```

### On-Call Runbook Integration

Monitoring is useless without a runbook. Every alert should link to a runbook that tells the on-call engineer:

1. What to check first
2. What metrics to collect before taking action
3. What the standard fix is
4. When to escalate
5. Who to call if escalation is needed

### SQL Server Agent Alerts — Built-in Monitoring

```sql
-- Set up SQL Agent to alert on severity levels
EXEC msdb.dbo.sp_add_alert
    @name = 'Severe Error',
    @message_id = 0,
    @severity = 19,  -- Fatal error in resource
    @enabled = 1,
    @delay_between_responses = 300,
    @include_event_description_in = 1;

-- Add notification to operator
EXEC msdb.dbo.sp_add_notification
    @alert_name = 'Severe Error',
    @operator_name = 'DBA_OnCall',
    @notification_method = 1;  -- Email
```

### Performance Metrics Collection (Build Your Baseline)

```sql
-- Create baseline tables
CREATE TABLE dbo.WaitStatsHistory (
    capture_time DATETIME2 DEFAULT GETDATE(),
    wait_type NVARCHAR(120),
    wait_time_ms BIGINT,
    signal_wait_time_ms BIGINT,
    waiting_tasks_count BIGINT
);
CREATE INDEX IX_WaitStatsHistory_capture ON dbo.WaitStatsHistory(capture_time);

CREATE TABLE dbo.PerfCounterHistory (
    capture_time DATETIME2 DEFAULT GETDATE(),
    counter_name NVARCHAR(256),
    cntr_value BIGINT,
    instance_name NVARCHAR(256)
);

-- Capture hourly (schedule via SQL Agent job)
INSERT INTO dbo.WaitStatsHistory (wait_type, wait_time_ms, signal_wait_time_ms, waiting_tasks_count)
SELECT wait_type, wait_time_ms, signal_wait_time_ms, waiting_tasks_count
FROM sys.dm_os_wait_stats;

INSERT INTO dbo.PerfCounterHistory (counter_name, cntr_value, instance_name)
SELECT counter_name, cntr_value, instance_name
FROM sys.dm_os_performance_counters;
```

### Extended Events for Custom Monitoring

```sql
-- Lightweight blocking monitor
CREATE EVENT SESSION [BlockingMonitor] ON SERVER
ADD EVENT sqlserver.blocked_process_report
ADD TARGET package0.ring_buffer
WITH (MAX_MEMORY = 4096 KB, STARTUP_STATE = ON);

-- Enable blocked process threshold (required for the event)
EXEC sp_configure 'blocked process threshold', 30;  -- 30 seconds
RECONFIGURE;

-- Capture query-level wait stats
CREATE EVENT SESSION [QueryWaits] ON SERVER
ADD EVENT sqlserver.sql_statement_completed (
    ACTION(sqlserver.sql_text, sqlserver.session_id)
    WHERE duration > 1000000  -- queries over 1 second
)
ADD TARGET package0.event_file(SET filename = 'E:\XE\QueryWaits.xel')
WITH (MAX_MEMORY = 4096 KB, STARTUP_STATE = ON);
```

---

## Interview Q&A

**Q:** What metrics do you monitor on a SQL Server and why?

> I use a tiered approach. Tier 1 is immediate alerts: service down, suspect databases, AG not synchronized, disk below 10%, corruption found. Tier 2 is daily review: job failures, backup status, PLE, blocking chains, deadlock rates. Tier 3 is weekly trends: wait stats shifts, Query Store regressions, index fragmentation, database growth. The key is that every alert is actionable — if I page someone at 3 AM, they need to know what to do.

**Q:** How do you handle alert fatigue in a 24/7 environment?

> Alert fatigue happens when alerts aren't actionable. I review our alerts quarterly — anything that hasn't triggered a useful response in 6 months gets either fixed (if it's a known issue) or removed. I set appropriate thresholds — don't alert on a 2-minute PLE dip, alert on a sustained drop below 300 seconds. I use delay-between-responses to avoid repeated alerts for the same condition. And every alert links to a runbook so the on-call engineer knows exactly what to check.

**Q:** How would you build a monitoring system from scratch for a XYZ-like environment?

> I'd start with the five golden signals: latency, traffic, errors, saturation, availability. For SQL Server, that translates to query duration and wait times, active sessions and batch requests, error log severity and job failures, CPU/memory/disk/IO usage, and database/AG health. I'd use SQL Agent alerts and Extended Events for SQL-specific monitoring, and integrate with the existing infrastructure monitoring tool (SCOM, Datadog, or similar). I'd capture wait stats and performance counters into baseline tables hourly. Every alert would have a linked runbook. The dashboard would show green/red status for the most critical signals so anyone can see server health in 10 seconds.

---

## T-SQL Quick Reference

```sql
-- Quick monitoring: what's happening right now
SELECT session_id, login_name, status, cpu_time,
       total_elapsed_time, reads, writes, logical_reads,
       open_transaction_count, transaction_isolation_level
FROM sys.dm_exec_sessions
WHERE is_user_process = 1
  AND status NOT IN ('sleeping', 'background');

-- SQL Server uptime
SELECT DATEDIFF(DAY, sqlserver_start_time, GETDATE()) AS uptime_days,
       sqlserver_start_time
FROM sys.dm_os_sys_info;

-- Disk space all drives
SELECT DISTINCT volume_mount_point,
       total_bytes / 1073741824 AS total_gb,
       available_bytes / 1073741824 AS free_gb,
       CAST(available_bytes * 100.0 / total_bytes AS DECIMAL(4,1)) AS free_pct
FROM sys.master_files
CROSS APPLY sys.dm_os_volume_stats(database_id, file_id);

-- Last successful backup per database
SELECT database_name,
       MAX(CASE type WHEN 'D' THEN backup_start_date END) AS last_full,
       MAX(CASE type WHEN 'L' THEN backup_start_date END) AS last_log
FROM msdb.dbo.backupset
WHERE database_name NOT IN ('tempdb')
GROUP BY database_name
ORDER BY database_name;

-- Top waits this hour (compare to baseline)
SELECT TOP 10 wait_type,
       SUM(wait_time_ms / 1000) AS total_wait_sec
FROM sys.dm_os_wait_stats
WHERE wait_type NOT IN ('BROKER_EVENTHANDLER', 'BROKER_RECEIVE_WAITFOR', ...)
GROUP BY wait_type
ORDER BY total_wait_sec DESC;

-- SQL Agent job health
SELECT j.name,
       h.run_status,
       h.run_date, h.run_time,
       h.step_name, h.message
FROM msdb.dbo.sysjobs j
OUTER APPLY (
    SELECT TOP 1 *
    FROM msdb.dbo.sysjobhistory h
    WHERE h.job_id = j.job_id AND h.step_id = 0
    ORDER BY h.run_date DESC, h.run_time DESC
) h
ORDER BY j.name;
```

### Recommended Reading

| Resource | Why |
|----------|-----|
| [Brent Ozar — How to Monitor SQL Server](https://www.brentozar.com/archive/2018/08/how-to-monitor-sql-server/) | Practical monitoring framework |
| [Microsoft — SQL Server Monitoring](https://learn.microsoft.com/en-us/sql/relational-databases/performance/monitor-sql-server) | Official monitoring guidance |
| [SQLSkills — Waits and Latches Library](https://www.sqlskills.com/help/waits/) | Understand what each wait type means for alerting |
