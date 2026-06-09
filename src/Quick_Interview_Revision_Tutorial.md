# Quick Interview Revision Tutorial
## SQL Server & Automation for XYZ Denmark

**Role:** Senior Infrastructure Operations Engineer — SQL Server & Automation  
**Company:** XYZ Denmark, Albertslund  
**Environment:** 24/7 enterprise retail across Denmark, Faroe Islands, Greenland, Germany

---

# 1. One-Page Executive Revision Summary

**What to remember before you walk into the interview:**

XYZ is not a normal office environment. If SQL Server slows down, customers abandon checkout queues, warehouse pallets get lost, and pricing feeds stop. There are no safe maintenance windows. You must think like someone who owns the commercial backbone of a store network.

**Core principles to internalize:**

- Availability is not about keeping SQL Server running. It is about keeping stores transacting.
- Every answer must connect to business impact: RPO, RTO, revenue, customers.
- Never guess. Use telemetry: DMVs, Extended Events, Query Store, sp_WhoIsActive.
- Never restart, never shrink, never guess. Diagnose first, act second.
- HA does not replace backup. DR does not replace HA. Both are required.
- Automation removes human error. Manual processes create incidents.
- Patching is not optional. Unpatched systems fail audits and get breached.
- Cloud is not a buzzword. It is a workload placement decision based on RPO/RTO/cost.
- Security means least privilege. Sysadmin access for developers is never acceptable.
- Documentation and runbooks protect the team when you are on vacation.

**What senior DBAs think about differently:**

They do not tune queries in isolation. They connect every technical decision to operational risk, business continuity, and team capability. They measure before they change. They test before they deploy. They automate what they repeat. They document what they know.

---

# 2. XYZ JD to SQL Server Topic Mapping

| XYZ JD Requirement | SQL Server Topic | Why It Matters at XYZ | Interview Angle | What You Should Say | What You Must Avoid |
|:---|:---|:---|:---|:---|:---|
| Operation of business-critical SQL Server platforms in 24/7 environment | SQL Server operations, health checks, daily monitoring | Stores, POS, pricing, inventory run continuously. Downtime = revenue loss. | "How do you ensure platform stability in a 24/7 retail environment?" | Describe your daily health check routine, what you monitor first, how you prioritize incidents by business impact. | Never say "I check if the server is online." Always describe specific checks: backup status, job failures, disk space, blocking, AG health, error log. |
| Performance tuning and capacity optimization | Execution plans, wait stats, index maintenance, statistics, Query Store | Slow queries stall checkout lines and warehouse operations. | "Walk me through troubleshooting a slow query that affects store operations." | Use the diagnostic workflow: sp_WhoIsActive, execution plan analysis, Query Store regression detection, statistics freshness check. | Never say "I restart the server" or "I add an index based on the missing index warning." |
| Automation of SQL Server operations | SQL Agent jobs, PowerShell, T-SQL scripting, runbooks | Manual processes fail at 2 AM. Automation ensures consistency across hundreds of servers. | "What tasks should never be done manually in a SQL Server estate?" | Describe automating backups, integrity checks, index maintenance, disk space monitoring, alerting. | Never say "I use the GUI to check everything." |
| HA and DR across multiple data centers | Always On AG, Log Shipping, failover, quorum, RPO/RTO | XYZ operates across Denmark, Faroe Islands, Greenland, Germany. One data center failure must not stop stores. | "How do you design HA/DR for a multi-site retail operation?" | Map business requirements to technology: sync AG for local HA (RPO=0), async AG or Log Shipping for remote DR, define RPO/RTO per workload. | Never say "We use Always On because it is the best." Explain why you chose it based on RPO/RTO and network latency. |
| Infrastructure modernization and Azure initiatives | Azure SQL Database, Azure SQL Managed Instance, hybrid cloud | Legacy on-prem systems need modernization without breaking production. | "When would you recommend Azure SQL Database vs. Managed Instance vs. Azure VM?" | Azure SQL DB for PaaS workloads with no OS dependency. Managed Instance for near-full SQL Server compatibility. Azure VM for OS-level control. | Never say "Azure is always better." Explain trade-offs: cost, feature compatibility, operational responsibility. |
| Migration, upgrade, and technical improvement projects | Database migration planning, version upgrades, compatibility testing | Upgrading from old SQL Server versions (2012/2014/2016) exposes security and supportability risks. | "How do you plan and execute a SQL Server upgrade with zero downtime?" | Describe: Data Migration Assistant assessment, compatibility level testing, performance baseline capture, rolling upgrade strategy, rollback plan. | Never say "I run the upgrade wizard and hope it works." |
| Security, compliance, and stable operational processes | Least privilege, TDE, auditing, service accounts, SQL Server Audit | Retail handles payment data, member data, pricing data. Security breaches destroy trust and trigger regulatory penalties. | "How do you enforce least privilege on a production SQL Server instance?" | Describe: role-based access, no sysadmin for developers, TDE for data at rest, SQL Server Audit for compliance, service account management. | Never say "I give developers sysadmin access so they can troubleshoot." |
| Troubleshooting, incident management, fast problem resolution | Diagnostic DMVs, Extended Events, error log analysis, First Responder Kit | When POS queues stall on Saturday morning, you need answers in minutes, not hours. | "Walk me through your first 5 minutes when someone says SQL Server is slow." | 1. Check blocking with sp_WhoIsActive. 2. Check wait stats. 3. Check CPU/memory/IO. 4. Check recent deployments. 5. Communicate status to stakeholders. | Never say "I look at Task Manager" or "I reboot the server." |
| Collaboration with infrastructure, development, security, and business teams | Technical sparring, knowledge sharing, communication | DBA work intersects with storage, network, application, and security teams constantly. | "How do you handle a developer who wants to deploy a query that you know will cause blocking?" | Describe: explain the risk with evidence (execution plan, wait stats), propose alternatives (read replica, index, query rewrite), document the decision. | Never say "I block the deployment because I said so." |
| 24/7 critical duty arrangement | On-call readiness, escalation, runbooks, documentation | Someone must respond at 2:30 AM when an alert fires. The process must be documented and repeatable. | "How do you prepare for 24/7 on-call duty?" | Describe: alert routing, severity classification, runbooks, first checks, escalation path, communication cadence, post-incident documentation. | Never say "I just log in and figure it out." |

---

# 3. High-Priority SQL Server Topics for Revision

## 3.1 SQL Server Operations in a 24/7 Enterprise Environment

**Simple explanation:** Managing SQL Server so that store systems, POS, pricing, inventory, warehouse feeds, member data, and reporting never stop working. There are no safe maintenance windows.

**Why XYZ cares:** XYZ operates 24/7 across multiple territories. Every minute of downtime affects customers, stores, and revenue.

**Common production problem:** Unthrottled index rebuilds running during peak hours, causing blocking and storage exhaustion.

**First three things to check:**
1. What is the current business impact? Which systems are affected?
2. What is the current instance health? CPU, memory, IO, blocking, job status.
3. What changed recently? Deployments, patches, maintenance jobs, storage changes.

**DMV/tool:** sp_WhoIsActive, sys.dm_exec_requests, sys.dm_os_wait_stats

**Strong interview answer:** "In a 24/7 retail environment, I treat every change as a potential incident. I check health metrics before and after any operation, I schedule maintenance during the lowest-traffic windows, and I never run unthrottled operations against business-critical tables during peak hours."

**Beginner mistake to avoid:** Running diagnostic scripts without checking their resource impact, or rebooting a slow instance instead of diagnosing the root cause.

---

## 3.2 Backup and Restore

**Simple explanation:** Creating recoverable copies of databases so you can restore data after corruption, accidental deletion, hardware failure, or disaster.

**Why XYZ cares:** A corrupted or lost database means lost pricing data, lost member records, lost inventory tracking. The business cannot operate without its data.

**Common production problem:** Backup jobs are green for months, but nobody has tested a restore. When corruption hits, the restore fails because the backup chain is broken.

**First three things to check:**
1. Is the backup chain intact? Check msdb.dbo.backupset for the last full, differential, and log backups.
2. Is the recovery model correct? Full recovery model requires log backups for point-in-time recovery.
3. Has a restore been tested recently? A backup is only as good as its last successful restore.

**DMV/tool:** msdb.dbo.backupset, sys.databases (log_reuse_wait_desc), RESTORE VERIFYONLY

**Strong interview answer:** "I configure backups with CHECKSUM, compression, and striping for large databases. I automate daily restore verification on an isolated test instance. I maintain a retention policy aligned with business RPO requirements. I never rely on a green job status checkbox as proof that a backup is good."

**Beginner mistake to avoid:** Saying "I check the job history to see if it says green." That proves the job ran, not that the backup is restorable.

---

## 3.3 RPO and RTO

**Simple explanation:** RPO (Recovery Point Objective) = maximum acceptable data loss. RTO (Recovery Time Objective) = maximum acceptable downtime.

**Why XYZ cares:** XYZ needs to define how much data they can afford to lose and how quickly they must recover. These numbers dictate HA/DR architecture.

**Common production problem:** Management asks "can we recover?" and nobody has defined RPO/RTO targets, so there is no measured baseline.

**First three things to check:**
1. What is the business RPO/RTO for this workload?
2. Does the current HA/DR architecture meet those targets?
3. Has the recovery been tested within the RTO window?

**DMV/tool:** Business requirement documentation, Always On sync mode configuration, backup frequency settings

**Strong interview answer:** "RPO and RTO are business decisions that drive technical architecture. For XYZ's checkout systems, I would configure synchronous Always On replicas for local HA (RPO=0, RTO near-zero) and asynchronous replicas or Log Shipping for remote DR (RPO=15 minutes, RTO=2 hours). I would test failover regularly to validate both targets."

**Beginner mistake to avoid:** Assuming RPO/RTO are technical settings. They are business requirements that you design around.

---

## 3.4 DBCC CHECKDB and Corruption Handling

**Simple explanation:** DBCC CHECKDB validates the physical and logical integrity of all database pages. Corruption means pages on disk do not match what SQL Server expects.

**Why XYZ cares:** Undetected corruption spreads into backups, making recovery impossible. You must catch corruption early.

**Common production problem:** Storage degradation causes silent page corruption that is not detected until a restore is attempted.

**First three things to check:**
1. Run DBCC CHECKDB to identify corrupted pages and objects.
2. Check msdb.dbo.suspect_pages for known bad pages.
3. Check the SQL Server Error Log for 823/824/825 errors.

**DMV/tool:** DBCC CHECKDB, msdb.dbo.suspect_pages, xp_readerrorlog, sys.master_files

