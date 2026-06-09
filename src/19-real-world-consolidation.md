---
title: Real-World Capstone — Database Consolidation
order: 21
icon: 🏆
---

## Project Summary: SmoMigrator — Automated SQL Server Consolidation

### What This Project Does

A .NET 8.0 console application that migrates database objects (tables, views, stored procedures, functions) and their data between SQL Server instances — purpose-built for consolidating multiple legacy databases into a modern, unified platform.

### Key Capabilities

- **Full migration**: Scripts DDL from source using SMO, rewrites identifiers (database/schema names), bulk-copies data via `SqlBulkCopy`, validates with row-count and checksum comparison
- **Incremental sync**: MERGE/UPSERT mode for ongoing synchronization
- **Resume capability**: Persists migration status per object — interrupted runs pick up where they left off
- **Stale-mapping cleanup**: Validates every mapping entry against actual source objects before starting
- **Identifier rewriting**: Sophisticated regex-based rewriting of all database and schema name permutations in SMO-scripted DDL
- **SP stub+ALTER pattern**: Creates stored procedures as stubs first, then ALTERs — preserves dependencies
- **Computed column handling**: Automatically excludes computed columns from data copy
- **Resilient**: Polly retry policies (3x for queries, 2x for bulk copy), graceful cancellation, per-object error handling
- **Real-time progress**: SqlBulkCopy `SqlRowsCopied` event with ETA, rows/sec, and percentage
- **Dual data mover**: Cross-server via `SqlBulkCopy` or same-server via `INSERT...SELECT`
- **Config-driven**: `appsettings.json` + database-driven mapping tables

### Architecture Layers

```
Program.cs → MigrationOrchestrator → DdlScripter (SMO) → StreamingDataMover (SqlBulkCopy) → DataValidationService
                     │                       │
                     └── MigrationLog ────────┘  (resume + audit trail)
```

---

## The Real Story — What Actually Happened

*This is a first-person narrative of a real database consolidation project. Every category from this tutorial played a role. Read this to see how it all fits together in production.*

### The Situation

I walked into a XYZ-like environment: 23 SQL Server instances, over 300 databases, some dating back to SQL Server 2008 R2. Four different business units, each running their own databases, with their own naming conventions, backup schedules (or lack thereof), security models, and index maintenance strategies (also lack thereof). The mandate was clear: consolidate into a modern, resilient, single-platform architecture.

Here is how every chapter of this tutorial came into play.

### 00 — Job Description & Role Understanding

The **first thing** I did was align with the business. Why were we consolidating? What was the RPO and RTO for the consolidated platform? Who were the stakeholders — infrastructure, application teams, business owners? I documented the current state: 23 instances, 308 databases, ~12 TB total data, and a patchwork of HA solutions (some with log shipping, some with mirroring, most with nothing).

My mandate: reduce operational overhead, improve recoverability, and lay the foundation for Azure migration. The consolidated target would be SQL Server 2022 Enterprise Edition, Always On across two data centers, with consistent backup, monitoring, and automation.

### 01 — 24/7 Enterprise Operations

We had 24/7 stores depending on this data. There was no "maintenance weekend." Every migration window had to be planned around the retail calendar — no consolidation work during Christmas, Easter, or summer sales. I built a migration calendar that accounted for:

- Store operating hours (most stores open 7:00–22:00)
- Batch processing windows (02:00–05:00 for inventory feeds, pricing updates)
- Month-end and quarter-end reporting loads
- The annual inventory count (all hands on deck, no changes)

**What this taught me:** A senior DBA plans around the business, not the other way around. If you propose a migration window during a store sale, you haven't understood the role.

### 02 — Performance Tuning & Troubleshooting

During the consolidation, I discovered that several legacy databases had **crippling performance problems** that had been masked by low traffic. When I moved them to the faster consolidated server, the problems got worse — not better — because the queries were now contending for resources with other databases.

I spent two weeks using sp_WhoIsActive and Query Store to identify the worst offenders. One stored procedure from a legacy reporting database was doing a 12-table join with no useful indexes — and it was running every 15 minutes. On its own instance, it was slow. On the consolidated server, it was blocking order-entry queries from a completely different application.

This led to the first rule of consolidation: **you don't just move databases — you fix them first.**

**The execution plan that saved a weekend:**

Two weeks after Wave 2, the batch processing pipeline slowed to a crawl. An overnight job that normally finished in 45 minutes was still running after 4 hours. The stores couldn't open their daily inventory reports.

