---
title: Cloud, Azure & Modernization
order: 11
icon: ☁️
---

## Key Concepts

### Azure SQL Options — Choosing the Right Service

| Feature | Azure SQL DB | Azure SQL Managed Instance | SQL Server on Azure VM |
|---------|-------------|---------------------------|----------------------|
| Management | Fully managed (PaaS) | Mostly managed | Your responsibility (IaaS) |
| Compatibility | Some limitations | Near 100% compatible | Full control |
| HA | Built-in (99.99% SLA) | Built-in | You configure AG/Mirroring |
| Scaling | Elastic pools, DTU/vCore | vCore, storage separate | VM scaling + SQL config |
| Migration effort | Low to medium | Low (if compatible) | Medium to high |
| Use case | New apps, modernized | Lift-and-shift | Legacy, full OS control |

### Azure Recommendations

```
If app supports it and minimal ops overhead desired → Azure SQL Database
If near-full SQL Server compatibility required     → Azure SQL Managed Instance
If full OS-level control needed                    → SQL Server on Azure VM
```

### Migration Methods

| Method | Downtime | Complexity | Best For |
|--------|----------|------------|----------|
| Backup/Restore to Azure VM | Hours | Low | Simple migrations |
| Azure DMS | Low | Medium | Online migrations, minimal downtime |
| BACPAC | Hours | Low | Smaller databases (< 1 TB) |
| Transactional Replication | Minimal | High | Near-zero downtime |
| Distributed AG | Seconds | High | Enterprise HA to cloud |
| Log Shipping | Minutes | Medium | DR setup to Azure |

### Migration Assessment Checklist

Before any migration, run the **Microsoft Data Migration Assistant (DMA)**:

1. Compatibility issues — deprecated features, breaking changes
2. SQL Agent jobs — need rewriting for Azure SQL DB?
3. Linked servers — supported in Managed Instance, not in Azure SQL DB
4. CLR, Service Broker, cross-database queries — check limitations
5. Security model — logins, contained users, firewall rules
6. Performance baseline — capture before migration for comparison

### Modernization Roadmap

```
Phase 1: Assessment (DMA, dependency mapping, ownership)
Phase 2: Quick wins (unsupported versions, simple DBs to MI)
Phase 3: Complex migrations (distributed AG to Azure, consolidation)
Phase 4: PaaS adoption (re-architect for Azure SQL DB)
Phase 5: Optimization (serverless, hyperscale, auto-tuning)
```

### SQL Server Version Upgrades

| Version | End of Support | Risk |
|---------|---------------|------|
| SQL Server 2012 | July 12, 2022 | Extended Security Updates only |
| SQL Server 2014 | July 9, 2024 | Out of support |
| SQL Server 2016 | July 14, 2026 | Extended Security Updates available |
| SQL Server 2019 | January 7, 2030 | Current |
| SQL Server 2022 | January 11, 2033 | Current — recommended |

Upgrade approach:
1. Pre-upgrade assessment (DMA)
2. Check compatibility level and deprecated features
3. Capture performance baseline
4. Test in non-production
5. Execute migration (backup/restore or side-by-side)
6. Validate performance, rollback plan ready

---

## Interview Q&A

**Q:** When would you recommend Azure SQL Managed Instance vs Azure SQL Database?

> Managed Instance when the application needs near-full SQL Server compatibility — SQL Agent jobs, cross-database queries, linked servers, Service Broker. It's the best "lift and shift" target. Azure SQL Database is for applications that can be modernized — it offers more built-in HA, auto-tuning, serverless compute, and lower operational overhead. The DMA report tells me which one is suitable.

**Q:** How do you plan a migration with minimal downtime?

> I use Azure Database Migration Service for online migrations. First, I run DMA to identify issues. Then I set up initial sync (full backup/restore or DMS continuous sync), test the target, and plan a cutover window. For very large databases with tight downtime, Distributed Availability Groups or transactional replication can reduce downtime to seconds. I always prepare a rollback plan.

**Q:** What do you check after an upgrade?

> I compare performance baselines — are my top 10 queries faster or slower? I check the Query Store for plan regressions. I review SQL Server error logs, Windows event logs, and application logs. I run DBCC CHECKDB. I monitor for a full business cycle — batch jobs, reporting, peak hours — before signing off.

---

## T-SQL Quick Reference

