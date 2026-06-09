---
title: Incident Management & Communication
order: 14
icon: 🚨
---

## Key Concepts

### Incident Response — First 5 Minutes

When a business-critical SQL Server is partially unavailable during peak hours:

<svg viewBox="0 0 720 155" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;margin:16px 0;">
  <rect width="720" height="155" rx="8" fill="var(--bg-secondary,#f6f8fa)" stroke="var(--border,#d0d7de)" stroke-width="1"/>
  <text x="360" y="18" text-anchor="middle" font-family="Inter,sans-serif" font-size="13" font-weight="700">Incident Response — First 5 Minutes</text>
  <!-- Timeline bar -->
  <rect x="20" y="30" width="680" height="8" rx="4" fill="#d0d7de"/>
  <rect x="20" y="30" width="100" height="8" rx="4" fill="#d29922"/>
  <rect x="120" y="30" width="140" height="8" rx="0" fill="#0969da"/>
  <rect x="260" y="30" width="100" height="8" rx="0" fill="#1a7f37"/>
  <rect x="360" y="30" width="200" height="8" rx="0" fill="#cf222e"/>
  <!-- Labels above -->
  <text x="70" y="27" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" fill="#7a5e00">0:00</text>
  <text x="190" y="27" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" fill="#0550ae">0:30</text>
  <text x="310" y="27" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" fill="#116329">2:00</text>
  <text x="460" y="27" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" fill="#cf222e">3:00</text>
  <text x="680" y="27" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" fill="#8b949e">5:00</text>
  <!-- Steps -->
  <rect x="20" y="48" width="100" height="40" rx="4" fill="#fff8c5" stroke="#d29922" stroke-width="1"/>
  <text x="70" y="64" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" font-weight="600" fill="#7a5e00">CONFIRM</text>
  <text x="70" y="80" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" fill="#7a5e00">Verify alert + impact</text>
  <rect x="125" y="48" width="130" height="40" rx="4" fill="#ddf4ff" stroke="#0969da" stroke-width="1"/>
  <text x="190" y="64" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" font-weight="600" fill="#0550ae">TRIAGE</text>
  <text x="190" y="80" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" fill="#0550ae">SQL / Network / Storage / App?</text>
  <rect x="260" y="48" width="100" height="40" rx="4" fill="#dafbe1" stroke="#1a7f37" stroke-width="1"/>
  <text x="310" y="64" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" font-weight="600" fill="#116329">COLLECT</text>
  <text x="310" y="80" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" fill="#116329">DMVs, waits, error log</text>
  <rect x="365" y="48" width="195" height="40" rx="4" fill="#ffeef0" stroke="#cf222e" stroke-width="1"/>
  <text x="462" y="64" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" font-weight="600" fill="#cf222e">COMMUNICATE</text>
  <text x="462" y="80" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" fill="#cf222e">"Investigating — impact: [scope] — next update 10 min"</text>
  <!-- Bottom methodology -->
  <rect x="20" y="100" width="680" height="45" rx="4" fill="none" stroke="var(--border,#d0d7de)" stroke-width="1"/>
  <text x="360" y="114" text-anchor="middle" font-family="Inter,sans-serif" font-size="10" font-weight="600">7-Step Troubleshooting Methodology</text>
  <text x="55" y="130" font-family="Inter,sans-serif" font-size="8" fill="#d29922">❶ CONFIRM</text>
  <text x="140" y="130" font-family="Inter,sans-serif" font-size="8" fill="#0969da">❷ SCOPE</text>
  <text x="218" y="130" font-family="Inter,sans-serif" font-size="8" fill="#1a7f37">❸ COLLECT</text>
  <text x="307" y="130" font-family="Inter,sans-serif" font-size="8" fill="#0969da">❹ ANALYZE</text>
  <text x="400" y="130" font-family="Inter,sans-serif" font-size="8" fill="#cf222e">❺ FIX</text>
  <text x="460" y="130" font-family="Inter,sans-serif" font-size="8" fill="#1a7f37">❻ VERIFY</text>
  <text x="547" y="130" font-family="Inter,sans-serif" font-size="8" fill="#8b949e">❼ DOCUMENT</text>
</svg>

> [!warning]
> Restarting SQL Server or killing random sessions is not troubleshooting. You lose evidence and may make things worse. Always collect data first.

