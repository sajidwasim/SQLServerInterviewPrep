---
title: Extra DBA Topics
order: 18
icon: 🧠
---

## Key Concepts

These topics may not be in every job description, but senior DBA interviews often test them to gauge your depth.

### Performance Baselines

Without a baseline, you can't tell if performance is "normal" or "abnormal."

**What to baseline:**
- CPU, memory, IOPS, throughput
- Wait stats (top 10 waits)
- Query duration (top 20 queries)
- Database growth rate
- Job duration (backup, maintenance, ETL)

**Value:**
- Proactive capacity planning
- Validate whether a change improved or regressed performance
- Defend against "SQL Server is slow" with data

### Patch Management

| Step | Activity |
|------|----------|
| 1 | Review patch documentation (known issues, fixes) |
| 2 | Test in non-production environment |
| 3 | Plan maintenance window with application teams |
| 4 | For AG: failover to secondary, patch primary offline, fail back |
| 5 | Run validation queries after patching |
| 6 | Monitor for a full business cycle |
| 7 | Document: what was applied, when, outcome |

### Change Management

Every production change should follow:

```
Request → Review → Approve → Schedule → Implement → Validate → Document
```

The DBA's role is to assess risk:
- "Changing the MAXDOP from 0 to 8 with this workload? Let's test that first."
- "Adding an index mid-day on this table may cause blocking. Let's do it with `ONLINE = ON`."
- "That deployment script doesn't have a rollback. Let's write one."

### Database Consolidation

When a company has many SQL Server instances with overlapping data:

1. **Discovery** — inventory all databases, their purpose, and ownership
2. **Dependency mapping** — which apps use which databases?
3. **Ownership** — who maintains each database?
4. **Duplicate data** — can datasets be shared?
5. **Security review** — consistent permissions across consolidated DB
6. **Migration planning** — sequence, downtime, testing
7. **Performance testing** — does consolidation create resource contention?
8. **Operational handover** — new backup schedule, monitoring, runbooks

### Licensing Awareness

**Key points for interview:**
- Enterprise Edition: AG with readable secondaries, online index rebuild, partitioning
- Standard Edition: Basic AG (2 nodes, 1 database), limited HA
- Passive replica licensing: secondary replicas used only for HA/DR may not require SQL Server license (check with Microsoft)
- Virtualization: licensing by physical core count for all VMs running SQL Server

> [!tip]
> Don't pretend to be a licensing expert. Say "I understand the basics that affect architecture decisions, but I would involve our licensing team for contractual questions."

### Retail SQL Workload Patterns

For a retail company like XYZ:

- **Store operations** — real-time pricing lookups, member validation, POS transactions
- **Inventory** — batch feeds from warehouses, real-time stock updates
- **Supply chain** — purchase orders, supplier integrations
- **Customer data** — membership, loyalty, analytics
- **Reporting** — sales reports, margin analysis, forecasting

**Key challenges:**
- Batch jobs (inventory, pricing updates) running concurrently with real-time store traffic
- Seasonal peaks (Christmas, holiday sales)
- 24/7 store hours — no true maintenance window

### RAID and Storage

| RAID Level | Min Disks | Fault Tolerance | Use Case |
|------------|-----------|----------------|----------|
| RAID 0 | 2 | None | TempDB (if data is disposable) |
| RAID 1 | 2 | Yes (1 disk) | Log files, OS |
| RAID 5 | 3 | Yes (1 disk) | Reporting, read-heavy (avoid for logs) |
| RAID 6 | 4 | Yes (2 disks) | Large data warehouses |
| RAID 10 | 4 | Yes (1 per pair) | Production OLTP data files |

### SQL Server Installation Essentials

**Pre-requisites checklist:**
- OS compatibility
- .NET Framework required version
- Service accounts (Engine, Agent)
- Disk layout: OS → C:, Data → D:, Logs → L:, TempDB → T:, Backups → B:
- Firewall rule for TCP 1433
- Collation selection
- Authentication mode
- Antivirus exclusions

**Unattended installation (repeatable):**
```cmd
setup.exe /Q /ACTION=Install /FEATURES=SQLENGINE
    /INSTANCENAME=MSSQLSERVER
    /SQLSVCACCOUNT="DOMAIN\sqlsvc"
    /AGTSVCACCOUNT="DOMAIN\sqlagent"
    /SQLSYSADMINACCOUNTS="DOMAIN\DBAGroup"
    /TCPENABLED=1
    /IACCEPTSQLSERVERLICENSETERMS
```

### Capacity Planning

Forecast 6 months ahead:

1. Collect current database size and growth trend
2. Review backup size growth
3. Review log generation rate
4. Check autogrowth events
5. Account for upcoming business events (new apps, data retention changes, seasonal peaks)
6. Add 20–30% safety buffer
7. Report risk levels and recommendations

---

## Interview Q&A

**Q:** How do you measure whether SQL Server performance is normal?

> I use baselines. I capture CPU, memory, IO, wait stats, top queries, and job durations over time — not just at a single point. When someone says "it's slow," I compare current metrics to the baseline. If wait stats show PAGEIOLATCH at 80% of waits and the baseline shows it's usually 20%, I know there's an IO problem. Without baselines, you're guessing.

**Q:** What do you consider when patching a SQL Server in an AG?

> I plan the maintenance window well in advance. I patch the secondary first, verify it's healthy, then fail over to make it the primary. Then I patch the former primary. This minimizes downtime to the failover seconds. I always check the patch notes for SQL Server-specific fixes or regressions. I test the application against the patched server before marking it complete.

**Q:** How do you approach a database consolidation project?

> First, I do a thorough inventory — every database, its purpose, owner, size, growth rate, and dependencies. I look for overlapping data and security inconsistencies. I plan the consolidation in phases to minimize risk: consolidate reporting databases first, then development, then production. I test performance and security in each phase. The goal is to reduce operational overhead without creating a single point of failure.
