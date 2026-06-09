---
title: Automation & Maintenance
order: 9
icon: 🤖
---

## Key Concepts

### Automation Mindset

**Automate everything that is repeatable.** Manual steps introduce risk and consume DBA time that should go to improvement.

| Automate | Still Needs Human Review |
|----------|------------------------|
| Backup validation and restore testing | Root cause analysis |
| Disk space monitoring and alerting | Architecture decisions |
| Index maintenance | New feature evaluation |
| Statistics updates | Change approval |
| Daily health report generation | Incident escalation decisions |
| Failed job alerts | Capacity planning strategy |

### SQL Agent Jobs

The backbone of SQL Server automation:

- **Job steps** — T-SQL, PowerShell, SSIS, OS commands
- **Schedules** — daily, weekly, recurring
- **Alerts** — email, webhook, operator notification
- **History** — job history retention is critical for troubleshooting
- **Retry** — configure retry for transient failures (e.g., network blips)

> [!tip]
> Job failures are the #1 indicator of brewing problems. If a backup job fails and nobody sees the alert, the backup chain breaks. Monitor job status religiously.

### Ola Hallengren Maintenance Solution

Industry-standard, open-source maintenance solution used by thousands of DBAs:

- **DatabaseBackup** — full, differential, log backup automation
- **DatabaseIntegrityCheck** — DBCC CHECKDB automation
- **IndexOptimize** — index defrag + statistics update

Why it's widely used:
- Handles complexity (AG, log shipping, multiple file groups)
- Logging to command log table
- Parameterized so you control exactly what happens
- Tested at massive scale

### PowerShell for DBAs

`Dbatools` is a PowerShell module that every modern DBA should know:

```powershell
# Check SQL Server health
Get-DbaDatabase -SqlInstance ServerA | Select-Object Name, Status, RecoveryModel

# Check backup
Get-DbaLastBackup -SqlInstance ServerA

# Migrate logins
Copy-DbaLogin -Source ServerA -Destination ServerB

# Run query
Invoke-DbaQuery -SqlInstance ServerA -Query "SELECT @@VERSION"
```

### Operational Runbooks

A runbook answers: "When alert X fires, what do I do?"

Every runbook should include:
1. **Alert trigger** — what fired and why
2. **Severity classification** — is this critical or informational?
3. **First checks** — what to verify immediately
4. **Troubleshooting steps** — ordered checklist
5. **Escalation path** — who to call if stuck
6. **Remediation** — how to fix the issue
7. **Rollback** — how to undo the fix if it makes things worse

---

## Interview Q&A

**Q:** What's your approach to SQL Server automation as a DBA?

> My philosophy is that any task performed more than twice should be automated. Backups, integrity checks, index maintenance, disk space monitoring, and health reports should all run on schedules with alerting. Automation reduces human error, frees DBA time for improvement work, and ensures consistency. But I always keep human oversight for changes — automation runs the routine; a DBA handles judgment calls.

**Q:** Why do you use Ola Hallengren's solution?

> It's battle-tested, handles edge cases I'd miss if I wrote my own scripts (AG awareness, log shipping, file groups), and has excellent logging. It's maintained by the community and supported by SQL Server MVPs. Using it means I'm not reinventing the wheel — I can focus on my environment's specific needs rather than writing backup scripts from scratch.

**Q:** How do you ensure a runbook is actually useful during an incident?

> A runbook is only useful if it's tested and kept current. I write runbooks with step-by-step checks, not assumptions. We test them during DR drills and after infrastructure changes. If an incident reveals the runbook was wrong, we update it immediately in the post-incident review. I store runbooks where the on-call engineer can find them at 3 AM without VPN access.

---

## T-SQL Quick Reference

```sql
-- Check SQL Agent job history (last 24 hours)
SELECT j.name AS job_name,
       h.run_date, h.run_time,
       h.step_id, h.step_name,
       CASE h.run_status
           WHEN 0 THEN 'Failed'
           WHEN 1 THEN 'Succeeded'
           WHEN 3 THEN 'Cancelled'
           WHEN 4 THEN 'In Progress'
       END AS status,
       h.message
FROM msdb.dbo.sysjobs j
JOIN msdb.dbo.sysjobhistory h ON j.job_id = h.job_id
WHERE h.run_date >= CONVERT(VARCHAR(8), DATEADD(DAY, -1, GETDATE()), 112)
ORDER BY h.run_date DESC, h.run_time DESC;

-- Ola Hallengren DatabaseBackup command example
EXEC dbo.DatabaseBackup
    @Databases = 'USER_DATABASES',
    @Directory = 'E:\Backups',
    @BackupType = 'FULL',
    @Compress = 'Y',
    @CheckSum = 'Y',
    @CleanupTime = 48,
    @ChangeBackupType = 'Y';

-- Check current running jobs
SELECT j.name AS job_name,
       ja.start_execution_date,
       ja.last_executed_step_id,
       ja.stop_execution_date,
       ja.job_id
FROM msdb.dbo.sysjobactivity ja
JOIN msdb.dbo.sysjobs j ON ja.job_id = j.job_id
WHERE ja.start_execution_date IS NOT NULL
  AND ja.stop_execution_date IS NULL;
```
