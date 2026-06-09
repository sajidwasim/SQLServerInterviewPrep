# XYZ SQL Server DBA Beginner Prompt Bank

Prepared for: **Senior Infrastructure Operations Engineer, SQL Server & Automation, XYZ Denmark**

Purpose: Use these small prompts one by one to learn the technical requirements from the XYZ JD in a beginner-friendly but interview-relevant way.

The JD focuses on business-critical SQL Server platforms, 24/7 operations, performance tuning, automation, high availability, disaster recovery, Azure modernization, migrations, upgrades, security, compliance, troubleshooting, incident management, collaboration, and communication.

## How to use this file

Copy one prompt at a time into ChatGPT, Copilot, Gemini, Perplexity, or another AI tutor.

For every prompt, ask the AI to teach you in this exact style:

- Explain like I am a beginner SQL Server DBA.
- Use the real-life scenario given in the prompt.
- Show what I should check first, second, and third.
- Explain the mistake a junior DBA usually makes.
- Give me one simple interview answer at the end.
- Keep it practical, not academic.

---

# Master Prompt

Use this first if you want the AI tutor to follow one consistent teaching style for all prompts.

```text
Act as a senior SQL Server DBA and infrastructure operations mentor.

I am preparing for a Senior Infrastructure Operations Engineer interview focused on SQL Server and Automation in a 24/7 enterprise environment.

Teach me as a beginner SQL Server DBA, but do not make it childish. Use simple language, real production examples, and practical steps.

For every topic I give you:
1. Explain the concept simply.
2. Use the real-life scenario I provide.
3. Show the step-by-step DBA thinking process.
4. Mention key SQL Server tools, DMVs, commands, or features where relevant.
5. Provide sample TSQL/SQL script.
6. Explain what a junior DBA might misunderstand.
7. Give me one interview-ready answer I can say naturally.
7. End with 3 quick self-test questions.

Do not give long theory. Teach me how to think and act in production.
```

---

# Section 1: SQL Server Operations in a 24/7 Enterprise Environment

## Prompt 1: Business-critical SQL Server operations

```text
Teach me what "business-critical SQL Server operations in a 24/7 enterprise environment" means for a beginner DBA.

Real-life scenario:
A large retail company has hundreds of stores. Store systems, pricing, inventory, warehouse feeds, member data, and reporting depend on SQL Server. If SQL Server becomes slow or unavailable, stores and internal teams are affected.

Explain:
- what a DBA is responsible for in this environment
- what must be monitored daily
- what "stable operations" means
- how a DBA thinks differently in a 24/7 environment compared with a normal office application
- one interview answer I can give for this topic

Quick Questions:
Why is running an unthrottled index rebuild at peak hours dangerous in a 24/7 environment, even if the database is online?

If a retail system experience a sudden surge in checkout volume, which specific DMV category would you query first to see if queries are waiting on physical hardware resources?

What is the fundamental difference between how you schedule a maintenance window for a traditional office application versus a 24/7 retail application?
```

## Prompt 2: Daily DBA health checks

```text
Teach me how to perform daily SQL Server health checks as a beginner DBA.

Real-life scenario:
I join the morning operations meeting. The business asks whether the SQL Server platform is healthy after last night's jobs, backups, and batch processing.

Explain:
- what checks I should do first
- backup status
- SQL Agent job failures
- disk space
- database status
- availability group status
- blocking or long-running queries
- error log review
- what should go into a daily DBA checklist
- one interview answer I can give
```

## Prompt 3: SQL Server service ownership

```text
Teach me what service ownership means for a SQL Server DBA.

Real-life scenario:
A payment or inventory database is technically online, but the business says the service is not working properly. Application teams, infrastructure teams, and DBAs are all involved.

Explain:
- difference between server uptime and service availability
- what the DBA owns
- what the application team owns
- what infrastructure owns
- how to avoid blame during an incident
- how to communicate ownership clearly
- one interview answer I can give
```

---

# Section 2: Performance Tuning and Troubleshooting

## Prompt 4: First response when SQL Server is slow

