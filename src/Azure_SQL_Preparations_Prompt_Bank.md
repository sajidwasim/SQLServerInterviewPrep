# Azure SQL Preparations — AI Prompt Bank

Prepared for: **Senior Infrastructure Operations Engineer, SQL Server & Automation (Azure SQL Focus)**

Purpose: Use these small prompts one by one to learn Azure SQL from a beginner-friendly but interview-relevant angle. Each prompt builds on a real retail/infrastructure scenario.

Prerequisite: You already know on-prem SQL Server basics. These prompts teach what changes when you move to Azure SQL.

## How to use this file

Copy one prompt at a time into ChatGPT, Copilot, Gemini, Perplexity, or another AI tutor.

For every prompt, ask the AI to teach you in this exact style:

- Explain like I know on-prem SQL Server but am new to Azure SQL.
- Use the real-life scenario given in the prompt.
- Show what I should check first, second, and third.
- Explain the mistake a junior DBA usually makes when moving to Azure.
- Give me one simple interview answer at the end.
- Keep it practical, not academic.

---

# Master Prompt

Use this first if you want the AI tutor to follow one consistent teaching style for all prompts.

```text
Act as a senior Azure SQL DBA and infrastructure operations mentor.

I am preparing for a Senior Infrastructure Operations Engineer interview focused on Azure SQL, cloud migrations, and hybrid infrastructure.

I already know on-prem SQL Server DBA basics. Teach me the Azure SQL differences, pitfalls, and best practices.

For every topic I give you:
1. Explain the concept simply, comparing to on-prem SQL Server where relevant.
2. Use the real-life scenario I provide (retail or enterprise context).
3. Show the step-by-step DBA thinking process for Azure SQL.
4. Mention key Azure SQL tools, DMVs, portal features, or T-SQL where relevant.
5. Provide sample T-SQL or Azure CLI / PowerShell script.
6. Explain what a DBA who is new to Azure usually gets wrong.
7. Give me one interview-ready answer I can say naturally.
8. End with 3 quick self-test questions.

Do not give long theory. Teach me how to think and act in an Azure SQL production environment.
```

---

# Section 1: Azure SQL Fundamentals

## Prompt 1: What is Azure SQL Database?

```text
Teach me what Azure SQL Database is, as a DBA coming from on-prem SQL Server.

Real-life scenario:
A retail company wants to move a store-pricing database from on-prem SQL Server to the cloud. Management says "it's just SQL Server in the cloud."

Explain:
- what Azure SQL Database actually is (PaaS, not IaaS)
- what changes for the DBA (no sysadmin, no RDP, no file system access)
- what stays the same (same SQL Server engine, same T-SQL, same DMVs)
- the shared responsibility model
- why "it's just SQL Server in the cloud" is misleading
- one interview answer I can give
```

## Prompt 2: Azure SQL DB vs Managed Instance vs SQL VM

```text
Teach me the three Azure SQL deployment options and when to use each.

Real-life scenario:
A retail company has a mix of applications: a modern web app, a legacy inventory system using SQL Agent jobs and linked servers, and a reporting system that needs full SQL Server control.

Explain:
- Azure SQL Database (PaaS, no sysadmin, no SQL Agent)
- Azure SQL Managed Instance (near-full SQL Server, can restore .bak)
- SQL Server on Azure VM (full control, IaaS)
- operational responsibility differences
- which option fits each retail scenario
- one interview answer I can give
```

## Prompt 3: The shared responsibility model

```text
Teach me the shared responsibility model for Azure SQL.

Real-life scenario:
After migrating to Azure SQL Database, the application team says "Microsoft handles everything now, so we don't need a DBA."

Explain:
- what Microsoft handles (OS, hardware, patching, backups, HA)
- what the DBA still owns (schema, performance, security, DR testing, capacity)
- why "Microsoft handles everything" is a dangerous mindset
- how DBA responsibilities shift (less infrastructure, more data optimization)
- one interview answer I can give
```

## Prompt 4: Creating logical servers and databases

