---
title: Virtualization for DBAs
order: 12
icon: 🖥️
---

## Key Concepts

The XYZ JD explicitly requires *"knowledge of virtualized platforms."* In a senior role, you will troubleshoot SQL Server performance issues that originate at the hypervisor layer — and you need to speak the infrastructure team's language.

### Why Virtualization Matters for SQL Server Performance

SQL Server assumes it owns the hardware. In a VM, it doesn't. The hypervisor shares CPU, memory, storage, and network across multiple VMs. When contention happens, SQL Server slows down — and the waits look like SQL problems, not virtualization problems.

### CPU Overcommitment & Ready Time

The most common virtualization performance issue. When the hypervisor assigns more virtual CPUs (vCPUs) than physical cores exist, VMs compete for CPU time.

<svg viewBox="0 0 720 130" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;margin:16px 0;">
  <rect width="720" height="130" rx="8" fill="var(--bg-secondary,#f6f8fa)" stroke="var(--border,#d0d7de)" stroke-width="1"/>
  <text x="360" y="18" text-anchor="middle" font-family="Inter,sans-serif" font-size="13" font-weight="700">CPU Overcommitment — The Hidden Performance Killer</text>
  <!-- Physical cores box -->
  <rect x="20" y="30" width="680" height="24" rx="4" fill="#ddf4ff" stroke="#0969da" stroke-width="1.5"/>
  <text x="360" y="47" text-anchor="middle" font-family="Inter,sans-serif" font-size="10" font-weight="600" fill="#0550ae">Physical Host: 16 physical cores / 32 logical processors</text>
  <!-- Scenario 1: Good -->
  <rect x="20" y="60" width="320" height="28" rx="4" fill="#dafbe1" stroke="#1a7f37" stroke-width="1"/>
  <text x="180" y="74" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" fill="#116329">4 VMs × 8 vCPUs = 32 vCPUs — 1:1 ratio</text>
  <text x="180" y="85" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" font-weight="700" fill="#1a7f37">✅ OK — no contention</text>
  <!-- Arrow -->
  <line x1="340" y1="74" x2="370" y2="74" stroke="#8b949e" stroke-width="1"/>
  <!-- Scenario 2: Bad -->
  <rect x="380" y="60" width="320" height="28" rx="4" fill="#ffeef0" stroke="#cf222e" stroke-width="1"/>
  <text x="540" y="74" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" fill="#cf222e">8 VMs × 8 vCPUs = 64 vCPUs — 2:1 ratio</text>
  <text x="540" y="85" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" font-weight="700" fill="#cf222e">⚠️ RISKY — VMs compete for CPU</text>
  <!-- Symptoms -->
  <rect x="20" y="96" width="680" height="26" rx="4" fill="#fff8c5" stroke="#d29922" stroke-width="1"/>
  <text x="360" y="114" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" fill="#7a5e00">SQL symptoms: SOS_SCHEDULER_YIELD waits, erratic query times, CPU Ready &gt; 5% (VMware)</text>
</svg>

**Symptoms in SQL Server:**
- `SOS_SCHEDULER_YIELD` waits even when SQL CPU usage seems low
- Query duration varies wildly — same query, different execution time
- VM monitoring shows high "CPU Ready" time (VMware) or "CPU Wait Time" (Hyper-V)

```text
VMware: CPU Ready > 5% = problem
         CPU Ready > 10% = severe
Hyper-V: CPU Wait > 10% = problem
```

**What to ask the infrastructure team:**
- What is the VM's vCPU-to-pCPU ratio?
- Are any other busy VMs on the same host?
- What is the CPU Ready / CPU Wait metric for the last 24 hours?

### Memory Ballooning

When the hypervisor runs low on physical memory, it reclaims memory from VMs using a "balloon driver." The VM thinks memory is still allocated, but it's actually paged to disk — causing massive slowdowns.