### Timeout Incident Investigation

When the app team reports timeouts but SQL Server is "online":

1. Check connections — are app servers connecting? connection pool exhaustion?
2. Check blocking — are transactions blocked?
3. Check long-running queries — which queries exceed the app's timeout threshold?
4. Check CPU, IO, memory — resource pressure?
5. Check network — latency, packet loss between app and database
6. Check app connection pool settings — Pool Size, Connection Lifetime

### Root Cause Analysis

A good RCA answers **why** it happened, not just what happened:

```
Bad RCA: "SQL Server was slow. We restarted it. Problem went away."
Good RCA: "At 09:15, a large inventory batch job ran concurrently with store 
           checkout queries. The batch job caused PAGEIOLATCH waits on the 
           inventory table. Missing indexes on the inventory table caused 
           scans. Fix: index added, batch job rescheduled to 02:00."
```

### Communicating with Non-DBAs

| Don't Say | Say Instead |
|-----------|-------------|
| "There's a PAGEIOLATCH_SH wait on the NCX on Inventory table" | "The database is waiting for data to load from disk for one of the inventory queries" |
| "We have blocking chain with session 72 holding locks" | "One transaction is waiting for another to finish before it can proceed" |
| "It's a parameter sniffing issue" | "The query plan was optimized for one type of lookup, but it's being used for a different one" |

### Technical Sparring with Developers

As a senior DBA, you're a consultant to the development team:

- Review query patterns and schema designs before they hit production
- Discuss trade-offs: "Adding this index will speed up this query by 80%, but it will slow inserts on this table by 5%"
- Ask for query plans and workload information
- Suggest safer alternatives
- Document decisions and rationale

---

## Interview Q&A

**Q:** Walk me through your process when you get an alert at 2 AM.

> I assess the severity first. Is this a critical database? Is it fully down or just slow? I check the monitoring dashboard for CPU, memory, disk, and blocking. I open my runbook for this alert and follow the first checks. If it's a known issue, I apply the documented fix. If it's new, I collect evidence and escalate if needed. I communicate status to the on-call team lead. After the incident, I update the runbook with what I learned.

**Q:** How do you explain a slow database to a non-technical manager?

> I focus on business impact, not technical details. "The system that processes store orders is taking longer than normal because there's a bottleneck reading data from disk. We've identified the cause and are applying a fix. It should be back to normal within the next hour. We'll do a full analysis tomorrow to prevent this from recurring." This answers: what happened, what you're doing, when it'll be fixed, and how you'll prevent it.

**Q:** How do you handle the application team blaming SQL Server for a timeout?

> I don't take it defensively. I say "Let's look at the data together." I check SQL Server metrics — are there blocking chains, high waits, resource pressure? I also ask the app team for their logs — connection timeout errors, query timeout settings, connection pool stats. Often the issue is fast queries but slow connections, or the app's connection pool is exhausted. Data removes blame.

---

## T-SQL Quick Reference

```sql
-- Current active sessions with wait info
SELECT session_id, login_name, status,
       cpu_time, memory_usage, reads, writes,
       last_request_start_time
FROM sys.dm_exec_sessions
WHERE is_user_process = 1
  AND status NOT IN ('sleeping', 'background')
ORDER BY cpu_time DESC;

-- Connection pool exhaustion
SELECT DB_NAME(dbid) AS database_name,
       COUNT(*) AS connection_count,
       loginame
FROM sys.sysprocesses
WHERE dbid > 0
GROUP BY DB_NAME(dbid), loginame
ORDER BY COUNT(*) DESC;

-- Last restarts / recent errors
SELECT log_date, process_info, text
FROM sys.dm_exec_requests r
CROSS APPLY sys.fn_get_audit_file(NULL, NULL, DEFAULT)
WHERE text LIKE '%error%' OR text LIKE '%fail%'
ORDER BY log_date DESC;

-- Find recent schema changes
SELECT OBJECT_NAME(object_id) AS object_name,
       type_desc, create_date, modify_date
FROM sys.objects
WHERE modify_date >= DATEADD(DAY, -1, GETDATE())
  AND type IN ('U', 'P', 'V', 'TR', 'FN', 'IF', 'TF');
```