**Strong interview answer:** "I run DBCC CHECKDB WITH PHYSICAL_ONLY daily on production databases during low-traffic windows to catch hardware degradation early. If corruption is found, my first priority is to take a tail-log backup to preserve in-flight data. Then I evaluate whether an online page restore is possible for isolated corruption, or whether a full restore from a clean backup chain is required. I never use REPAIR_ALLOW_DATA_LOSS on production data without understanding the consequences."

**Beginner mistake to avoid:** Running DBCC CHECKDB with default options on a large database during peak hours (it is resource-intensive), or using REPAIR_ALLOW_DATA_LOSS without understanding data loss.

---

## 3.5 Always On Availability Groups

**Simple explanation:** SQL Server's primary HA/DR technology. Groups of databases are replicated across replicas. Synchronous mode = zero data loss. Asynchronous mode = potential data loss but better performance.

**Why XYZ cares:** XYZ needs HA across multiple data centers. Always On provides automatic failover, readable secondaries for reporting, and backup offloading.

**Common production problem:** Log truncation blocked because the secondary replica is out of sync, causing the primary log file to grow rapidly.

**First three things to check:**
1. Check sys.dm_hadr_database_replica_states for sync status and queue sizes.
2. Check sys.databases log_reuse_wait_desc for AVAILABILITY_GROUP.
3. Check network latency between replicas.

**DMV/tool:** sys.dm_hadr_database_replica_states, sys.dm_exec_requests (HADR_SYNC_COMMIT waits), sp_WhoIsActive

**Strong interview answer:** "Always On Availability Groups are the foundation of XYZ's HA/DR strategy. I configure synchronous replicas for local data center HA to achieve RPO=0, and asynchronous replicas for remote DR sites to avoid WAN latency impacting primary transaction throughput. I monitor log send and redo queue sizes proactively. I test failover regularly and maintain synchronized logins, jobs, and permissions across all replicas."

**Beginner mistake to avoid:** Assuming Always On replaces backup. It does not. You still need a backup strategy. Also, forgetting to sync SQL Agent jobs, logins, and linked servers across replicas.

---

## 3.6 Log Shipping

**Simple explanation:** A DR technology that backs up transaction logs on the primary, copies them to a secondary, and restores them there. Simpler than Always On but with higher RPO.

**Why XYZ cares:** Good for remote DR sites over high-latency networks where Always On synchronous commit is not feasible.

**Common production problem:** LSN chain broken by an ad-hoc backup without COPY_ONLY, causing log restores to fail.

**First three things to check:**
1. Check msdb.dbo.log_shipping_monitor_secondary for restore job failures.
2. Check msdb.dbo.backupset for unauthorized log backups (missing COPY_ONLY).
3. Compare last applied LSN on secondary against available log backup files.

**DMV/tool:** Log Shipping monitoring tables, msdb.dbo.backupset, SQL Agent job history

**Strong interview answer:** "Log Shipping is appropriate for remote DR sites over constrained WAN links where synchronous Always On is not feasible. I configure frequent log backups (every 5-10 minutes), automate copy and restore jobs, and monitor sync thresholds. If the LSN chain breaks, I re-initialize with a differential backup rather than a full backup to minimize WAN transfer."

**Beginner mistake to avoid:** Running ad-hoc log backups without COPY_ONLY, which breaks the log shipping chain.

---

## 3.7 High Availability vs Disaster Recovery

**Simple explanation:** HA = surviving a local component failure instantly with zero data loss. DR = recovering after a catastrophic facility outage or data corruption.

**Why XYZ cares:** XYZ needs both. HA keeps stores running when a server fails. DR keeps the business running when a data center fails.

**Common production problem:** Team confuses HA with DR and assumes Always On AG replaces the need for backups and DR testing.

**First three things to check:**
1. What is the HA architecture? (Always On, failover clustering)
2. What is the DR architecture? (Log Shipping, async AG, offsite backups)
3. When was the last DR test?

**DMV/tool:** sys.dm_hadr_database_replica_states, WSFC quorum configuration

**Strong interview answer:** "HA and DR are complementary, not interchangeable. HA protects against component failures within a data center using synchronous Always On replicas with automatic failover. DR protects against data center outages using asynchronous replicas or Log Shipping to a remote site. I define RPO/RTO for each workload tier and design the architecture to meet those targets. I test both HA failover and DR recovery regularly."

**Beginner mistake to avoid:** Saying "We have Always On, so we do not need backups or DR testing."

---

## 3.8 Performance Tuning

**Simple explanation:** Making queries run faster by improving execution plans, reducing resource consumption, and eliminating bottlenecks.

**Why XYZ cares:** Slow queries stall checkout lines and warehouse operations. Performance is directly tied to revenue.

**Common production problem:** A query that ran in seconds starts taking minutes after a statistics update or plan regression.

**First three things to check:**
1. What is the current wait type? (Check sys.dm_exec_requests, sp_WhoIsActive)
2. What does the execution plan show? (Query Store, actual execution plan)
3. Are statistics up to date? (sys.dm_db_stats_properties)

**DMV/tool:** Query Store, sys.dm_exec_query_stats, sp_WhoIsActive, actual execution plans

**Strong interview answer:** "I start with wait statistics to identify where the engine is spending time. Then I examine the actual execution plan to find high-cost operators, cardinality mismatches, and implicit conversions. I check Query Store for plan regressions and statistics freshness. I fix the root cause, not the symptom."

**Beginner mistake to avoid:** Tuning by execution plan percentage cost without comparing estimated vs actual rows, or adding indexes without checking for duplicates and write overhead.

---

## 3.9 Query Store

**Simple explanation:** A built-in feature that captures query execution history, plans, and performance statistics over time. It lets you compare old vs new plans and force known good plans.

**Why XYZ cares:** When a query regresses after a deployment, Query Store lets you identify the regression and force a stable plan within minutes, without waiting for a code fix.

**Common production problem:** A query regresses after a deployment. Without Query Store, you have no historical plan to compare against.

**First three things to check:**
1. Is Query Store enabled on the database?
2. Query sys.query_store_query and sys.query_store_runtime_stats for the regressed query.
3. Compare the old plan vs new plan for cardinality estimate changes.

**DMV/tool:** sys.query_store_query, sys.query_store_plan, sys.query_store_runtime_stats

**Strong interview answer:** "Query Store is my first tool when a query regresses. I identify the regressed query, compare the old and new plans side by side, and force the known good plan to restore immediate performance. I then investigate the root cause: stale statistics, parameter sniffing, or a schema change."

**Beginner mistake to avoid:** Blindly forcing plans without understanding why the regression occurred. Forced plans can become stale themselves.

---

## 3.10 Execution Plans

**Simple explanation:** A visual representation of how SQL Server executes a query. Shows operators (scans, seeks, joins, sorts), row estimates, costs, and warnings.

**Why XYZ cares:** Execution plans reveal why a query is slow. They show whether SQL Server is using the right index, reading the right number of rows, and avoiding unnecessary operations.

**Common production problem:** A query uses an Index Scan instead of an Index Seek, or has millions of Key Lookups, causing excessive logical reads.

**First three things to check:**
1. Estimated vs actual rows (cardinality estimate accuracy)
2. Index Seek vs Index Scan (index usage)
3. Key Lookups, Sort spills, Hash Match spills (high-cost operators)

**DMV/tool:** Actual execution plan (SET STATISTICS IO ON), Query Store plan comparison

**Strong interview answer:** "I examine execution plans for cardinality mismatches, unnecessary scans, and high-cost operators. I look for implicit conversions, non-sARGable predicates, and missing index warnings. I compare estimated vs actual rows to identify statistics issues. I do not tune by percentage cost alone."

**Beginner mistake to avoid:** Saying "I look at the execution plan and see which operator is most expensive." The most expensive operator may be correct. The issue is often in a small operator with a bad row estimate.

---

## 3.11 Wait Statistics

**Simple explanation:** Every query that cannot immediately execute waits for something. Wait stats tell you what the engine is waiting for: locks, IO, CPU, network, memory.

**Why XYZ cares:** Wait stats eliminate guesswork. They tell you exactly where the bottleneck is.

**Common production problem:** Team argues about whether the issue is storage or SQL Server. Wait stats prove it is lock contention, not IO.

**First three things to check:**
1. What are the top cumulative wait types? (sys.dm_os_wait_stats)
2. What are the current active waits? (sys.dm_exec_requests)
3. What changed recently that could have shifted the wait profile?

**DMV/tool:** sys.dm_os_wait_stats, sys.dm_exec_requests, sp_BlitzFirst

**Strong interview answer:** "I use differential wait stats analysis to isolate the current bottleneck. PAGEIOLATCH waits indicate storage pressure. LCK_M waits indicate lock contention. CXPACKET waits indicate parallelism issues. WRITELOG waits indicate transaction log write latency. I match the wait type to the root cause, not to a generic solution."

**Beginner mistake to avoid:** Focusing on cumulative wait stats without considering what changed recently. A sudden spike in waits after a deployment is more actionable than a high cumulative total.

---

## 3.12 Blocking and Deadlocks

**Simple explanation:** Blocking = one session holds a lock and other sessions wait. Deadlock = two sessions block each other, and SQL Server kills one as a victim.

**Why XYZ cares:** Blocking at checkout lines means customers cannot complete transactions. Deadlocks cause application errors and data inconsistency.

**Common production problem:** A reporting query holds a shared lock on a large table, blocking write transactions from POS systems.

**First three things to check:**
1. Identify the root blocker with sp_WhoIsActive.
2. Check the blocking session's T-SQL and execution plan.
3. Determine if the blocker is a long-running transaction, missing index, or escalation.

**DMV/tool:** sp_WhoIsActive, sys.dm_tran_locks, sys.dm_exec_requests, Extended Events (xml_deadlock_report)

**Strong interview answer:** "I use sp_WhoIsActive to trace the blocking chain to the root blocker. I examine the blocker's query and execution plan to understand why it is holding locks. I kill the blocker if necessary to restore service, then fix the root cause: add an index, rewrite the query, or redirect reporting to a read replica."

**Beginner mistake to avoid:** Killing sessions without understanding what transaction was in progress, or killing sessions repeatedly without fixing the root cause.

---

## 3.13 TempDB Contention

**Simple explanation:** TempDB is a shared workspace for sorts, temp tables, version store, and parallel operations. When too many sessions compete for allocation pages, performance degrades.

**Why XYZ cares:** Warehouse workloads, ETL jobs, and reporting queries all use TempDB. Contention here slows everything.