**Symptoms in SQL Server:**
- Page life expectancy (PLE) drops suddenly for no SQL reason
- `RESOURCE_SEMAPHORE` waits (queries can't get memory grants)
- Operating system report memory pressure, but SQL Server memory setting hasn't changed
- Event IDs in Windows System log about balloon driver activity

**What to check:**
```sql
-- Check if OS is paging (should be near 0)
SELECT cntr_value AS pages_per_sec
FROM sys.dm_os_performance_counters
WHERE counter_name = 'Page Faults/sec';

-- Check PLE drop
SELECT cntr_value AS ple_seconds
FROM sys.dm_os_performance_counters
WHERE counter_name = 'Page life expectancy';
```

> [!warning]
> **Never overcommit memory for SQL Server VMs.** SQL Server assumes it owns all configured memory. If the hypervisor balloons memory, SQL Server underperforms unpredictably. Always reserve memory for production SQL Server VMs.

### Storage Latency — Hypervisor Hidden Layer

When SQL Server reports IO waits (`PAGEIOLATCH_XX`, `WRITELOG`), the storage stack looks like:

```
SQL Server → OS → Hypervisor → Storage Array → Physical Disks
                    ↑
              You are here ← the virtual SCSI controller
```

**What hides at each layer:**
- Virtual SCSI/HBA driver — adds small latency
- Hypervisor storage stack — queue depth, caching
- SAN/NAS network — FC or iSCSI latency
- Storage array — cache hit ratio, disk latency

**As a DBA, you should know:**
- Virtual disk format: VHDX (fixed = best performance), VHDX (dynamic = fragmentation risk)
- Pass-through disk: VM directly accesses a LUN (best performance, but less flexible)
- Storage QoS: limits set at hypervisor level that cap IOPS

```sql
-- Check IO latency inside VM
SELECT DB_NAME(fs.database_id) AS db_name,
       mf.physical_name,
       fs.num_of_reads, fs.num_of_writes,
       fs.io_stall_read_ms / NULLIF(fs.num_of_reads, 0) AS avg_read_latency_ms,
       fs.io_stall_write_ms / NULLIF(fs.num_of_writes, 0) AS avg_write_latency_ms,
       fs.size_on_disk_bytes / 1073741824 AS file_size_gb
FROM sys.dm_io_virtual_file_stats(NULL, NULL) fs
JOIN sys.master_files mf ON fs.database_id = mf.database_id
                         AND fs.file_id = mf.file_id
ORDER BY avg_read_latency_ms DESC;

/* Latency targets:
    < 5 ms  → Excellent (local NVMe or fast SAN flash)
    5-10 ms → Good (enterprise SAN)
   10-20 ms → Marginal (investigate)
   > 20 ms → Problematic (urgent action)
*/
```

### NUMA in Virtualized Environments

SQL Server is NUMA-aware — it tries to keep memory and CPU on the same NUMA node for best performance. In VMs, NUMA topology is virtualized:

**Best practices:**
- Don't span NUMA nodes with a single SQL VM (assign vCPUs from one NUMA node)
- In VMware: enable "Virtualize NUMA" for VMs with > 8 vCPUs
- In Hyper-V: use "Maximum NUMA Nodes per VM" = 1
- vNUMA topology should align with underlying physical NUMA

### Hyper-V vs VMware — Key Differences for DBAs

| Feature | VMware vSphere | Hyper-V |
|---------|---------------|---------|
| CPU scheduler | Proportional share-based | Quantum-based |
| Memory overhead | ~5-10% | ~5-10% |
| Dynamic Memory | Not recommended for SQL | Not recommended for SQL |
| Pass-through disks | RDMs (physical mode) | Pass-through disks |
| NUMA | Virtual NUMA available | Automatic |
| Storage QoS | I/O limits and shares | Storage QoS policies |
| Backup integration | VSS for consistent snapshots | VSS for consistent snapshots |

### Snapshots — Critical Warning for DBAs

**Never run a production SQL Server for extended periods with a VM snapshot active.**

When a snapshot exists:
1. The VM's virtual disk stops writing to the original VHDX
2. All writes go to a "delta" file (AVHDX) — this grows over time
3. Read performance degrades because the hypervisor must read from both files
4. If the delta file fills the datastore, the VM crashes

```text
Snapshot use cases (acceptable):
  ✓ Before a patching window (delete within 24 hours)
  ✓ Before a risky change (delete immediately after validation)
  ✓ Development / test environments

Never use snapshots for:
  ✗ Long-term backup strategy
  ✗ "Just in case we need to go back" (use proper backups)
  ✗ Keeping for days or weeks
```

### Virtualization Interview Scenario

> "We migrated SQL Server to a new VMware cluster. Since then, all queries are 30% slower. CPU on SQL Server shows only 20% utilization. Where do you look?"

**Answer structure:**
1. Check SQL Server waits — are `SOS_SCHEDULER_YIELD` or `PAGEIOLATCH` elevated?
2. Check the hypervisor — CPU Ready time on the new cluster? Storage latency?
3. Compare VM configuration — vCPU count, memory reservation, virtual SCSI adapter type
4. Check if the new cluster has CPU overcommitment
5. Check NUMA configuration — is the VM spanning nodes?
6. Check storage path — different LUN type? Different datastore?

---

## Interview Q&A

**Q:** How does virtualization affect SQL Server performance tuning?

> SQL Server waits can be caused by hypervisor contention, not SQL problems. `PAGEIOLATCH` waits could mean slow storage, but they could also mean storage queue depth limits at the hypervisor. `SOS_SCHEDULER_YIELD` could mean CPU pressure from other VMs on the host. As a DBA, I need to correlate SQL Server waits with hypervisor metrics — CPU Ready, memory ballooning, storage latency at the VM level — before blaming SQL Server or the application.

**Q:** What would you check if a SQL Server VM performs inconsistently?

> First, I check for resource contention at the hypervisor: CPU Ready time > 5%, memory ballooning activity, storage latency at the VM level. Then I check the VM configuration: is memory reserved? Are vCPUs spanning NUMA nodes? Is the virtual disk type fixed or dynamic? Is there a snapshot active? I also check whether other VMs on the same host are busy. The root cause is often outside SQL Server.

**Q:** Should you reserve memory for a SQL Server VM?

> Yes — always. SQL Server performs best when memory is guaranteed. Without reservation, the hypervisor can balloon memory, causing PLE to drop and query performance to degrade unpredictably. Memory reservation means the hypervisor dedicates physical RAM to the VM. The cost is that other VMs can't use that memory, but for business-critical SQL Servers, the performance predictability is worth it.

---

## T-SQL Quick Reference

```sql
-- Detect potential CPU overcommitment via scheduler yield
SELECT wait_type, wait_time_ms, waiting_tasks_count,
       wait_time_ms / NULLIF(waiting_tasks_count, 0) AS avg_wait_ms
FROM sys.dm_os_wait_stats
WHERE wait_type = 'SOS_SCHEDULER_YIELD'
ORDER BY wait_time_ms DESC;

-- Check NUMA node configuration inside SQL Server
SELECT node_id, cpu_count, scheduler_count,
       processor_group, memory_node_id
FROM sys.dm_os_nodes
WHERE node_state_desc = 'ONLINE';

-- Check virtual machine info (if running on Hyper-V)
SELECT virtual_machine_type_desc
FROM sys.dm_os_sys_info;

-- Get OS-level CPU info (compare to vCPU assigned)
SELECT cpu_count AS os_cpu_count,
       hyperthread_ratio,
       cpu_count / hyperthread_ratio AS physical_cores
FROM sys.dm_os_sys_info;

-- Check if VM is overprovisioned (compare SQL scheduler count to expected)
SELECT scheduler_count
FROM sys.dm_os_sys_info;
```

### Recommended Reading

| Resource | Why |
|----------|-----|
| [Brent Ozar — SQL Server Virtualization](https://www.brentozar.com/archive/2015/08/virtualizing-sql-server/) | Practical virtualization guidance |
| [Microsoft — SQL Server on Hyper-V](https://learn.microsoft.com/en-us/sql/relational-databases/performance/sql-server-on-hyper-v-best-practices) | Official best practices |
| [SQLSkills — VM Performance Troubleshooting](https://www.sqlskills.com/blogs/glenn/troubleshooting-sql-server-virtualization-performance-issues/) | Systematic approach to VM performance issues |