```text
Teach me how to provision Azure SQL logical servers and databases.

Real-life scenario:
I need to create a new Azure SQL Database for a retail membership system. There are multiple environments (dev, test, prod) and data must stay in Europe for GDPR.

Explain:
- what a logical server is (not a physical machine)
- region selection and data sovereignty
- resource groups and tagging
- collation choices (cannot change later)
- maintenance window settings
- infrastructure-as-code options (ARM, Terraform, Bicep)
- one interview answer I can give
```

---

# Section 2: Service Tiers and Pricing

## Prompt 5: DTU vs vCore pricing models

```text
Teach me the difference between DTU and vCore pricing models.

Real-life scenario:
A retail company is choosing a service tier for their production inventory database. They already own SQL Server licenses and want to save costs.

Explain:
- what DTU is (blended measure of CPU, memory, IO)
- what vCore is (explicit vCPUs, memory, storage)
- Azure Hybrid Benefit and how it saves license costs
- when to use DTU vs vCore
- why DTU is less transparent
- one interview answer I can give
```

## Prompt 6: Serverless vs provisioned compute

```text
Teach me serverless vs provisioned compute in Azure SQL.

Real-life scenario:
A junior team member suggests using serverless for a 24/7 retail pricing database to save money. The pricing database serves store checkouts during business hours.

Explain:
- how serverless works (auto-pause, cold start, paid per second)
- how provisioned works (always on, paid per hour)
- why serverless is wrong for 24/7 retail production
- cold start latency (~1 minute) and business impact
- appropriate use cases for serverless (dev/test, intermittent workloads)
- one interview answer I can give
```

## Prompt 7: General Purpose vs Business Critical vs Hyperscale

```text
Teach me the service tiers in the vCore model.

Real-life scenario:
A retail company has three workloads: an OLTP checkout system needing sub-second latency, a standard inventory app, and a 50TB data warehouse.

Explain:
- General Purpose (remote SSD, standard HA model, cost-effective)
- Business Critical (local SSD, Always On AG with 4 replicas, low latency)
- Hyperscale (multi-tier storage, up to 100TB, fast scaling)
- Elastic pools (shared resources across databases)
- which tier fits each retail workload
- one interview answer I can give
```

## Prompt 8: Understanding Azure SQL costs

```text
Teach me the cost components of Azure SQL Database.

Real-life scenario:
The finance team sees an unexpectedly high Azure bill after migrating a 500GB retail database. They ask why costs are higher than estimated.

Explain:
- compute costs (vCores × hours provisioned)
- storage costs (data + log, per GB)
- backup storage costs (free up to 100% of DB size, then charged per GB)
- how large transaction logs generate backup storage costs
- how to estimate and monitor costs
- one interview answer I can give
```

---

# Section 3: Networking and Security

## Prompt 9: Public endpoint vs private endpoint

```text
Teach me Azure SQL networking options for a production retail database.

Real-life scenario:
A security audit finds that the production Azure SQL database is accessible from the internet. The security team requires no public exposure.

Explain:
- public endpoint (accessible over internet, firewall protected)
- service endpoint (access from specific Azure vnet)
- private endpoint (private IP inside vnet, no public exposure)
- why private endpoint is the production standard
- Azure Policy to enforce private endpoint
- one interview answer I can give
```

## Prompt 10: Server-level vs database-level firewall

```text
Teach me firewall rule management in Azure SQL.

Real-life scenario:
After a geo-failover test, store applications cannot connect to the secondary database. The firewall rules worked before failover.

Explain:
- server-level firewall (portal, applies to all DBs, not portable)
- database-level firewall (T-SQL, per database, portable during failover)
- why database-level rules are better for application connectivity
- the failover scenario and why server rules break
- one interview answer I can give
```

## Prompt 11: Microsoft Entra ID vs SQL authentication

```text
Teach me authentication options in Azure SQL.

Real-life scenario:
A retail company handling customer data (GDPR) needs to improve database access security. The current setup uses shared SQL login credentials.

Explain:
- SQL authentication (username/password, static, no audit trail)
- Microsoft Entra ID authentication (MFA, centralized policies, access reviews)
- why Entra ID is mandatory for enterprise compliance
- how Entra ID supports conditional access and MFA
- when SQL authentication is still acceptable
- one interview answer I can give
```

## Prompt 12: Security features stack