**Common production problem:** PAGELATCH_UP waits on database ID 2 (TempDB) caused by concurrent temp table creation with only one TempDB data file.

**First three things to check:**
1. Check for PAGELATCH waits on database ID 2.
2. Count and size TempDB data files.
3. Check for temp table creation patterns in the workload.

**DMV/tool:** sys.dm_os_waiting_tasks, sys.dm_db_page_info, sys.dm_os_wait_stats

**Strong interview answer:** "When I see PAGELATCH_UP waits on database ID 2, I know TempDB allocation pages are contended. I add data files to match the CPU core count (up to 8), ensuring identical size and autogrowth for proportional fill. For long-term prevention, I work with developers to reduce temp table churn using table variables or memory-optimized types."

**Beginner mistake to avoid:** Adding too many TempDB files without matching size and autogrowth settings, which breaks proportional fill.

---

## 3.14 Index Maintenance

**Simple explanation:** Indexes fragment over time as data is inserted, updated, and deleted. Fragmentation increases IO and reduces query performance.

**Why XYZ cares:** Fragmented indexes on transactional tables slow down checkout queries and inventory lookups.

**Common production problem:** Unthrottled index rebuilds running during peak hours, acquiring exclusive locks and blocking application queries.

**First three things to check:**
1. Check fragmentation levels with sys.dm_db_index_physical_stats.
2. Check index usage with sys.dm_db_index_usage_stats (are indexes actually used?).
3. Check when the last maintenance ran.

**DMV/tool:** sys.dm_db_index_physical_stats, sys.dm_db_index_usage_stats, Ola Hallengren IndexOptimize

**Strong interview answer:** "I use Ola Hallengren's scripts with intelligent thresholds: reorganize at 5-30% fragmentation, rebuild above 30%, with ONLINE=ON and MAXDOP limits during low-traffic windows. I check index usage stats to remove unused indexes before rebuilding them. I never run unthrottled rebuilds during peak hours."

**Beginner mistake to avoid:** Rebuilding indexes that are rarely used, or running rebuilds without ONLINE=ON during business hours.

---

## 3.15 Statistics Maintenance

**Simple explanation:** Statistics tell the query optimizer how data is distributed in a table. Stale statistics cause bad cardinality estimates and bad execution plans.

**Why XYZ cares:** After bulk loads or large data changes, stale statistics cause queries to choose wrong plans, slowing down inventory and pricing lookups.

**Common production problem:** After a large inventory batch load, statistics become stale, and the optimizer chooses a Hash Match instead of an Index Seek.

**First three things to check:**
1. Check sys.dm_db_stats_properties for last update date and row modification count.
2. Compare estimated vs actual rows in the execution plan.
3. Check if AUTO_UPDATE_STATISTICS is enabled and whether async updates are appropriate.

**DMV/tool:** sys.dm_db_stats_properties, UPDATE STATISTICS, sp_autostats

**Strong interview answer:** "I check statistics freshness via sys.dm_db_stats_properties. If the modification counter far exceeds the auto-update threshold, I run UPDATE STATISTICS WITH FULLSCAN on the affected table. For volatile tables, I enable AUTO_UPDATE_STATISTICS_ASYNC to prevent query threads from blocking while statistics update."

**Beginner mistake to avoid:** Running UPDATE STATISTICS on every table nightly regardless of need, or ignoring statistics when troubleshooting a slow query.

---

## 3.16 SQL Server Agent Jobs

**Simple explanation:** Automated tasks scheduled by SQL Server Agent: backups, integrity checks, index maintenance, data imports, notifications.

**Why XYZ cares:** Agent jobs are the backbone of automated operations. A failed job can break backup chains, pricing feeds, or inventory syncs.

**Common production problem:** A backup job fails silently for three days. Nobody notices until corruption hits and there is no clean backup to restore.

**First three things to check:**
1. Check job history for failures in msdb.dbo.sysjobhistory.
2. Check job step output for error details.
3. Check job schedule alignment with business windows.

**DMV/tool:** msdb.dbo.sysjobhistory, msdb.dbo.sysjobsteps, SQL Agent alerts

**Strong interview answer:** "I configure SQL Agent jobs with retry logic, alert notifications, and detailed step logging. I monitor job failures proactively, not reactively. I document every job's purpose, schedule, owner, and failure escalation path. For critical jobs like backups, I add secondary validation checks."

**Beginner mistake to avoid:** Ignoring job failures because "it usually works," or not having alert notifications configured.

---

## 3.17 Automation Using T-SQL and PowerShell

**Simple explanation:** Replacing manual, error-prone tasks with repeatable scripts and scheduled automation.

**Why XYZ cares:** Manual processes fail at 2 AM. Automation ensures consistency across hundreds of servers and reduces key-person dependency.

**Common production problem:** Only one senior DBA knows how to check disk space across all servers. When they are on vacation, nobody else can do it.

**First three things to check:**
1. What tasks are currently done manually that could be automated?
2. Are there existing scripts that need documentation and version control?
3. Are automation scripts logged and auditable?

**DMV/tool:** PowerShell (Invoke-Sqlcmd, dbatools), T-SQL scripts, SQL Agent jobs

**Strong interview answer:** "I automate what I repeat: backups, integrity checks, index maintenance, disk space monitoring, job failure alerting, capacity reporting. I use PowerShell for multi-server operations and T-SQL for single-server tasks. I version-control all scripts, add logging, and test in non-production before deploying to production."

**Beginner mistake to avoid:** Writing automation scripts without error handling, logging, or rollback capability.

---

## 3.18 Monitoring and Alerting

**Simple explanation:** Proactive detection of problems before users notice. Monitoring collects data; alerting triggers action.

**Why XYZ cares:** When checkout lines stall, the DBA team should already know about the issue before the business calls.

**Common production problem:** No alerts configured for disk space, job failures, or AG sync status. Problems are discovered only when users complain.

**First three things to check:**
1. Are critical alerts configured? (Severity 16-25, disk space, job failures, AG state)
2. Are alerts routed to the right people?
3. Are alert thresholds tuned to avoid noise?

**DMV/tool:** SQL Agent Alerts, Extended Events, sys.dm_os_ring_buffers, monitoring dashboards

**Strong interview answer:** "I configure alerts for actionable threats: severity 16-25 errors, disk space thresholds, job failures, AG state changes, and blocking duration. I tune thresholds to reduce noise. I route alerts to on-call engineers with clear severity classification and escalation paths."

**Beginner mistake to avoid:** Configuring too many alerts that cause fatigue, or too few alerts that let problems go undetected.

---

## 3.19 Capacity Planning

**Simple explanation:** Forecasting future storage, CPU, memory, and workload needs to prevent resource exhaustion.

**Why XYZ cares:** Running out of disk space during holiday sales peaks is an emergency. Capacity planning prevents emergencies.

**Common production problem:** Database grows silently until the disk is full. Autogrowth triggers, but there is no space left.

**First three things to check:**
1. Current database and log sizes with growth trends.
2. Drive free space and autogrowth settings.
3. Upcoming business events that affect data volume.

**DMV/tool:** sys.master_files, sys.dm_db_file_space_usage, msdb backup history, capacity tracking tables

**Strong interview answer:** "I collect daily snapshots of database size, log size, drive free space, and backup size. I calculate monthly growth rates and project 3-6 months forward with a 20-30% buffer. I review growth trends before business events like holiday sales or campaign launches. I present capacity risks to management with specific numbers and timelines."

**Beginner mistake to avoid:** Waiting until the disk is full to address capacity, or autogrowth without monitoring.

---

## 3.20 Security and Least Privilege

**Simple explanation:** Giving users and applications only the permissions they need, nothing more. Protecting data with encryption and auditing.

**Why XYZ cares:** XYZ handles payment data, member data, pricing data. Security breaches trigger regulatory penalties and destroy customer trust.

**Common production problem:** Developers have sysadmin access "because they need to troubleshoot." An audit reveals excessive privileges.

**First three things to check:**
1. Who has sysadmin access? Should they?
2. Are service accounts following least privilege?
3. Is TDE enabled for sensitive data?

**DMV/tool:** sys.server_principals, sys.database_principals, sys.dm_exec_sessions, SQL Server Audit

**Strong interview answer:** "I enforce least privilege by granting only necessary permissions. I audit sysadmin access quarterly. I use role-based access control, not individual permissions. I enable TDE for data at rest, configure SQL Server Audit for compliance, and manage service accounts with minimal permissions."

**Beginner mistake to avoid:** Granting sysadmin access to developers, or using shared service accounts without ownership documentation.

---

## 3.21 Patch Management and Upgrades

**Simple explanation:** Applying Cumulative Updates (CUs) and security patches to keep SQL Server secure and supported.

**Why XYZ cares:** Unpatched systems fail security audits and are vulnerable to known exploits. End-of-support versions (SQL Server 2012/2014) have no security patches.

**Common production problem:** Patches are delayed for months because the team fears downtime. The system falls out of compliance.

**First three things to check:**
1. What SQL Server version and CU level is currently installed?
2. What is the vendor support status? (End of support dates)
3. Is there a test environment to validate patches before production?

**DMV/tool:** SERVERPROPERTY('ProductVersion'), Microsoft Lifecycle documentation, Data Migration Assistant

**Strong interview answer:** "I maintain a patching schedule aligned with Microsoft's CU release cycle. I test patches in a non-production environment first. For Always On environments, I use rolling upgrades: patch secondary replicas first, failover, patch the former primary. I validate performance after each patch. I never skip security patches because the system is 'working fine.'"

**Beginner mistake to avoid:** Avoiding patches indefinitely, or patching without testing and rollback planning.

---

## 3.22 Migration Planning

**Simple explanation:** Moving databases from one SQL Server instance/version/platform to another with minimal downtime and data loss.

**Why XYZ cares:** XYZ needs to modernize legacy systems, consolidate databases, and move toward Azure without breaking production.

**Common production problem:** Migration is planned as a single big-bang event. No rollback plan exists. Performance regresses after migration.

**First three things to check:**
1. Run Data Migration Assistant for compatibility assessment.
2. Map all dependencies: logins, jobs, linked servers, cross-database queries.
3. Define cutover window and rollback plan.

**DMV/tool:** Data Migration Assistant (DMA), sys.servers, sys.dm_exec_cached_plans, Query Store baseline

**Strong interview answer:** "I plan migrations in phases: discovery, assessment, testing, cutover, validation. I use DMA to identify compatibility issues. I capture a performance baseline before migration. I test the full restore/failover process in staging. I prepare a rollback plan. I validate post-migration: schemas, permissions, jobs, query performance."

