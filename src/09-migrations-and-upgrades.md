---
title: Migrations & Upgrades
order: 10
icon: 🚀
---

## Key Concepts

The XYZ JD explicitly calls out *"planning and executing migrations, upgrades and technical improvement projects across critical platforms."* This is a project-delivery skill on top of your technical DBA knowledge. Interviewers want to know you can lead a migration without breaking production.

### Upgrade vs Migration — Know the Difference

| Upgrade | Migration |
|---------|-----------|
| SQL Server 2016 → 2022 on same hardware | Move from on-prem to Azure SQL |
| Same server, newer version | Different server, different platform |
| Typically backup/restore or in-place | Requires more planning (compatibility, networking) |
| Lower risk profile | Higher risk, more unknowns |

### End-of-Support Timeline (cite this in interviews)

| Version | EOL Date | Risk |
|---------|----------|------|
| SQL Server 2012 | July 12, 2022 | Extended Security Updates only |
| SQL Server 2014 | July 9, 2024 | Out of support — urgent |
| SQL Server 2016 | July 14, 2026 | Extended Security Updates available — plan now |
| SQL Server 2019 | January 7, 2030 | Mainstream support |
| SQL Server 2022 | January 11, 2033 | Current — recommended |

### Migration Methodology — The DMA-Driven Approach

