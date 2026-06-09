---
title: Backup, Restore & Integrity
order: 8
icon: 💾
---

## Key Concepts

### Backup Strategy Framework

RPO drives backup frequency. RTO drives restore strategy. The backup chain determines how far back you can recover:

<svg viewBox="0 0 720 145" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;margin:16px 0;">
  <rect width="720" height="145" rx="8" fill="var(--bg-secondary,#f6f8fa)" stroke="var(--border,#d0d7de)" stroke-width="1"/>
  <text x="360" y="18" text-anchor="middle" font-family="Inter,sans-serif" font-size="13" font-weight="700">Backup Chain — One Week Timeline</text>
  <!-- Timeline bar -->
  <rect x="20" y="28" width="680" height="6" rx="3" fill="#d0d7de"/>
  <!-- Sun-Sat markers -->
  <text x="68" y="24" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" fill="#8b949e">Sun</text>
  <text x="168" y="24" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" fill="#8b949e">Mon</text>
  <text x="268" y="24" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" fill="#8b949e">Tue</text>
  <text x="368" y="24" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" fill="#8b949e">Wed</text>
  <text x="468" y="24" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" fill="#8b949e">Thu</text>
  <text x="568" y="24" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" fill="#8b949e">Fri</text>
  <text x="668" y="24" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" fill="#8b949e">Sat</text>
  <!-- Full backup (big block) -->
  <rect x="40" y="32" width="16" height="18" rx="2" fill="#0969da"/>
  <text x="48" y="62" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" fill="#0969da">FULL</text>
  <!-- Differential arrows (smaller blocks) -->
  <rect x="140" y="36" width="12" height="14" rx="2" fill="#1a7f37"/>
  <text x="146" y="62" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" fill="#1a7f37">DIFF</text>
  <rect x="240" y="36" width="12" height="14" rx="2" fill="#1a7f37"/>
  <text x="246" y="62" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" fill="#1a7f37">DIFF</text>
  <rect x="340" y="36" width="12" height="14" rx="2" fill="#1a7f37"/>
  <text x="346" y="62" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" fill="#1a7f37">DIFF</text>
  <rect x="440" y="36" width="12" height="14" rx="2" fill="#1a7f37"/>
  <text x="446" y="62" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" fill="#1a7f37">DIFF</text>
  <rect x="540" y="36" width="12" height="14" rx="2" fill="#1a7f37"/>
  <text x="546" y="62" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" fill="#1a7f37">DIFF</text>
  <rect x="640" y="36" width="12" height="14" rx="2" fill="#1a7f37"/>
  <text x="646" y="62" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" fill="#1a7f37">DIFF</text>
  <!-- Log backup dots (every ~5-15 min) -->
  <circle cx="50" cy="80" r="2" fill="#d29922"/>
  <circle cx="55" cy="80" r="2" fill="#d29922"/>
  <circle cx="60" cy="80" r="2" fill="#d29922"/>
  <circle cx="65" cy="80" r="2" fill="#d29922"/>
  <circle cx="70" cy="80" r="2" fill="#d29922"/>
  <circle cx="75" cy="80" r="2" fill="#d29922"/>
  <circle cx="80" cy="80" r="2" fill="#d29922"/>
  <rect x="50" y="78" width="640" height="4" rx="2" fill="#fff8c5" opacity="0.5"/>
  <text x="360" y="93" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" fill="#d29922">Transaction Log backups — every 5-15 minutes (PITR granularity)</text>
  <!-- Restore line -->
  <line x1="40" y1="108" x2="700" y2="108" stroke="#cf222e" stroke-width="1.5"/>
  <text x="700" y="120" text-anchor="end" font-family="Inter,sans-serif" font-size="9" fill="#cf222e">Restore sequence: FULL → latest DIFF → all logs since DIFF</text>
  <!-- PIT example -->
  <line x1="520" y1="108" x2="520" y2="130" stroke="#cf222e" stroke-width="1.5"/>
  <rect x="460" y="130" width="120" height="14" rx="3" fill="#ffeef0" stroke="#cf222e" stroke-width="1"/>
  <text x="520" y="140" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" fill="#cf222e">PIT restore to 07:30 Wed</text>
</svg>

| Backup Type | Frequency | Purpose |
|-------------|-----------|---------|
| Full | Daily / Weekly | Baseline for restore |
| Differential | Every 4–6 hours | Faster restore (only changes since last full) |
| Transaction Log | Every 5–15 minutes | Point-in-time recovery |
| Copy-Only | Ad hoc | Backup without breaking backup chain |

### Recovery Models

| Model | Log Backups? | Point-in-Time Recovery? | Use Case |
|-------|-------------|------------------------|----------|
| Simple | No | No | Dev/test, reporting, rebuildable data |
| Full | Yes | Yes | Production OLTP, critical data |
| Bulk-Logged | Yes | Limited | Bulk import windows (temporary) |

### 1.5 TB Database — Backup Time Estimation

```
If effective throughput is 300 MB/sec:   1536 GB / 300 MB/s ≈ 87 minutes
If effective throughput is 600 MB/sec:   1536 GB / 600 MB/s ≈ 44 minutes
If effective throughput is 1 GB/sec:     1536 GB / 1024 MB/s ≈ 25 minutes

Compressed backup size: typically 300 GB–900 GB (depends on compressibility)
```