```text
Teach me how to respond when someone says "SQL Server is slow right now."

Real-life scenario:
At 09:15, store users report that a retail application is timing out. The application team says the database is slow.

Explain:
- what I should check in the first 5 minutes
- active sessions
- blocking
- wait stats
- CPU
- memory
- IO latency
- SQL Agent jobs
- recent deployments
- what not to do first
- one interview answer I can give
```

## Prompt 5: Wait stats for beginners

```text
Teach me SQL Server wait stats like I am a beginner DBA.

Real-life scenario:
A production SQL Server is slow, but CPU is not very high. Someone says "check the waits."

Explain:
- what wait stats mean
- why SQL Server waits
- difference between cumulative waits and current waits
- common waits such as PAGEIOLATCH, LCK_M, CXPACKET, CXCONSUMER, ASYNC_NETWORK_IO, WRITELOG
- how waits guide troubleshooting
- what a junior DBA often misunderstands
- one interview answer I can give
```

## Prompt 6: Blocking

```text
Teach me how blocking works in SQL Server.

Real-life scenario:
An order-processing system becomes slow because one transaction is holding locks and many other sessions are waiting behind it.

Explain:
- what blocking is
- how it differs from deadlock
- how to identify the blocking session
- what information I should collect before killing a session
- how application transaction design can cause blocking
- how to prevent repeated blocking
- one interview answer I can give
```

## Prompt 7: Deadlocks

```text
Teach me SQL Server deadlocks for a beginner DBA.

Real-life scenario:
Two retail batch jobs run at the same time. Each job locks a different table and then tries to access the other's table. One transaction is killed.

Explain:
- what a deadlock is
- why SQL Server chooses a victim
- how to read a deadlock graph at a high level
- common causes
- how indexing, transaction order, retry logic, and shorter transactions help
- what to tell developers
- one interview answer I can give
```

## Prompt 8: Query Store

```text
Teach me Query Store in SQL Server.

Real-life scenario:
A report ran in 5 seconds yesterday but takes 5 minutes today after a deployment. The business needs the report before store opening.

Explain:
- what Query Store captures
- how it helps identify plan regression
- how to compare old and new plans
- when plan forcing can help
- risks of blindly forcing plans
- how Query Store helps in SQL Server 2022 and Azure SQL
- one interview answer I can give
```

## Prompt 9: Execution plans

```text
Teach me SQL Server execution plans as a beginner DBA.

Real-life scenario:
A query against product and inventory tables suddenly becomes slow. A senior DBA asks me to check the actual execution plan.

Explain:
- estimated vs actual execution plan
- scans vs seeks
- joins
- key lookups
- missing index warnings
- row estimate problems
- how execution plans help performance tuning
- one interview answer I can give
```

## Prompt 10: Parameter sniffing

```text
Teach me parameter sniffing in SQL Server.

Real-life scenario:
A stored procedure is fast for one store ID but very slow for another store ID. The same procedure uses a cached execution plan.

Explain:
- what parameter sniffing means
- why the first parameter value can influence the cached plan
- symptoms
- how to confirm it
- possible fixes such as recompile, optimize for, dynamic SQL, better indexing, or procedure redesign
- risks of each fix
- one interview answer I can give
```

## Prompt 11: Index tuning

```text
Teach me index tuning for a beginner SQL Server DBA.

Real-life scenario:
A pricing lookup query is slow during peak store hours. Developers suggest adding several indexes quickly.

Explain:
- why indexes help reads but can hurt writes
- clustered vs nonclustered indexes
- included columns
- duplicate indexes
- unused indexes
- missing index recommendations
- why I should not create indexes blindly
- one interview answer I can give
```

## Prompt 12: Statistics

```text
Teach me SQL Server statistics in simple terms.

Real-life scenario:
After a large data load into an inventory table, queries start choosing bad execution plans.

Explain:
- what statistics are
- how the optimizer uses statistics
- why stale statistics cause bad plans
- auto update statistics
- manual statistics update
- relation between statistics and index maintenance
- one interview answer I can give
```

## Prompt 13: Tempdb pressure

```text
Teach me tempdb pressure in SQL Server.

Real-life scenario:
Several reports, sorts, and ETL jobs run together. Users complain that the whole SQL Server is slow.

Explain:
- what tempdb is used for
- why tempdb becomes a bottleneck
- symptoms of tempdb pressure
- version store, sorts, spills, temp tables
- file configuration basics
- how to investigate tempdb issues
- one interview answer I can give
```