**Beginner mistake to avoid:** Migrating without testing, or migrating without a rollback plan.

---

## 3.23 Azure SQL, Azure SQL Managed Instance, and Hybrid Modernization

**Simple explanation:** Moving workloads to Azure for PaaS benefits (managed infrastructure, automatic patching, built-in HA) while maintaining compatibility where needed.

**Why XYZ cares:** XYZ is modernizing toward Azure. The right platform choice depends on workload requirements.

**Common production problem:** Lift-and-shift to Azure SQL Database without checking feature compatibility. Cross-database queries fail. Agent jobs do not exist in PaaS.

**First three things to check:**
1. Does the workload require OS-level access? (Azure VM)
2. Does the workload use features not supported in Azure SQL Database? (Agent jobs, cross-db queries, CLR)
3. What are the RPO/RTO requirements and how does each platform meet them?

**DMV/tool:** Data Migration Assistant, Azure SQL Migration extension, sys.dm_db_persisted_version_store_usage

**Strong interview answer:** "Azure SQL Database is ideal for isolated PaaS workloads. Azure SQL Managed Instance is better when you need near-full SQL Server compatibility including Agent jobs, cross-database queries, and CLR. Azure VM is appropriate when you need OS-level control. I assess each workload individually and migrate to the platform that meets its technical requirements, not a one-size-fits-all approach."

**Beginner mistake to avoid:** Assuming Azure SQL Database supports everything SQL Server supports. It does not.

---

# 4. XYZ-Based Real-Life Scenarios

## Scenario 1: POS Slowdown Caused by Blocking

**Situation:** Saturday 10:15 AM. Store POS registers across Denmark are timing out during checkout. Customers are abandoning carts.

**Business impact:** Direct revenue loss. Customer satisfaction drops. Store managers are calling the help desk.

**Symptoms:** Batch requests per second drops sharply. sys.dm_os_wait_stats shows massive LCK_M_S and LCK_M_IX waits. sp_WhoIsActive reveals a single reporting session blocking dozens of checkout sessions.

**Investigation steps:**
1. Run sp_WhoIsActive to identify the root blocker.
2. Extract the blocking session's T-SQL and execution plan.
3. Identify what lock type is held and why it escalated.

**Tools/DMVs used:** sp_WhoIsActive, sys.dm_tran_locks, sys.dm_exec_requests

**Root cause:** A corporate reporting query ran a Clustered Index Scan on the main sales table due to a non-sARGable predicate. It escalated row locks to a table-level Shared lock (S), blocking all write transactions (IX) from POS terminals.

**Immediate fix:** KILL the reporting session to release the lock chain. POS registers resume immediately.

**Long-term prevention:** Redirect reporting workloads to a read-only Always On secondary replica. Enable Read Committed Snapshot Isolation (RCSI) on the primary database so readers access row versions in TempDB instead of acquiring blocking shared locks.

**Short interview answer:** "I would run sp_WhoIsActive to find the root blocker, kill the reporting session to restore POS service, then move reporting to a read replica and enable RCSI to prevent recurrence."

**Senior-level interview answer:** "When checkout lines stall, my first priority is isolating the root blocker using sp_WhoIsActive. I identify the reporting query holding a table-level Shared lock due to index scan escalation. I terminate it to restore transaction processing. For prevention, I architecturally separate read and write workloads: heavy analytics go to Always On secondary replicas via read-intent routing. I also enable RCSI on the primary, which allows readers to access versioned data in TempDB without blocking writers, eliminating the fundamental reader-writer contention pattern."

---

## Scenario 2: Slow Inventory Query Caused by Stale Statistics

**Situation:** Monday 2:00 PM. Warehouse distribution trucks are sitting idle because inventory manifest scans take minutes instead of seconds.

**Business impact:** Fresh-food delivery guarantees are threatened. Supply chain bottlenecks cascade.

**Symptoms:** An inventory query that normally runs in 50ms now takes several minutes. sys.dm_exec_requests shows PAGEIOLATCH_SH waits. Execution plan shows Hash Match instead of Index Seek. Estimated rows = 1, Actual rows = 2.5 million.

**Investigation steps:**
1. Check execution plan for cardinality mismatch.
2. Check sys.dm_db_stats_properties for last statistics update date.
3. Compare Query Store historical plans.

**Tools/DMVs used:** Query Store, sys.dm_db_stats_properties, actual execution plan

**Root cause:** A large inventory batch load updated millions of rows. Statistics became stale. The optimizer predicted 1 row return and chose a Nested Loop plan that performed millions of unexpected logical reads.

**Immediate fix:** Run UPDATE STATISTICS Warehouse.InventoryTable WITH FULLSCAN. Force the known good plan via Query Store.

**Long-term prevention:** Enable AUTO_UPDATE_STATISTICS_ASYNC. Schedule high-frequency incremental statistics updates for volatile tables. Monitor statistics modification counters.

**Short interview answer:** "I would check for cardinality mismatches in the execution plan, update statistics with FULLSCAN, and force a known good plan via Query Store to restore warehouse operations immediately."

**Senior-level interview answer:** "This is a classic cardinality regression. When a large batch load outpaces auto-statistics thresholds, the optimizer generates plans based on incorrect assumptions. My immediate step is operational recovery: I force the previously stable execution plan via Query Store to get warehouse trucks moving. Then I investigate via sys.dm_db_stats_properties, confirm the stale statistics, and run UPDATE STATISTICS WITH FULLSCAN. For prevention, I enable asynchronous statistics updates to prevent query stalling, and I schedule proactive statistics maintenance for high-volatility tables using modification counter thresholds."

---

## Scenario 3: Always On AG Latency Affecting Checkout Performance

**Situation:** Wednesday 3:30 PM. After a network re-routing update between primary and DR data centers, synchronous AG replication latency spikes.

**Business impact:** Register response times spike globally. Payment transaction verifications are delayed.

**Symptoms:** High HADR_SYNC_COMMIT waits. Hundreds of checkout queries suspended. sys.dm_hadr_database_replica_states shows growing log_send_queue_size.

**Investigation steps:**
1. Query sys.dm_exec_requests for HADR_SYNC_COMMIT waits.
2. Check sys.dm_hadr_database_replica_states for log_send and redo queue sizes.
3. Test network RTT between replica nodes.

**Tools/DMVs used:** sys.dm_exec_requests, sys.dm_hadr_database_replica_states, Performance Monitor

**Root cause:** Network routing update increased WAN round-trip time. Synchronous commit acknowledgments are delayed, causing primary transactions to wait.

**Immediate fix:** ALTER AVAILABILITY GROUP to switch the remote secondary from synchronous to asynchronous commit mode. This removes the acknowledgment bottleneck and restores primary transaction throughput.

**Long-term prevention:** Dedicated network lines for AG replication. Proactive alerts on transaction delay counters. Regular network latency monitoring.

**Short interview answer:** "I would confirm HADR_SYNC_COMMIT waits, temporarily switch the replica to asynchronous commit to restore checkout processing, then work with the network team to resolve the routing issue."

**Senior-level interview answer:** "Synchronous replication binds primary transaction speed to secondary acknowledgment latency. When WAN latency spikes, checkout lines stall. My first priority is protecting live store operations. I inspect sys.dm_hadr_database_replica_states to confirm the delay, then execute an emergency ALTER AVAILABILITY GROUP command to flip the secondary to asynchronous mode. This unlinks primary execution from WAN response times. Once the network team resolves the routing issue, I return the replica to synchronous mode during a verified stability window, confirming log send queue resolution beforeswitching."

---

## Scenario 4: Log Shipping Broken by Missing LSN Chain

**Situation:** Thursday 6:00 AM. The remote DR site log shipping restore job has been failing for 18 hours.

**Business impact:** The remote backup facility is out of sync. If the primary data center fails, recovery will be significantly delayed.

**Symptoms:** Log shipping restore job fails with LSN mismatch error. msdb.dbo.log_shipping_monitor_secondary shows the failure. msdb.dbo.backupset shows an unauthorized ad-hoc log backup without COPY_ONLY.

**Investigation steps:**
1. Review log shipping history via msdb.dbo.log_shipping_monitor_secondary.
2. Check msdb.dbo.backupset for ad-hoc log backups.
3. Compare last applied LSN on secondary against available log files.

**Tools/DMVs used:** Log Shipping monitoring tables, msdb.dbo.backupset, SQL Agent job history

**Root cause:** An ad-hoc backup tool ran a log backup without COPY_ONLY, breaking the LSN chain.

**Immediate fix:** Take a differential backup from the primary. Restore it on the secondary WITH NORECOVERY to re-sync past the broken LSN gap. Resume log shipping.

**Long-term prevention:** Remove ad-hoc backup rights from unauthorized users. Mandate COPY_ONLY for all ad-hoc backups. Configure monitoring alerts on log shipping sync thresholds.

**Short interview answer:** "I would identify the unauthorized backup that broke the LSN chain, apply a differential backup to re-sync the secondary, and enforce COPY_ONLY for all ad-hoc backups."

**Senior-level interview answer:** "A broken LSN chain means an ad-hoc log backup was executed without COPY_ONLY. Instead of transferring a full database over the WAN, I take a fresh differential backup on the primary and restore it on the secondary WITH NORECOVERY. This fast-forwards the secondary past the broken sequence, aligning it with the primary log stream. Automated log shipping jobs resume with minimal overhead. For prevention, I remove ad-hoc backup permissions from unauthorized accounts, mandate COPY_ONLY in all backup scripts, and configure alerts on log shipping sync thresholds."

---

## Scenario 5: Backup Restore During Database Corruption

**Situation:** Friday 7:30 AM. Storage I/O error corrupts a data page in the central retail member database. Database goes SUSPECT.

**Business impact:** Cashiers cannot process member discounts. Mobile app checkout fails. Growing queues at registers across Denmark.

**Symptoms:** SQL Server Error Log flags 823/824 I/O error. Database status = SUSPECT. Active connections dropped.

**Investigation steps:**
1. Check xp_readerrorlog for corrupted file ID, page ID, fault type.
2. Query msdb.dbo.suspect_pages.
3. Verify WSFC and storage health.

**Tools/DMVs used:** xp_readerrorlog, sys.master_files, msdb.dbo.suspect_pages

**Root cause:** Physical block dropped on storage array, causing torn page write that failed checksum validation.

**Immediate fix:** Take tail-log backup WITH NORECOVERY. Restore latest full backup WITH NORECOVERY. Restore latest differential WITH NORECOVERY. Restore sequential log backups up to corruption point. Final restore WITH RECOVERY.

