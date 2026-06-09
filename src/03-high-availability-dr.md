---
title: High Availability & Disaster Recovery
order: 7
icon: 🔁
---

## Key Concepts

### HA vs DR — Know the Difference

| **High Availability** | **Disaster Recovery** |
|---|---|
| Survive server/component failure | Survive site/data center loss |
| Seconds to minutes failover | Minutes to hours recovery |
| Automatic or manual failover | Often manual process |
| Typically same data center | Cross-data center / region |
| **RTO:** minutes | **RTO:** hours to days |
| **RPO:** zero to seconds | **RPO:** minutes to hours |

> [!tip]
> HA does NOT replace backups. A user-error or corruption is replicated to all replicas. Backups are your safety net for logical corruption.

### RPO and RTO

- **RPO** (Recovery Point Objective) — How much data can you afford to lose?
- **RTO** (Recovery Time Objective) — How fast must you recover?

These drive all your architecture decisions. Low RPO → frequent log backups, sync replication. Low RTO → automated failover, pre-tested restore procedures.

### Always On Availability Groups

| Feature | Description |
|---------|-------------|
| Primary Replica | Read-write copy of the database |
| Secondary Replica | Read-only copy, can be used for backups |
| Listener | Virtual network name (clients connect here, not to a server) |
| Synchronous Commit | Transaction is committed on primary AND secondary before acknowledgement |
| Asynchronous Commit | Transaction committed on primary, secondary catches up asynchronously |

<svg viewBox="0 0 720 195" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;margin:16px 0;">
  <rect width="720" height="195" rx="8" fill="var(--bg-secondary,#f6f8fa)" stroke="var(--border,#d0d7de)" stroke-width="1"/>
  <text x="360" y="20" text-anchor="middle" font-family="Inter,sans-serif" font-size="13" font-weight="700">Always On Availability Group — Three-Replica Topology</text>
  <!-- Primary -->
  <rect x="20" y="35" width="200" height="65" rx="6" fill="#dafbe1" stroke="#1a7f37" stroke-width="2"/>
  <text x="120" y="55" text-anchor="middle" font-family="Inter,sans-serif" font-size="12" font-weight="700" fill="#116329">Primary Replica</text>
  <text x="120" y="70" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" fill="#116329">Data Center A</text>
  <text x="120" y="85" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" fill="#116329">Read / Write</text>
  <!-- Sync secondary -->
  <rect x="260" y="35" width="200" height="65" rx="6" fill="#ddf4ff" stroke="#0969da" stroke-width="2"/>
  <text x="360" y="55" text-anchor="middle" font-family="Inter,sans-serif" font-size="12" font-weight="700" fill="#0550ae">Sync Secondary</text>
  <text x="360" y="70" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" fill="#0550ae">Data Center A</text>
  <text x="360" y="85" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" fill="#0550ae">Read-Only (reporting)</text>
  <!-- Async secondary -->
  <rect x="500" y="35" width="200" height="65" rx="6" fill="#fff8c5" stroke="#d29922" stroke-width="2"/>
  <text x="600" y="55" text-anchor="middle" font-family="Inter,sans-serif" font-size="12" font-weight="700" fill="#7a5e00">Async Secondary</text>
  <text x="600" y="70" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" fill="#7a5e00">Data Center B (DR)</text>
  <text x="600" y="85" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" fill="#7a5e00">Read-Only (DR)</text>
  <!-- Sync arrow -->
  <line x1="220" y1="55" x2="257" y2="55" stroke="#1a7f37" stroke-width="2.5" marker-end="url(#bt-arrow)"/>
  <line x1="250" y1="55" x2="224" y2="55" stroke="#1a7f37" stroke-width="2.5"/>
  <text x="240" y="48" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" fill="#1a7f37">Sync</text>
  <!-- Async arrow -->
  <line x1="460" y1="55" x2="497" y2="55" stroke="#d29922" stroke-width="2" stroke-dasharray="6,3" marker-end="url(#bt-arrow)"/>
  <text x="480" y="48" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" fill="#d29922">Async</text>
  <!-- Listener -->
  <rect x="260" y="115" width="200" height="30" rx="15" fill="#ffeef0" stroke="#cf222e" stroke-width="2"/>
  <text x="360" y="135" text-anchor="middle" font-family="Inter,sans-serif" font-size="11" font-weight="700" fill="#cf222e">AG Listener (Virtual IP)</text>
  <!-- Arrows to listener -->
  <line x1="120" y1="100" x2="260" y2="130" stroke="#8b949e" stroke-width="1" stroke-dasharray="3,2"/>
  <line x1="360" y1="100" x2="360" y2="113" stroke="#8b949e" stroke-width="1" stroke-dasharray="3,2"/>
  <line x1="600" y1="100" x2="460" y2="130" stroke="#8b949e" stroke-width="1" stroke-dasharray="3,2"/>
  <!-- Application -->
  <rect x="420" y="155" width="180" height="24" rx="4" fill="none" stroke="#0969da" stroke-width="1.5"/>
  <text x="510" y="172" text-anchor="middle" font-family="Inter,sans-serif" font-size="10" font-weight="600" fill="#0969da">App → Listener → Primary</text>
  <!-- Quorum -->
  <rect x="20" y="115" width="170" height="22" rx="4" fill="none" stroke="#d0d7de" stroke-width="1"/>
  <text x="105" y="130" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" fill="#8b949e">Quorum: File Share Witness (DC C)</text>