## Prompt 14: Transaction log pressure

```text
Teach me SQL Server transaction log pressure.

Real-life scenario:
A large update runs during the day and the transaction log grows quickly. Disk space alerts start firing.

Explain:
- what the transaction log does
- why logs grow
- full recovery model and log backups
- long-running transactions
- VLF basics
- how to respond safely
- what not to do during an emergency
- one interview answer I can give
```

## Prompt 15: Capacity optimization

```text
Teach me SQL Server capacity optimization.

Real-life scenario:
A retail SQL Server grows every month because of sales, inventory, campaign, and transaction data. Storage and CPU pressure are increasing.

Explain:
- what capacity optimization means
- CPU, memory, storage, IO, database growth, and workload trends
- how baselines help
- when to tune queries vs add resources
- how to forecast capacity
- how to explain capacity risk to management
- one interview answer I can give
```

---

# Section 3: High Availability and Disaster Recovery

## Prompt 16: HA vs DR

```text
Teach me the difference between High Availability and Disaster Recovery.

Real-life scenario:
A company has two data centers. They want SQL Server to stay available if one server fails, and recover if a full data center has a serious outage.

Explain:
- what HA means
- what DR means
- RPO and RTO
- why HA does not replace backup
- common SQL Server HA/DR options
- how to explain the difference in an interview
```

## Prompt 17: Always On Availability Groups basics

```text
Teach me SQL Server Always On Availability Groups as a beginner DBA.

Real-life scenario:
A business-critical database must be available across multiple data centers. The company uses primary and secondary replicas.

Explain:
- primary replica
- secondary replica
- availability database
- listener
- synchronous commit
- asynchronous commit
- automatic vs manual failover
- why secondaries are not backups
- one interview answer I can give
```

## Prompt 18: Sync vs async replicas

```text
Teach me synchronous vs asynchronous commit in Always On Availability Groups.

Real-life scenario:
The primary data center is in Denmark and the DR site is in another location. The business wants low data loss but also good performance.

Explain:
- how synchronous commit works
- how asynchronous commit works
- latency trade-off
- data loss risk
- when to use each
- how to connect this to RPO and RTO
- one interview answer I can give
```

## Prompt 19: Failover

```text
Teach me SQL Server failover in an Always On Availability Group.

Real-life scenario:
The primary SQL Server node fails during business hours. The team must move service to a secondary replica quickly.

Explain:
- planned manual failover
- automatic failover
- forced failover
- data loss risk
- listener behavior
- application connection impact
- what to check after failover
- one interview answer I can give
```

## Prompt 20: Quorum

```text
Teach me quorum in Windows Server Failover Cluster for SQL Server Always On.

Real-life scenario:
A two-data-center SQL Server cluster loses network communication between sites. The team needs to avoid split-brain risk.

Explain:
- what quorum means
- why quorum matters
- node majority
- witness
- split-brain risk
- why quorum is an infrastructure and database concern
- one interview answer I can give
```

## Prompt 21: DR testing

```text
Teach me how to plan a SQL Server disaster recovery test.

Real-life scenario:
Management asks whether the company can recover its most critical SQL Server platform if a data center fails.

Explain:
- define scope
- define RPO and RTO
- choose test database or service
- failover or restore test
- communication plan
- validation checklist
- rollback plan
- post-test report
- one interview answer I can give
```

---

# Section 4: Backup, Restore, and Integrity

## Prompt 22: Backup strategy

```text
Teach me SQL Server backup strategy.

Real-life scenario:
A business-critical database needs point-in-time recovery. The business says it can lose at most 15 minutes of data.

Explain:
- full backup
- differential backup
- transaction log backup
- recovery model
- backup frequency
- retention
- encryption and access control
- how backup strategy connects to RPO
- one interview answer I can give
```

## Prompt 23: Restore testing