**Long-term prevention:** Automated alerts for Error Log severities 22-25. Daily DBCC CHECKDB WITH PHYSICAL_ONLY. Storage health monitoring.

**Short interview answer:** "I would pull corruption details from the error log, take a tail-log backup to preserve in-flight data, and execute a restore sequence using the clean backup chain."

**Senior-level answer:** "When a database goes SUSPECT, my priority is data preservation. I check xp_readerrorlog to evaluate if it is isolated page corruption or total storage failure. I query suspect_pages. If the infrastructure is stable, I take a tail-log backup WITH NORECOVERY to safeguard in-flight transactions. I restore from the latest clean full, differential, and log chain. For isolated corruption, I would also consider an online page restore to keep the rest of the database online while repairing only the damaged pages."

---

## Scenario 6: TempDB Contention During Warehouse Workload Spike

**Situation:** Monday 6:00 AM. Shift change at automated distribution center. Hundreds of warehouse scanners connect concurrently, creating temporary tables for inventory scans.

**Business impact:** Conveyor sorting stops. Inbound shipping containers stack up outside the facility.

**Symptoms:** PAGELATCH_UP and PAGELATCH_EX waits on database ID 2 (addresses 2:1:1, 2:1:3). TempDB has only one data file.

**Investigation steps:**
1. Query sys.dm_os_waiting_tasks for PAGELATCH waits on database ID 2.
2. Count and size TempDB data files.
3. Examine workload for temp table creation patterns.

**Tools/DMVs used:** sys.dm_os_waiting_tasks, sys.dm_db_page_info, sys.dm_os_wait_stats

**Root cause:** Allocation bottleneck on TempDB metadata pages (PFS/GAM) caused by concurrent temp table creation on an instance with a single TempDB data file.

**Immediate fix:** Add data files to TempDB (up to 8, matching CPU core count), with identical size and autogrowth settings.

**Long-term prevention:** Enable Trace Flags 1117/1118 on older instances. Work with developers to use table variables or memory-optimized types instead of temp tables.

**Short interview answer:** "I would check for PAGELATCH_UP waits on database ID 2, then split TempDB into multiple equally sized data files to eliminate allocation contention."

**Senior-level answer:** "PAGELATCH waits on database ID 2 indicate metadata page contention, not IO pressure. This happens when concurrent threads compete for PFS/GAM allocation pages. I expand TempDB to multiple data files matching the CPU core count, ensuring identical size and autogrowth for proportional fill. For long-term prevention, I collaborate with developers to reduce temp table churn using memory-optimized table types or table variables, which bypass the TempDB allocation path entirely."

---

## Scenario 7: SQL Agent Job Failure Affecting Pricing or Backup Chain

**Situation:** Tuesday 8:00 AM. The nightly pricing distribution job failed at 2:00 AM. Stores are displaying yesterday's prices.

**Business impact:** Incorrect pricing across stores. Customer complaints. Regulatory risk for mispriced items.

**Symptoms:** SQL Agent job history shows failure. Job step output indicates a timeout or connection error. Pricing database is not updated.

**Investigation steps:**
1. Check msdb.dbo.sysjobhistory for the failure time and error.
2. Check job step output for specific error details.
3. Check if the target server or network was available at the failure time.

**Tools/DMVs used:** msdb.dbo.sysjobhistory, msdb.dbo.sysjobsteps, SQL Agent alerts

**Root cause:** Network timeout during the pricing feed import step. The job did not have retry logic configured.

**Immediate fix:** Manually re-execute the failed job step. Verify pricing data is current. Notify store operations.

**Long-term prevention:** Add retry logic to critical jobs. Configure alert notifications for job failures. Add a secondary validation step that confirms data freshness.

**Short interview answer:** "I would check the job history for the failure details, re-execute the failed step, and add retry logic and alerts to prevent recurrence."

**Senior-level answer:** "A failed pricing job means incorrect data in stores. I first check job history and step output to identify the failure point. If it is a transient issue like a network timeout, I re-execute the step and validate the output. For prevention, I add retry logic with exponential backoff, configure SQL Agent alert notifications for critical job failures, and add a post-execution validation step that confirms pricing data freshness before marking the job as successful."

---

## Scenario 8: Disk Capacity Issue Caused by Transaction Log Growth

**Situation:** Wednesday 11:00 AM. A large inventory update runs during business hours. Transaction log grows to fill the drive.

**Business impact:** Disk space alerts fire. Autogrowth may fail. Database could go offline if the log drive is full.

**Symptoms:** sys.dm_db_log_space_usage shows high log usage. log_reuse_wait_desc shows ACTIVE_TRANSACTION or DATABASE_REPLICATION. The large update transaction is still running.

**Investigation steps:**
1. Check sys.databases log_reuse_wait_desc.
2. Check sys.dm_tran_active_transactions for long-running transactions.
3. Check disk free space and autogrowth settings.

**Tools/DMVs used:** sys.databases, sys.dm_db_log_space_usage, sys.dm_tran_active_transactions

**Root cause:** A large inventory update transaction is still active, preventing log truncation. The log grew to fill the available disk space.

**Immediate fix:** If the transaction is non-critical, KILL it to release the log. If it must complete, wait for it to finish, then take a log backup to truncate the log.

**Long-term prevention:** Schedule large batch operations during low-traffic windows. Monitor log usage proactively. Configure appropriate autogrowth with max size limits. Implement log backup frequency aligned with transaction volume.

**Short interview answer:** "I would check log_reuse_wait_desc to identify why the log is not truncating, then either kill the long-running transaction or wait for it to complete and take a log backup."

**Senior-level answer:** "Log file growth is almost always caused by untruncated logs. I check log_reuse_wait_desc first. If it shows ACTIVE_TRANSACTION, I identify the long-running transaction via sys.dm_tran_active_transactions. If it is a non-critical batch operation, I kill it and take a log backup to reclaim space. If it must complete, I monitor until it finishes. For prevention, I schedule large batch operations during maintenance windows, configure log backups at appropriate frequency, and set max size limits with proactive disk space alerts."

---

## Scenario 9: Patch or Upgrade Planning in an HA Environment

**Situation:** Thursday 9:00 AM. A critical security patch must be applied to SQL Server 2019 instances within two weeks. The instances are in Always On AG configurations.

**Business impact:** Delaying the patch exposes the business to known security vulnerabilities. Applying the patch incorrectly could cause downtime.

**Symptoms:** Current CU level is three months behind. Security team requires patching before the next compliance audit.

**Investigation steps:**
1. Check SERVERPROPERTY('ProductVersion') for current CU level.
2. Review the CU release notes for known issues and fixes.
3. Test the patch in a non-production environment that mirrors production.

**Tools/DMVs used:** SERVERPROPERTY('ProductVersion'), Data Migration Assistant, test environment

**Root cause:** Patches were delayed due to fear of downtime. No rolling upgrade process was documented.

**Immediate fix:** Execute rolling upgrade: patch secondary replicas first, validate stability, failover, patch the former primary, validate, failback.

**Long-term prevention:** Establish a regular patching schedule. Document rolling upgrade procedures. Maintain a test environment for validation.

**Short interview answer:** "I would test the patch in a non-production environment, then execute rolling upgrades across secondary replicas first, failover, and patch the former primary."

**Senior-level answer:** "Patching in an HA environment requires a rolling upgrade strategy. I test the CU in a staging environment first. Then I patch secondary replicas one at a time, allowing each to catch up with the primary. Once all secondaries are patched and healthy, I perform a controlled failover to a patched secondary. I then patch the former primary. After validation, I failback. This maintains availability throughout the process. I validate performance post-patch using Query Store baselines."

---

## Scenario 10: Azure/Cloud Migration Readiness Assessment

**Situation:** Friday 2:00 PM. Management asks whether the legacy SQL Server 2014 estate should move to Azure.

**Business impact:** Premature migration could break applications. Delayed migration leaves the business on unsupported platforms.

**Symptoms:** SQL Server 2014 is end-of support (July 2024). Several databases use features not supported in Azure SQL Database.

**Investigation steps:**
1. Run Data Migration Assistant against each database.
2. Map dependencies: cross-database queries, linked servers, CLR, Agent jobs.
3. Assess workload requirements: RPO/RTO, OS access, feature compatibility.

**Tools/DMVs used:** Data Migration Assistant, sys.servers, sys.dm_exec_cached_plans

**Root cause:** No prior assessment was done. The team assumes "cloud is always better."

**Immediate fix:** Complete the assessment. Present platform recommendations per workload: Azure SQL Database for isolated PaaS workloads, Managed Instance for workloads needing Agent jobs/cross-db queries, Azure VM for OS-level control.

**Long-term prevention:** Establish a cloud readiness assessment process for all databases. Create a migration roadmap aligned with business priorities.

**Short interview answer:** "I would run Data Migration Assistant, map all dependencies, and recommend the right Azure platform per workload based on feature compatibility and RPO/RTO requirements."

**Senior-level answer:** "Cloud migration is a workload placement decision, not a blanket move. I start with DMA to identify compatibility issues. I map all dependencies: cross-database queries, linked servers, CLR, Agent jobs. Then I classify each workload: Azure SQL Database for isolated PaaS workloads, Managed Instance for near-full SQL Server compatibility, Azure VM for OS-level control. I present a workload-by-workload recommendation with cost estimates, migration paths, and rollback plans."

---

# 5. DMV and Troubleshooting Cheat Sheet

