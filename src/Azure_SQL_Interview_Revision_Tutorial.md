# Azure SQL Database for SQL Server DBAs, XYZ Interview Revision Tutorial

---

## 1. Executive Summary

Azure SQL Database is a managed SQL Server engine in Microsoft's cloud. Microsoft handles the OS, hardware, patching, backups, and high availability. You handle schema, data, performance, security, and connectivity.

What changes for a DBA moving from on-prem SQL Server:

| On-prem SQL Server | Azure SQL Database |
|---|---|
| You patch SQL Server | Microsoft patches |
| You manage backups | Automatic backups (you configure retention) |
| You build HA (AGs, FCI) | Built-in HA (Standard or Premium model) |
| You manage tempdb, max memory, file sizes | Microsoft manages infrastructure |
| sysadmin access | No sysadmin — server roles only |
| Full SQL Server features (Agent, CLR, Mail, etc.) | Subset of features — some missing |
| You provision hardware | You choose a service tier (DTU or vCore) |
| Restore any .bak file | Cannot restore .bak — use .bacpac, DMA, or replication |

For XYZ: This means less infrastructure firefighting, but you still own performance tuning, security, migration planning, DR testing, and incident response. The cloud does not remove DBA responsibility — it shifts it.

---

## 2. XYZ JD Alignment Table