```text
Teach me restore testing for SQL Server.

Real-life scenario:
The backup jobs are green every night, but nobody has tested restoring the database for six months.

Explain:
- why successful backup jobs are not enough
- how to run a restore test
- how to validate restored data
- how to measure restore time
- how restore testing supports RTO
- how to report results
- one interview answer I can give
```

## Prompt 24: Point-in-time recovery

```text
Teach me point-in-time recovery in SQL Server.

Real-life scenario:
A user accidentally deletes important pricing rows at 10:12. The business asks if we can recover to 10:11.

Explain:
- full backup
- differential backup
- log backup chain
- STOPAT recovery
- tail-log backup
- risks and preparation
- one interview answer I can give
```

## Prompt 25: DBCC CHECKDB

```text
Teach me DBCC CHECKDB for SQL Server.

Real-life scenario:
A storage issue occurred overnight. The DBA team wants to check whether any databases have corruption.

Explain:
- what DBCC CHECKDB does
- why integrity checks matter
- how often to run it
- performance impact
- what to do if corruption is found
- why restore is usually safer than repair
- one interview answer I can give
```

---

# Section 5: Automation and Maintenance

## Prompt 26: DBA automation mindset

```text
Teach me the automation mindset for SQL Server operations.

Real-life scenario:
The DBA team manually checks backups, disk space, failed jobs, index maintenance, and database health every morning.

Explain:
- what should be automated
- why automation reduces risk
- what still needs human review
- scheduling
- logging
- alerting
- ownership
- one interview answer I can give
```

## Prompt 27: SQL Agent jobs

```text
Teach me SQL Server Agent jobs.

Real-life scenario:
Nightly jobs run backups, index maintenance, data imports, and reporting refreshes. One job fails and affects morning operations.

Explain:
- what SQL Agent jobs are
- job steps
- schedules
- job history
- alerts and notifications
- retry settings
- how to troubleshoot failed jobs
- one interview answer I can give
```

## Prompt 28: Ola Hallengren maintenance solution

```text
Teach me Ola Hallengren SQL Server Maintenance Solution.

Real-life scenario:
A company wants a reliable, repeatable maintenance setup for backups, DBCC CHECKDB, index maintenance, and statistics updates.

Explain:
- what Ola's solution does
- DatabaseBackup
- DatabaseIntegrityCheck
- IndexOptimize
- why it is widely used
- how to schedule it with SQL Agent
- what to monitor after setup
- one interview answer I can give
```

## Prompt 29: PowerShell for DBAs

```text
Teach me how PowerShell helps SQL Server DBAs.

Real-life scenario:
The operations team needs a daily report showing SQL Server availability, disk space, backup status, job failures, and database growth across many servers.

Explain:
- why PowerShell is useful
- what tasks it can automate
- how it works with SQL Server
- examples of DBA automation scripts
- what security precautions are needed
- one interview answer I can give
```

## Prompt 30: Runbooks

```text
Teach me SQL Server operational runbooks.

Real-life scenario:
A DBA is on vacation. A production alert fires, and another engineer must know exactly what to check and how to escalate.

Explain:
- what a runbook is
- what should be included
- alert meaning
- first checks
- escalation path
- rollback or recovery steps
- why runbooks matter in 24/7 operations
- one interview answer I can give
```

---

# Section 6: Cloud, Azure, Virtualization, and Modernization

## Prompt 31: Azure SQL vs SQL Server on VM

```text
Teach me the difference between Azure SQL Database, Azure SQL Managed Instance, and SQL Server on Azure VM.

Real-life scenario:
A company is modernizing from on-prem SQL Server and wants to move some workloads to Azure, but not all databases have the same requirements.

Explain:
- Azure SQL Database
- Azure SQL Managed Instance
- SQL Server on Azure VM
- operational responsibility differences
- HA/DR differences
- migration considerations
- one interview answer I can give
```

## Prompt 32: SQL Server modernization

```text
Teach me SQL Server modernization.

Real-life scenario:
A company has old SQL Server versions, too many databases, manual maintenance, weak monitoring, and inconsistent security.

Explain:
- what modernization means
- version upgrade
- consolidation
- automation
- monitoring
- security cleanup
- Azure readiness
- how to modernize without breaking operations
- one interview answer I can give
```

## Prompt 33: Database migration planning