```text
Teach me the Azure SQL security features for a retail company under GDPR.

Real-life scenario:
A retail database contains customer PII, transaction data, and payment information. The security team wants a defense-in-depth approach.

Explain:
- TDE (encryption at rest, automatic with service-managed keys)
- Microsoft Defender for SQL (vulnerability assessment, threat detection)
- Auditing (log to Log Analytics, storage, Event Hub)
- Always Encrypted (column-level encryption, DBA cannot read)
- Key Vault integration
- defense-in-depth layering
- one interview answer I can give
```

## Prompt 13: Missing security features compared to on-prem

```text
Teach me what security features change or are missing in Azure SQL.

Real-life scenario:
A DBA new to Azure tries to configure xp_cmdshell, SQL Server Audit at instance level, and server-level triggers. None of these work.

Explain:
- no sysadmin role — use built-in server roles (##MS_DatabaseManager##, ##MS_ServerStateReader##)
- no server-level audit — use database auditing or Azure SQL Auditing
- no xp_cmdshell
- no SQL Server Agent (use Elastic Jobs)
- no instance-scoped DMVs — all database-scoped
- one interview answer I can give
```

---

# Section 4: Feature Gaps and Management Differences

## Prompt 14: What is missing in Azure SQL DB

```text
Teach me the features available in on-prem SQL Server but missing in Azure SQL Database.

Real-life scenario:
A legacy retail warehouse app uses SQL Agent, CLR, Database Mail, linked servers, and cross-database queries. The team tries to migrate to Azure SQL DB and hits blockers.

Explain:
- SQL Agent (not available — use Elastic Jobs)
- CLR (not available)
- Database Mail (not available)
- Linked servers (external tables only, no full linked server)
- Cross-database queries (not supported)
- .bak restore (not supported)
- sysadmin (no equivalent)
- how this affects migration decisions
- one interview answer I can give
```

## Prompt 15: SQL Server Agent alternatives

```text
Teach me how to schedule jobs in Azure SQL Database without SQL Agent.

Real-life scenario:
A retail company has nightly ETL jobs, index maintenance scripts, and data cleanup jobs that run via SQL Agent on-prem. After moving to Azure SQL DB, SQL Agent is gone.

Explain:
- Elastic Jobs (Azure SQL job scheduling, T-SQL based)
- Azure Automation (PowerShell/runbook based)
- differences from SQL Agent
- limitations of Elastic Jobs
- when Managed Instance is a better fit
- one interview answer I can give
```

## Prompt 16: Backups in Azure SQL

```text
Teach me how backup and restore works in Azure SQL vs on-prem.

Real-life scenario:
A DBA new to Azure tries to run BACKUP DATABASE and RESTORE DATABASE commands, and both fail. The team needs to recover a database to a point in time.

Explain:
- automatic backups (full weekly, diff 12-24h, log every 10 min)
- no T-SQL BACKUP/RESTORE commands
- point-in-time restore (PITR) within retention period
- short-term retention (up to 35 days)
- long-term retention (up to 10 years)
- geo-restore vs geo-replication
- why you cannot restore a .bak file
- one interview answer I can give
```

---

# Section 5: Backup, High Availability, and Disaster Recovery

## Prompt 17: Built-in high availability in Azure SQL

```text
Teach me how HA works in Azure SQL compared to on-prem Always On AGs.

Real-life scenario:
A retail DBA is used to configuring Windows Clustering, Always On AGs, listeners, and quorum. Management says "Azure has built-in HA."

Explain:
- Standard availability model (General Purpose — compute and storage separate)
- Premium availability model (Business Critical — Always On AG with 4 replicas)
- what Microsoft manages (replica sync, failover orchestration)
- what the DBA still owns (choosing the right tier, testing failover)
- why no quorum or WSFC is needed
- one interview answer I can give
```

## Prompt 18: Geo-replication and auto-failover groups

```text
Teach me disaster recovery options for Azure SQL across regions.

Real-life scenario:
A retail company operates in Denmark (North Europe) and needs a DR strategy if the primary region goes down. RPO must be under 1 minute, RTO under 2 hours.

Explain:
- geo-restore (RPO 1h, RTO 12h — too slow for retail)
- active geo-replication (up to 4 secondaries, manual failover)
- auto-failover groups (group failover, configurable grace period, listener endpoint)
- RPO ~5 seconds, RTO ~1 hour
- why auto-failover groups are the production standard
- failover testing
- one interview answer I can give
```