| XYZ JD Requirement | Azure SQL Topic | Why XYZ Cares | Interview Angle | What I Should Say | What I Must Avoid Saying |
|---|---|---|---|---|---|
| Operation of business-critical SQL Server platforms in 24/7 enterprise | Service tiers, HA/DR, monitoring alerts | Stores, inventory, and pricing must stay up. No downtime. | "How do you keep Azure SQL stable in production?" | Pick provisioned (not serverless) for 24/7. Use Business Critical for low-latency workloads. Configure geo-replication for DR. Set up alerts on CPU, DTU, deadlocks. | "Serverless saves money, so I'd use that." or "Microsoft handles everything, so I don't need monitoring." |
| Performance tuning, capacity optimization, automation | vCore vs DTU, Query Performance Insight, automatic tuning, DMVs | Retail peak hours (Black Friday, Christmas) require fast queries. | "How do you troubleshoot a slow Azure SQL query?" | Use `sys.dm_db_resource_stats` for 15s granularity, Query Store for plan regression, and scale up vCores if resource-bound. Set up alerts at 80% DTU/CPU. | "I'd just add more DTUs." (Throwing resources at problems without diagnosis) |
| HA/DR solutions supporting high uptime across data centers | Geo-replication, auto-failover groups, backup restore | XYZ operates across Denmark, Greenland, Faroe Islands — needs regional failover. | "What DR strategy for Azure SQL in a multi-region retail company?" | Use auto-failover groups with one secondary region. Test failover quarterly. RTO ~1 hour, RPO ~5 seconds. For zero data loss, use manual planned failover. | "Azure handles HA for me, I don't need to do anything." |
| Infrastructure modernization, Azure platform, cloud initiatives | Choosing Azure SQL DB vs Managed Instance vs VM | XYZ wants future-proof, not lift-and-shift. | "When would you choose Managed Instance over Azure SQL DB?" | Managed Instance if the app needs SQL Agent, CLR, cross-db queries, or .bak restore. Azure SQL DB if the app is modern, elastic, can tolerate missing features. | "Azure SQL DB is always the best choice." |
| Migrations, upgrades, technical improvement projects | DMA, DMS, transactional replication, .bacpac | XYZ has legacy SQL Server apps they want to modernize. | "How would you migrate a 2TB retail database to Azure SQL DB?" | Use DMA for assessment first. If no blockers, use transactional replication for near-zero downtime. Test with a dry run. Have a rollback plan. | "I'd just export a .bacpac and import it." (Too slow for 2TB) |
| Security, compliance, robust operational processes | TDE, Entra ID, Defender for SQL, auditing, firewall | XYZ handles customer data across EU — GDPR compliance is mandatory. | "How do you secure Azure SQL for a retail company?" | Use Entra ID (Azure AD) authentication, not SQL auth. Enable TDE (Microsoft-managed keys unless security team demands customer-managed). Use private endpoint for production. Enable auditing to Log Analytics. | "SQL authentication is fine." or "I'll open a public endpoint for convenience." |
| Troubleshooting, incident management, technical sparring | DMVs, Query Store, metrics alerts, `sys.dm_exec_requests` | A slow checkout or inventory sync is a business emergency. | "Walk me through investigating a sudden spike in Azure SQL DTU usage." | Check `sys.dm_db_resource_stats` for recent 15s CPU/IO spikes. Check Query Store for plan changes. Identify the top query by resource consumption. If it's a bad plan, force the older plan. If it's resource pressure, scale up temporarily. | "I'd restart the database." (Restart doesn't fix bad queries) |

---

## 3. Core Tutorial Sections

### 3.1 What Azure SQL Database Is

**Simple explanation:** A managed SQL Server engine where Microsoft runs the server, you run the database.

**What changes:** No RDP to the server. No file system access. No `xp_cmdshell`. No SQL Agent.

**Why it matters for XYZ:** You cannot "just log in and fix it" like on-prem. Everything is done through T-SQL, portal, or PowerShell.

**Production risk:** Assuming you have sysadmin access when you don't. You get server-level roles like `##MS_ServerStateReader##`, not sysadmin.

**Interview answer:** "Azure SQL Database is a PaaS offering where Microsoft manages the infrastructure — OS, patching, hardware, backups, and HA. I manage schema, data, performance, security, and connectivity. It uses the same SQL Server engine, so my DBA skills transfer, but my access model and some features are different."

**Beginner mistake:** Trying to restore a `.bak` file. It does not work. Use `.bacpac`, DMA, or replication.

### 3.2 Database as a Service and Shared Responsibility

**Simple explanation:** Microsoft handles everything below the database engine. You handle everything inside it.

**What changes:** No more patching weekends. No more SAN provisioning. But you still need to test DR, tune queries, and manage users.

**Why it matters for XYZ:** Less infrastructure work means more time for performance tuning and automation projects.

**Production risk:** Assuming Microsoft handles performance. They don't. A badly written query will still kill your database.

**Interview answer:** "Shared responsibility means Microsoft owns the infrastructure — hardware, OS, patching, backups, and HA. I own the data, schema, query performance, security configuration, DR testing, and capacity planning."

**Beginner mistake:** Thinking "it's managed" means "I don't need to do anything."

### 3.3 Azure SQL DB vs Managed Instance vs SQL Server on Azure VM

**Simple explanation:**

| Service | Best for | Key difference |
|---|---|---|
| Azure SQL DB | New apps, elastic scale, simple migration | No sysadmin, no SQL Agent, database-scoped only |
| Managed Instance | Lift-and-shift legacy apps | Almost full SQL Server, can restore .bak, has SQL Agent |
| SQL VM | Full control needed | You manage everything, full SQL Server |

**What changes:** If your app uses SQL Agent, CLR, cross-database queries, Service Broker, or Database Mail, Azure SQL DB will not work. You need Managed Instance.

**Why it matters for XYZ:** Many retail apps may have legacy dependencies. You must assess before choosing.

**Production risk:** Choosing Azure SQL DB for an app that needs SQL Agent. You will hit blockers during migration.

**Interview answer:** "I choose Azure SQL DB for modern, cloud-native apps that don't depend on SQL Agent or cross-db queries. I choose Managed Instance for legacy apps that need near-full SQL Server compatibility, especially if they use SQL Agent jobs or need .bak restore. I choose SQL VM only when I need full control or unsupported features."

**Beginner mistake:** Assuming Managed Instance is always better because it has more features. It costs more and has less elastic scaling.

### 3.4 DTU Model vs vCore Model

**Simple explanation:**

- **DTU:** Blended measure of CPU, memory, IO. Simple but opaque. Basic, Standard, Premium.
- **vCore:** You pick exact vCores, memory, storage. More control. General Purpose, Business Critical, Hyperscale.

**What changes:** With vCore, you can use Azure Hybrid Benefit to reuse existing SQL Server licenses.

**Why it matters for XYZ:** XYZ likely has SQL Server licenses. Azure Hybrid Benefit can save significant costs.

**Production risk:** Using DTU for a complex workload where you need predictable resource allocation.

**Interview answer:** "I use vCore for production workloads because it gives me control over exact resources, supports Azure Hybrid Benefit for cost savings, and offers more tiers including Hyperscale for large databases. DTU is simpler but less transparent — fine for dev/test or simple workloads."

**Beginner mistake:** Not knowing Azure Hybrid Benefit exists. It can cut licensing costs by up to 55%.

### 3.5 Serverless vs Provisioned Compute

**Simple explanation:**

- **Serverless:** Auto-pauses when idle, paid per second. Cold start ~1 minute on first connection.
- **Provisioned:** Always on, paid per hour. No cold start.

**What changes:** Serverless is new — no on-prem equivalent.

**Why it matters for XYZ:** XYZ is 24/7 retail. Serverless is **wrong** for any business-critical system. Cold start delays during peak hours are unacceptable.

**Production risk:** Using serverless for a production retail database. A customer checkout that takes an extra minute because the database was paused? Unacceptable.

**Interview answer:** "Serverless is for dev/test or intermittent workloads with low usage. For any 24/7 production system at XYZ, I use provisioned compute — resources are always available, no cold start, and predictable performance."

**Beginner mistake:** Enabling serverless on a production database to save money without understanding cold start latency.

### 3.6 General Purpose, Business Critical, Hyperscale, and Elastic Pools

**Simple explanation:**

| Tier | Storage | HA model | Best for |
|---|---|---|---|
| General Purpose | Remote SSD (slower) | Standard (compute+storage split) | Most workloads, cost-sensitive |
| Business Critical | Local SSD (fast) | Premium (Always On AG, 4 replicas) | Low latency, high throughput |
| Hyperscale | Multi-tier with page servers | Standard up to 100TB | Very large databases |
| Elastic Pool | Shared resources across DBs | Depends on tier | Many databases with low avg utilization |

**What changes:** No need to build Always On AGs yourself — Business Critical includes it.

**Why it matters for XYZ:** A retail inventory system with sub-second query requirements needs Business Critical. A reporting warehouse with 50TB of data needs Hyperscale.

**Production risk:** Putting a latency-sensitive app on General Purpose. Remote SSD has higher latency than local SSD.

**Interview answer:** "General Purpose is my default for most workloads. I use Business Critical when the app needs low-latency writes or can benefit from read-scale to secondary replicas. Hyperscale is for databases over 4TB. Elastic pools save money when I have many databases with low average utilization."

**Beginner mistake:** Choosing Business Critical for every database "because it's better." It's more expensive and often unnecessary.

### 3.7 Cost Components: Compute, Storage, Backup Storage, Service Tier

**Simple explanation:**

- **Compute:** vCores (paid per hour provisioned, per second serverless)
- **Storage:** Data + log, paid per GB
- **Backup storage:** Free up to 100% of provisioned storage, then paid per GB
- **Service tier:** Determines base features and pricing multiplier

**What changes:** No upfront hardware costs. Pay-as-you-go. You can scale up/down anytime.

**Why it matters for XYZ:** Capacity planning is now about choosing the right tier, not buying hardware. Overprovisioning wastes money; underprovisioning causes slow performance.

**Production risk:** Not understanding backup storage costs. If you have 500GB database and keep 35 days of backups, your backup storage can exceed the 100% free limit significantly.

**Interview answer:** "The main costs are compute (vCores), storage (data+log), and backup storage (free up to 100% of DB size). I can scale up for peak loads and scale down after, using automation to match capacity to demand."

**Beginner mistake:** Ignoring backup storage costs. Large transaction logs can generate gigabytes of backup storage quickly.

### 3.8 Creating Servers and Databases

**Simple explanation:** A server is a logical grouping for databases, not a physical machine. You create a server, then create databases inside it.

**What changes:** No instance-level configuration (max memory, tempdb settings). You just pick region, auth method, and tier.

**Why it matters for XYZ:** Multiple retail databases (pricing, inventory, membership) can share one logical server for simpler management.

**Production risk:** Choosing the wrong region. Data sovereignty (GDPR) requires data to stay in EU for XYZ.

**Interview answer:** "I create a logical server per environment (dev, test, prod) in the appropriate region. Each database gets its own service tier based on workload requirements. I use infrastructure-as-code (ARM templates or Terraform) to ensure repeatability."

**Beginner mistake:** Not setting the maintenance window. Default is 5 PM to 8 AM — fine for most, but check if it conflicts with your batch window.

### 3.9 Region, Resource Group, Logical Server, Service Tier, Collation, Maintenance Window

**Simple explanation:** These are the decisions you make when provisioning. Get collation right at creation — you cannot change it later.

**What changes:** Resource groups let you manage related Azure resources together (e.g., all retail app resources in one group).

**Why it matters for XYZ:** Proper tagging and resource groups make it easier to track costs per business unit or application.

**Production risk:** Wrong collation means rebuilding the database. Get this right the first time.

**Interview answer:** "Region affects latency and data sovereignty. Resource groups organize resources logically. Logical servers group databases for administration. Collation must match the source database during migration. Maintenance window should be set to avoid peak business hours."

**Beginner mistake:** Forgetting to set the maintenance window. Default may overlap with your ETL window.

### 3.10 Public Endpoint, Service Endpoint, and Private Endpoint

**Simple explanation:**

- **Public endpoint:** Accessible over internet (firewall protected).
- **Service endpoint:** Access from a specific Azure virtual network.
- **Private endpoint:** Database gets a private IP inside your virtual network. No public exposure.

**What changes:** No more VPN into a physical data center. Network is configured in Azure.

**Why it matters for XYZ:** For production retail systems handling customer data, private endpoint is the security standard. Public endpoint is for dev/test only.

**Production risk:** Leaving a production database on a public endpoint with "Allow Azure services" enabled. This allows any Azure service to attempt connections.

**Interview answer:** "For production, I use private endpoint — the database is only reachable from our virtual network, with no public exposure. Service endpoint is a middle ground. Public endpoint is for dev/test with strict firewall rules only."

**Beginner mistake:** Using public endpoint + "Allow Azure services" in production. This is a common security gap.

### 3.11 Server-Level Firewall vs Database-Level Firewall

**Simple explanation:**

- **Server-level:** Set in Azure portal. Applies to all databases on the server. Best for admin access.
- **Database-level:** Set with T-SQL. Applies to one database. Portable during failover. Best for application access.

**What changes:** You need both layers of firewall management.

**Why it matters for XYZ:** Application firewall rules travel with the database during geo-failover. Server rules do not. This matters for retail applications that use geo-replication.

**Production risk:** Putting application firewall rules at server level. During failover, those rules don't exist on the secondary server.

**Interview answer:** "I use server-level firewall for DBA/admin access and database-level firewall for application access. Database firewall rules are portable during failover, which is critical for our disaster recovery strategy."

**Beginner mistake:** Only configuring server-level firewall. Application connectivity breaks after geo-failover.

### 3.12 Microsoft Entra ID (Azure AD) Authentication vs SQL Authentication

**Simple explanation:** Entra ID uses Azure AD identities (users, groups, service principals). SQL authentication uses username/password stored in the database.

**What changes:** No more managing SQL logins separately. Use your corporate Azure AD.

**Why it matters for XYZ:** Centralized identity management. One place for password policies, MFA, and access reviews. Critical for GDPR compliance.

**Production risk:** Using SQL authentication with shared credentials. No audit trail of who actually connected.

**Interview answer:** "I use Entra ID authentication as the primary method. It supports MFA, centralized password policies, and proper auditing. SQL authentication is only for legacy applications that cannot support Entra ID."

**Beginner mistake:** Using SQL authentication for everything because "that's what we've always done."

### 3.13 Security Features: Microsoft Defender for SQL, Auditing, TDE, Always Encrypted, Key Vault

**Simple explanation:**

- **Defender for SQL:** Vulnerability assessment + threat detection (SQL injection, anomalous access).
- **Auditing:** Log database events to storage, Event Hub, or Log Analytics.
- **TDE:** Encryption at rest. On by default. Use Microsoft-managed keys unless your security team insists on customer-managed.
- **Always Encrypted:** Column-level encryption. Application encrypts data before sending to DB. Even DBAs cannot read it.
- **Key Vault:** Central key management for TDE, Always Encrypted, and other Azure services.

**What changes:** TDE is automatic. No need to manage certificates. Defender is a cloud-only feature with no on-prem equivalent.

**Why it matters for XYZ:** GDPR and retail customer data require defense in depth.

**Production risk:** Managing your own TDE keys and losing them. Data becomes permanently unrecoverable.

**Interview answer:** "I enable TDE by default with Microsoft-managed keys unless compliance requires customer-managed keys in Key Vault. I enable Defender for SQL for vulnerability assessments and threat alerts. Auditing goes to Log Analytics for centralized SIEM integration."

**Beginner mistake:** Taking on customer-managed TDE keys without a mature key management process. You can lose your data permanently.

### 3.14 SQL Server Management Differences in Azure SQL Database

**Simple explanation:**

- No sysadmin role — use fixed server roles (`##MS_DatabaseManager##`, `##MS_ServerStateReader##`, etc.)
- No SQL Server Agent — use Elastic Jobs or Azure Automation
- No SSMS Management folder — no error log file, use `sys.event_log`
- DMVs are database-scoped, not server-scoped
- No `xp_cmdshell`, no `OPENROWSET` with non-Azure sources

**What changes:** Your toolbox changes. You cannot rely on OS-level tools.

**Why it matters for XYZ:** If a retail app relies on SQL Agent for nightly jobs, Azure SQL DB won't work. You need Managed Instance.

**Production risk:** Assuming you can run a T-SQL backup command. `BACKUP DATABASE` is not supported.

**Interview answer:** "The biggest differences are no sysadmin role, no SQL Agent, and DMVs scoped at database level. I use the built-in server roles for access control, Elastic Jobs for scheduling, and database-scoped DMVs for troubleshooting."

**Beginner mistake:** Running `BACKUP DATABASE` or `RESTORE DATABASE` in Azure SQL DB. It will fail.

### 3.15 Missing or Changed Features: SQL Agent, CLR, Database Mail, Linked Servers, Backups, Restore, sysadmin

**Simple explanation:**

| Feature | Azure SQL DB | Managed Instance |
|---|---|---|
| SQL Agent | No | Yes |
| CLR | No | Partial |
| Database Mail | No | Yes |
| Linked Servers | External table only | Yes |
| .bak restore | No | Yes |
| sysadmin | No | No (but close) |
| Cross-db queries | No | Yes |
| Service Broker | No | Yes |

**What changes:** Azure SQL DB is a subset of SQL Server features. You must design around these limitations.

**Why it matters for XYZ:** Many enterprise retail apps use SQL Agent, linked servers, or cross-db queries. These apps cannot go to Azure SQL DB without refactoring.

**Production risk:** Not doing a proper feature compatibility assessment before choosing Azure SQL DB.

**Interview answer:** "I use the Data Migration Assistant to assess feature compatibility first. If the app needs SQL Agent, CLR, or linked servers, I target Managed Instance instead. If it can work without these, Azure SQL DB is a better fit."

**Beginner mistake:** Discovering on migration day that the app uses SQL Agent and Azure SQL DB doesn't support it.

### 3.16 Backup, Short-Term Retention, Long-Term Retention

**Simple explanation:**

- **Automatic backups:** Full weekly, differential 12-24h, log every 10 minutes (5 min for Hyperscale). RPO = 10 minutes.
- **Short-term retention:** Up to 35 days (configurable). Can do point-in-time restore within retention.
- **Long-term retention:** Up to 10 years. Configure weekly/monthly/yearly policies.
- **Backup redundancy:** LRS (local), ZRS (zone), GRS (geo).

**What changes:** Backups are automatic. You no longer manage backup jobs, but you must configure retention and test restores.

**Why it matters for XYZ:** Compliance may require 7-year retention for financial data. Configure LTR accordingly.

**Production risk:** Deleting the logical server = all short-term backups are gone. You can still restore from LTR if configured.

**Interview answer:** "Backups are automatic with a 10-minute RPO. I configure short-term retention up to 35 days and long-term retention up to 10 years for compliance requirements. I test restores quarterly. I always use geo-redundant backup storage for production."

**Beginner mistake:** Not testing backups. Assuming automatic backups mean you're covered. Test your restore process.

### 3.17 HA/DR, Geo-Replication, Auto-Failover Groups

**Simple explanation:**

- **HA (same region):** Standard (General Purpose) or Premium (Business Critical) model. Business Critical uses Always On AGs with 4 replicas.
- **DR (cross-region):** Geo-restore (RPO 1h, RTO 12h), active geo-replication (up to 4 readable secondaries, manual failover), auto-failover groups (group failover, configurable grace period, RPO 5s, RTO 1h).

**What changes:** No configuring Windows Clustering, no quorum management, no AG listener setup. Microsoft handles the complexity.

**Why it matters for XYZ:** Retail cannot have 12-hour downtime. Geo-restore is too slow for business-critical systems. Use auto-failover groups.

**Production risk:** Relying on geo-restore for DR. RPO of 1 hour and RTO of 12 hours is unacceptable for production retail.

**Interview answer:** "For HA, I use Business Critical tier (Premium availability model with Always On AGs) for critical workloads. For DR, I use auto-failover groups with a secondary region. I test failover quarterly. I connect my application to the failover group listener endpoint for automatic redirection."

**Beginner mistake:** Not understanding that geo-restore has a 12-hour RTO. That's a day without your retail systems.

### 3.18 Migration from SQL Server to Azure SQL Database

**Simple explanation:** Migration is a project, not a task. You must assess, plan, test, and execute.

**What changes:** No direct `.bak` restore. You need specific migration tools.

**Why it matters for XYZ:** XYZ likely has dozens of legacy SQL Server databases. A structured migration methodology prevents failures.

**Production risk:** Attempting a migration without assessment. Unsupported features will block you.

**Interview answer:** "My migration methodology is: 1) Assess with DMA, 2) Choose target (Azure SQL DB or Managed Instance), 3) Test application compatibility and performance, 4) Choose migration method based on downtime tolerance, 5) Dry run, measure downtime, 6) Execute cutover with rollback plan."

**Beginner mistake:** Skipping the assessment. You discover blockers during cutover.

### 3.19 Migration Tools: DMA, DMS, Azure Data Studio, Transactional Replication

**Simple explanation:**

| Tool | Assessment | Data Movement | Downtime | Best for |
|---|---|---|---|---|
| DMA | Yes | Yes | Offline (longer) | Small/medium DBs, one-time |
| Azure Data Studio extension | Yes | Yes | Offline | Multiple DBs at once |
| DMS | No | Yes | Offline | Large DBs, uses Azure service |
| Transactional Replication | No | Yes | Online (minimal) | Near-zero downtime, large DBs |

**What changes:** Transactional replication from SQL Server to Azure SQL DB is the only way to achieve near-zero downtime migration.

**Why it matters for XYZ:** Retail systems cannot have hours of downtime. Transactional replication is the preferred method for production migrations.

**Production risk:** Using `.bacpac` for a 2TB database. The export/import will take hours or days.

**Interview answer:** "For a retail production database that needs minimal downtime, I use transactional replication. It keeps source and target in sync, allowing a short cutover window. I use DMA for pre-migration assessment and smaller databases. For large databases with longer downtime tolerance, DMS or .bacpac can work."

**Beginner mistake:** Using `.bacpac` for a large production migration. Way too slow.

### 3.20 Monitoring, Alerts, Query Performance Insight, Recommendations, Automatic Tuning

**Simple explanation:**

- **Metrics:** CPU, DTU, data IO, log IO, sessions, workers, deadlocks. Tracked in Azure Monitor.
- **Alerts:** Define conditions (e.g., CPU > 80% for 5 minutes) and action groups (email, SMS, webhook, runbook).
- **Query Performance Insight:** Portal tool showing top queries by CPU, duration, IO. Requires Query Store enabled.
- **Automatic Tuning:** Create/drop indexes automatically. Auto-force plan if regression detected.
- **Performance Recommendations:** Index create/drop suggestions based on workload.

**What changes:** No PerfMon, no custom monitoring scripts (unless you want them). Azure provides built-in tools.

**Why it matters for XYZ:** You need to know about resource pressure before stores open. Alert when CPU/DTU > 80%.

**Production risk:** Not setting up alerts. You find out about a problem when the business calls you.

**Interview answer:** "I set up alerts on CPU percentage > 80%, DTU usage > 80%, and failed connections. I use Query Performance Insight to identify the top resource-consuming queries. I enable automatic tuning for index management and plan forcing. I review performance recommendations weekly."

**Beginner mistake:** Enabling automatic create/drop index without understanding the workload. Let Azure manage indexes but review its decisions.

### 3.21 Azure SQL DMVs and Database-Scoped Troubleshooting

**Simple explanation:** DMVs work at database scope, not server scope. Key DMVs:

| DMV | What it shows | Retention |
|---|---|---|
| `sys.dm_db_resource_stats` | CPU, IO, memory per 15s | 1 hour |
| `sys.resource_stats` (master) | CPU, IO, memory per 5min | 14 days |
| `sys.dm_db_wait_stats` | Wait stats for the current database | Resets on restart |
| `sys.dm_exec_requests` | Currently executing requests | Live |
| `sys.event_log` | Database connectivity events | — |

**What changes:** You cannot run `sys.dm_os_wait_stats` at server level for your workload — it shows Azure fabric waits.

**Why it matters for XYZ:** Quick database-scoped troubleshooting without needing server-level access.

**Production risk:** Looking at `sys.dm_os_wait_stats` in master and thinking those waits are from your workload. They are Azure infrastructure waits.

**Interview answer:** "For troubleshooting, I start with `sys.dm_db_resource_stats` for 15-second granularity on resource usage, then `sys.dm_db_wait_stats` for wait analysis, and Query Store for plan regression. All DMVs are database-scoped — I connect to the specific database I'm troubleshooting."

**Beginner mistake:** Trying to use server-scoped DMVs the same way as on-prem. They don't work the same.

---

## 4. XYZ-Style Real-Life Scenarios

### Scenario 1: Choosing Azure SQL DB vs Managed Instance for a Retail App

**Situation:** XYZ is migrating a legacy inventory management system that uses SQL Agent for nightly stock reconciliation jobs and a linked server to pull data from the warehouse.

**Business impact:** If the migration target is wrong, the project will fail or require costly rework.

**Technical symptoms:** DMA assessment shows SQL Agent jobs, linked server usage, and a CLR assembly for custom business logic.

**Investigation:** Run DMA. Find blocked features.

**Azure SQL tool used:** Data Migration Assistant.

**Root cause:** The legacy app depends on features not available in Azure SQL DB.

**Fix:** Choose Azure SQL Managed Instance instead. It supports SQL Agent, linked servers, and CLR.

**Long-term prevention:** Always run DMA before choosing a cloud target. Document application dependencies.

**Short interview answer:** "I chose Managed Instance because the app uses SQL Agent and linked servers, which Azure SQL DB doesn't support."

**Senior answer:** "The DMA flagged SQL Agent jobs for nightly reconciliation and linked server queries. These are blockers for Azure SQL DB. Managed Instance supports both with near 100% compatibility, making it the right target for this lift-and-shift. Long-term, we'll refactor the app to remove these dependencies and eventually target Azure SQL DB."

### Scenario 2: Serverless Database Causing Cold-Start Delay

**Situation:** A XYZ store pricing lookup application was migrated to serverless Azure SQL DB to save costs. During opening hours, the first query of the morning takes over a minute.

**Business impact:** Store employees cannot look up prices for 60+ seconds. Customers wait at the register.

**Technical symptoms:** First query after idle period takes 60-90 seconds. Subsequent queries are fast. `sys.dm_db_resource_stats` shows no resource usage before the spike.

**Investigation:** Check the service tier. Notice serverless with auto-pause enabled. The database was paused overnight.

**Azure SQL tool used:** Azure portal → database overview → Pricing tier.

**Root cause:** Serverless auto-pause pauses the database after 1 hour idle. First connection triggers resume (~1 minute latency).

**Fix:** Disable auto-pause or switch to provisioned compute.

**Long-term prevention:** Never use serverless for 24/7 production workloads. Provisioned compute only.

**Short interview answer:** "The database was in serverless mode and auto-paused overnight. The first connection had to resume it, causing a cold-start delay."

**Senior answer:** "Serverless was incorrectly chosen for a 24/7 retail application. The auto-pause feature causes 60+ second cold-start delays, which is unacceptable for store operations. I switched to provisioned compute with 2 vCores — no cold start, predictable performance. For cost-sensitive dev/test databases, serverless is fine. For production retail systems, always provisioned."

### Scenario 3: Private Endpoint Required for Secure Production Access

**Situation:** XYZ's security team mandates that all production databases must not be accessible from the internet. The existing Azure SQL DB is using a public endpoint.

**Business impact:** Security audit failure. Potential data exposure risk.

**Technical symptoms:** Public endpoint is enabled with "Allow Azure services" checked. Any Azure resource can attempt connections.

**Investigation:** Review the database networking blade.

**Azure SQL tool used:** Portal → SQL server → Networking.

**Root cause:** Default configuration uses public endpoint.

**Fix:** Create a private endpoint. Disable public endpoint. Configure network security groups.

**Long-term prevention:** Make private endpoint the standard for all production databases. Block public endpoint creation via Azure Policy.

**Short interview answer:** "The database had a public endpoint. I configured a private endpoint with the public endpoint disabled to meet security requirements."

**Senior answer:** "The public endpoint was a security risk — the database was reachable from any Azure service. I deployed a private endpoint to place the database on our virtual network with a private IP, then disabled the public endpoint. This ensures all traffic stays within our network. I also implemented Azure Policy to prevent future public endpoint creation for production resources."

### Scenario 4: Firewall Misconfiguration Blocking Store Connectivity

**Situation:** XYZ stores cannot connect to the central pricing database after a networking change.

**Business impact:** Stores cannot update prices. Customers are charged incorrect amounts.

**Technical symptoms:** Connection errors from store systems: "Cannot open server 'XYZ-pricing' requested by the login. Client IP address 'X.X.X.X' is not allowed to access the server."

**Investigation:** Check server firewall rules. The store IP ranges may be missing.

**Azure SQL tool used:** Portal → SQL server → Networking → Firewall rules.

**Root cause:** A firewall rule was accidentally removed during a configuration change, or store IP ranges changed without updating the firewall.

**Fix:** Add the correct store IP ranges to the server-level firewall or configure database-level firewall rules.

**Long-term prevention:** Use database-level firewall rules for application connectivity (portable during failover). Use automation to manage firewall rules. Consider private endpoint to avoid IP management entirely.

**Short interview answer:** "Store IPs were blocked by the firewall. I added the missing ranges to the server-level firewall."

**Senior answer:** "The root cause was a missing firewall rule after a network change — store IP ranges weren't updated. I added the correct ranges immediately to restore connectivity. For prevention, I'll migrate application connectivity to use database-level firewall rules, which are more portable during failover, and we're planning private endpoint deployment to eliminate dependency on IP-based firewall management entirely."

### Scenario 5: Wrong Service Tier Causing Slow Checkout

**Situation:** XYZ's checkout application is slow during peak hours (4-6 PM). Transactions that normally take 200ms are taking 2-3 seconds.

**Business impact:** Customers wait longer. Checkout throughput drops.

**Technical symptoms:** High DTU usage (consistently > 90%) during peak hours. `sys.dm_db_resource_stats` shows 95% DTU. Queries in `sys.dm_exec_requests` show high `PAGEIOLATCH` waits.

**Investigation:** Check Azure metrics → DTU percentage. Check `sys.dm_db_resource_stats` for the peak period.

**Azure SQL tool used:** Azure Metrics (DTU percentage), Query Performance Insight.

**Root cause:** The database is on Standard S2 (50 DTUs). Peak checkout load exceeds capacity.

**Fix:** Scale up to S3 (100 DTUs) temporarily, then evaluate if a permanent scale-up or query optimization is needed.

**Long-term prevention:** Monitor peak usage patterns. Set up autoscaling or schedule scale-ups for known peak hours.

**Short interview answer:** "The database was undersized for peak load. I scaled up the service tier."

**Senior answer:** "DTU usage was consistently above 90% during checkout peak hours. This is an IO-bound workload — the S2 tier with 50 DTUs couldn't handle the concurrency. I scaled to S3 (100 DTUs) as an immediate fix to restore checkout performance. Long-term, I'll analyze the top queries via Query Performance Insight to identify optimization opportunities, and implement scheduled scale-ups for known peak periods."

### Scenario 6: Geo-Replication for DR

**Situation:** A regional Azure outage affects the North Europe datacenter where XYZ's production database is hosted.

**Business impact:** XYZ stores across Denmark cannot process transactions.

**Technical symptoms:** All connections to the primary database fail. The application is completely down.

**Investigation:** Check Azure Service Health for region outage. Verify secondary database status in West Europe.

**Azure SQL tool used:** Auto-failover group → Failover.

**Root cause:** North Europe region outage.

**Fix:** Initiate failover to West Europe secondary via the auto-failover group. Verify application connectivity through the failover group listener. When North Europe recovers, fail back.

**Long-term prevention:** Ensure all production databases have auto-failover groups configured. Test failover quarterly.

**Short interview answer:** "North Europe had an outage. I performed a manual failover to our West Europe secondary using the auto-failover group, and applications reconnected through the listener endpoint."

**Senior answer:** "During the North Europe outage, our auto-failover group detected the region unavailability. I initiated a manual failover to West Europe with a configurable grace period — the RPO was approximately 5 seconds, well within our 1-minute tolerance. The auto-failover group listener endpoint handled connection redirection transparently. After the incident, I failed back to North Europe once stability was confirmed. This is why I always recommend auto-failover groups with a secondary region for production retail databases."

### Scenario 7: Backup Retention Not Matching Compliance

**Situation:** XYZ's compliance team requires 7-year retention for financial transaction data. The current Azure SQL DB has default retention of 7 days.

**Business impact:** Compliance violation. Potential fines under GDPR.

**Technical symptoms:** Not a technical failure — a configuration gap. No LTR policy configured.

**Investigation:** Review backup retention settings in the portal.

**Azure SQL tool used:** Portal → SQL server → Backups → Retention policies → Long-term retention.

**Root cause:** No long-term retention policy configured.

**Fix:** Configure LTR policy. Example: weekly backups for 4 weeks, monthly for 12 months, yearly for 7 years.

**Long-term prevention:** Include LTR configuration in the database provisioning checklist. Automate with Azure Policy.

**Short interview answer:** "The compliance requirement was 7 years. I configured long-term retention with a yearly policy to meet it."

**Senior answer:** "The default 7-day retention was insufficient for our 7-year compliance requirement. I configured a long-term retention policy: weekly full backups retained for 4 weeks, the first full backup of each month retained for 12 months, and the full backup from week 20 of each year retained for 7 years. This meets both our operational recovery needs and compliance requirements while managing storage costs."

### Scenario 8: Migration Blocked by Unsupported Features

**Situation:** XYZ is migrating a 10-year-old warehouse management database to Azure. The migration fails because the database uses CLR assemblies and Database Mail.

**Business impact:** Migration project delayed. Extra cost because target must change.

**Technical symptoms:** DMA assessment shows red flags: CLR dependency, Database Mail usage.

**Investigation:** Run DMA. Review feature parity report.

**Azure SQL tool used:** Data Migration Assistant.

**Root cause:** Trying to migrate a legacy app to Azure SQL DB without verifying feature compatibility.

**Fix:** Change target to Azure SQL Managed Instance (supports CLR and Database Mail). Or refactor the application to remove dependencies.

**Long-term prevention:** Always run DMA before choosing a target. Include application dependency inventory in the pre-migration phase.

**Short interview answer:** "DMA flagged CLR and Database Mail as incompatible with Azure SQL DB. I switched the target to Managed Instance."

**Senior answer:** "The DMA assessment was critical here — it identified CLR assemblies and Database Mail usage, both unsupported in Azure SQL DB. Had we proceeded, the migration would have failed. I changed the target to Azure SQL Managed Instance, which supports both features with nearly full compatibility. This added minimal cost but saved weeks of rework. The lesson is: always assess before you decide."

### Scenario 9: Monitoring Alert Detects Resource Pressure Before Business Outage

**Situation:** An Azure alert fires at 7:15 AM: "High CPU on XYZ Inventory Database" — CPU > 85% for the last 5 minutes.

**Business impact:** None yet. But if unaddressed, queries will slow as stores open at 8 AM.

**Technical symptoms:** Alert shows CPU at 88%. `sys.dm_db_resource_stats` confirms sustained high CPU. `sys.dm_exec_requests` shows a specific inventory query running frequently with a high compile time.

**Investigation:** Check Query Performance Insight. Find the top CPU-using query. Compare with Query Store — a plan changed overnight.

**Azure SQL tool used:** Azure Alerts, Query Performance Insight, Query Store.

**Root cause:** An index was dropped (or statistics outdated), causing a plan regression for a key inventory query.

**Fix:** Force the previous known-good plan via Query Store. Or rebuild the missing index.

**Long-term prevention:** Set up alerts on CPU/DTU > 80%. Review Query Store weekly for plan regressions. Enable automatic plan forcing.

**Short interview answer:** "An alert fired at 7:15 AM for high CPU. I used Query Store to find a plan regression and forced the old plan. Problem solved before stores opened."

**Senior answer:** "The alert gave us 45 minutes before stores opened. I investigated via Query Performance Insight — a new execution plan for the stock availability query was causing excessive CPU. Query Store showed the plan changed at 2 AM during index maintenance. I forced the previous plan via `sp_query_store_force_plan`. CPU dropped to 25% immediately. The root cause was an index rebuild at 2 AM causing stats to change. I adjusted index maintenance to update stats more carefully, and enabled automatic plan forcing for future regressions."

### Scenario 10: Automatic Tuning Helps Identify a Bad Query Plan

**Situation:** The XYZ membership rewards query suddenly runs 5x slower. The DBA was not aware until membership team complained.

**Business impact:** Customer reward points calculation delayed. Members see incorrect balances.

**Technical symptoms:** Query that normally takes 2 seconds now takes 11 seconds. No code changes deployed.

**Investigation:** Open Query Performance Insight in Azure portal. Check for top regressed queries.

**Azure SQL tool used:** Query Performance Insight, automatic tuning.

**Root cause:** Statistics change caused a suboptimal query plan. Query Store detected regression.

**Fix:** Enable automatic plan forcing, or manually force the old plan.

**Long-term prevention:** Keep Query Store enabled with AUTO capture mode. Enable automatic tuning for plan forcing.

**Short interview answer:** "Query Store found a plan regression. I forced the old plan and the query returned to normal."

**Senior answer:** "The membership query regressed from 2s to 11s due to a stats-driven plan change. Query Performance Insight identified the query immediately. I enabled automatic plan forcing via the automatic tuning feature — Azure SQL DB now automatically forces the known-good plan when regression is detected. For the immediate fix, I manually forced the plan. I also set up Azure Alerts to notify the DBA team any time a plan is auto-forced, so we can investigate the root cause."

---

## 5. Azure SQL DBA Cheat Sheet

| Azure SQL Feature | On-Prem SQL Server Equivalent | DBA Still Owns | Microsoft Manages | Interview Warning |
|---|---|---|---|---|
| Automatic backups | Manual backup job | Define retention, test restores | Schedule, execute, store | "Microsoft handles backups" — say "I configure and test retention" |
| High Availability | Always On AG / FCI | Choose tier, test failover | Replica sync, failover orchestration | "Azure handles HA" — say "I choose Business Critical for 4-replica HA and test failover" |
| Service tiers | Hardware selection | Choose right tier, scale as needed | Provision hardware | "I'll just use the cheapest tier" — align tier to workload |
| Query Store | Same feature | Enable, configure, review | Feature availability | "Query Store is optional" — it's essential for troubleshooting |
| Automatic tuning | DBA-run index maintenance | Review recommendations, approve | Execute changes | "Let Azure do everything" — review and validate auto changes |
| TDE | Certificate management | Key strategy (service vs customer-managed) | Encryption if service-managed | "I'll manage keys myself" — know the risk of key loss |
| Auditing | SQL Server Audit | Define what to audit, review logs | Infrastructure to deliver logs | "Auditing is built-in" — say "I configure audit destination and review regularly" |
| Firewall | Windows Firewall | Define rules (server and database level) | Enforce rules | "Just use public endpoint" — say "private endpoint for production" |
| Server roles | sysadmin, securityadmin, etc. | Grant roles appropriately | Define available roles | "I need sysadmin" — you won't get it |
| DMVs | Same, server-scoped | Query from correct database scope | Provide views | "Same DMVs" — say "same DMVs, database-scoped" |

---

## 6. Interview Question Bank

### Q1: What is Azure SQL Database and how is it different from SQL Server on-premises?

**Weak answer:** "It's SQL Server in the cloud. Microsoft manages everything."

**Strong answer:** "It's a PaaS offering where Microsoft manages the OS, hardware, patching, backups, and HA. I manage data, schema, performance, security, and connectivity. Key differences: no sysadmin access, database-scoped DMVs, no SQL Agent, no direct .bak restore, built-in HA/DR, and consumption-based pricing."

**Follow-up:** "What would you do if your app needs SQL Agent?"

**Sentence to memorize:** "Azure SQL DB is managed SQL Server — Microsoft handles infrastructure, I handle the data layer."

**Avoid:** "It's the same thing as SQL Server." It's not.

### Q2: How do you choose between DTU and vCore pricing models?

**Weak answer:** "vCore is better because it gives you more control."

**Strong answer:** "vCore is my default for production — it gives precise control over resources, supports Azure Hybrid Benefit for license cost savings, and offers more tiers including Hyperscale. DTU is simpler and fine for dev/test or predictable small workloads but lacks transparency."

**Follow-up:** "How does Azure Hybrid Benefit work?"

**Sentence to memorize:** "vCore for production with Hybrid Benefit; DTU for simplicity in dev/test."

**Avoid:** "DTU is outdated." It's not — it has valid use cases.

### Q3: How do you handle disaster recovery for an Azure SQL database in a retail environment?

**Weak answer:** "Azure handles HA/DR automatically."

**Strong answer:** "Azure handles HA within a region. For DR across regions, I use auto-failover groups. I configure a secondary region, set a grace period for automatic failover, and connect applications to the failover group listener endpoint. I test failover quarterly. The RPO is ~5 seconds, RTO is ~1 hour."

**Follow-up:** "What's the difference between geo-replication and auto-failover groups?"

**Sentence to memorize:** "Auto-failover groups for group failover with a listener; geo-replication for individual database failover with up to 4 secondary regions."

**Avoid:** "Geo-restore is good enough for DR." 12-hour RTO is not acceptable for retail.

### Q4: How do you troubleshoot a slow-performing Azure SQL database?

**Weak answer:** "I check CPU and add more resources."

**Strong answer:** "First, I check `sys.dm_db_resource_stats` (15s granularity) for CPU/IO pressure. Then I check Query Store for plan regressions. I use `sys.dm_db_wait_stats` to identify wait types. If it's a plan issue, I force the old plan. If it's resource pressure, I scale up. I also check Query Performance Insight in the portal for top resource-consuming queries."

**Follow-up:** "What's your first DMV when someone reports a slow query?"

**Sentence to memorize:** "Start with `sys.dm_db_resource_stats` for resource pressure, then Query Store for plan regression."

**Avoid:** "I'd just restart the service." No SQL Server restart in Azure SQL DB.

### Q5: How would you migrate a 500GB retail database to Azure SQL with minimal downtime?

**Weak answer:** "I'd export a .bacpac and import it."

**Strong answer:** "I'd use transactional replication from SQL Server to Azure SQL DB. After the initial snapshot syncs, log changes replicate continuously. When we cut over, I stop the app, verify sync, redirect the connection string, and start the app. Downtime is 1-2 minutes. Before this, I'd run DMA to check compatibility."

**Follow-up:** "What if the database uses features not supported in Azure SQL DB?"

**Sentence to memorize:** "Transactional replication for near-zero downtime; DMA first for compatibility check."

**Avoid:** "I'd just use DMS." Understand the tools, don't just name them.

### Q6: How do you secure an Azure SQL database for a retail company handling customer data?

**Weak answer:** "Enable TDE and use firewalls."

**Strong answer:** "Defense in depth: 1) Entra ID authentication with MFA, 2) Private endpoint (no public exposure), 3) TDE with service-managed keys, 4) Microsoft Defender for SQL for threat detection, 5) Auditing to Log Analytics, 6) Row-Level Security for customer data isolation, 7) Always Encrypted for highly sensitive columns like payment data."

**Follow-up:** "Would you use customer-managed or service-managed keys for TDE?"

**Sentence to memorize:** "Entra ID, private endpoint, TDE, Defender, auditing — layered security for customer data."

**Avoid:** "SQL authentication is fine." Not for GDPR-sensitive retail data.

### Q7: Why would you choose Managed Instance over Azure SQL DB?

**Weak answer:** "Managed Instance has more features."

**Strong answer:** "I choose Managed Instance when the application depends on SQL Agent, CLR, linked servers, cross-database queries, Service Broker, or needs native .bak restore. Azure SQL DB is better when the app is modern, can tolerate missing features, and benefits from elastic scaling and lower cost."

**Follow-up:** "What's the main downside of Managed Instance?"

**Sentence to memorize:** "Managed Instance for legacy compatibility; Azure SQL DB for modern, elastic applications."

**Avoid:** "Managed Instance is always better." It's more expensive and less elastic.

---

## 7. Expert DBA Notes

### Why serverless is risky for 24/7 critical workloads

Serverless auto-pauses after idle. Cold start is ~1 minute. XYZ retail systems cannot wait 60 seconds for a database to resume during business hours. **Never use serverless for production 24/7 systems. Use provisioned compute.**

### Why Managed Instance may fit better than Azure SQL DB for legacy workloads

Azure SQL DB is missing SQL Agent, CLR, Database Mail, linked servers, cross-database queries, and Service Broker. If XYZ's legacy apps use any of these, **you will be blocked**. Managed Instance has near 100% compatibility. Always run DMA before choosing. **Don't discover blockers on migration day.**

### Why private endpoint is preferred for production

Public endpoint + firewall is a single layer of security. Private endpoint removes public exposure entirely. For retail customer data under GDPR, **private endpoint should be the standard**. Use Azure Policy to enforce it.

### Why Entra ID is better than SQL authentication

Entra ID supports MFA, centralized password policies, access reviews, and conditional access. SQL authentication uses static credentials stored in the database. **For enterprise security and compliance, Entra ID is mandatory.** SQL auth is for legacy app compatibility only.

### Why Azure SQL reduces infrastructure work but does not remove DBA responsibility

Microsoft handles OS, hardware, patching, and backups. **You still own performance tuning, security configuration, data modeling, capacity planning, DR testing, access management, and migration strategy.** The DBA role shifts from "keep the server running" to "optimize the data platform." This requires different skills, not fewer skills.

### Why backups existing automatically does not mean recovery is tested

Azure backups are automatic. That does not mean your recovery process works. **You must test restores.** Test point-in-time restore. Test geo-restore. Test failover group failover. An untested backup is a backup that might not work when you need it. Schedule quarterly restore drills.

### Why monitoring must focus on actionable alerts, not noise

Alert on CPU > 80%, DTU > 80%, failed connections, deadlocks. Do not alert on every small fluctuation. **Too many alerts = ignored alerts.** Define severity levels. Use action groups to route critical alerts to on-call and informational alerts to email. A good alert tells you exactly what is wrong and what to check first.

### Why migration assessment matters before choosing a cloud target

DMA assessment can take 30 minutes and save weeks of failed migration. **Run DMA before choosing Azure SQL DB vs Managed Instance vs SQL VM.** Know your feature dependencies, database size, and compatibility level before you provision anything. The assessment should be the first step, not an afterthought.

---

## 8. Final 30-Minute Revision Plan

### First 10 Minutes: Azure SQL Fundamentals

- What is Azure SQL DB? (PaaS, managed engine, no sysadmin, no SQL Agent)
- DTU vs vCore (DTU = blended measure, vCore = exact resources)
- Serverless vs provisioned (serverless = cold start, provisioned = always on)
- General Purpose vs Business Critical vs Hyperscale (storage type, HA model, latency)
- Shared responsibility model (Microsoft = infra, you = data/performance/security)

### Next 10 Minutes: HA/DR, Security, Migration

- HA (built-in, no AGs to manage) vs DR (geo-replication, auto-failover groups)
- Auto-failover groups (group failover, listener endpoint, 5s RPO, 1h RTO)
- Backups (automatic, 10-min RPO, 35-day STR, 10-year LTR)
- Security (Entra ID, private endpoint, TDE, Defender, auditing)
- Migration (DMA first, then transactional replication for near-zero downtime)

### Final 10 Minutes: Scenarios and Interview Answers

- Scenario: Slow checkout → check DTU/CPU, scale up or optimize query
- Scenario: Serverless cold start → switch to provisioned
- Scenario: Missing feature in Azure SQL DB → pick Managed Instance
- Scenario: Region outage → auto-failover group failover
- Scenario: Compliance needs long retention → configure LTR

### What to Memorize

- "Azure SQL DB is managed infrastructure, but I still manage performance and security."
- "vCore with Hybrid Benefit for production; DTU for dev/test."
- "Never serverless for 24/7 production."
- "Private endpoint for production; Entra ID for auth."
- "Run DMA before migrating. Test restores. Test failover."
- "Transaction replication for near-zero downtime migration."

### What to Avoid Saying

- "Microsoft handles everything" (implies you have no role)
- "Azure SQL DB is the same as on-prem SQL Server" (it's not)
- "I'd just add more DTUs" (throwing resources at problems without diagnosis)
- "Backups are automatic, we're fine" (untested backups are not backups)
- "SQL authentication is fine" (not for enterprise security)

---

### Pre-Interview Checklist

- [ ] Can I explain the three Azure SQL options (DB, MI, VM) and when to use each?
- [ ] Do I know the difference between DTU and vCore?
- [ ] Do I understand why serverless is wrong for 24/7 production?
- [ ] Can I describe how auto-failover groups work?
- [ ] Do I know how migration assessment with DMA works?
- [ ] Can I explain the shared responsibility model clearly?
- [ ] Do I know what's missing in Azure SQL DB vs on-prem?
- [ ] Can I troubleshoot a slow query using DMVs and Query Store?
- [ ] Do I know the security stack (Entra ID, private endpoint, TDE, Defender)?
- [ ] Can I give a retail-specific example for each major concept?