</svg>

### Sync vs Async

| | Synchronous | Asynchronous |
|---|---|---|
| Data loss risk | Zero (no data loss on failover) | Some data loss possible |
| Performance impact | Higher latency (network round-trip) | Primary unaffected |
| Use case | Same data center, low latency | DR site, geographically distant |
| Automatic failover | Supported | Not supported |

### Quorum

Quorum prevents **split-brain** — where both sides of a cluster think they're the active node.

| Node Count | Quorum Type | Survivability |
|------------|-------------|---------------|
| 2 nodes | Node + File Share Witness | Survive 1 node loss |
| 2 nodes | Node + Disk Witness | Survive 1 node loss |
| 3 nodes | Node Majority | Survive 1 node loss |
| 4+ nodes | Node Majority | Survive floor(n/2) node loss |

> [!warning]
> Always configure a witness for 2-node clusters. Without a witness, losing one node takes the entire AG offline.

### Failover Types

| Type | Description | Data Loss |
|------|-------------|-----------|
| Planned manual failover | Graceful, intended | None |
| Automatic failover | Due to failure, sync replicas only | None |
| Forced failover | Manual override, async replicas | Possible data loss |

---

## Interview Q&A

**Q:** Explain the difference between HA and DR with a real example.

> HA is about surviving a SQL Server or host failure — an Always On automatic failover happens within seconds, and the business barely notices. DR is about surviving a data center outage — a fire, flood, or power loss — where we restore or fail over to another site. HA gives us minutes of downtime; DR gives us hours. Both need to be tested regularly.

**Q:** How do you choose between synchronous and asynchronous commit?

> Synchronous is for critical databases within the same data center where we cannot accept data loss. Asynchronous is for DR across data centers where network latency makes sync impractical. A common pattern is: sync replica in the primary data center for HA, async replica in the DR site for DR. The business decides the RPO, and the replica configuration follows.

**Q:** What do you check after an Always On failover?

> First, verify the listener is online and applications can connect. Second, check the data — is it consistent, is synchronization healthy? Third, check jobs — are SQL Agent jobs running on the new primary? Are logins and permissions in sync? Fourth, check the old primary — why did it fail? Fifth, update documentation and incident record.

---

## T-SQL Quick Reference

