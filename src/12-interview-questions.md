---
title: Interview Questions Deep Dive
order: 19
icon: ❓
---

## Key Concepts

This chapter consolidates the most important interview questions from the companion `SQL Server Interview Questions 01.txt` file. Use this for quick revision before interviews.

### Backup & Recovery

**Q: How long to backup a 1.5 TB database?**

> Depends on throughput. At 300 MB/s ≈ 87 min. At 600 MB/s ≈ 44 min. At 1 GB/s ≈ 25 min. Compressed backup size is typically 300–900 GB. Always test in your environment — theoretical estimates are starting points, not guarantees.

**Q: What backup parameters do you use?**

```sql
BACKUP DATABASE MyDB TO DISK = 'E:\Backups\MyDB.bak'
WITH COMPRESSION, CHECKSUM, STATS = 5, FORMAT,
     ENCRYPTION (ALGORITHM = AES_256, SERVER CERTIFICATE = BackupCert);
```

**Q: When would you NOT use backup compression?**

> When CPU is already the bottleneck. Test both compressed and uncompressed during a maintenance window to measure the trade-off.

**Q: What recovery model for transactional replication?**

> Any recovery model works technically. But for critical publishers, use **Full** recovery model for point-in-time recovery support.

### Storage & RAID

**Q: Where should log files be placed?**

> On RAID 1 or RAID 10 — low-latency, reliable storage. NOT RAID 5/6 for heavy write workloads (parity overhead hurts sequential writes).

| RAID | Fault Tolerance | Best For |
|------|----------------|----------|
| RAID 10 | 1 per mirror pair | Data files (OLTP) |
| RAID 1 | 1 disk | Log files, OS |
| RAID 5 | 1 disk | Reporting, read-heavy |

### High Availability

**Q: What's Always On setup process?**

1. Build Windows Failover Cluster
2. Install SQL Server on each node
3. Enable Always On in SQL Server Configuration Manager
4. Configure endpoints and permissions
5. Take full + log backups on primary
6. Restore WITH NORECOVERY on secondary(s)
7. Create Availability Group
8. Add listener
9. Test failover
10. Configure logins, jobs, linked servers on all replicas

**Q: How is Always On different from Mirroring?**

| Feature | Mirroring | Always On AG |
|---------|-----------|-------------|
| Scope | Single database | Group of databases |
| Readable secondary | No (snapshot workaround) | Yes |
| Multiple secondaries | No | Yes (up to 8 in SQL 2022+) |
| Listener | Witness-based | AG listener |
| Backup on secondary | No | Yes |
| Status | Deprecated | Recommended |

### Performance

**Q: What red flags do you look for in execution plans?**

- Table Scan on large table (missing index)
- Key Lookup repeated millions of times (add INCLUDE columns)
- Hash Match spill (memory pressure, need more memory grant)
- Sort spill (check indexes, reduce sort requirement)
- Implicit conversion (data type mismatch — e.g., `WHERE VarcharColumn = 123`)
- Bad cardinality estimate (stale statistics, parameter sniffing)
- Parallelism skew (CXPACKET waits)

**Q: How to investigate a stored procedure that went from 5 seconds to 30 minutes?**

```text
1. Confirm the issue — which proc, which parameters?
2. Check blocking — is it waiting?
3. Check execution plan — did the plan change?
4. Query Store — any plan regression?
5. Check statistics freshness
6. Check indexes — are they maintained?
7. Check for parameter sniffing
```

**Q: What is parameter sniffing and how do you fix it?**

> SQL Server creates a plan using the first parameter value it sees. That plan may be great for some values but terrible for others. Fixes include: `WITH RECOMPILE`, `OPTIMIZE FOR UNKNOWN`, `OPTIMIZE FOR (@param = value)`, or rewriting the stored procedure to use local variables.

### TDE

**Q: What is TDE and what's the critical DBA task?**

> Transparent Data Encryption encrypts data at rest. No app changes needed. **Critical task:** Back up the certificate and private key immediately. Without them, you cannot restore encrypted backups on a different server.

### Columnstore & Partitioning

**Q: When would you use a columnstore index vs rowstore?**

> Columnstore for analytics, aggregations, large scans — 5-10x compression, batch mode processing. Rowstore for OLTP, point lookups, singleton seeks. In SQL Server 2019+, batch mode can also benefit rowstore via Interleaved Execution. A common pattern: columnstore on the fact table, rowstore with covering indexes on dimension tables.

**Q: What are key partitioning considerations?**

> Partitioning is a maintenance feature, not a performance feature (despite common misconception). Use it for sliding-window data management (archiving old partitions), index rebuilds per partition, and switch-in/switch-out loads. Key gotchas: align the clustered index with the partition scheme, avoid partitioning on a column with frequent updates, and remember that SQL Server Standard Edition limits to 15 partitions in 2016 SP1+.