```text
Teach me how to plan a SQL Server database migration.

Real-life scenario:
A business-critical database must move from an old SQL Server instance to SQL Server 2022 or Azure SQL with minimal downtime.

Explain:
- discovery
- compatibility check
- dependency mapping
- migration method
- backup/restore or Azure DMS
- testing
- cutover
- rollback plan
- validation after migration
- one interview answer I can give
```

## Prompt 34: SQL Server upgrades

```text
Teach me SQL Server version upgrades.

Real-life scenario:
A company needs to upgrade from an older SQL Server version to SQL Server 2022, but the database supports critical business applications.

Explain:
- pre-upgrade assessment
- compatibility level
- deprecated features
- application testing
- performance baseline
- rollback plan
- post-upgrade monitoring
- one interview answer I can give
```

## Prompt 35: SQL Server on virtualized platforms

```text
Teach me SQL Server on virtualized platforms.

Real-life scenario:
SQL Server runs on VMware or Hyper-V. Performance becomes inconsistent during peak hours.

Explain:
- CPU overcommit
- memory ballooning
- storage latency
- virtual disk layout
- NUMA basics
- why DBAs must collaborate with infrastructure teams
- what to check before blaming SQL Server
- one interview answer I can give
```

---

# Section 7: Security, Compliance, and Operational Controls

## Prompt 36: SQL Server security basics

```text
Teach me SQL Server security basics for a beginner DBA.

Real-life scenario:
A company wants to reduce risk on production SQL Server platforms after an access review.

Explain:
- logins vs users
- server roles vs database roles
- least privilege
- service accounts
- sysadmin risk
- password and authentication basics
- auditability
- one interview answer I can give
```

## Prompt 37: Least privilege

```text
Teach me least privilege in SQL Server.

Real-life scenario:
Developers request sysadmin access to troubleshoot a production issue quickly.

Explain:
- why sysadmin access is risky
- how to provide controlled access
- read-only access
- execute permission
- temporary elevated access
- approval and audit trail
- how to handle pressure from teams
- one interview answer I can give
```

## Prompt 38: SQL Server auditing

```text
Teach me SQL Server auditing.

Real-life scenario:
Compliance asks who changed permissions on a production database and when.

Explain:
- what SQL Server Audit can capture
- login events
- permission changes
- schema changes
- sensitive data access
- where audit logs should be stored
- how auditing supports compliance
- one interview answer I can give
```

## Prompt 39: Encryption and TDE

```text
Teach me Transparent Data Encryption and SQL Server encryption basics.

Real-life scenario:
A business-critical database contains customer and transaction data. Security asks how data is protected at rest.

Explain:
- what TDE does
- what TDE does not do
- certificate and key backup
- backup encryption
- connection encryption
- common mistakes
- one interview answer I can give
```

## Prompt 40: Service accounts

```text
Teach me service account management for SQL Server.

Real-life scenario:
Several SQL Server services, applications, and jobs use old shared accounts with unknown ownership.

Explain:
- why service accounts matter
- least privilege for service accounts
- password rotation
- managed service accounts
- ownership documentation
- audit risk
- one interview answer I can give
```

---

# Section 8: Incident Management and Communication

## Prompt 41: Production incident response

```text
Teach me production incident response for a SQL Server DBA.

Real-life scenario:
A business-critical SQL Server platform is partially unavailable during peak business hours. Multiple teams are asking for updates.

Explain:
- first 5 minutes
- impact assessment
- technical triage
- communication cadence
- stabilization
- escalation
- root cause analysis
- post-incident review
- one interview answer I can give
```

## Prompt 42: SQL Server timeout incident

```text
Teach me how to handle application timeout incidents related to SQL Server.

Real-life scenario:
The application team reports timeouts from the retail order system. SQL Server is online, but users cannot complete transactions.

Explain:
- how to check if SQL Server is the real bottleneck
- connection issues
- blocking
- long-running queries
- CPU
- IO
- network
- application connection pool
- how to communicate findings
- one interview answer I can give
```

## Prompt 43: Root cause analysis