## Prompt 19: Testing failover in Azure SQL

```text
Teach me how to test failover for an Azure SQL auto-failover group.

Real-life scenario:
Management asks: "We configured geo-replication, but have we ever tested it?" The team has never performed a failover drill.

Explain:
- planned vs unplanned failover
- how to perform a planned failover (no data loss)
- how to verify application connectivity after failover
- how to fail back
- how to test without affecting production (use a copy)
- quarterly failover drills
- one interview answer I can give
```

## Prompt 20: Backup retention and compliance

```text
Teach me how to configure backup retention for compliance requirements.

Real-life scenario:
Compliance requires 7-year retention for financial transaction data. The default Azure SQL retention is 7 days.

Explain:
- short-term retention (STR) — up to 35 days, PITR within
- long-term retention (LTR) — up to 10 years, weekly/monthly/yearly policies
- how to configure LTR in portal or T-SQL
- backup storage costs for long retention
- automation with Azure Policy
- what happens if the logical server is deleted
- one interview answer I can give
```

---

# Section 6: Migration to Azure SQL

## Prompt 21: Migration assessment with DMA

```text
Teach me how to assess a SQL Server database for Azure SQL readiness.

Real-life scenario:
A retail company wants to migrate a 10-year-old warehouse management database to Azure but doesn't know if it's compatible.

Explain:
- Data Migration Assistant (DMA) — assessment tool
- what DMA checks (feature parity, compatibility issues, deprecated features)
- how to interpret DMA results (blockers vs warnings)
- why DMA should be the FIRST step before choosing a target
- common blockers (SQL Agent, CLR, linked servers)
- one interview answer I can give
```

## Prompt 22: Migration methods

```text
Teach me the different migration methods for moving to Azure SQL.

Real-life scenario:
A retail production database must move to Azure SQL with minimal downtime. It's a 500GB database that cannot be offline for more than 5 minutes.

Explain:
- .bacpac export/import (simple but slow for large DBs)
- DMA migration (good for small/medium DBs, offline)
- Azure DMS (Data Migration Service — scalable, offline)
- transactional replication (near-zero downtime, log shipping style)
- when to use each method
- why transactional replication is preferred for production
- one interview answer I can give
```

## Prompt 23: Transactional replication for near-zero downtime migration

```text
Teach me how to use transactional replication to migrate to Azure SQL with minimal downtime.

Real-life scenario:
A 2TB retail pricing database must be migrated with less than 5 minutes of downtime. The business cannot afford hours of offline migration.

Explain:
- how transactional replication works for migration
- snapshot initialization
- continuous log replication
- cutover steps (stop app, verify sync, redirect connection)
- monitoring replication health
- rollback plan if cutover fails
- one interview answer I can give
```

## Prompt 24: Common migration mistakes

```text
Teach me the most common mistakes DBAs make when migrating to Azure SQL.

Real-life scenario:
A DBA team tries to migrate a 2TB database using .bacpac, discovers unsupported features mid-migration, and forgets to test application performance.

Explain:
- using .bacpac for large databases (too slow)
- skipping DMA assessment (blockers found during cutover)
- not testing application performance after migration
- choosing Azure SQL DB when Managed Instance is needed
- not planning rollback
- forgetting firewall rules and networking
- one interview answer I can give
```

---

# Section 7: Monitoring, Tuning, and DMVs

## Prompt 25: Monitoring and alerts in Azure SQL

```text
Teach me how to set up monitoring and alerts for Azure SQL.

Real-life scenario:
A retail database was migrated to Azure SQL two weeks ago. Nobody set up alerts. At 8 AM, stores open and the database is at 95% DTU.

Explain:
- Azure Monitor metrics (CPU, DTU, data IO, log IO, sessions, deadlocks)
- metric alerts with action groups (email, SMS, webhook, runbook)
- which thresholds to alert on (CPU > 80%, DTU > 80%, failed connections)
- why proactive alerts matter in a 24/7 retail environment
- Log Analytics integration for long-term analysis
- one interview answer I can give
```