<svg viewBox="0 0 720 230" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;margin:16px 0;">
  <rect width="720" height="230" rx="8" fill="var(--bg-secondary,#f6f8fa)" stroke="var(--border,#d0d7de)" stroke-width="1"/>
  <text x="360" y="20" text-anchor="middle" font-family="Inter,sans-serif" font-size="13" font-weight="700">Migration Methodology — 5 Phases</text>
  <!-- Phase 1 -->
  <rect x="15" y="35" width="130" height="170" rx="6" fill="#ddf4ff" stroke="#0969da" stroke-width="1.5"/>
  <rect x="15" y="35" width="130" height="22" rx="6" fill="#0969da"/>
  <rect x="15" y="51" width="130" height="6" fill="#0969da"/>
  <text x="80" y="51" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" font-weight="700" fill="#fff">Phase 1</text>
  <text x="80" y="68" text-anchor="middle" font-family="Inter,sans-serif" font-size="10" font-weight="600" fill="#0550ae">Discovery</text>
  <text x="22" y="84" font-family="Inter,sans-serif" font-size="8" fill="#1f2328">• Run DMA assessment</text>
  <text x="22" y="98" font-family="Inter,sans-serif" font-size="8" fill="#1f2328">• Inventory instances</text>
  <text x="22" y="112" font-family="Inter,sans-serif" font-size="8" fill="#1f2328">• Document deps</text>
  <text x="22" y="126" font-family="Inter,sans-serif" font-size="8" fill="#1f2328">  (apps, jobs, SSIS)</text>
  <text x="22" y="140" font-family="Inter,sans-serif" font-size="8" fill="#1f2328">• Identify blockers</text>
  <text x="80" y="195" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" fill="#8b949e">2 days</text>
  <!-- Arrow -->
  <line x1="145" y1="120" x2="170" y2="120" stroke="#8b949e" stroke-width="1.5" marker-end="url(#bt-arrow)"/>
  <!-- Phase 2 -->
  <rect x="175" y="35" width="130" height="170" rx="6" fill="#fff8c5" stroke="#d29922" stroke-width="1.5"/>
  <rect x="175" y="35" width="130" height="22" rx="6" fill="#d29922"/>
  <rect x="175" y="51" width="130" height="6" fill="#d29922"/>
  <text x="240" y="51" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" font-weight="700" fill="#fff">Phase 2</text>
  <text x="240" y="68" text-anchor="middle" font-family="Inter,sans-serif" font-size="10" font-weight="600" fill="#7a5e00">Planning</text>
  <text x="182" y="84" font-family="Inter,sans-serif" font-size="8" fill="#1f2328">• Choose target</text>
  <text x="182" y="98" font-family="Inter,sans-serif" font-size="8" fill="#1f2328">• Cutover window</text>
  <text x="182" y="112" font-family="Inter,sans-serif" font-size="8" fill="#1f2328">• Rollback criteria</text>
  <text x="182" y="126" font-family="Inter,sans-serif" font-size="8" fill="#1f2328">• Plan logins, jobs,</text>
  <text x="182" y="140" font-family="Inter,sans-serif" font-size="8" fill="#1f2328">  linked servers</text>
  <text x="182" y="154" font-family="Inter,sans-serif" font-size="8" fill="#1f2328">• Stakeholder approval</text>
  <text x="240" y="195" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" fill="#8b949e">1 week</text>
  <!-- Arrow -->
  <line x1="305" y1="120" x2="330" y2="120" stroke="#8b949e" stroke-width="1.5" marker-end="url(#bt-arrow)"/>
  <!-- Phase 3 -->
  <rect x="335" y="35" width="130" height="170" rx="6" fill="#dafbe1" stroke="#1a7f37" stroke-width="1.5"/>
  <rect x="335" y="35" width="130" height="22" rx="6" fill="#1a7f37"/>
  <rect x="335" y="51" width="130" height="6" fill="#1a7f37"/>
  <text x="400" y="51" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" font-weight="700" fill="#fff">Phase 3</text>
  <text x="400" y="68" text-anchor="middle" font-family="Inter,sans-serif" font-size="10" font-weight="600" fill="#116329">Testing</text>
  <text x="342" y="84" font-family="Inter,sans-serif" font-size="8" fill="#1f2328">• Non-prod migration</text>
  <text x="342" y="98" font-family="Inter,sans-serif" font-size="8" fill="#1f2328">• App regression tests</text>
  <text x="342" y="112" font-family="Inter,sans-serif" font-size="8" fill="#1f2328">• Performance baseline</text>
  <text x="342" y="126" font-family="Inter,sans-serif" font-size="8" fill="#1f2328">• Document runbook</text>
  <text x="400" y="195" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" fill="#8b949e">2 weeks</text>
  <!-- Arrow -->
  <line x1="465" y1="120" x2="490" y2="120" stroke="#8b949e" stroke-width="1.5" marker-end="url(#bt-arrow)"/>
  <!-- Phase 4 -->
  <rect x="495" y="35" width="130" height="170" rx="6" fill="#ffeef0" stroke="#cf222e" stroke-width="1.5"/>
  <rect x="495" y="35" width="130" height="22" rx="6" fill="#cf222e"/>
  <rect x="495" y="51" width="130" height="6" fill="#cf222e"/>
  <text x="560" y="51" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" font-weight="700" fill="#fff">Phase 4</text>
  <text x="560" y="68" text-anchor="middle" font-family="Inter,sans-serif" font-size="10" font-weight="600" fill="#cf222e">Cutover</text>
  <text x="502" y="84" font-family="Inter,sans-serif" font-size="8" fill="#1f2328">• Final backup</text>
  <text x="502" y="98" font-family="Inter,sans-serif" font-size="8" fill="#1f2328">• Migrate data</text>
  <text x="502" y="112" font-family="Inter,sans-serif" font-size="8" fill="#1f2328">• Redirect connections</text>
  <text x="502" y="126" font-family="Inter,sans-serif" font-size="8" fill="#1f2328">• Validate integrity</text>
  <text x="502" y="140" font-family="Inter,sans-serif" font-size="8" fill="#1f2328">• Monitor apps</text>
  <text x="560" y="195" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" fill="#8b949e">Weekend</text>
  <!-- Arrow -->
  <line x1="625" y1="120" x2="650" y2="120" stroke="#8b949e" stroke-width="1.5" marker-end="url(#bt-arrow)"/>
  <!-- Phase 5 -->
  <rect x="655" y="35" width="50" height="170" rx="6" fill="#ddf4ff" stroke="#0969da" stroke-width="1.5"/>
  <rect x="655" y="35" width="50" height="22" rx="6" fill="#0969da"/>
  <rect x="655" y="51" width="50" height="6" fill="#0969da"/>
  <text x="680" y="51" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" font-weight="700" fill="#fff">P5</text>
  <text x="680" y="70" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" font-weight="600" fill="#0550ae">Post</text>
  <text x="680" y="82" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" font-weight="600" fill="#0550ae">Mig</text>
  <text x="662" y="98" font-family="Inter,sans-serif" font-size="7" fill="#1f2328">Monitor</text>
  <text x="662" y="112" font-family="Inter,sans-serif" font-size="7" fill="#1f2328">Review</text>
  <text x="662" y="126" font-family="Inter,sans-serif" font-size="7" fill="#1f2328">Learn</text>
  <text x="680" y="195" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" fill="#8b949e">Ongoing</text>