| Problem | First DMV/Tool | What Signal to Look For | What It Means | Action to Take |
|:---|:---|:---|:---|:---|
| **Query is slow right now** | sys.dm_exec_requests | wait_type, blocking_session_id, cpu_time, reads | Identifies if query is blocked, waiting on IO, or consuming CPU | Check blocking chain, examine execution plan, check stats |
| **Who is blocking whom** | sp_WhoIsActive | blocking_session_id chain, wait_type, T-SQL text | Shows root blocker at top of chain | Identify root blocker, examine their query, KILL if necessary |
| **What is the server waiting on** | sys.dm_os_wait_stats | Top wait types by total_wait_time_ms | PAGEIOLATCH = storage, LCK_M = locks, CXPACKET = parallelism, WRITELOG = log writes | Match wait type to root cause, address the specific bottleneck |
| **Current blocking sessions** | sys.dm_tran_locks | resource_type, request_mode, request_session_id | Shows which sessions hold which locks on which objects | Identify lock escalation, long-running transactions, missing indexes |
| **Top resource-consuming queries** | sys.dm_exec_query_stats | total_logical_reads, total_cpu_time, execution_count | Identifies queries consuming the most resources overall | Tune top resource consumers, add indexes, rewrite queries |
| **Query plan regression** | Query Store | avg_duration, plan_id changes over time | Old plan was fast, new plan is slow | Force known good plan, investigate root cause of regression |
| **Index not being used** | sys.dm_db_index_usage_stats | user_seeks = 0, user_scans = low | Index is unused overhead | Consider dropping unused indexes to reduce write overhead |
| **Statistics are stale** | sys.dm_db_stats_properties | modification_counter, last_updated | High modification count with old last_updated = stale | UPDATE STATISTICS WITH FULLSCAN |
| **IO latency on database files** | sys.dm_io_virtual_file_stats | io_stall_read_ms, io_stall_write_ms, num_of_reads | High stall times indicate storage bottleneck | Check storage health, review file placement, consider faster storage |
| **AG replica out of sync** | sys.dm_hadr_database_replica_states | log_send_queue_size, redo_queue_size, synchronization_health | Growing queues indicate sync problems | Check network, check replica health, consider async mode temporarily |
| **Transaction log not truncating** | sys.databases (log_reuse_wait_desc) | AVAILABILITY_GROUP, ACTIVE_TRANSACTION, DATABASE_REPLICATION | Log truncation blocked by specific reason | Address the specific wait: fix AG sync, kill long transaction, check replication |
| **Backup history missing** | msdb.dbo.backupset | backup_finish_date, type, family_count | Gaps in backup chain | Verify backup jobs, check for ad-hoc backups breaking chain |
| **Error details** | SQL Server Error Log | Error severity, message text, database, file/page ID | Identifies corruption, I/O errors, security events | Check severity: 16+ = action needed, 22+ = corruption/硬件 |
| **Job failure details** | SQL Agent Job History | step_id, run_status, message | Job failed, which step, what error | Fix the failing step, add retry logic, configure alerts |
| **Active sessions and queries** | sp_WhoIsActive | session_id, status, command, wait_type, blocking_session_id | Real-time view of all active sessions | Immediate diagnostic starting point for any performance issue |
| **Comprehensive health check** | First Responder Kit (sp_Blitz) | Multiple output rows covering config, health, security | Identifies dozens of common issues in one pass | Run sp_Blitz for initial assessment, sp_BlitzFirst for real-time checks |

---

# 6. Interview Answer Bank

## Question 1: "Tell me about your SQL Server operations experience."

**Weak answer:** "I have been working with SQL Server for several years. I do backups, performance tuning, and help with issues."

**Strong senior DBA answer:** "I have managed SQL Server platforms in enterprise environments with a focus on availability, recoverability, performance, and security. My daily work includes health monitoring, backup validation, performance troubleshooting, HA/DR management, automation, patching, and incident response. I work across teams: infrastructure, development, security, and business stakeholders."

**Follow-up:** "What is the most critical system you have managed?"  
**One sentence to memorize:** "I treat every SQL Server instance as a business service, not just a database engine."  
**Words to avoid:** "I mostly do backups and indexes."

---

## Question 2: "How do you troubleshoot a slow SQL Server?"

**Weak answer:** "I check CPU and memory, then restart if needed."

**Strong senior DBA answer:** "I start with sp_WhoIsActive to check for blocking and active queries. I examine wait statistics to identify the bottleneck type: IO, locks, CPU, or network. I check the execution plan for cardinality mismatches, scans, and key lookups. I verify statistics freshness and index usage. I correlate findings with recent changes: deployments, batch jobs, storage changes."

**Follow-up:** "What if the wait stats show PAGEIOLATCH?"  
**One sentence to memorize:** "I use telemetry to identify the bottleneck, not intuition."  
**Words to avoid:** "I restart the server" or "I look at Task Manager."

---

## Question 3: "Explain Always On Availability Groups and when you would use them."

**Weak answer:** "Always On is the best HA feature in SQL Server. It replicates databases across servers."

**Strong senior DBA answer:** "Always On Availability Groups replicate groups of databases across replicas. Synchronous commit provides zero data loss (RPO=0) for local HA. Asynchronous commit provides better performance for remote DR but introduces potential data loss. I configure the mode based on RPO/RTO requirements and network latency. I monitor log send and redo queues, test failover regularly, and ensure logins, jobs, and permissions are synchronized across replicas."

**Follow-up:** "What happens if the secondary replica falls behind?"  
**One sentence to memorize:** "I choose sync or async based on business RPO/RTO, not default settings."  
**Words to avoid:** "We use Always On because it is the best."

---

## Question 4: "How do you approach backup and restore strategy?"

**Weak answer:** "I take full backups every night and check that they complete."

**Strong senior DBA answer:** "I design backup strategy around RPO requirements. For a 15-minute RPO, I use full backups daily, differentials every 4-6 hours, and log backups every 5-10 minutes. I use compression, CHECKSUM, and striping for large databases. I automate daily restore verification on an isolated test instance. A backup is only as good as its last successful restore."

**Follow-up:** "How do you verify a backup is actually good?"  
**One sentence to memorize:** "I prove backups work by restoring them, not by checking green checkboxes."  
**Words to avoid:** "I check the job history to see if it says green."

---

## Question 5: "What is your automation philosophy?"

**Weak answer:** "I automate backups and index maintenance."

**Strong senior DBA answer:** "I automate everything I repeat: backups, integrity checks, index maintenance, statistics updates, disk space monitoring, job failure alerting, capacity reporting. I use PowerShell for multi-server operations, T-SQL for single-server tasks, and SQL Agent for scheduling. I version-control all scripts, add error handling and logging, and test in non-production before deploying."

**Follow-up:** "What tasks should never be done manually?"  
**One sentence to memorize:** "Automation removes human error and protects the team at 2 AM."  
**Words to avoid:** "I use the GUI to check everything."

---

## Question 6: "How do you handle a production incident?"

**Weak answer:** "I log in and figure out what is wrong."

**Strong senior DBA answer:** "My first 5 minutes: check impact (which systems are affected), check blocking with sp_WhoIsActive, check wait stats, check CPU/memory/IO, check recent changes. I communicate status to stakeholders within 10 minutes. I stabilize first (kill blocking sessions if needed), then investigate root cause. I document everything and conduct a post-incident review."

**Follow-up:** "What if you cannot find the root cause immediately?"  
**One sentence to memorize:** "I stabilize the business first, then investigate the root cause methodically."  
**Words to avoid:** "I just log in and figure it out."

---

## Question 7: "How do you enforce security on production SQL Server?"

**Weak answer:** "I give developers the access they need."

**Strong senior DBA answer:** "I enforce least privilege. No developer gets sysadmin access. I use role-based access control: db_datareader for read access, db_datawriter for write access, execute permission for specific stored procedures. I audit sysadmin access quarterly. I enable TDE for data at rest, configure SQL Server Audit for compliance, and manage service accounts with minimal permissions."

**Follow-up:** "A developer asks for sysadmin access to troubleshoot. What do you do?"  
**One sentence to memorize:** "I grant controlled access with approval, not blanket sysadmin privileges."  
**Words to avoid:** "I give them sysadmin access so they can troubleshoot."

---

## Question 8: "How do you approach patching SQL Server?"

**Weak answer:** "I apply patches when they come out."

**Strong senior DBA answer:** "I maintain a patching schedule aligned with Microsoft's CU cycle. I test in staging first. For Always On environments, I use rolling upgrades: patch secondaries, failover, patch the former primary. I validate performance post-patch using Query Store baselines. I never skip security patches."

**Follow-up:** "What if a patch introduces a performance regression?"  
**One sentence to memorize:** "I test patches before production and validate performance after."  
**Words to avoid:** "I avoid patches because they might break things."

---

## Question 9: "When would you choose Azure SQL Database vs. Managed Instance vs. Azure VM?"

**Weak answer:** "Azure is always better than on-prem."

**Strong senior DBA answer:** "Azure SQL Database for isolated PaaS workloads with no OS dependency. Managed Instance for near-full SQL Server compatibility including Agent jobs, cross-database queries, and CLR. Azure VM when you need OS-level control. I assess each workload individually and migrate to the platform that meets its requirements."

**Follow-up:** "What features are not supported in Azure SQL Database?"  
**One sentence to memorize:** "Cloud is a workload placement decision, not a blanket move."  
**Words to avoid:** "Azure is always better."

---

## Question 10: "How do you handle a developer who wants to deploy a query that will cause blocking?"

**Weak answer:** "I block the deployment."

**Strong senior DBA answer:** "I explain the risk with evidence: execution plan showing table scans, wait stats showing blocking potential, comparison to similar past incidents. I propose alternatives: add an index, rewrite the query, redirect to a read replica. I document the decision and the trade-offs. I collaborate, not dictate."

**Follow-up:** "What if the developer insists?"  
**One sentence to memorize:** "I provide evidence and alternatives, not just objections."  
**Words to avoid:** "I block the deployment because I said so."

---

# 7. Expert DBA Notes: What an Expert Would Notice

## What Beginners Usually Miss

- Accidental inclusion of development databases in production AGs, causing unnecessary log generation.
- Forgetting to sync SQL Agent jobs, logins, and linked servers across Always On replicas.
- Running diagnostic scripts without checking their resource impact on a production server.
- Creating indexes based on missing index warnings without checking for duplicates and write overhead.
- Assuming a green backup job means the backup is restorable.
- Not having a rollback plan for changes.
- Configuring too many alerts that cause fatigue, or too few that let problems go undetected.

## What a Senior DBA Checks First

- Business impact: which systems are affected, how many customers are impacted.
- Recent changes: deployments, patches, storage changes, network changes.
- Telemetry: DMVs, wait stats, execution plans, error logs.
- HA/DR status: are replicas in sync, is quorum healthy.
- Backup chain: is the chain intact, when was the last successful restore test.

## What Trade-offs Matter

- Synchronous AG = zero data loss but primary speed bound to network latency.
- Asynchronous AG = better primary performance but potential data loss on failover.
- Online index rebuild = no table locks but more IO and CPU.
- More indexes = faster reads but slower writes and more maintenance overhead.
- Backup compression = smaller backups but more CPU during backup.
- TDE = data encryption at rest but CPU overhead and backup compression impact.

## What Can Go Wrong if the Fix is Applied Blindly

- Shrinking a database file: fractures indexes, causes heavy IO, file grows back immediately.
- Restarting SQL Server: clears plan cache, hides root cause, causes connection drops.
- Adding indexes without checking write overhead: slows down all INSERT/UPDATE/DELETE operations.
- Forcing a Query Store plan without understanding why the regression occurred: forced plans become stale.
- Running DBCC CHECKDB with default options on a large database during peak hours: excessive resource consumption.
- Killing sessions without understanding what transaction was in progress: data inconsistency.