```text
Teach me root cause analysis for SQL Server incidents.

Real-life scenario:
A database incident was fixed by restarting a service, but nobody knows why it happened.

Explain:
- why restart is not a root cause
- timeline building
- evidence collection
- logs and monitoring
- recent changes
- contributing factors
- corrective actions
- how to write a short RCA
- one interview answer I can give
```

## Prompt 44: Technical sparring

```text
Teach me what technical sparring means in an infrastructure operations team.

Real-life scenario:
A developer wants to add a new query and index. The infrastructure team worries about performance, storage, and maintenance overhead.

Explain:
- how a DBA gives technical feedback without blocking delivery
- how to discuss trade-offs
- how to ask for query plans and workload information
- how to suggest safer alternatives
- how to document a decision
- one interview answer I can give
```

## Prompt 45: Communicating with non-DBAs

```text
Teach me how to explain SQL Server problems to non-DBA stakeholders.

Real-life scenario:
Management asks why a system was slow. The real issue involved blocking, long transactions, and poor indexing.

Explain:
- how to avoid deep jargon
- how to explain business impact
- how to explain current status
- how to explain next steps
- how to communicate risk without panic
- one interview answer I can give
```

---

# Section 9: T-SQL and DBA Scripts

## Prompt 46: T-SQL for DBAs

```text
Teach me the most important T-SQL skills for a SQL Server DBA.

Real-life scenario:
I need to investigate slow queries, sessions, job failures, database sizes, backup history, and permissions using T-SQL.

Explain:
- DMV queries
- system catalog views
- backup history queries
- index usage queries
- session and blocking queries
- permissions queries
- why DBA T-SQL is different from application SQL
- one interview answer I can give
```

## Prompt 47: DMVs

```text
Teach me SQL Server DMVs for beginner DBA troubleshooting.

Real-life scenario:
A senior DBA asks me to gather evidence from SQL Server before making any changes.

Explain:
- what DMVs are
- sys.dm_exec_requests
- sys.dm_exec_sessions
- sys.dm_os_wait_stats
- sys.dm_db_index_usage_stats
- sys.dm_io_virtual_file_stats
- sys.dm_exec_query_stats
- how to use DMVs carefully
- one interview answer I can give
```

## Prompt 48: DBA script safety

```text
Teach me how to safely use DBA scripts in production.

Real-life scenario:
I found a script online to fix blocking and index issues, but the database is business-critical.

Explain:
- why scripts must be reviewed
- read-only vs change scripts
- test environment
- transaction safety
- rollback plan
- permissions
- logging
- change approval
- one interview answer I can give
```

---

# Section 10: Collaboration, Knowledge Sharing, and Team Fit

## Prompt 49: Working with infrastructure teams

```text
Teach me how a SQL Server DBA should work with infrastructure teams.

Real-life scenario:
SQL Server performance is poor, but the root cause may be storage latency, VM host pressure, network latency, or backup infrastructure.

Explain:
- what information DBA should provide
- what to ask infrastructure team
- how to discuss storage IO
- how to discuss CPU and memory allocation
- how to avoid blame
- how to create joint troubleshooting steps
- one interview answer I can give
```

## Prompt 50: Knowledge sharing

```text
Teach me knowledge sharing for SQL Server operations.

Real-life scenario:
Only one senior DBA knows how to fail over a critical SQL Server platform. The company wants less key-person dependency.

Explain:
- why documentation matters
- runbooks
- handover
- internal training
- peer review
- incident lessons learned
- how to share knowledge without sounding superior
- one interview answer I can give
```

## Prompt 51: 24/7 on-call readiness

```text
Teach me how to prepare for SQL Server 24/7 on-call duty.

Real-life scenario:
I am part of a duty rotation. A SQL Server alert wakes me up at 02:30.

Explain:
- what alert information I need
- how to decide severity
- first checks
- escalation
- communication
- when to apply a workaround
- when to wait for business approval
- how to document the incident
- one interview answer I can give
```

---

# Section 11: Extra DBA Topics You Should Not Miss

These are not always written clearly in a JD, but senior SQL Server operations interviews often test them.

## Prompt 52: Baselines