</svg>
│  ├─ Compare performance baselines                │
│  ├─ Check Query Store for regressions            │
│  ├─ Review error logs and event logs             │
│  └─ Document lessons learned                     │
└──────────────────────────────────────────────────┘
```

### Data Migration Assistant (DMA) Deep Dive

DMA is the single most important tool for migration planning:

```text
DMA assesses:
✓ Compatibility issues (breaking changes, deprecated features)
✓ Behavior changes (different defaults, different cardinality estimator)
✓ Feature parity (does the target support what the app needs?)
✓ Migration recommendations (Azure SQL DB vs MI vs VM)
✓ Performance baseline (captures query metrics before migration)
```

**Key DMA checks before any upgrade:**

| Check | Why It Matters |
|-------|---------------|
| Deprecated features | `sp_addtype`, `SET ROWCOUNT` in DELETE, `WITH APPEND` — will break in future |
| `COMPATIBILITY_LEVEL` | Must be ≤ target version; new QE may change plans |
| Cross-database queries | Not supported in Azure SQL DB |
| Linked servers | Not supported in Azure SQL DB; limited in MI |
| SQL Agent jobs | Need review — many use deprecated features |
| CLR assemblies | Need recompilation for new server |
| Service Broker | Cross-DB not supported in Azure SQL DB |
| Full-text search | Check compatibility with target |

```sql
-- Check current compatibility level
SELECT name, compatibility_level
FROM sys.databases;

-- Enable new cardinality estimator (SQL Server 2022)
ALTER DATABASE MyDB SET COMPATIBILITY_LEVEL = 160;

-- Check for feature usage that may be deprecated
SELECT OBJECT_NAME(object_id) AS object_name,
       name AS feature_name
FROM sys.dm_db_persisted_sku_features;
```

### Side-by-Side vs In-Place Upgrade

| | Side-by-Side | In-Place |
|---|---|---|
| New hardware | Install SQL on new server | Same server |
| Rollback | Point to old server | Restore from backup |
| Testing | Full parallel testing | Limited testing |
| Downtime | Minutes (DNS switch) | Hours (install + migrate) |
| Risk | Low — easy rollback | Higher — all-in-one |
| XYZ interview answer | "For critical systems, I prefer side-by-side" | "For non-critical dev/test, in-place is acceptable" |

### Cutover Plan Template (Answer This in Interviews)

A well-structured cutover plan covers:

```
1. Pre-cutover checklist (48h before)
   └─ Final backup, DBCC CHECKDB, application sign-off

2. Cutover window (T-0)
   └─ Set database to SINGLE_USER
   └─ Take tail-log backup
   └─ Run DMA on final backup
   └─ Restore/migrate to target
   └─ Validate data, permissions, jobs
   └─ Open database for testing

3. Validation (T+1h)
   └─ Application team runs smoke tests
   └─ Performance baseline comparison
   └─ Error log review

4. Rollback triggers (prepare for failure)
   └─ Any data integrity issue → rollback
   └─ >30% query regression → rollback
   └─ Application blocking issue → rollback
   └─ Rollback means: point DNS back to old server,
       restore tail-log backup, notify stakeholders
```

### Rolling Upgrades — Upgrading SQL Server with HADR Configured

When you have Always On Availability Groups, you can perform a **rolling upgrade** — upgrade the secondaries first while the primary continues serving traffic, then fail over. This turns an hours-long outage into a seconds-long blip.

#### The Real-Life Scenario

You manage a business-critical SQL Server platform at an enterprise retail company operating 24/7 across multiple data centers. You are running SQL Server 2016, and its extended support ends on **July 14, 2026** — you need to upgrade to SQL Server 2022. This platform handles constant storefront transactions and overnight warehouse batches, so you cannot afford a 3-hour downtime window.

#### Step-by-Step Process

**Step 1: Assess & Prepare.** Before the upgrade, run Microsoft's **Data Migration Assistant (DMA)** against your current databases to identify deprecated features or breaking changes that would fail on SQL Server 2022.

```text
DMA assessments to run:
  ✓ Compatibility issues (breaking changes, deprecated features)
  ✓ Behavior changes (different defaults, CE differences)
  ✓ Feature parity (does SQL 2022 support what the app needs?)
  ✓ Performance baseline for post-upgrade comparison