```sql
-- Check current SQL Server version
SELECT @@VERSION;

-- Check compatibility level
SELECT name, compatibility_level
FROM sys.databases;

-- Check deprecated features
SELECT * FROM sys.dm_os_performance_counters
WHERE counter_name LIKE '%deprecated%';

-- Azure SQL DB migration assessment queries (run via DMA preferred)
-- Check cross-database queries
SELECT OBJECT_NAME(object_id) AS procedure_name
FROM sys.sql_modules
WHERE definition LIKE '%.%'
  AND definition LIKE '%sp_executesql%';

-- Check linked server usage
SELECT OBJECT_NAME(object_id) AS object_name
FROM sys.sql_modules
WHERE definition LIKE '%OPENQUERY%'
   OR definition LIKE '%OPENROWSET%'
   OR definition LIKE '%LINKED%SERVER%';
```

---

## Azure Hybrid Infrastructure for DBAs

The XYZ JD mentions *"infrastructure modernization and participation in cloud initiatives with a focus on the Azure platform."* This goes beyond Azure SQL — you need to understand Azure networking, identity, and hybrid connectivity.

### Hybrid Connectivity — How On-Prem Talks to Azure

**ExpressRoute vs VPN Gateway:**

| Feature | ExpressRoute | VPN Gateway |
|---------|-------------|-------------|
| Connection | Dedicated private circuit | Internet-based VPN |
| Latency | Consistent, low (~5-10 ms DK to North EU) | Variable, depends on internet |
| Bandwidth | 50 Mbps – 10 Gbps | Up to 10 Gbps |
| SLA | 99.95% | 99.9% (for active-active) |
| Cost | Higher (circuit + egress) | Lower (only egress) |
| Best for | Production, latency-sensitive SQL | Dev/test, non-critical |

**For XYZ Denmark:** An ExpressRoute circuit from Copenhagen to Azure North Europe (Ireland) or West Europe (Netherlands) would give consistent low-latency connectivity for hybrid SQL architectures.

### Azure Networking Fundamentals for DBAs

| Concept | Why It Matters for SQL |
|---------|----------------------|
| **VNET** | Your virtual network in Azure — all Azure SQL resources live in or connect to VNETs |
| **Subnet** | Segmentation within VNET — SQL VMs in a dedicated subnet |
| **NSG** | Network Security Group — virtual firewall, controls SQL port 1433 access |
| **Private Endpoint** | Gives Azure SQL DB a private IP in your VNET — no public internet exposure |
| **VNET Peering** | Connect VNETs across regions (e.g., primary in West Europe, DR in North Europe) |
| **Azure DNS** | Custom DNS for hybrid name resolution (e.g., `sql-01.XYZ.dk` resolves in Azure) |

### Azure Hybrid Benefit — Cost Optimization

If XYZ has Software Assurance on existing SQL Server licenses, Azure Hybrid Benefit lets you use those licenses in Azure at a reduced rate:

```text
On-prem SQL Server with SA  →  Azure SQL VM  →  Pay only for base compute (no SQL license)
                              Azure SQL MI   →  Reduced base rate
                              Azure SQL DB   →  Reduced DTU/vCore rate

Savings: Typically 40-55% on SQL licensing costs in Azure
```

### Azure Backup for SQL Server

Native backup integration for SQL Server on Azure VMs:

```text
Benefits over traditional backups:
  ✓ Managed backup schedules — no custom scripts needed
  ✓ Centralized backup center — view all backups in one portal
  ✓ Point-in-time restore — built-in log backup chain
  ✓ Retention management — policy-based, no cleanup scripts
  ✓ Long-term retention — weekly/monthly/yearly archival
  ✓ Application-consistent — VSS-based for SQL

Limitations:
  - Must be SQL Server on Azure VM (not on-prem)
  - Backup stored in Azure Recovery Services vault
  - Restore only to Azure VM (can't restore on-prem directly)
```

### Azure Site Recovery for SQL Server DR

ASR replicates entire VMs to a secondary Azure region:

```text
For SQL Server:
  ✓ Replicates the VM including SQL Server config
  ✓ Can be tested without affecting production
  ✓ Supports custom RPO (sync < 30 seconds, async > 30 seconds)
  ✗ Not SQL-aware — doesn't understand AG roles or log chains
  ✗ Best used WITH Always On AG, not instead of

Recommended: Use ASR for the VM + Always On AG for the database
```