```text
Teach me SQL Server performance baselines.

Real-life scenario:
A manager asks whether the current SQL Server workload is normal or abnormal, but no one has baseline data.

Explain:
- what a baseline is
- CPU, memory, IO, waits, database growth, query duration, job duration
- why baseline matters before tuning
- how baselines help capacity planning
- how to explain baseline value in an interview
```

## Prompt 53: Patch management

```text
Teach me SQL Server patch management.

Real-life scenario:
A security patch must be applied to SQL Server nodes that support business-critical databases.

Explain:
- why patching matters
- test environment
- maintenance window
- Always On failover planning
- rollback
- application validation
- communication
- one interview answer I can give
```

## Prompt 54: Change management

```text
Teach me SQL Server change management.

Real-life scenario:
A developer wants to deploy schema changes to a production database during business hours.

Explain:
- why change control matters
- risk assessment
- testing
- deployment script review
- rollback script
- maintenance window
- monitoring after change
- one interview answer I can give
```

## Prompt 55: Database consolidation

```text
Teach me database consolidation.

Real-life scenario:
A company has many SQL Server databases with overlapping data, inconsistent security, high maintenance cost, and unclear ownership.

Explain:
- discovery
- dependency mapping
- ownership
- duplicate data
- security review
- migration planning
- performance testing
- operational handover
- how consolidation improves manageability
- one interview answer I can give
```

## Prompt 56: Documentation

```text
Teach me what documentation matters for SQL Server operations.

Real-life scenario:
A new DBA joins the team and must understand the SQL Server estate quickly.

Explain:
- server inventory
- database ownership
- backup and restore procedures
- HA/DR design
- job schedules
- security model
- maintenance plan
- incident runbooks
- known risks
- one interview answer I can give
```

## Prompt 57: Licensing awareness

```text
Teach me basic SQL Server licensing awareness for DBAs.

Real-life scenario:
A company is adding new SQL Server nodes and replicas, and operations must avoid unexpected licensing risk.

Explain:
- why DBAs should understand licensing basics
- Enterprise vs Standard features
- Always On implications
- passive replica considerations
- virtualization impact
- why I should not pretend to be a licensing expert
- one interview answer I can give
```

## Prompt 58: Retail SQL Server workload

```text
Teach me SQL Server operations in a retail company context.

Real-life scenario:
A grocery retailer has stores, pricing, inventory, product catalog, customer membership, supplier feeds, and reporting workloads.

Explain:
- what types of databases may exist
- why uptime matters
- why performance affects stores and customers
- why batch jobs and real-time workloads may conflict
- what a DBA should monitor before store opening
- one interview answer I can give
```

## Prompt 59: How to answer "What would you improve first?"

```text
Teach me how to answer this interview question: "If you joined our SQL Server operations team, what would you look at first?"

Real-life scenario:
I join a large enterprise SQL Server environment with many databases, business-critical platforms, and existing senior engineers.

Explain:
- why I should not sound arrogant
- what I would review first
- health checks
- backups and restore testing
- HA/DR
- monitoring
- security
- documentation
- automation opportunities
- one natural interview answer I can give
```

## Prompt 60: Beginner-to-interview synthesis

```text
Act as a senior SQL Server DBA mentor.

I have studied SQL Server operations, performance tuning, HA/DR, backup/restore, automation, Azure modernization, security, incident response, and 24/7 operations.

Now help me create:
1. A 60-second interview answer explaining my SQL Server operations mindset.
2. A 90-second answer for troubleshooting a slow SQL Server.
3. A 90-second answer for HA/DR and Always On.
4. A 90-second answer for backup and restore.
5. A 90-second answer for automation and monitoring.
6. Five likely follow-up questions a senior DBA interviewer might ask.
7. Simple answers to each follow-up question.

Keep the wording natural, practical, and suitable for a XYZ.dk SQL Server Infrastructure Operations Engineer interview.
```

---

# Final Reminder

For this XYZ interview, your learning target is not to become a textbook DBA overnight.

Your target is to speak like someone who understands production SQL Server operations:

- keep platforms stable
- troubleshoot without guessing
- protect data with tested backup and restore
- design HA/DR around business RPO/RTO
- automate repeatable tasks
- monitor before users complain
- secure access with least privilege
- communicate clearly during incidents
- document and share knowledge
- improve systems without risking daily operations