## Prompt 26: Query Performance Insight and automatic tuning

```text
Teach me Query Performance Insight and Automatic Tuning in Azure SQL.

Real-life scenario:
A retail checkout query suddenly becomes slow after an index rebuild. Nobody changed the application code.

Explain:
- Query Performance Insight (top queries by CPU, duration, IO)
- how it uses Query Store
- Automatic Tuning (auto create/drop indexes, auto force plans)
- enabling automatic plan forcing for regression detection
- reviewing and validating automatic tuning decisions
- why you should not blindly trust auto tuning
- one interview answer I can give
```

## Prompt 27: Azure SQL DMVs for troubleshooting

```text
Teach me the most important DMVs for troubleshooting Azure SQL.

Real-life scenario:
A user reports slow query performance on an Azure SQL database during peak hours. I need to investigate quickly.

Explain:
- sys.dm_db_resource_stats (15-second granularity CPU/IO/memory, 1-hour retention)
- sys.resource_stats (5-minute granularity, 14-day retention)
- sys.dm_db_wait_stats (database-scoped wait stats)
- sys.dm_exec_requests (currently executing requests)
- sys.event_log (connectivity events)
- how to use these DMVs step by step
- why server-scoped DMVs don't show your workload
- one interview answer I can give
```

## Prompt 28: Troubleshooting a slow Azure SQL query

```text
Teach me a systematic approach to troubleshooting a slow query in Azure SQL.

Real-life scenario:
At 9 AM, the store checkout application is timing out. The Azure SQL database shows high DTU usage. My manager asks what's wrong.

Explain:
- step 1: check sys.dm_db_resource_stats for resource pressure
- step 2: check Query Store for plan regression
- step 3: check sys.dm_db_wait_stats for wait types
- step 4: identify the top query via Query Performance Insight
- step 5: force old plan or tune query
- step 6: scale up temporarily if resource-bound
- what NOT to do (restart, throw resources without diagnosis)
- one interview answer I can give
```

---

# Section 8: Interview Synthesis

## Prompt 29: Retail Azure SQL scenarios

```text
Teach me how to answer Azure SQL interview questions with retail-specific examples.

Real-life scenario:
The interviewer asks: "Tell me about your experience with Azure SQL in a retail environment."

Explain:
- how Azure SQL supports store operations, pricing, inventory, membership
- why service tier choice matters for checkout latency
- why serverless is wrong for 24/7 retail
- how auto-failover groups protect against region outages
- how monitoring prevents problems before stores open
- how DMA and transactional replication enable safe migrations
- one natural 90-second interview answer I can give
```

## Prompt 30: Azure SQL interview synthesis

```text
Act as a senior Azure SQL DBA mentor.

I have studied Azure SQL fundamentals, service tiers, networking, security, HA/DR, backup/restore, migration, monitoring, and troubleshooting for retail environments.

Now help me create:
1. A 60-second interview answer explaining my Azure SQL mindset.
2. A 90-second answer for choosing Azure SQL DB vs Managed Instance vs SQL VM.
3. A 90-second answer for Azure SQL DR strategy with auto-failover groups.
4. A 90-second answer for migrating a retail database to Azure SQL.
5. A 90-second answer for troubleshooting slow Azure SQL performance.
6. Five likely follow-up questions a senior DBA interviewer might ask about Azure SQL.
7. Simple answers to each follow-up question.

Keep the wording natural, practical, and suitable for a retail/enterprise Senior Infrastructure Operations Engineer interview.
```

---

# Final Reminder

For this Azure SQL preparation, your learning target is not to become an Azure expert overnight.

Your target is to speak like someone who understands Azure SQL production operations:

- know the difference between Azure SQL DB, Managed Instance, and SQL VM
- choose the right service tier for the workload
- never use serverless for 24/7 production
- use private endpoint and Entra ID for production security
- design DR with auto-failover groups
- test failover and restore processes regularly
- run DMA assessment before choosing a migration target
- use transactional replication for near-zero downtime migrations
- set up proactive monitoring alerts before users complain
- troubleshoot with database-scoped DMVs and Query Store