## How to Show Production Maturity in Your Answer

- Always connect technical decisions to business impact: RPO, RTO, revenue, customers.
- Measure before you change: baseline first, then tune.
- Test before you deploy: staging environment, rollback plan.
- Document what you know: runbooks, incident reports, decision records.
- Automate what you repeat: remove human error from routine tasks.
- Communicate clearly during incidents: status updates, next steps, ETA.
- Learn from incidents: post-incident review, root cause analysis, preventive actions.

---

# 8. 60-Minute Quick Revision Plan

## First 15 Minutes: Must-Know Concepts

| Time | Topic | What to Review |
|:---|:---|:---|
| 0-5 min | 24/7 Operations Mindset | Daily health checks, what to monitor, incident response workflow |
| 5-10 min | RPO/RTO | Definition, how it drives architecture, how to explain it |
| 10-15 min | Backup Strategy | Full/Diff/Log, recovery models, restore testing, CHECKSUM |

## Next 15 Minutes: HA/DR and Backup

| Time | Topic | What to Review |
|:---|:---|:---|
| 15-20 min | Always On AG | Sync vs async, listener, failover, log truncation issues |
| 20-25 min | Log Shipping | LSN chain, COPY_ONLY, re-initialization with differential |
| 25-30 min | HA vs DR | Difference, architecture choices, testing requirements |

## Next 15 Minutes: Performance Troubleshooting

| Time | Topic | What to Review |
|:---|:---|:---|
| 30-35 min | Wait Statistics | Top wait types, what they mean, how to use them |
| 35-40 min | Execution Plans | Scans vs seeks, cardinality, key lookups, implicit conversions |
| 40-45 min | Blocking/Deadlocks | sp_WhoIsActive, blocking chain, lock escalation, RCSI |

## Final 15 Minutes: Scenario Practice and Interview Answers

| Time | Topic | What to Review |
|:---|:---|:---|
| 45-50 min | POS Blocking Scenario | Walk through: symptoms, investigation, fix, prevention |
| 50-55 min | AG Latency Scenario | Walk through: symptoms, investigation, async switch, prevention |
| 55-60 min | Interview Answer Practice | Practice 3 strongest answers with natural language |

---

# 9. Final Interview Checklist

## Concepts to Revise

- [ ] RPO/RTO and how they drive HA/DR architecture
- [ ] Backup strategy: full, differential, log, compression, striping, restore testing
- [ ] Always On AG: sync vs async, failover, log truncation issues, job/login sync
- [ ] Log Shipping: LSN chain, COPY_ONLY, re-initialization
- [ ] Wait statistics: PAGEIOLATCH, LCK_M, CXPACKET, WRITELOG, HADR_SYNC_COMMIT
- [ ] Execution plans: scans vs seeks, cardinality, key lookups, implicit conversions
- [ ] Blocking and deadlocks: sp_WhoIsActive, lock escalation, RCSI
- [ ] TempDB contention: PAGELATCH, data files, proportional fill
- [ ] Query Store: plan regression, forcing, historical comparison
- [ ] Index maintenance: fragmentation thresholds, ONLINE rebuild, unused indexes
- [ ] Statistics: stale stats, sys.dm_db_stats_properties, FULLSCAN update
- [ ] Security: least privilege, TDE, SQL Server Audit, service accounts
- [ ] Patching: rolling upgrades, testing, performance validation
- [ ] Azure: SQL Database vs Managed Instance vs Azure VM
- [ ] Migration: DMA assessment, dependency mapping, rollback planning

## Scenarios to Practice

- [ ] POS slowdown caused by blocking (reporting query locking checkout tables)
- [ ] Slow inventory query caused by stale statistics
- [ ] Always On AG latency affecting checkout performance
- [ ] Log Shipping broken by missing LSN chain
- [ ] Backup restore during database corruption (SUSPECT state)
- [ ] TempDB contention during warehouse workload spike
- [ ] SQL Agent job failure affecting pricing
- [ ] Disk capacity issue caused by transaction log growth
- [ ] Patch planning in an HA environment
- [ ] Azure migration readiness assessment

## DMVs to Remember

- [ ] sys.dm_exec_requests (current requests, waits, blocking)
- [ ] sp_WhoIsActive (real-time session analysis)
- [ ] sys.dm_os_wait_stats (cumulative wait types)
- [ ] sys.dm_tran_locks (lock information)
- [ ] sys.dm_exec_query_stats (top resource-consuming queries)
- [ ] Query Store (plan history and regression detection)
- [ ] sys.dm_db_index_usage_stats (index utilization)
- [ ] sys.dm_db_stats_properties (statistics freshness)
- [ ] sys.dm_io_virtual_file_stats (IO latency)
- [ ] sys.dm_hadr_database_replica_states (AG health)
- [ ] sys.databases (log_reuse_wait_desc)
- [ ] msdb.dbo.backupset (backup history)
- [ ] SQL Server Error Log (errors and warnings)
- [ ] SQL Agent Job History (job failures)

## My Strongest Stories to Prepare

- [ ] Incident where I identified and resolved blocking affecting production
- [ ] Performance issue I diagnosed using wait statistics and execution plans
- [ ] HA/DR failover I executed successfully
- [ ] Migration or upgrade I planned and executed with minimal downtime
- [ ] Automation I implemented that reduced manual effort or prevented incidents

## Junior DBA Answers to Stop Saying

- [ ] "I restart the server" → Say: "I diagnose the root cause using DMVs"
- [ ] "I shrink the database" → Say: "I address the root cause of disk growth"
- [ ] "I add an index based on the missing index warning" → Say: "I analyze the execution plan and write workload before adding indexes"
- [ ] "I check if the server is online" → Say: "I check backup status, job failures, disk space, blocking, AG health, and error logs"
- [ ] "I give developers sysadmin access" → Say: "I grant controlled, least-privilege access with approval"
- [ ] "I look at the code to see if it looks right" → Say: "I analyze the actual execution plan to identify high-cost operators"
- [ ] "We use Always On because it is the best" → Say: "I chose it based on RPO/RTO requirements and network latency"
- [ ] "I check the job history to see if it says green" → Say: "I verify backups by restoring them on a test instance"

---

# 10. Supplementary Deep-Dive Reference

*Source: dist/index.html — the full interactive study guide. This section captures unique technical depth not covered in the earlier chapters.*

---

## 10.1 Query Store Deep Dive

**What Query Store captures:**
- Query text (normalized, parameterized)
- Execution plans (one query can have multiple plans over time)
- Runtime statistics (duration, CPU, IO, memory per plan)
- Wait statistics (SQL Server 2022+ — per-query waits)
- Query hints (SQL Server 2022+ — forced plan modifiers without code changes)

**Production-ready configuration:**
```sql
ALTER DATABASE [YourDB] SET QUERY_STORE (
    OPERATION_MODE = READ_WRITE,
    CLEANUP_POLICY = (STALE_QUERY_THRESHOLD_DAYS = 14),
    DATA_FLUSH_INTERVAL_SECONDS = 120,
    INTERVAL_LENGTH_MINUTES = 30,
    MAX_STORAGE_SIZE_MB = 1024,
    QUERY_CAPTURE_MODE = AUTO,
    SIZE_BASED_CLEANUP_MODE = AUTO,
    MAX_PLANS_PER_QUERY = 200,
    WAIT_STATS_CAPTURE_MODE = ON  -- SQL Server 2022+
);
```

**Critical configuration notes:**

| Option | Default | Recommendation | Why |
|:---|:---|:---|:---|
| MAX_STORAGE_SIZE_MB | 100 MB | 500–2000 MB | Default fills in days on busy systems → QS auto-switches to READ_ONLY |
| DATA_FLUSH_INTERVAL_SECONDS | 900 (15 min) | 60–300 (1–5 min) | Lower = less data loss on crash |
| QUERY_CAPTURE_MODE | ALL | AUTO | ALL captures everything (overhead). AUTO captures relevant queries |
| WAIT_STATS_CAPTURE_MODE | OFF | ON | Per-query wait stats — game changer (SQL 2022+) |

**Plan regression detection workflow:**

Step 1 — Find regressed queries:
```sql
SELECT TOP 10
    qsq.query_id,
    MAX(qsp.query_plan_hash) AS current_plan_hash,
    MAX(IIF(rsi.start_time < DATEADD(DAY, -1, GETDATE()), rs.avg_duration, NULL)) AS prev_avg_duration,
    MAX(IIF(rsi.start_time >= DATEADD(DAY, -1, GETDATE()), rs.avg_duration, NULL)) AS curr_avg_duration,
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

Step 2 — Force the known good plan:
```sql
EXEC sys.sp_query_store_force_plan
    @query_id = @QueryID,
    @plan_id = @OldPlanID;
```

**SQL Server 2022 features:**
- Query Store on secondary replicas (previously invisible)
- Per-query wait statistics via sys.query_store_wait_stats
- Query Store Hints — apply hints without changing application code:
```sql
EXEC sys.sp_query_store_set_hints
    @query_id = @QueryID,
    @query_hints = N'OPTION (USE HINT(''DISABLE_PARAMETER_SNIFFING''), MAXDOP 1)';
```

**Common Query Store mistakes:**

| Mistake | Consequence | Fix |
|:---|:---|:---|
| Default 100 MB max size | QS fills up, silently stops capturing | Set to 512–2048 MB |
| QUERY_CAPTURE_MODE = ALL on busy OLTP | High overhead, fills storage faster | Use AUTO |
| Plan forcing without root cause | Masking the real problem | Always investigate why plan changed |
| Not monitoring force failures | Query silently used bad plan | Check force_failure_count regularly |
| QS on system databases | Not supported for master, model, msdb, tempdb | Only enable on user databases |

---

## 10.2 Indexing Deep Dive

**B-Tree structure — how indexes actually work:**

A clustered index has three levels:
- Root page (1 page at top)
- Intermediate pages (2+ levels for large tables)
- Leaf pages = the actual data pages (the index IS the table)

A nonclustered index has the same structure, but the leaf level contains index key columns + bookmark (clustered index key or RID) pointing to the data row.

**Clustered index selection — what makes a good clustered key:**

| Property | Why | Example |
|:---|:---|:---|
| Narrow | Clustered key is copied to all NC indexes | INT (4 bytes) vs GUID (16 bytes) |
| Unique | SQL Server adds a 4-byte uniquifier if not unique | Identity, sequence |
| Static | Updates to clustered key cascade to NC indexes | Ever-increasing values are ideal |
| Ever-increasing | Reduces page splits | IDENTITY, SEQUENCE, DATETIME |
| Used for range scans | Clustered index is fastest for range queries | OrderDate, OrderID |

**Warning:** GUID as clustered index (NEWID()) generates random GUIDs causing massive fragmentation and page splits. If you must use GUID, use NEWSEQUENTIALID().

**Nonclustered index design — covering indexes:**

```sql
-- Covering index: all columns needed by the query are IN the index
CREATE NONCLUSTERED INDEX IX_Orders_CustomerID
ON dbo.Orders(CustomerID, OrderDate DESC)
INCLUDE (OrderAmount, OrderStatus, ShippingAddress);
-- No key lookups needed for queries selecting these columns
```

How to design a covering index:
1. Identify the query's WHERE predicates → key columns
2. Identify ORDER BY → key columns (same direction) or included
3. Identify SELECT columns → included columns
4. Check if the index is covering (no key lookups in the plan)

**Key Lookups — the silent performance killer:**

When a nonclustered index is used but doesn't cover the query, SQL Server does a key lookup (clustered) or RID lookup (heap) to fetch the missing columns.

```sql
Index Seek (IX_Orders_CustomerID)  →  finds 10,000 rows
    ↓