```sql
-- Check AG health
SELECT ar.replica_server_name,
       ar.endpoint_url,
       ar.availability_mode_desc,
       ar.failover_mode_desc,
       ar.secondary_role_allow_connections_desc,
       ar.seeding_mode_desc
FROM sys.availability_replicas ar
JOIN sys.availability_groups ag ON ar.group_id = ag.group_id;

-- Check database synchronization state
SELECT DB_NAME(database_id) AS db_name,
       synchronization_state_desc,
       synchronization_health_desc,
       last_sent_time,
       last_received_time,
       last_hardened_time,
       last_redone_time,
       log_send_queue_size,
       redo_queue_size
FROM sys.dm_hadr_database_replica_states;

-- Preferred backup replica check
IF sys.fn_hadr_backup_is_preferred_replica('MyDB') = 1
    BACKUP DATABASE MyDB TO DISK = 'E:\Backups\MyDB.bak'
    WITH COMPRESSION, CHECKSUM;

-- Check quorum state
SELECT cluster_name, quorum_type_desc, quorum_state_desc
FROM sys.dm_hadr_cluster;

-- Failover health check
SELECT replica_id, role_desc, is_local,
       operational_state_desc, connected_state_desc,
       recovery_health_desc
FROM sys.dm_hadr_availability_replica_states;
```

---

### Log Shipping

#### What Is Log Shipping

Log shipping automates three jobs in sequence:

```
Primary Server           File Share              Secondary Server
┌─────────────────┐     ┌──────────────┐     ┌──────────────────┐
│ Backup Job      │────>│ .trn files   │────>│ Copy Job         │
│ (every 10 min)  │     │ \\share\ls\  │     │ → Restore Job     │
│                 │     │              │     │ (WITH NORECOVERY) │
└─────────────────┘     └──────────────┘     └──────────────────┘
```

| Job | Runs On | Frequency | What It Does |
|-----|---------|-----------|-------------|
| Backup | Primary | Log backup schedule | Backs up transaction log to a network share |
| Copy | Secondary | Every 1-2 minutes | Copies .trn files from share to local folder |
| Restore | Secondary | Every 1-2 minutes | Restores .trn to secondary database WITH NORECOVERY |

A **monitor server** (optional) tracks all activity and raises alerts if any job fails.

#### Log Shipping vs Availability Groups

| | Log Shipping | Availability Group |
|---|---|---|
| Failover | Manual only | Automatic (sync replicas) |
| Secondary accessible | Read-only (STANDBY mode) or offline (NORECOVERY) | Readable (all secondary replicas) |
| Multiple secondaries | Yes (unlimited) | Up to 8 (SQL 2022) |
| Cross-domain / forest | Yes (file share access) | Kerberos delegation required |
| Performance impact | Negligible (just log backup I/O) | Log transport + redo on secondaries |
| Listener | No — clients must be re-pointed | Yes — AG listener handles failover transparently |
| Complexity | Low | High (WSFC, quorum, networking) |
| RPO | Log backup frequency (1-15 min typical) | Zero (sync) or seconds (async) |
| RTO | Minutes (restore remaining logs + failover)| Seconds (auto failover) |

#### When to Use Log Shipping

| Scenario | Why Log Shipping Wins |
|----------|----------------------|
| DR to a remote data center | Works over unreliable WAN; resumes automatically after network outage |
| Migrating to a new server | Pre-stage the target with logs, then minimal final cutover downtime |
| Reporting offload | STANDBY mode allows read-only access between restore cycles |
| Budget-constrained environment | No Enterprise Edition requirement (AG requires Enterprise for readable secondaries) |
| Cross-platform / cloud DR | Works to Azure VMs, different domains, or even non-Windows file shares |

#### Setup Overview