```

**Step 2: Upgrade the Secondaries First.** During your approved window, install SQL Server 2022 on the secondary replicas. The primary replica is completely untouched — production traffic continues uninterrupted.

**Step 3: Verify Synchronization.** After the secondary servers reboot and come back online, confirm they have reconnected to the AG and data synchronization is fully caught up.

```sql
-- Verify synchronization before failover
SELECT database_name, synchronization_state_desc,
       synchronization_health_desc, last_redone_time
FROM sys.dm_hadr_database_replica_states
WHERE is_local = 1;
-- Wait for synchronization_state_desc = 'SYNCHRONIZED'
```

**Step 4: Manual Failover.** Trigger a manual failover. The newly upgraded secondary becomes the new primary. This is the *only* downtime the application experiences — typically seconds.

```sql
-- Manual failover (run on the target secondary)
ALTER AVAILABILITY GROUP [YourAG] FAILOVER;
```

**Step 5: Upgrade the Old Primary.** Now that the original primary is a secondary replica, apply the SQL Server 2022 upgrade to it. It rejoins the AG automatically after the upgrade completes.

**Step 6: Update Compatibility Level.** Once all nodes are upgraded, update the Database Compatibility Level so the database can use the SQL Server 2022 query optimizer and features.

```sql
-- Enable new features
ALTER DATABASE MyDB SET COMPATIBILITY_LEVEL = 160;
```

#### Key Tools and DMVs

| Tool / DMV | Purpose |
|------------|---------|
| Data Migration Assistant (DMA) | Assess databases for compatibility issues before upgrading |
| Always On Availability Groups | Enables rolling upgrade strategy (upgrade secondary first) |
| `sys.dm_hadr_database_replica_states` | Verify `synchronization_state_desc = SYNCHRONIZED` before failover |
| `ALTER AVAILABILITY GROUP ... FAILOVER` | Manual controlled failover to upgraded secondary |

#### What a Junior DBA Might Misunderstand

- **Upgrading the primary first** — A junior might think "upgrade the most important server first." Running setup on the primary takes the entire 24/7 operation down immediately.
- **Forgetting the compatibility level** — They upgrade the engine to 2022 but leave `COMPATIBILITY_LEVEL` at 2016, meaning the business gets almost none of the performance benefits they just paid for.
- **No pre-assessment** — They skip DMA and discover breaking changes only after the upgrade is underway, forcing a rollback.

#### Upgrade-Specific Risks for Always On Environments

```text
Key risks:
- Different versions in AG during upgrade (temporary by design — supported by Microsoft)
- Feature differences between versions during the rolling window
- Failover may fail if AG configuration changed between versions
- Kernel-mode DMA drivers may need updating between major versions
```

#### Interview-Ready Answer

> *"When upgrading a business-critical SQL Server environment configured with HADR, such as Always On Availability Groups, I use a rolling upgrade strategy to ensure minimal downtime. First, I prepare by running the Data Migration Assistant to catch any breaking code changes. During the execution window, I upgrade the secondary replicas first while the primary continues serving production traffic. Once the secondaries are upgraded and I confirm via `sys.dm_hadr_database_replica_states` that they are fully synchronized, I perform a manual failover. The upgraded secondary takes over as the new primary, resulting in only a momentary blip for the application. Finally, I upgrade the original primary and raise the database compatibility level to 160. This approach protects our 24/7 uptime SLAs while modernizing the infrastructure."*

### Azure Migration Paths — Decision Tree

```
Is app compatible with Azure SQL DB?
    ├── YES → Azure SQL Database (PaaS, lowest ops overhead)
    │
    └── NO → Does app need near-100% SQL Server compatibility?
            ├── YES → Azure SQL Managed Instance
            │
            └── NO → Need full OS control?
                    ├── YES → SQL Server on Azure VM
                    └── NO → Re-evaluate Managed Instance