Key Lookup (clustered index)  →  for each row, go lookup the full row
    ↓
10,000 random I/Os  →  SLOW!
```

Fix: Add missing columns as INCLUDE columns in the nonclustered index.

**Columnstore indexes — when to use:**

| | Rowstore (B-Tree) | Columnstore |
|:---|:---|:---|
| Storage | By row | By column |
| Best for | OLTP, point lookups, small scans | Analytics, aggregations, large scans |
| Compression | Moderate | Excellent (5-10x) |
| Update pattern | Frequent updates | Batch updates preferred |

**Filtered indexes:**
```sql
-- Only index active orders (99% of queries filter by Active = 1)
CREATE NONCLUSTERED INDEX IX_Orders_Active
ON dbo.Orders(CustomerID, OrderDate DESC)
WHERE Status = 'Active';
-- This index is tiny compared to an unfiltered one
```

**Index maintenance — fragmentation thresholds:**

| Fragmentation % | Action |
|:---|:---|
| 0–5% | Ignore |
| 5–30% | ALTER INDEX ... REORGANIZE |
| > 30% | ALTER INDEX ... REBUILD |

```sql
-- Rebuild with fill factor and online option
ALTER INDEX IX_Orders_CustomerID
ON dbo.Orders REBUILD WITH (
    FILLFACTOR = 90,
    ONLINE = ON,           -- Enterprise Edition only
    SORT_IN_TEMPDB = ON,
    MAXDOP = 4
);
```

**Indexing patterns for common query types:**

| Query Pattern | Index Strategy |
|:---|:---|
| `WHERE col = @val` (equality) | Nonclustered index on `col`, INCLUDE other SELECT columns |
| `WHERE col BETWEEN @a AND @b` (range) | Clustered on `col` if range is common, or nonclustered with INCLUDE |
| `ORDER BY col1, col2` | Index key must match order: `(col1, col2)` same direction |
| `JOIN table ON a.col = b.col` | Index on `b.col` (foreign key column) |
| `WHERE a = @a AND b = @b` (multi-column) | Composite index on `(a, b)` — column order matters |
| `WHERE a = @a ORDER BY b` | Composite index on `(a, b)` — covers both predicate and sort |

---

## 10.3 SQL Server Internals & Storage Engine

**Pages and Extents:**

SQL Server stores data in 8 KB pages. Eight contiguous pages form one 64 KB extent.

An 8 KB page has three regions:
- Header (96 bytes) — page type, free space
- Data rows (variable) — stored sequentially
- Row offset array (2 bytes per row) — grows downward

**Allocation maps:**

| Map | Tracks | Used By |
|:---|:---|:---|
| GAM | Which extents are allocated (1 = free, 0 = allocated) | Allocation and deallocation of extents |
| SGAM | Which extents have at least one free page | Finding space for small objects (< 8 pages) |
| PFS | Free space per page (0–100% free) | Every INSERT/UPDATE needs a PFS check |
| DCM | Which extents have changed since last full backup | Differential backups |
| BCM | Which extents changed during minimally logged operations | Bulk-logged recovery model |

**Interview insight:** When you understand GAM/SGAM, you can explain why tempdb contention happens — all temp tables allocate and deallocate pages rapidly, causing contention on GAM/SGAM/PFS pages. That's why you need multiple tempdb data files on multi-core servers.

**Page splits — what they cost:**

A page split happens when a page has no room for a new row during an INSERT or UPDATE that lengthens a row:
1. SQL Server allocates a new page
2. Moves ~50% of the rows from the full page to the new page
3. Updates the page linkages in the B-Tree
4. This causes fragmentation and generates transaction log records

Minimize page splits by:
- Choosing an ever-increasing clustered key (IDENTITY, SEQUENCE)
- Using appropriate FILLFACTOR for tables with random inserts
- Avoiding large UPDATEs that lengthen variable-length columns

**Forwarding pointers (heaps):**

When a table has no clustered index (heap), rows can move to a different page during an UPDATE that lengthens the row. SQL Server leaves a forwarding pointer at the original location. Over time, forwarding pointers create forwarding chains that degrade read performance significantly.

```sql
-- Check forwarding pointers
SELECT OBJECT_NAME(object_id) AS table_name,
       forwarded_record_count
FROM sys.dm_db_index_physical_stats(
    DB_ID(), NULL, NULL, NULL, 'DETAILED')
WHERE forwarded_record_count > 0;
```

A clustered index eliminates forwarding pointers because the row position is defined by the key value, not the physical location.

**Transaction log internals:**

The transaction log is a write-ahead log — the log is written before the data page.

- Checkpoint: writes dirty pages from buffer pool to disk
- Virtual Log Files (VLFs): log is divided into segments
- Log Sequence Number (LSN): every log record has a unique LSN
- Write-Ahead Logging (WAL): log write happens BEFORE data page write

VLF best practices:
- Too many VLFs (from frequent small log autogrows) = slow operations and long recovery
- Target: < 50 VLFs for small DBs, < 1,000 for very large DBs
- Fix: set log to appropriate size, grow in large chunks, then shrink + regrow

```sql
-- Check VLF count
DBCC LOGINFO;
```

**Memory and buffer pool:**

The buffer pool is SQL Server's main memory area — it caches data pages from disk. Pages cycle through three states:
- Clean Pages: match disk → can be evicted
- Dirty Pages: modified → must be checkpointed
- Free Pages: available for new reads

Lazy writer — process that frees buffer pool memory when SQL Server needs more. Frequent lazy writer activity = memory pressure.

```sql
-- Page life expectancy (PLE) — target > 300 seconds
SELECT cntr_value AS page_life_expectancy_sec
FROM sys.dm_os_performance_counters
WHERE object_name LIKE '%Buffer Manager%'
  AND counter_name = 'Page life expectancy';
```

---

## 10.4 Production DBA Toolkit

**Brent Ozar's First Responder Kit:**

sp_Blitz — comprehensive health check:
```sql
EXEC sp_Blitz @OutputType = 'TABLE';
EXEC sp_Blitz @Priorities = 'HIGH';
```
Checks: missing backups, no query store, default MAXDOP, no tempdb data files, missing security, outdated stats, corrupted databases, unsupported builds, and 100+ other checks.

sp_BlitzIndex — index analysis:
```sql
EXEC sp_BlitzIndex @DatabaseName = 'YourDB', @Mode = 4;
```
Finds: missing indexes, unused indexes with write overhead, duplicate indexes, heaps with forwarding pointers, extremely fragmented indexes, indexes with high key column width.

sp_BlitzCache — query plan analysis:
```sql
EXEC sp_BlitzCache @SortOrder = 'cpu', @Top = 25;
```
Key metrics: CPU, duration, reads, writes, execution count, plan size, implicit conversions, parameter sniffing, forced serialization.

sp_BlitzFirst — real-time diagnostics:
```sql
EXEC sp_BlitzFirst @SinceStartup = 0;
```
Shows current waits, running queries, file stats, and recommendations.

**sp_WhoIsActive — who's running right now:**

```sql
EXEC sp_WhoIsActive @ShowSystemSpids = 0,
                    @GetTasksInfo = 1,
                    @GetPlans = 1,
                    @GetTransactionInfo = 1;
```

What it shows per session:
- Query text and execution plan
- Wait type, wait time, and resource
- Blocking chain (who is blocking whom)
- Transaction log usage per session
- TempDB usage per session

Common patterns:
```sql
-- Find the head blocker (most deeply nested)
EXEC sp_WhoIsActive @FindBlockLeaders = 1;

-- Filter by wait type
EXEC sp_WhoIsActive @Filter_Type = 'wait', @Filter = 'PAGEIOLATCH_EX';

-- Show sleeping sessions with open transactions
EXEC sp_WhoIsActive @ShowSleepingSessions = 2;
```

**SQLSkills wait stats categories:**

| Wait Category | Key Waits | What It Means |
|:---|:---|:---|
| IO | PAGEIOLATCH_*, WRITELOG, ASYNC_IO_COMPLETION | Storage is slow or overloaded |
| Locking | LCK_M_* | Blocking, long transactions |
| Latch | PAGELATCH_*, LATCH_* | Internal contention (often tempdb or allocation) |
| CPU | SOS_SCHEDULER_YIELD | CPU pressure, need more cores or tune queries |
| Network | ASYNC_NETWORK_IO | Client consuming results too slowly |
| Memory | RESOURCE_SEMAPHORE | Query memory grant waits, memory pressure |

**Ola Hallengren Maintenance Solution:**

```sql
-- Full backup with compression and verify
EXEC dbo.DatabaseBackup
    @Databases = 'USER_DATABASES',
    @Directory = 'E:\Backups',
    @BackupType = 'FULL',
    @Compress = 'Y', @Verify = 'Y', @CheckSum = 'Y',
    @CleanupTime = 48, @LogToTable = 'Y';

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
```

Key design features:
- CommandLog table records every operation — provides an audit trail
- Awareness of Always On AGs (backs up on preferred replica)
- Awareness of log shipping (doesn't break log shipping chain)
- Per-index decisions on rebuild vs reorganize based on actual fragmentation

---

*This tutorial is designed for rapid pre-interview revision. Focus on the scenarios, DMVs, and interview answers. Practice speaking naturally, not memorizing scripts. Show production maturity by connecting every technical decision to business impact.*