I connected to the consolidated server and captured the actual plan for the stuck query using `SET STATISTICS XML ON`. The plan revealed three problems stacked on top of each other:

1. **Key Lookup avalanche** — A nonclustered index on `OrderDate` was used for the WHERE clause, but the SELECT grabbed 14 columns not in the index. The plan showed 1.2 million key lookups. Estimated cost was "only" 32%, but each lookup was a random I/O against the clustered index.

2. **Implicit conversion** — The `StoreId` parameter was being passed as NVARCHAR from the application layer, but the column was VARCHAR(10). The plan showed `CONVERT_IMPLICIT` on every seek predicate — SQL Server was scanning the index instead of seeking. The estimated vs actual rows ratio was 1:48,000 for that operator.

3. **Spill to tempdb** — A Hash Match join between the 1.2 million row result and a 400,000 row product table exceeded its memory grant by 2×. The spill wrote 800 MB to tempdb. The plan warning icon was unmistakable.

The fixes:

```sql
-- Fix 1: Covering index (eliminates 1.2M key lookups)
CREATE INDEX IX_Orders_OrderDate_INC ON dbo.Orders(OrderDate)
INCLUDE (StoreId, ProductId, Quantity, UnitPrice, TotalAmount,
         CustomerName, PaymentMethod, OrderStatus, CreatedBy);

-- Fix 2: Align parameter data type — changed the application call
-- from SqlParameter with DbType.String (= NVARCHAR) to DbType.AnsiString (= VARCHAR)
-- Result: Index Seek instead of Index Scan, estimated rows matched actual rows

-- Fix 3: Updated statistics on both joined tables (spill cause)
UPDATE STATISTICS dbo.Orders WITH FULLSCAN;
UPDATE STATISTICS dbo.Products WITH FULLSCAN;
```

The covering index alone eliminated the key lookups, reducing total query I/O by 70%. The type alignment turned the scan into a seek (estimated 24 rows vs actual 31 — finally accurate). With accurate cardinality, the optimizer chose a Merge Join instead of Hash Match, eliminating the spill entirely.

**Before:** 4 hours 23 minutes. **After:** 22 minutes. **Total fix time:** 45 minutes (15 to capture and read the plan, 20 to apply changes, 10 to test).

This is why I always look at the **actual** plan (not estimated), check **estimated vs actual rows** at every operator, and never trust percentage costs alone. A "32%" Key Lookup with 1.2 million executions is infinitely more expensive than a "45%" Index Scan that runs once.

**The In-Memory OLTP win that the junior DBA didn't believe:**

Six months after go-live, the business launched a real-time inventory dashboard — every store location needed to see stock levels updated within seconds of a sale. The application team built it with a polling pattern: each of 200+ stores queried the consolidated server every 5 seconds for their location's top-selling items. At 40 queries per second, the disk-based `Inventory` table started showing contention — `PAGELATCH_EX` waits on the hot page where the stock-level column lived. The SELECT queries were quick (sub-millisecond), but with 40 concurrent readers and 5-10 concurrent writers (from point-of-sale systems), lock-free access wasn't possible on a disk-based table.

A junior on the team suggested increasing MAXDOP and adding more indexes. I suggested something different: move the `Inventory` table to In-Memory OLTP.

The migration took 45 minutes:

```sql
-- Step 1: Add MEMORY_OPTIMIZED_DATA filegroup
ALTER DATABASE ConsolidatedDB
ADD FILEGROUP InMem CONTAINS MEMORY_OPTIMIZED_DATA;
ALTER DATABASE ConsolidatedDB
ADD FILE (NAME = 'InMemData',
          FILENAME = 'L:\Data\InMemData')
TO FILEGROUP InMem;

-- Step 2: Create memory-optimized Inventory table
CREATE TABLE dbo.Inventory_Mem (
    StoreID    INT NOT NULL,
    ProductID  INT NOT NULL,
    StockLevel INT NOT NULL,
    LastUpdated DATETIME2 NOT NULL,
    CONSTRAINT PK_Inventory_Mem
        PRIMARY KEY NONCLUSTERED HASH (StoreID, ProductID)
        WITH (BUCKET_COUNT = 2000000)
) WITH (MEMORY_OPTIMIZED = ON, DURABILITY = SCHEMA_AND_DATA);
GO

-- Step 3: Seed from disk-based table (30 sec for 1.2M rows)
INSERT INTO dbo.Inventory_Mem (StoreID, ProductID, StockLevel, LastUpdated)
SELECT StoreID, ProductID, StockLevel, LastUpdated FROM dbo.Inventory;
GO

-- Step 4: Natively compiled stock update proc
CREATE PROCEDURE dbo.usp_UpdateStockLevel
    @StoreID INT, @ProductID INT, @NewLevel INT
WITH NATIVE_COMPILATION, SCHEMABINDING
AS
BEGIN ATOMIC WITH
    (TRANSACTION ISOLATION LEVEL = SNAPSHOT, LANGUAGE = N'us_english')
    UPDATE dbo.Inventory_Mem
    SET StockLevel = @NewLevel, LastUpdated = SYSDATETIME()
    WHERE StoreID = @StoreID AND ProductID = @ProductID;
END;
GO

-- Step 5: Switch the application to read from Inventory_Mem
-- (ProductCatalog view redirects queries)
CREATE OR ALTER VIEW dbo.Inventory_Current AS
SELECT StoreID, ProductID, StockLevel, LastUpdated FROM dbo.Inventory_Mem;
```

