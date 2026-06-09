---
title: 24/7 Enterprise Operations
order: 1
icon: 🔄
---

## Key Concepts

### Business-Critical SQL Server Operations

In a 24/7 enterprise retail environment (like XYZ), SQL Server supports:
- Store systems (POS, pricing)
- Inventory and warehouse feeds
- Membership and customer data
- Reporting and analytics
- Supply chain and logistics

If SQL Server becomes unavailable, the business loses revenue and operational capability immediately.

### What a DBA Owns

The DBA owns **database availability, recoverability, performance, security, and capacity**. You do NOT own the application code, the network, or the storage array — but you must partner with those teams.

### 24/7 vs Office-Hours Mindset

| Office-Hours DBA | 24/7 Enterprise DBA |
|---|---|
| Schedule maintenance during lunch | Schedule during lowest business impact (e.g., 02:00–04:00) |
| Restart services freely | Every restart is a planned change with rollback |
| Fix performance next week | Fix it now or stores/warehouses stop |
| "It works on my machine" | "What is the RPO and RTO?" |

### Daily Health Checklist

1. **Backup status** — all critical databases backed up successfully?
2. **SQL Agent jobs** — any failures overnight?
3. **Disk space** — data, log, tempdb, backup drives
4. **Database status** — all online, no suspect/emergency mode?
5. **Availability Group health** — synchronized, no data loss?
6. **Blocking/long-running queries** — anything stuck?
7. **Error log** — severe errors overnight?
8. **SQL Server and Windows event logs** — warnings to address?

### Service Ownership Model

```
Application Team ── owns the app code and connection logic
     │
Infrastructure ──── owns the VM, storage, network, OS
     │
DBA ─────────────── owns the database engine, data, HA, backups, security
```

During an incident: **focus on collecting evidence, not assigning blame.** Use DMVs, logs, and monitoring data to identify the bottleneck.

---

## Interview Q&A

**Q:** What does "business-critical SQL Server operations" mean to you?

> It means databases that directly support revenue-generating or operational systems — stores, pricing, inventory, member data. In a 24/7 retail environment, there is no "off-hours" for these systems. My job is to ensure stability through proactive monitoring, tested backup/restore, and fast, methodical troubleshooting when issues arise. I think in terms of RPO, RTO, and business impact first.

**Q:** How does a DBA think differently in a 24/7 environment?

> The main difference is that maintenance and changes must be designed around the business cycle, not the DBA's convenience. A simple index rebuild that runs during peak hours can cause blocking and outages. Every change needs a rollback plan. Monitoring must be proactive — I want to know about a disk filling up before the business does.

---

## T-SQL Quick Reference

```sql
-- Quick health check
SELECT name, state_desc, recovery_model_desc, log_reuse_wait_desc
FROM sys.databases
ORDER BY name;

-- Check recent errors
SELECT TOP 10 log_date, process_info, text
FROM sys.dm_exec_requests r
CROSS APPLY sys.fn_get_audit_file(NULL, NULL, DEFAULT)
ORDER BY log_date DESC;

-- Check blocking
SELECT session_id, blocking_session_id, wait_type, wait_time, wait_resource
FROM sys.dm_exec_requests
WHERE blocking_session_id > 0;

-- Backup status check
SELECT database_name, type, backup_start_date, backup_finish_date,
       DATEDIFF(MINUTE, backup_start_date, backup_finish_date) AS duration_min,
       backup_size / 1048576 AS size_mb
FROM msdb.dbo.backupset
WHERE backup_start_date >= DATEADD(DAY, -1, GETDATE())
ORDER BY backup_start_date DESC;
```

---

## Self-Test

1. Why is an unthrottled index rebuild at peak hours dangerous in a 24/7 environment?
2. If a retail system has a sudden surge in checkout volume, which DMV category would you query first?
3. What's the fundamental difference between scheduling maintenance for an office application versus a 24/7 retail application?