```

### Rollback Strategy — The Safety Net

Every migration plan must answer: **"How do we undo this?"**

```text
In-place upgrade rollback:
  → Restore from pre-upgrade full backup
  → Takes time (database must be restored)
  → Loss of any data written after upgrade started

Side-by-side rollback:
  → Point application connection string to old server
  → Near-instant
  → Old server still running with all data

Azure migration rollback:
  → For Azure SQL DB: point app back to on-prem
  → For MI: restore from pre-migration backup on-prem
  → For VM: old VM or on-prem still available
```

---

## Interview Q&A

**Q:** Walk me through how you would upgrade SQL Server 2016 to 2022 for a business-critical OLTP database.

> I start with DMA to identify blocking issues and compatibility concerns. Then I plan a side-by-side migration — install SQL 2022 on new hardware, restore a backup from production to test, run DBCC CHECKDB, test the application against it, and compare performance baselines using Query Store. For cutover: final backup on old server, restore on new server with tail-log backup, redirect the application connection string (or AG listener), validate, and keep the old server available for 48 hours as rollback. Post-migration, I monitor Query Store for plan regressions for a full business cycle.

**Q:** Your client is still on SQL Server 2014. How do you convince them to upgrade?

> I present the risk in business terms. SQL Server 2014 went end-of-support on July 9, 2024 — no security patches, no bug fixes. This means compliance risk, audit findings, and vulnerability to CVEs. I frame the upgrade as risk reduction, not a feature upgrade. I highlight that SQL Server 2022 delivers IntelliQuery, improved Query Store, and better Azure integration as business benefits. I offer a phased approach: test in dev, prove stability, then plan production with a clear rollback path.

**Q:** What's the first thing you check after a migration?

> I validate the data first — DBCC CHECKDB and compare row counts on critical tables. Then I check the application — can it connect? Are logins synced? Are jobs running? Then performance — I compare top 10 queries from before and after using Query Store. I also check the error log for any migration-related issues. I don't sign off until the application team confirms the system works from their perspective.

---

## T-SQL Quick Reference

```sql
-- DMA assessment (run in PowerShell or CMD)
C:\DMA\DmaAnalysis.exe /AssessmentName="XYZUpgrade"
    /TargetPlatform="SqlServer2022"
    /TargetServerName="ProductionServer"
    /AssessmentDatabases="SalesDB,InventoryDB"

-- Check deprecated features in current instance
SELECT * FROM sys.dm_os_performance_counters
WHERE counter_name LIKE '%deprecated%';

-- Check if backup can restore on target version
RESTORE VERIFYONLY FROM DISK = 'E:\Backups\MyDB.bak'
WITH CHECKSUM;

-- Post-migration: compare query performance
SELECT qsq.query_id,
       MAX(CASE WHEN rsi.start_time < '2026-06-01' THEN rs.avg_duration END) AS before_migration,
       MAX(CASE WHEN rsi.start_time >= '2026-06-01' THEN rs.avg_duration END) AS after_migration
FROM sys.query_store_query qsq
JOIN sys.query_store_plan qsp ON qsq.query_id = qsp.query_id
JOIN sys.query_store_runtime_stats rs ON qsp.plan_id = rs.plan_id
JOIN sys.query_store_runtime_stats_interval rsi
    ON rs.runtime_stats_interval_id = rsi.runtime_stats_interval_id
GROUP BY qsq.query_id
HAVING MAX(CASE WHEN rsi.start_time < '2026-06-01' THEN rs.avg_duration END) >
       MAX(CASE WHEN rsi.start_time >= '2026-06-01' THEN rs.avg_duration END) * 1.2;
```

### Recommended Reading

| Resource | Why |
|----------|-----|
| [Microsoft DMA Docs](https://learn.microsoft.com/en-us/data-migration/) | Official migration tool documentation |
| [Brent Ozar — Upgrading SQL Server](https://www.brentozar.com/archive/2022/11/upgrading-to-sql-server-2022/) | Practical upgrade advice |
| [SQLSkills — Upgrade Checklist](https://www.sqlskills.com/blogs/paul/a-sql-server-dbas-checklist-for-sql-server-version-upgrades/) | Paul Randal's authoritative checklist |