**The result:** `PAGELATCH_EX` waits dropped to zero. The 40 queries per second from 200 stores ran with **no contention, no blocking, no latch waits**. The natively compiled update proc completed in under 5 microseconds per call — compared to ~50µs for the disk-based version. The junior DBA's reaction: "I didn't know SQL Server could do that."

**What the junior missed:** In-Memory OLTP uses an optimistic, latch-free concurrency model. Readers and writers don't block each other because every transaction gets its own snapshot-consistent version. The same optimization that makes it fast also makes it scale linearly with CPU cores — adding more stores (and more concurrent queries) wouldn't cause the contention curve we'd see with a disk-based B-tree.

**But this wasn't a silver bullet.** We kept historical inventory data on disk with a columnstore index (for trend analysis and reporting), and only moved the hot "current stock level" table to memory. The total In-Memory OLTP footprint was ~400 MB — well within the server's 512 GB budget. We used the [transaction performance analysis report](https://learn.microsoft.com/en-us/sql/relational-databases/in-memory-oltp/determining-if-a-table-or-stored-procedure-should-be-ported-to-in-memory-oltp) to verify we were targeting the right table (high contention, many concurrent point lookups and updates).

### 03 — Indexing Deep Dive

During the assessment phase, I ran sp_BlitzIndex on every source database. The findings were alarming:

- Over 40% of indexes had never been used (zero seeks, scans, or lookups since last restart)
- 18 duplicate indexes found across the estate (different names, identical key columns)
- Several tables with 15+ indexes each — the write overhead was hidden because those tables had low transaction volume on their isolated instances

I created a **pre-consolidation index remediation plan**:

1. Dropped all duplicate indexes (reclaiming ~120 GB of disk space)
2. Dropped unused indexes on OLTP tables (reducing write overhead by 30-60%)
3. Added covering indexes for the most expensive queries identified in step 2

**For the consolidated target platform**, I designed a standard index maintenance policy:
- Clustered indexes on ever-increasing narrow keys (IDENTITY/BIGINT)
- Consistent naming convention: `IX_TableName_ColumnName`
- Max 5-8 nonclustered indexes per OLTP table
- Columnstore indexes on reporting tables
- Monthly fragmentation check, reorganize at 5-30%, rebuild if > 30%

### 04 — SQL Server Internals & Storage Engine

The consolidated server had 48 logical cores, 512 GB RAM, and flash storage across two LUNs (data + logs). But the legacy databases came from servers with wildly different storage layouts:

| Source | Data on | Log on | TempDB on |
|--------|---------|--------|----------|
| Instance A | E: (RAID 5) | E: (same volume!) | F: (single file) |
| Instance B | D: (RAID 10) | L: (RAID 1) | T: (4 files) |
| Instance C | C: (OS drive) | C: (OS drive!) | C: (OS drive!) |

I designed the target layout based on internals knowledge:
- **Data files**: 12 evenly-sized files per large database, spread across the data LUN — reduces allocation contention (GAM/SGAM/PFS)
- **Log files**: Single file, pre-sized to expected growth, grown in large chunks (avoid VLF fragmentation)
- **TempDB**: 8 files, equal size, on dedicated fast storage — essential for a consolidated server where dozens of applications share tempdb

**The VLF lesson**: One database had 4,700+ VLFs from years of small autogrowth events. Before migrating, I rebuilt the log — set the size to 50 GB in one step, then shrunk and regrew in a controlled way. Post-consolidation log operations were 3x faster.

### 05 — Production DBA Toolkit

This project was where the First Responder Kit earned its keep:

- **sp_Blitz** — ran on every source instance to catalog misconfigurations (old compatibility levels, disabled Query Store, default MAXDOP of 0 on 48-core servers)
- **sp_BlitzIndex** — the duplicate/unused index analysis guided the entire pre-consolidation cleanup
- **sp_BlitzCache** — identified the 50 most expensive queries across the estate to target performance tuning
- **sp_WhoIsActive** — ran on source instances during peak hours to catalog real-time blocking patterns

**The SmoMigrator tool itself** — built because no off-the-shelf tool met all our needs:
- Required integration with our change management workflow (database-driven mapping tables)
- Had to support schema remapping (three source schemas → one target schema)
- Needed resume capability (we couldn't risk losing 6 hours of migration to a network blip)
- Had to log every object's status for audit and traceability

### 06 — High Availability & Disaster Recovery

The target architecture: **Always On Availability Group** with three replicas:

| Replica | Location | Commit Mode | Role |
|---------|----------|-------------|------|
| Primary | Data Center A | — | Read-write workload |
| Secondary (sync) | Data Center A | Synchronous | HA failover target, readable for reporting |
| Secondary (async) | Data Center B (DR) | Asynchronous | Disaster recovery |

**Cross-DC considerations for consolidation:**
- We calculated latency between DCs at 2.3 ms — acceptable for synchronous commit
- File share witness placed in Data Center C (cloud VM) to maintain quorum if either DC failed
- Listener configured with `MultiSubnetFailover=True` for fast cross-DC failover
- DNS TTL set to 60 seconds (not the default 10 minutes)
- Read-only routing configured so reporting queries hit the sync secondary automatically

**The consolidation changed the DR strategy** from "each instance managed separately" to "critical databases get AG protection, non-critical get log shipping, dev/test get backup-only." We classified all 308 databases into these three tiers during the assessment.

**The log shipping lesson that saved a migration:**

During Wave 4, we were migrating the legacy payroll database — 120 GB, 24x7 critical, no maintenance window longer than 15 minutes. A full backup + restore approach would have required 45+ minutes of downtime. Not acceptable.

I set up log shipping from the source instance to the target:

1. Full backup on source, restored WITH NORECOVERY on target
2. Log shipping configured to ship logs every 5 minutes from source to target
3. Let it run for 48 hours — the secondary stayed within 5 minutes of the primary
4. The night of cutover: final log backup WITH NORECOVERY on source, applied last log on target WITH RECOVERY, updated application connection strings
5. Total downtime: **8 minutes** — 3 for the final log backup, 2 to apply it, 3 for connection string rollout

**Log shipping also became our DR safety net for non-critical databases.** Instead of keeping 180+ low-priority databases in an AG (expensive, complex), we grouped them onto a standalone DR instance with log shipping. The RPO was 15 minutes, RTO about 30 minutes — acceptable for Tier 2 databases. The AG only handled the 120+ critical databases.

The monitoring setup for log shipping was minimal but effective: a SQL Agent alert if the restore latency exceeded 20 minutes, and a weekly report showing the top 10 databases by restore lag.

### 07 — Backup, Restore & Integrity

Before consolidation, backup strategies were chaotic:
- Some databases in Full recovery with 15-minute log backups (correct)
- Others in Simple recovery with weekly full backups only (risky)
- Several had **zero** recent backup history (the job had been failing for weeks, unnoticed)

I designed a **unified backup strategy** for the consolidated platform:

```text
Production OLTP databases (Tier 1):
  Full backup:    Daily at 22:00
  Differential:   Every 4 hours during business
  Log backup:     Every 10 minutes
  Retention:      14 days local, 30 days cloud, 12 monthly archives
  Restore test:   Monthly, automated via Ola Hallengren + custom validation

Reporting databases (Tier 2):
  Full backup:    Daily at 02:00
  Log backup:     Disabled (Simple recovery)
  Retention:      7 days

Dev/Test databases (Tier 3):
  Full backup:    Weekly
  Retention:      14 days
```

Every database was run through DBCC CHECKDB before migration. Two databases had corruption that had gone undetected for months — the legacy instances had no integrity check jobs. We restored them from backup before migrating.

### 08 — Automation & Maintenance

I standardized on **Ola Hallengren's Maintenance Solution** for the consolidated platform:

```sql
-- The exact job schedule used:
Job 1: DatabaseBackup (USER_DATABASES, FULL, 22:00 daily)
Job 2: DatabaseBackup (USER_DATABASES, DIFF, 02:00/06:00/10:00/14:00/18:00)
Job 3: DatabaseBackup (USER_DATABASES, LOG, every 10 min)
Job 4: DatabaseIntegrityCheck (USER_DATABASES, 23:00 daily)
Job 5: IndexOptimize (USER_DATABASES, 01:00 Saturday)
Job 6: CommandLog cleanup (7 day retention)
```

The SmoMigrator tool itself was automated: triggered via SQL Agent job that ran PowerShell `dotnet SmoMigrator.dll --mode initial`, with email notification on completion or failure.

**The moment of truth**: The first full migration of the 12-database Sales suite ran for 4 hours and 17 minutes. At 3 hours 52 minutes, a transient network error killed the bulk copy. Because SmoMigrator had `Resume: true` and persisted every completed object to `MigrationLog`, the second attempt completed in 25 minutes — only re-processing the tables that hadn't finished.

### 09 — Migrations & Upgrades (The Project Itself)

This was the core. The migration methodology I followed:

| Phase | Activity | Duration |
|-------|----------|----------|
| Discovery | DMA assessment on all source instances | 2 days |
| Mapping | Create MigrationMapping entries (308 databases, ~15,000 objects) | 5 days |
| Pre-migration cleanup | Index remediation, corruption repair, log rebuilds | 2 weeks |
| Pilot | Migrate 3 low-risk reporting databases | 3 days |
| Rollout | 5 waves of 50-70 databases each | 6 weeks |
| Validation | DBCC CHECKDB, row-count comparison, application testing | Ongoing |

**The pilot taught us a painful lesson:** One of the "low-risk" reporting databases had a stored procedure using `SELECT * INTO #temp FROM linked_server.remote_db.dbo.table`. The linked server wasn't configured on the target. SmoMigrator's `DdlScripter` correctly scripted the procedure syntax, but the runtime dependency on the linked server caused a failure when the ETL ran that night. We added a **dependency scanning step** to every mapping review after that.

**The identifier rewriter** in SmoMigrator handled a scope I hadn't fully anticipated: some legacy stored procedures referenced `[OldServer].[OldDB].[dbo].[Table]` — three-part names with the old server name baked in. The regex-based rewriter handled these by first normalizing all bracket styles, then replacing the old database name with the new one.

**The rolling upgrade that proved the methodology:**

A year after go-live, we needed to upgrade the consolidated platform from SQL Server 2022 CU2 to CU10. The AG had three replicas — primary in DC-A, sync secondary in DC-A, async secondary in DC-B (DR). With 24/7 store operations and overnight warehouse batches, I could not take the platform offline for hours.

I followed the rolling upgrade playbook:

1. **Assess first.** Ran DMA against every database on the consolidated server. Result: zero blocking issues — the year-old migration had already remediated all deprecated features. DMA reported only informational warnings about trace flags that were no longer needed in SQL Server 2022.

2. **Upgrade the secondaries.** Applied the CU to the sync secondary first (zero impact on production — the primary continued serving all traffic). Rebooted. Verified the secondary rejoined the AG and synchronization reached `SYNCHRONIZED`. Then repeated for the async secondary in DC-B.

3. **Verify synchronization.** Before reaching for the failover switch, I checked `sys.dm_hadr_database_replica_states` to confirm every database on both secondaries was fully caught up — `synchronization_state_desc = 'SYNCHRONIZED'` for the sync replica, `'SYNCHRONIZING'` with near-zero latency for the async.

4. **Manual failover.** I triggered a controlled failover at 03:00 — the lowest traffic point. The failover completed in 8 seconds (AG automatic failover with `REQUIRED_SYNCHRONIZED_SECONDARIES_TO_COMMIT = 1` ensured zero data loss).

5. **Upgrade the old primary.** Now a secondary, the original primary received the CU upgrade. It rejoined the AG automatically after reboot.

6. **Compatibility level.** Since this was a CU upgrade (not a version upgrade), the compatibility level stayed at 160. But I verified with `SELECT name, compatibility_level FROM sys.databases` to confirm no databases had drifted.

**Result:** Zero end-user impact. The only visible effect was a single 8-second failover event in the monitoring dashboard. The overnight warehouse batch ran on schedule. This was the payoff for designing the AG architecture right from the start.

### 10 — Cloud, Azure & Hybrid Infrastructure

The target was on-prem, but we designed with Azure in mind:

- Azure Hybrid Benefit was factored into the licensing cost model
- The consolidated server was configured to be migration-ready for Azure SQL Managed Instance (no cross-DB queries, consistent collation, contained database authentication where possible)
- Azure Backup was evaluated for offsite backup storage (we ended up using a combination of local + Azure blob storage)
- ExpressRoute was already in place between the data center and Azure — hybrid AG replicas are on the roadmap for the next phase

### 11 — Virtualization for DBAs

The consolidated server was a VMware VM with 48 vCPUs and 512 GB memory. I made sure:

- Memory was **reserved** (no ballooning)
- vCPUs matched physical cores (no overcommitment for this critical VM)
- Virtual SCSI adapter was **VMware Paravirtual** (not LSI Logic SAS)
- Virtual disks used **thick-provisioned eager-zeroed** VMDKs (best performance)
- CPU Ready time stayed below 5% consistently post-consolidation

**The storage lesson**: During the pilot, I saw `PAGEIOLATCH_SH` waits spike to 45 ms on one LUN. The infrastructure team found that another VM on the same datastore was running disk benchmarks. We moved SQL Server to dedicated datastores with IOPS guarantees.

### 12 — Security, Compliance & Encryption

Consolidation meant standardizing security:

**Before consolidation:**
- 23 different security models across 23 instances
- Some databases had `public` with `sysadmin` access (yes, really)
- TDE was not used anywhere
- No consistent audit trail

**After consolidation:**
- All databases on one instance with consistent AD group-based access
- TDE enabled on all customer-facing databases
- SQL Server Audit configured for: failed logins, permission changes, schema changes, backup operations
- Least privilege model: application accounts get EXECUTE on stored procedures only, no direct table access
- Backup encryption with AES-256

The `CreateDbConfig` scripts included TDE setup as part of the database creation process — `CREATE DATABASE ENCRYPTION KEY ... ALTER DATABASE SET ENCRYPTION ON` — so every new database in the consolidated platform was automatically encrypted.

**The TDE lesson that nearly cost us a DR drill:**

Three weeks after Wave 3 completed, we ran a scheduled DR drill. The plan: fail the AG to Data Center B (async secondary), run application smoke tests, fail back. TDE was enabled on all customer databases. AG synchronization was healthy — lag under 200 ms.

The failover completed in 12 seconds. Smoke tests passed for the first 10 minutes. Then the inventory application failed with error 33111:

> *"Cannot find server certificate with thumbprint..."*

Root cause: The TDE certificate on the DR secondary had been restored from the certificate backup taken during initial setup. But two weeks earlier, we had cycled the DEK on a subset of databases (security rotation). The updated certificate — with the new DEK's key — had **not** been redeployed to the DR replica. The DR secondary could decrypt the databases whose DEK hadn't been rotated, but failed on the ones it had.

**The fix:** We copied the updated certificate from the primary to the DR server using the existing backup file — SQL Server cached the open DEKs in memory, so the restore didn't require a restart or database outage. Within 5 minutes all databases were accessible, and the drill continued.

**What we changed after the incident:**

1. Added certificate backup age to the weekly compliance dashboard
2. Created a SQL Agent job that runs the `pvt_key_last_backup_date` audit query and alerts if any TDE certificate hasn't been backed up in 30+ days
3. Updated the DR runbook: "Before any DEK rotation, deploy updated certificates to all AG replicas and document the thumbprint change"
4. Added a pre-drill checklist item: "Verify TDE certificate thumbprint matches across all replicas using `sys.dm_database_encryption_keys`"

This incident reinforced a lesson from the tutorial: **TDE without certificate management is not security — it's a disaster waiting to happen.**

**The audit that exposed what we didn't know:**

Three months after go-live, the internal audit team requested a report: "List every schema change made in the last 90 days, who made it, and from which workstation."

On the old platform (23 separate instances), this would have been impossible — most instances had no audit configured. The auditors would have received a shrug and a risk acceptance.

On the consolidated platform, every database had SQL Server Audit enabled from day one — `SCHEMA_OBJECT_CHANGE_GROUP`, `DATABASE_PERMISSION_CHANGE_GROUP`, `FAILED_LOGIN_GROUP` — writing to `E:\Audit\*.sqlaudit` with 512 MB file rotation.

I ran:

```sql
SELECT event_time,
       server_principal_name,
       database_name,
       schema_name + '.' + object_name AS object,
       action_id,
       CASE action_id
           WHEN 'CR' THEN 'CREATE'
           WHEN 'AL' THEN 'ALTER'
           WHEN 'DR' THEN 'DROP'
       END AS action,
       statement,
       client_ip,
       application_name
FROM sys.fn_get_audit_file('E:\Audit\*.sqlaudit', NULL, NULL)
WHERE event_time >= DATEADD(DAY, -90, GETDATE())
  AND class_type IN ('PG', 'U', 'V', 'FN', 'TR')  -- procs, tables, views, functions, triggers
ORDER BY event_time DESC;
```

The result: 2,347 schema changes across 308 databases, with full attribution.

But the query also revealed something we hadn't noticed: a developer's service account had been ALTERing stored procedures directly in production — bypassing the deployment pipeline. The account had `db_ddladmin` on a shared reporting database, granted six months earlier during a "temporary" setup that was never revoked.

**What we changed:**

1. Removed `db_ddladmin` from all service accounts — replaced with `EXECUTE`-only permissions
2. Set up a weekly audit report that emails the security team: "New objects created in production this week"
3. Created a SQL Agent alert on `DATABASE_PERMISSION_CHANGE_GROUP` — any grant of `db_ddladmin` or higher triggers an immediate notification
4. Added the audit query to the standard on-call handoff documentation so any DBA can answer auditor questions within minutes

The audit team's verdict: "Best audit response we've seen across any platform in the organization." The report went from "impossible" to "delivered in 10 minutes" — and it caught a security gap we would have missed until the next breach.

**The biggest incident** during consolidation: Wave 3 included the inventory database (30 GB, heavily fragmented). SmoMigrator started the data copy at 22:00 as planned. At 22:14, the monitoring system alerted — the target server's log drive was filling rapidly.

My response (following the runbook):

| Time | Action |
|------|--------|
| 22:14 | Alert received: log drive at 78% and rising |
| 22:15 | Checked SmoMigrator progress — in the middle of a 30 GB table with 15 indexes |
| 22:16 | Checked log reuse: `LOG_BACKUP` — the log backup job was running but couldn't keep up with the bulk insert |
| 22:17 | Paused the migration (Ctrl+C → graceful stop) |
| 22:18 | Took a manual log backup to reclaim space |
| 22:19 | Reduced SmoMigrator `BulkCopyBatchSize` from 50,000 to 10,000 to reduce log generation rate |
| 22:22 | Resumed migration with lower batch size |
| 22:45 | Migration completed successfully |

**Post-incident**: I added a pre-flight check to SmoMigrator that estimated log growth before starting a table copy and warned if the log drive had insufficient free space. I also updated the runbook.

### 14 — T-SQL & DBA Scripts

The validation queries I used during consolidation became a permanent part of my toolkit:

```sql
-- Pre-migration: verify source object exists
SELECT 'Source OK' AS status
FROM [SourceDB].sys.objects o
JOIN [SourceDB].sys.schemas s ON o.schema_id = s.schema_id
WHERE s.name = 'dbo' AND o.name = 'OrdersTable';

-- Post-migration: row-count validation
SELECT 'Source' AS location, COUNT_BIG(1) AS row_count
FROM [SourceDB].[dbo].[OrdersTable]
UNION ALL
SELECT 'Target', COUNT_BIG(1)
FROM [TargetDB].[dbo].[OrdersTable];

-- Post-migration: checksum validation
SELECT CHECKSUM_AGG(BINARY_CHECKSUM(*))
FROM [SourceDB].[dbo].[OrdersTable] WITH (NOLOCK);
SELECT CHECKSUM_AGG(BINARY_CHECKSUM(*))
FROM [TargetDB].[dbo].[OrdersTable] WITH (NOLOCK);

-- Dependency scanner (found the linked server issue)
SELECT OBJECT_NAME(referencing_id) AS object_name,
       referenced_server_name, referenced_database_name,
       referenced_schema_name, referenced_entity_name
FROM sys.sql_expression_dependencies
WHERE referenced_server_name IS NOT NULL;
```

### 15 — Collaboration, Knowledge Sharing & Team Fit

This project **forced** collaboration. I couldn't consolidate 300+ databases alone:

- **Application teams**: Identified database owners, validated migration acceptance criteria, tested applications post-migration
- **Infrastructure team**: Provisioned the VM, configured storage, set up networking, monitored hypervisor metrics
- **Security team**: Approved the new security model, reviewed TDE implementation, audited consolidated permissions
- **Storage team**: Dedicated LUNs with appropriate RAID, IOPS guarantees, monitored latency during migration
- **Network team**: Verified AG listener connectivity across subnets, tested cross-DC latency, configured firewall rules

**The collaboration tools I created:**
- A SharePoint page tracking every database's consolidation status (assessed, remediated, migrated, validated)
- A runbook for each migration wave with rollback steps
- Weekly 30-minute standup with all stakeholders
- Post-wave retrospective documenting what went well and what didn't

### 16 — Monitoring, Alerting & Observability

Post-consolidation, the monitoring strategy was completely redesigned:

**Tier 1 (Page on-call):**
- AG synchronization lag > 30 seconds → investigate replication
- Disk < 10% free → escalate
- DBCC CHECKDB reports corruption → immediate restore
- SQL Server Agent job fails 3+ consecutive times → investigate

**Tier 2 (Daily dashboard):**
- Failed logins (possible brute force)
- PLE trending downward (memory pressure indicator)
- Top 10 waits (shift in workload patterns)
- Database growth rate (capacity planning input)
- Job duration changes (regression detection)

**Tier 3 (Weekly review):**
- Query Store plan regressions
- Index fragmentation trends
- Wait stats baseline comparison week-over-week
- Backup and restore test results

We used the `WaitStatsHistory` and `PerfCounterHistory` tables (from Chapter 16) to build Grafana dashboards that showed before-and-after comparisons — a powerful tool for demonstrating consolidation success to management.

### 17 — Extra DBA Topics

**Capacity planning**: I projected growth for the consolidated platform based on 3 years of backup history from the legacy instances. The trend showed 25% year-over-year growth. The target server was sized for 3 years of growth with 30% buffer, plus room for the AG secondary.

**Licensing**: The consolidated server used SQL Server 2022 Enterprise Edition. By consolidating from 23 instances (many Standard Edition) to one Enterprise instance, we gained:
- Readable secondaries (replaced the need for separate reporting instances)
- Online index rebuild (no more maintenance windows for index maintenance)
- Accelerated Database Recovery (faster recovery after failover)
- Backup compression (CPU-efficient, Enterprise-level optimization)

**Change management**: Every migration wave had a documented change ticket with:
- Risk assessment (low/medium/high based on database criticality)
- Rollback plan (switch back to original connection string)
- Testing verification criteria (row counts, checksums, application smoke tests)
- Approval chain (DBA lead → application team → change advisory board)

### 18 — Interview Questions Deep Dive

When I interview candidates now, I ask about database consolidation. Here is how I'd answer my own question:

**Q:** "Tell me about a time you consolidated databases into a single platform."

> I led the consolidation of 23 SQL Server instances and 308 databases into a single SQL Server 2022 Enterprise platform with Always On Availability Group across two data centers.

> **Assessment first.** I ran DMA on every instance, sp_BlitzIndex for index analysis, and sp_Blitz to catalog misconfigurations. I fixed corruption in two databases, dropped 120 GB of unused indexes, and rebuilt transaction logs with excessive VLFs.

> **The migration tool.** I built SmoMigrator — a .NET 8.0 console app using SMO to script DDL and SqlBulkCopy for data movement. It supported resume, schema remapping, progress tracking with ETA, and row-count validation. It migrated ~15,000 objects over 6 weeks in 5 waves.

> **The architecture.** Target was SQL Server 2022 Enterprise on VMware (48 vCPU, 512 GB RAM, flash storage) with Always On AG — sync secondary in the same DC for HA, async secondary in the DR DC. Consistent backup strategy using Ola Hallengren, TDE on customer databases, AD group-based least-privilege access, and centralized monitoring with Grafana dashboards.

> **The result.** 308 databases migrated with zero data loss. Operational overhead reduced from managing 23 instances to 1. Query Store enabled everywhere — we caught and fixed 12 plan regressions in the first month. RTO improved from hours (log shipping on some instances, nothing on others) to under 5 minutes (AG automatic failover).

## Final Reflection

Every chapter in this tutorial played a role in this project — from understanding the business need (00), to the technical execution (02–09, 11–12), to the monitoring and ongoing operations (16). The difference between a junior DBA who knows the syntax and a senior DBA who delivers the project is the ability to connect all these domains into a coherent, business-driven plan.

The SmoMigrator codebase at `DbConsolidation/` is the tool. This chapter is the story of how it was used.