### Azure Monitor for SQL

Centralized monitoring across all SQL resources:

```text
Azure Monitor collects:
  SQL Server VM:  Perf counters, event logs, heartbeat
  Azure SQL DB:   Query Store insights, DTU/vCore usage, wait stats
  Azure SQL MI:   Managed instance metrics, storage, IO

Log Analytics queries for SQL:
```

```sql
// KQL query in Log Analytics — find slow queries across all Azure SQL DBs
AzureDiagnostics
| where Category == "QueryStoreRuntimeStatistics"
| where avg_duration > 1000000  // > 1 second
| project TimeGenerated, database_name_s, query_id_s, avg_duration_d,
          count_executions_d, query_sql_text_s
| order by avg_duration_d desc
```

### Entra ID (Azure AD) for SQL Authentication

Modern authentication replaces legacy SQL logins:

```text
Benefits:
  ✓ Centralized identity management
  ✓ Multi-factor authentication (MFA)
  ✓ Conditional Access policies
  ✓ No passwords in connection strings
  ✓ Managed identities for Azure services

Setup for Azure SQL:
  CREATE USER [user@XYZ.dk] FROM EXTERNAL PROVIDER;
  EXEC sp_addrolemember 'db_datareader', 'user@XYZ.dk';
```

### Managed Identities — Secure App-to-SQL

Azure applications can authenticate to SQL without passwords:

```sql
-- In Azure SQL DB, create a user mapped to a managed identity
CREATE USER [XYZ-app-service] FROM EXTERNAL PROVIDER;
ALTER ROLE db_datareader ADD MEMBER [XYZ-app-service];

-- App connects using Managed Identity — no password in config
```

### Azure Policy for SQL Compliance

Enforce compliance rules across all SQL resources:

```text
Built-in policies for SQL:
  ✓ Require TDE on Azure SQL DB
  ✓ Enforce minimum TLS version (1.2)
  ✓ Require auditing enabled
  ✓ Restrict public network access
  ✓ Enforce backup retention > 7 days

Example: XYZ can enforce that all Azure SQL DBs have
         auditing enabled, TDE on, and public access disabled
         — automatically, without manual review.
```

### Interview Q&A for Hybrid Azure

**Q:** Your company has on-prem SQL Servers and wants to extend to Azure. How would you design the hybrid connectivity?

> I'd start with connectivity — ExpressRoute from the data center to Azure for consistent, low-latency connections. Then I'd decide which workloads move first: typically dev/test, then reporting, then critical OLTP. For hybrid HA, I'd extend the existing AG with an async replica in Azure — this gives DR without full migration. I'd use Azure Hybrid Benefit to optimize licensing costs. And I'd plan the networking carefully — VNET with private endpoints for Azure SQL DB, or a dedicated subnet for SQL VMs, with NSGs controlling port 1433 access.

**Q:** What's the difference between Private Endpoint and Service Endpoint for Azure SQL?

> Private Endpoint gives Azure SQL Database a private IP address inside your VNET — traffic never leaves the Microsoft network. It's more secure and recommended. Service Endpoint connects your VNET to Azure SQL over the Azure backbone but the SQL server still has a public endpoint (just with firewall rules allowing the VNET). For production workloads with security requirements (like XYZ), Private Endpoint is the right choice — no public exposure at all.

**Q:** How do you monitor a hybrid SQL environment spanning on-prem and Azure?

> I'd use Azure Monitor with Log Analytics as the central hub. On-prem SQL Servers send data via the Azure Monitor Agent. Azure SQL resources feed data directly. I build dashboards showing all servers — on-prem and cloud — in one place. For alerting, I use Azure Monitor alerts with action groups that page the on-call engineer. This gives a single pane of glass for a hybrid environment.

### Recommended Reading

| Resource | Why |
|----------|-----|
| [Microsoft — SQL Server on Azure VM](https://learn.microsoft.com/en-us/azure/azure-sql/virtual-machines/) | Official deployment guidance |
| [Microsoft — Hybrid Identity for SQL](https://learn.microsoft.com/en-us/azure/active-directory/managed-identities-azure-resources/) | Managed identities for SQL |
| [Brent Ozar — Azure SQL Performance](https://www.brentozar.com/archive/2022/08/azure-sql-database-performance-tuning/) | Practical Azure SQL tuning |
```