```sql
-- On primary: configure log shipping
EXEC master.dbo.sp_add_log_shipping_primary_database
    @database = N'SalesDB',
    @backup_directory = N'\\fileshare\logships\SalesDB',
    @backup_share = N'\\fileshare\logships\SalesDB',
    @backup_job_name = N'LSBackup_SalesDB',
    @backup_retention_period = 4320,        -- minutes (3 days)
    @backup_compression = 2,                -- 2 = use default
    @monitor_server = N'MonitorSvr',
    @monitor_server_security_mode = 1;      -- Windows Auth

-- On secondary: configure restore
EXEC master.dbo.sp_add_log_shipping_secondary_database
    @secondary_database = N'SalesDB',
    @primary_server = N'PrimarySvr',
    @primary_database = N'SalesDB',
    @restore_delay = 0,                     -- minutes to wait before restoring
    @restore_mode = 0,                      -- 0 = NORECOVERY, 1 = STANDBY
    @disconnect_users = 0,
    @restore_all = 1,
    @restore_job_name = N'LSRestore_SalesDB',
    @file_retention_period = 4320,
    @monitor_server = N'MonitorSvr',
    @monitor_server_security_mode = 1;
```

#### Monitoring

```sql
-- Primary status
SELECT primary_database,
       backup_directory,
       last_backup_file,
       last_backup_time,
       history_retention_period
FROM msdb.dbo.log_shipping_monitor_primary;

-- Secondary status
SELECT secondary_database,
       last_restored_file,
       last_restored_time,
       last_restored_latency_seconds,
       history_retention_period
FROM msdb.dbo.log_shipping_monitor_secondary;

-- Latency check (how far behind is the secondary?)
SELECT DATEDIFF(MINUTE, last_restored_time, GETDATE()) AS restore_lag_minutes
FROM msdb.dbo.log_shipping_monitor_secondary;

-- Job status
SELECT j.name AS job_name,
       h.run_date, h.run_time,
       h.message,
       CASE h.run_status
           WHEN 0 THEN 'Failed'
           WHEN 1 THEN 'Succeeded'
           WHEN 2 THEN 'Retry'
           WHEN 3 THEN 'Cancelled'
           WHEN 4 THEN 'In Progress'
       END AS status
FROM msdb.dbo.sysjobhistory h
JOIN msdb.dbo.sysjobs j ON h.job_id = j.job_id
WHERE j.name LIKE 'LS%'
  AND h.run_date >= CONVERT(VARCHAR, DATEADD(DAY, -7, GETDATE()), 112)
ORDER BY h.run_date DESC, h.run_time DESC;
```

**Alert thresholds** — configure in Log Shipping Monitor or as SQL Agent alerts:
- Backup older than 30 minutes → page
- Copy older than 15 minutes → page
- Restore older than 15 minutes → page
- Any LS job fails 3+ consecutive times → page

#### Failover Procedure

Planned failover (primary still accessible):

```
1. BACKUP LOG SalesDB TO DISK = '\\share\final.trn' WITH NORECOVERY
   (primary is now read-only)

2. Restore all pending logs on secondary, including the tail-log backup:
   RESTORE LOG SalesDB FROM DISK = '\\share\final.trn' WITH RECOVERY
   (secondary is now live)

3. Point applications to the secondary server

4. Optionally set up reverse log shipping:
   - Configure the old primary as a log shipping secondary
   - Configure the new primary (old secondary) to ship logs back
```

Unplanned failover (primary lost):

```
1. Identify the latest .trn file on the file share

2. Restore all logs up to the latest:
   RESTORE LOG SalesDB FROM DISK = '\\share\latest.trn' WITH RECOVERY

3. Point applications to the secondary server
   (data loss = time between last backed-up log and the crash)

4. Once primary is recovered, restore the tail-log if possible
   and set up reverse log shipping
```

**Critical rule after failover:** Every restored log must maintain the LSN chain. If you restore a full backup from a different point in the LSN sequence, the chain breaks and subsequent log backups cannot be applied.

#### Cross-DC Log Shipping (XYZ Context)

For XYZ's remote geographies, log shipping is often the most practical DR solution:

| Location | Latency | AG Viable? | Log Shipping Viable? | Strategy |
|----------|---------|-----------|---------------------|----------|
| Faroe Islands | 30-50 ms | Async — possible but complex | Yes | Log shipping to a local server in Tórshavn |
| Greenland | 80-150 ms | Async — impractical | Yes | Log shipping + weekly full backup shipped by disk |
| Germany DC | 10-20 ms | Async — yes | Yes | Either works; AG preferred if budget allows |
| Denmark DC2 | 1-3 ms | Sync — yes | Yes | AG for HA; log shipping for long-term archival |

**Log shipping over high-latency links** — best practices:
- Compress log backups before transfer (`BACKUP LOG ... WITH COMPRESSION`)
- Increase backup job frequency on poor links (smaller files resume faster)
- Use a staging server in the same DC as the primary before shipping cross-DC
- Test automated resume after WAN drop — log shipping recovers automatically when the share is reachable again

#### Interview Q&A

**Q:** When would you choose Log Shipping over Availability Groups?

> Log Shipping when: the secondary is in a remote location with unreliable connectivity, I need cross-domain support without complex Kerberos setup, I'm on Standard Edition and need DR, or I'm doing a one-time migration. AG when: I need automatic failover, zero data loss (sync commit), readable secondaries for reporting, or an AG listener for transparent client reconnection.

**Q:** How do you minimize downtime during a log shipping failover?

> Pre-stage: schedule the log backup frequency as low as practical (1 minute). Before failover, take a final tail-log backup on the primary (WITH NORECOVERY) and apply it to the secondary. Then restore WITH RECOVERY — the secondary is caught up to the last transaction. Total downtime is typically under 2 minutes: 30 seconds for the final log backup, a few seconds to apply it, and 30 seconds for the RESTORE WITH RECOVERY.

**Q:** What breaks a log shipping chain?

> Any restore of a non-contiguous backup, a full backup restored on the secondary that doesn't align with the current LSN, or a manual transaction log backup on the primary that breaks the log sequence without being shipped to the secondary. Also: running `RESTORE LOG WITH RECOVERY` on the secondary without planning for the failover.

The XYZ JD states HA/DR solutions must work *"across multiple data centers"* covering Denmark, Faroe Islands, Greenland, and Germany. This introduces challenges you don't see in a single-DC setup.

### Latency Budgeting for Synchronous Replication

**Synchronous commit requires a round trip between data centers for every transaction:**
```
Application → Primary (write log) → Secondary (hardened) → Primary (commit) → Application
```

Each 1 ms of network latency adds ~1 ms to every write transaction. At 10 ms latency (typical Denmark-Germany), writes are 10x slower than local.

```text
Latency targets for sync commit:
  < 1 ms  → Excellent (same DC)
  1-5 ms  → Good (same campus / metro)
  5-10 ms → Marginal (test carefully)
  > 10 ms → Use async commit instead
```

**For XYZ's geography:**
| Route | Est. Latency | Sync Viable? |
|-------|-------------|-------------|
| DC1 ↔ DC2 (same country) | 1-3 ms | Yes |
| Denmark ↔ Germany | 10-20 ms | Async only |
| Denmark ↔ Faroe Islands | 30-50 ms | Async only |
| Denmark ↔ Greenland | 80-150 ms | Async only |

### Multi-Site Cluster Design

When nodes are in different data centers, the cluster must handle network partitions:

**Preferred architecture:**
```
Data Center A (Primary)          Data Center B (DR)
┌─────────────────────┐          ┌─────────────────────┐
│ SQL Node 1 (Sync)   │ ← WAN → │ SQL Node 2 (Async)  │
│ File Share Witness  │          │                     │
│ (DC A or DC C)      │          │                     │
└─────────────────────┘          └─────────────────────┘
```

**Cross-DC quorum best practices:**
- Use File Share Witness in a THIRD location (cloud, small office) — not in either DC
- If witness is in same DC as primary, primary DC loss takes quorum down
- Consider Azure-based witness for cloud-integrated environments

### Read Scale-Out with Remote Replicas

Secondary replicas in remote DCs can serve read-only traffic — valuable for XYZ's reporting needs:

```sql
-- Configure remote replica for read-only access
ALTER AVAILABILITY GROUP [XYZAG]
MODIFY REPLICA ON N'SQL_DR' WITH
    (SECONDARY_ROLE (ALLOW_CONNECTIONS = READ_ONLY));

-- Application connection string hints:
-- Read/write: Server=AGListener; Database=SalesDB;
-- Read-only:  Server=AGListener; Database=SalesDB; ApplicationIntent=ReadOnly;
```

### Failover Orchestration Across Geo-Distributed Sites

A cross-DC failover is NOT the same as same-DC:

| Consideration | Same DC | Cross DC |
|---------------|---------|----------|
| Network DNS | Immediate | TTL propagation delay (minutes) |
| Application connections | Connection pool reconnects | Connection strings may need update |
| Active Directory | Same domain controller | DC availability across sites |
| File paths | Same paths | Different paths (replica must use same or MOVE) |
| Witness | Local | Cross-DC or cloud witness |

### Monitoring Cross-DC Replication

```sql
-- Check synchronization lag across all replicas
SELECT replica_server_name,
       DB_NAME(database_id) AS database_name,
       synchronization_state_desc,
       log_send_queue_size AS send_queue_kb,
       log_send_rate AS send_rate_kb_sec,
       redo_queue_size AS redo_queue_kb,
       redo_rate AS redo_rate_kb_sec,
       last_sent_time,
       last_received_time,
       last_redone_time,
       DATEDIFF(SECOND, last_redone_time, GETDATE()) AS redo_lag_seconds
FROM sys.dm_hadr_database_replica_states s
JOIN sys.availability_replicas ar ON s.replica_id = ar.replica_id;

-- Alert if redo queue grows (DR replica falling behind)
-- Redo queue > 100 MB for async replica = investigate
-- Redo queue > 1 GB for async replica = urgent
```

### DNS Propagation Considerations

After a cross-DC failover, clients using the AG listener may still connect to the old (failed) primary:

```text
Problem:
  AG Listener DNS TTL = 10 minutes (default)
  After failover: clients with cached DNS still try old IP
  Result: 10 minutes of failed connections for some clients

Solution:
  Set AG Listener DNS TTL to 60 seconds or lower
  Pre-warm DNS cache on critical application servers
  Use multiple A records with low TTL
```

### Cross-DC DR Testing Strategy

Testing DR across data centers is harder than same-DC:

1. **Tabletop test** (quarterly) — walk through the runbook without actually failing over
2. **Partial test** (bi-annual) — fail over a single non-critical database
3. **Full test** (annual) — simulate complete DC loss, fail over all critical databases
4. **Validation** — run DBCC CHECKDB, compare row counts, test application E2E

> [!tip]
> In the interview, mention that DR testing is not just a technical exercise — it requires coordination with application teams, infrastructure teams, and business stakeholders. Define success criteria before the test.

### Interview Q&A for Cross-DC

**Q:** Your primary data center goes offline. The DR site has a 20 ms latency link. How do you handle the failover?

> Since we use async commit for the DR site, I would do a forced failover — some data loss is possible depending on what wasn't sent yet. I'd run the failover using `FORCE_FAILOVER_ALLOW_DATA_LOSS`, verify data consistency, and redirect application connections to the listener. Post-failover, I'd start capturing baseline metrics on the DR node, check that logins and jobs are in place, and initiate communication about the data loss window. When primary comes back, I'd set up reverse sync and plan a controlled failback.

**Q:** How do you design an AG that spans three geographic regions?

> For a three-site design, I'd use: synchronous commit for the local secondary (HA, same DC), asynchronous commit for the DR site (DR, different region), and a third async replica for reporting or additional DR (if needed). The quorum would include a file share witness in a separate location (possibly Azure) to avoid split-brain. I'd configure the DR replica as readable for reporting workloads. The listener would point to all replicas. I'd also plan for DNS propagation delays after cross-region failover.
```