### Accelerated Database Recovery (ADR)

**Q: What is ADR and when does it help?**

> ADR (SQL Server 2019+) accelerates recovery after failover or restart by using persistent version store (PVS) in tempdb instead of scanning the transaction log. Benefits: fast recovery even with long-running transactions, instant transaction rollback, and aggressive log truncation. Enable it per database with `ALTER DATABASE ... SET ACCELERATED_DATABASE_RECOVERY = ON`.

### TempDB Best Practices

**Q: How do you configure tempdb for a consolidated server?**

> For a server hosting multiple databases: equal-sized data files matching CPU count (up to 8), on dedicated fast storage. Single file causes PAGELATCH contention on GAM/SGAM pages. Set autogrowth to a reasonable chunk (512 MB), not 1 MB at a time. Enable Trace Flags 1117 (equal file growth) and 1118 (uniform extent allocations) on pre-SQL 2016. Monitor version store usage in tempdb with `sys.dm_tran_version_store_space_usage`.

### Azure SQL Differences

**Q: What features work differently in Azure SQL Database vs on-prem?**

> No SQL Agent jobs (use Elastic Jobs), no cross-database queries (use Elastic Query), no CLR, no FileStream, no Database Mail, no linked servers (use Elastic Query or External Tables). MAXDOP is fixed at 8. TDE is mandatory. Always On is built-in but you cannot configure replicas. S3/M-series for OLTP, Hyperscale for large databases with fast scaling.

### Plan Guides & Query Hints

**Q: When would you use a plan guide instead of modifying code?**

> When you can't change the application code (third-party app, vendor software). Plan guides let you attach query hints (like OPTIMIZE FOR, RECOMPILE, MAXDOP) to specific queries without touching the T-SQL. Query Store hints (SQL 2022+) are the modern replacement — they don't require full plan XML and survive version upgrades better.

### System Databases

**Q: What are GAM, SGAM, PFS, DCM, BCM pages?**

| Page | Purpose |
|------|---------|
| GAM | Global Allocation Map — which extents are allocated |
| SGAM | Shared Global Allocation Map — which extents have free space |
| PFS | Page Free Space — free space per page |
| DCM | Differential Changed Map — changed extents since last full backup |
| BCM | Bulk Changed Map — extents modified by minimally logged operations |

### Log Shipping

**Q: How to refresh a test database that's part of log shipping?**

1. Disable log shipping restore job
2. Take full backup from primary
3. Restore on secondary WITH NORECOVERY or STANDBY
4. Apply all log backups generated since the full backup
5. Re-enable log shipping restore job
6. Validate LSN chain

The key rule: the restored database must be at a point where the next log backup can be applied, or the LSN chain breaks.

### Troubleshooting Stored Procedure Regression

**6-step methodology:**

```
Step 1: Confirm the issue (which proc, parameters, timing)
Step 2: Check current execution (wait types, blocking, plan)
Step 3: Query Store analysis (plan history, regression detection)
Step 4: Statistics and index freshness
Step 5: Compare to baseline (when was it fast?)
Step 6: Fix and verify (update stats, fix parameter sniffing, force plan, etc.)
```

---

## Quick Reference: Scenario Answers

### "A database is corrupted — what do you do?"

> Stop all activity on the affected database. Determine the scope — which pages are corrupt? Run DBCC CHECKDB to assess damage. Restore from the most recent valid backup. If no backup exists (and only as last resort), consider DBCC CHECKDB WITH REPAIR_ALLOW_DATA_LOSS. Then fix whatever caused the corruption — storage issue, faulty hardware, bug.

### "Transaction log is filling up the disk"

> Check `log_reuse_wait_desc` to find why the log isn't clearing. Common causes: missing log backups, long-running transaction, replication issues, Always On synchronization lag. Fix the root cause, not the symptom. Do NOT shrink the log as a permanent fix — it will grow back. If it's a true emergency, take a log backup, then shrink, but prioritize fixing the root cause.

### "A developer needs production data for testing"

> I never give the developer production credentials. I create a sanitized copy of the production database in a non-production environment with sensitive data masked or removed. The developer gets a contained database user with appropriate permissions in that environment. I document what was provided and for what purpose.

---

## Interview Closing Mindset

Every answer should connect back to:

> **Availability, Recoverability, Performance, Security, Capacity**

You're not just a technical expert — you're responsible for keeping business-critical systems running. Frame every answer in terms of:
- Business impact ("stores couldn't process payments")
- Risk reduction ("we now test restore monthly")
- Process improvement ("we added monitoring alerts")
- Data-driven decisions ("we tested both approaches and measured the difference")