### Restore Sequence for Point-in-Time Recovery

Given a corruption at Tuesday 07:30, with Full backup Sunday 22:00, Differential Monday 21:00, and log backups every 15 minutes:

```
1. RESTORE DATABASE MyDB FROM full backup WITH NORECOVERY
2. RESTORE DATABASE MyDB FROM differential backup WITH NORECOVERY
3. RESTORE LOG MyDB FROM log_1 WITH NORECOVERY
4. RESTORE LOG MyDB FROM log_2 WITH NORECOVERY
   ... (continue all logs in sequence)
5. RESTORE LOG MyDB FROM log_n WITH STOPAT = '2026-06-02T07:30:00', RECOVERY
```

> [!warning]
> If the database is still accessible, take a **tail-log backup** (`BACKUP LOG WITH NORECOVERY`) BEFORE starting the restore to capture any transactions not yet backed up.

### Restore States

| Option | Database State | Use When |
|--------|---------------|----------|
| `WITH RECOVERY` | Online, usable | Final restore step |
| `WITH NORECOVERY` | Restoring | More backups to apply |
| `WITH STANDBY` | Read-only | Log shipping, want readability between restores |

### Backup Parameters

```sql
BACKUP DATABASE MyDB TO DISK = 'E:\Backups\MyDB.bak'
WITH
    COMPRESSION,                             -- Smaller file, more CPU
    CHECKSUM,                                -- Validate page integrity
    STATS = 5,                               -- Progress every 5%
    FORMAT,                                  -- New media set
    NAME = 'MyDB-FullBackup',
    DESCRIPTION = 'Weekly full backup',
    COMPRESSION,                             -- Default or explicit
    ENCRYPTION (ALGORITHM = AES_256,         -- Encrypted backup
                SERVER CERTIFICATE = BackupCert);

-- Striped backup (parallel writes, faster)
BACKUP DATABASE MyDB TO
    DISK = 'E:\Backups\MyDB_01.bak',
    DISK = 'F:\Backups\MyDB_02.bak',
    DISK = 'G:\Backups\MyDB_03.bak'
WITH COMPRESSION, CHECKSUM, STATS = 5;
```

### DBCC CHECKDB

Run **integrity checks** regularly (daily for critical databases):

- `DBCC CHECKDB('MyDB')` — checks allocation, logical, and structural integrity
- High IO impact — schedule during maintenance windows or use physical_only option
- On Always On secondaries: `DBCC CHECKDB('MyDB') WITH TABLOCK` uses resource grants

```sql
-- If corruption found:
-- 1. Identify corrupt pages: DBCC CHECKDB WITH ESTIMATEONLY
-- 2. Restore from backup (safer than repair)
-- 3. Only use DBCC CHECKDB WITH REPAIR_ALLOW_DATA_LOSS as last resort
```

---

## Interview Q&A

**Q:** How do you decide backup compression?

> I test both compressed and uncompressed backups for the specific database. I measure backup duration, restore duration, CPU usage during the window, and compression ratio. If CPU is not a bottleneck and compression reduces file size by 50%+ (typical), I use compression. If the database is already TDE-encrypted, compression benefit is reduced because encrypted data doesn't compress well.

**Q:** What's your recommended backup retention policy?

> For a critical OLTP database: full backups retained 2–4 weeks locally, differentials 1–2 weeks, log backups according to PITR requirement. Monthly backups archived 6–12 months. Yearly backups retained 5–7 years for regulatory needs. Retention must align with business, legal, and audit requirements.

**Q:** When would you use striped backups?

> For large databases where backup duration is too long. Striping across multiple disks/LUNs allows parallel writes. On restore, all stripes are required. I test the restore from stripes to make sure the procedure is documented and works.

---

## T-SQL Quick Reference

```sql
-- Backup size history
SELECT database_name, type,
       CAST(backup_start_date AS date) AS backup_date,
       SUM(backup_size) / 1048576 AS size_mb,
       SUM(compressed_backup_size) / 1048576 AS compressed_size_mb
FROM msdb.dbo.backupset
GROUP BY database_name, type, CAST(backup_start_date AS date)
ORDER BY backup_date DESC;

-- Check last backup per database
SELECT database_name, type, MAX(backup_start_date) AS last_backup
FROM msdb.dbo.backupset
WHERE database_name NOT IN ('master', 'model', 'msdb', 'tempdb')
GROUP BY database_name, type
ORDER BY database_name, type;

-- Log reuse wait (why log is growing)
SELECT name, recovery_model_desc, log_reuse_wait_desc
FROM sys.databases
ORDER BY name;

-- Tail-log backup
BACKUP LOG MyDB TO DISK = 'E:\Backups\MyDB_TailLog.trn'
WITH NORECOVERY, CHECKSUM, STATS = 5;

-- PITR example
RESTORE DATABASE MyDB FROM DISK = 'E:\Backups\MyDB_FULL.bak'
WITH NORECOVERY, REPLACE;
RESTORE LOG MyDB FROM DISK = 'E:\Backups\MyDB_LOG.trn'
WITH STOPAT = '2026-06-02T07:30:00', RECOVERY;
```
