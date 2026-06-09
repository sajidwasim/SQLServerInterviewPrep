---
title: Security, Compliance & Encryption
order: 13
icon: 🔒
---

## Key Concepts

### Security Layers

```
Network → Firewall, VPN, TLS
Platform → Windows security, service accounts, patching
SQL Server → Logins, roles, permissions, audit
Data → TDE, column encryption, Always Encrypted, backup encryption
Application → Connection strings, least privilege, row-level security
```

### Logins vs Users

| Login | User |
|-------|------|
| Server-level principal | Database-level principal |
| Connects to SQL Server | Accesses a specific database |
| Maps to a database user | Authorized for DB objects |

### Least Privilege Model

| Role | Scope | When to Grant |
|------|-------|---------------|
| `sysadmin` | Server | Only DBAs, very limited |
| `securityadmin` | Server | Security team |
| `db_owner` | Database | DBA, application admin |
| `db_datareader` | Database | Read-only access |
| `db_datawriter` | Database | Write-only access |
| `EXECUTE` | Stored Procedure | Grant on specific procs, not tables |

> [!tip]
> Developers do NOT need sysadmin. Grant specific permissions on the objects they need. Use stored procedures as an access layer — grant EXECUTE on the procedure, not SELECT on the underlying table.

### Transparent Data Encryption (TDE)

#### What TDE Does

- Page-level I/O encryption — data is encrypted before writing to disk, decrypted when read into memory
- No application changes required
- **Does NOT** encrypt data in flight (use TLS) or in memory
- CPU overhead: 3–5% typically, AES-NI instructions reduce this significantly
- TempDB is automatically encrypted if any user database has TDE enabled
- Instant file initialization (IFI) is unavailable when TDE is enabled

#### Encryption Hierarchy

The encryption key chain protects the DEK in layers — break any link and data becomes inaccessible:

<svg viewBox="0 0 720 100" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;margin:16px 0;">
  <rect width="720" height="100" rx="8" fill="var(--bg-secondary,#f6f8fa)" stroke="var(--border,#d0d7de)" stroke-width="1"/>
  <text x="360" y="18" text-anchor="middle" font-family="Inter,sans-serif" font-size="12" font-weight="700">TDE Encryption Hierarchy</text>
  <!-- DPAPI -->
  <rect x="15" y="28" width="120" height="22" rx="4" fill="#ddf4ff" stroke="#0969da" stroke-width="1"/>
  <text x="75" y="43" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" font-weight="600" fill="#0550ae">Windows DPAPI</text>
  <line x1="135" y1="39" x2="168" y2="39" stroke="#8b949e" stroke-width="1.2"/>
  <!-- SMK -->
  <rect x="170" y="28" width="120" height="22" rx="4" fill="#dafbe1" stroke="#1a7f37" stroke-width="1"/>
  <text x="230" y="43" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" font-weight="600" fill="#116329">Service Master Key</text>
  <line x1="290" y1="39" x2="323" y2="39" stroke="#8b949e" stroke-width="1.2"/>
  <!-- DMK -->
  <rect x="325" y="28" width="120" height="22" rx="4" fill="#fff8c5" stroke="#d29922" stroke-width="1"/>
  <text x="385" y="43" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" font-weight="600" fill="#7a5e00">Database Master Key</text>
  <line x1="445" y1="39" x2="478" y2="39" stroke="#8b949e" stroke-width="1.2"/>
  <!-- Certificate -->
  <rect x="480" y="28" width="120" height="22" rx="4" fill="#ffeef0" stroke="#cf222e" stroke-width="1"/>
  <text x="540" y="43" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" font-weight="600" fill="#cf222e">Certificate</text>
  <line x1="600" y1="39" x2="633" y2="39" stroke="#8b949e" stroke-width="1.2"/>
  <!-- DEK -->
  <rect x="635" y="28" width="70" height="22" rx="4" fill="#dafbe1" stroke="#1a7f37" stroke-width="1.5"/>
  <text x="670" y="43" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" font-weight="700" fill="#116329">DEK</text>
  <!-- Storage locations -->
  <rect x="15" y="60" width="130" height="16" rx="3" fill="none" stroke="#d0d7de" stroke-width="0.8" stroke-dasharray="3,2"/>
  <text x="80" y="72" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" fill="#8b949e">Machine level</text>
  <rect x="160" y="60" width="140" height="16" rx="3" fill="none" stroke="#d0d7de" stroke-width="0.8" stroke-dasharray="3,2"/>
  <text x="230" y="72" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" fill="#8b949e">master DB</text>
  <rect x="315" y="60" width="140" height="16" rx="3" fill="none" stroke="#d0d7de" stroke-width="0.8" stroke-dasharray="3,2"/>
  <text x="385" y="72" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" fill="#8b949e">master DB</text>
  <rect x="470" y="60" width="140" height="16" rx="3" fill="none" stroke="#d0d7de" stroke-width="0.8" stroke-dasharray="3,2"/>
  <text x="540" y="72" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" fill="#8b949e">master DB</text>
  <rect x="625" y="60" width="85" height="16" rx="3" fill="none" stroke="#d0d7de" stroke-width="0.8" stroke-dasharray="3,2"/>
  <text x="667" y="72" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" fill="#8b949e">User DB</text>
  <!-- Bottom warning -->
  <rect x="15" y="82" width="690" height="14" rx="3" fill="#ffeef0"/>
  <text x="360" y="93" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" fill="#cf222e">⚠️ Lose the certificate → DEK cannot be decrypted → data is permanently inaccessible</text>
</svg>

The DEK is stored in the user database. The certificate that protects it must be in `master`. Lose the certificate = lose access to the data.

#### Full Enablement Sequence

```sql
USE master;

-- 1. Create master key (if not exists)
CREATE MASTER KEY ENCRYPTION BY PASSWORD = 'StrongPasswordHere';

-- 2. Create certificate protected by master key
CREATE CERTIFICATE TDECert
WITH SUBJECT = 'TDE Certificate for Customer Databases';

-- 3. Back up certificate and private key IMMEDIATELY
BACKUP CERTIFICATE TDECert
TO FILE = 'E:\Security\TDECert.cer'
WITH PRIVATE KEY
(
    FILE    = 'E:\Security\TDECert.key',
    ENCRYPTION BY PASSWORD = 'StrongPasswordHere'
);

-- 4. Create DEK in user database
USE MyDatabase;

CREATE DATABASE ENCRYPTION KEY
WITH ALGORITHM = AES_256
ENCRYPTION BY SERVER CERTIFICATE TDECert;

-- 5. Enable encryption
ALTER DATABASE MyDatabase SET ENCRYPTION ON;
```

SQL Server runs the encryption scan in background threads. Monitor progress with:

```sql
SELECT DB_NAME(database_id) AS database_name,
       encryption_state,
       encryption_state_desc = CASE encryption_state
           WHEN 0 THEN 'No encryption'
           WHEN 1 THEN 'Unencrypted'
           WHEN 2 THEN 'Encryption in progress'
           WHEN 3 THEN 'Encrypted'
           WHEN 4 THEN 'Key change in progress'
           WHEN 5 THEN 'Decryption in progress'
       END,
       percent_complete,
       encryptor_thumbprint,
       encryption_scan_state,
       encryption_scan_modify_date
FROM sys.dm_database_encryption_keys;
```

#### TDE Scan (SQL Server 2019+)

On large databases, the encryption scan can take hours. Suspend during business hours and resume later:

```sql
ALTER DATABASE MyDatabase SET ENCRYPTION SUSPEND;
ALTER DATABASE MyDatabase SET ENCRYPTION RESUME;
```

#### TDE + Always On Availability Groups

**Critical:** The certificate must exist on ALL secondary replicas BEFORE creating the DEK on the primary. Otherwise, the DEK creation succeeds but log records can't be decrypted on the secondary, breaking synchronization.

Workflow:

1. Create master key and certificate on the primary
2. Back up the certificate and private key
3. Restore the certificate to every secondary replica
4. Create the DEK and enable encryption on the primary
5. Add the database to the AG

```sql
-- On each secondary replica (after restoring the cert file):
USE master;

CREATE MASTER KEY ENCRYPTION BY PASSWORD = 'StrongPasswordHere';

CREATE CERTIFICATE TDECert
FROM FILE = 'E:\Security\TDECert.cer'
WITH PRIVATE KEY
(
    FILE    = 'E:\Security\TDECert.key',
    DECRYPTION BY PASSWORD = 'StrongPasswordHere'
);
```

#### Restoring a TDE-Protected Database on Another Server

The target server must have the same certificate in `master` before the restore. If the certificate is missing, the database is inaccessible (error 33111).

```sql
-- On the target server, before restore:
USE master;

CREATE CERTIFICATE TDECert
FROM FILE = 'E:\Security\TDECert.cer'
WITH PRIVATE KEY
(
    FILE    = 'E:\Security\TDECert.key',
    DECRYPTION BY PASSWORD = 'StrongPasswordHere'
);
```

**Audit your certificates.** This query identifies TDE-protected databases whose certificate has never been backed up:

```sql
SELECT pvt_key_last_backup_date,
       DB_NAME(dek.database_id) AS encrypted_database,
       c.name AS certificate_name,
       CASE WHEN pvt_key_last_backup_date IS NULL
           THEN 'CRITICAL — Never backed up'
           ELSE 'Last backed up: ' + CONVERT(VARCHAR, pvt_key_last_backup_date, 120)
       END AS backup_status
FROM sys.certificates c
INNER JOIN sys.dm_database_encryption_keys dek
    ON c.thumbprint = dek.encryptor_thumbprint;
```

#### Limitations During Encryption Scan

The following operations are blocked while the scan is running:
- Dropping a file or filegroup
- Taking the database offline
- Detaching the database
- Starting a backup or restore
- Creating a snapshot
- Any `ALTER DATABASE` command

#### Removing TDE

```sql
ALTER DATABASE MyDatabase SET ENCRYPTION OFF;

-- Wait for decryption to complete (monitor sys.dm_database_encryption_keys), then:
DROP DATABASE ENCRYPTION KEY;
```

### SQL Server Audit

SQL Server Audit provides native, policy-based auditing at the instance and database level. Every audited event is written to the audit log — no third-party tools required.

#### Server vs Database Audit Specifications

| Level | Tracks | Created By |
|-------|--------|-----------|
| **Server Audit** | The target output — file, Windows Security Log, or Application Log | `CREATE SERVER AUDIT` |
| **Server Audit Specification** | Server-level events (logins, role changes) | `CREATE SERVER AUDIT SPECIFICATION` |
| **Database Audit Specification** | Database-level events (schema changes, DML, permission changes) | `CREATE DATABASE AUDIT SPECIFICATION` |

A single server audit can feed multiple audit specifications:

```
Server Audit (file target)
  ├── Server Audit Spec (login failures, server role changes)
  └── Database Audit Spec 1 (DDL changes on SalesDB)
  └── Database Audit Spec 2 (permission changes on HRDB)
```

#### Creating a Server Audit

```sql
-- Create server audit with file target
CREATE SERVER AUDIT SecurityAudit
TO FILE
(
    FILEPATH = 'E:\Audit\',
    MAXSIZE = 512 MB,
    MAX_FILES = 20,
    MAX_ROLLOVER_FILES = 10,
    RESERVE_DISK_SPACE = OFF
)
WITH
(
    QUEUE_DELAY = 1000,    -- milliseconds before writing (lower = less data loss)
    ON_FAILURE = CONTINUE,  -- CONTINUE, SHUTDOWN, or FAIL_OPERATION
    AUDIT_GUID = NULL       -- omits GUID in file name for easier management
);
```

| Option | Recommendation |
|--------|---------------|
| `MAXSIZE` | Cap each file to prevent disk filling. 512 MB-2 GB typical |
| `MAX_FILES` + `MAX_ROLLOVER_FILES` | Controls retention. 20 files × 512 MB = ~10 GB total |
| `ON_FAILURE` | `CONTINUE` for most audits (don't kill the business for a full audit drive). `SHUTDOWN` for compliance-critical audits |
| `QUEUE_DELAY` | Default 1000 ms. Lower to 100 ms for near-real-time audit, at the cost of more I/O |

#### Creating Audit Specifications

```sql
-- Server-level: track who logs in and who gets admin rights
CREATE SERVER AUDIT SPECIFICATION ServerAuditSpec
FOR SERVER AUDIT SecurityAudit
ADD (FAILED_LOGIN_GROUP),
ADD (SERVER_ROLE_MEMBER_CHANGE_GROUP),
ADD (SERVER_PRINCIPAL_CHANGE_GROUP),
ADD (SERVER_OBJECT_PERMISSION_CHANGE_GROUP)
WITH (STATE = ON);

-- Database-level: track schema and permission changes
CREATE DATABASE AUDIT SPECIFICATION DbAuditSpec
FOR SERVER AUDIT SecurityAudit
ADD (SCHEMA_OBJECT_CHANGE_GROUP),
ADD (DATABASE_PRINCIPAL_CHANGE_GROUP),
ADD (DATABASE_PERMISSION_CHANGE_GROUP),
ADD (DATABASE_OBJECT_PERMISSION_CHANGE_GROUP),
ADD (BACKUP_RESTORE_GROUP)
WITH (STATE = ON);
```

#### Reading Audit Logs

```sql
-- Read all audit events from the last 7 days
SELECT event_time,
       server_principal_name,
       database_name,
       schema_name, object_name,
       statement,
       action_id,
       succeeded,
       session_server_principal_name,
       client_ip, application_name
FROM sys.fn_get_audit_file('E:\Audit\*.sqlaudit', NULL, NULL)
WHERE event_time >= DATEADD(DAY, -7, GETDATE())
ORDER BY event_time DESC;

-- Who changed stored procedures yesterday?
SELECT event_time,
       server_principal_name AS who,
       database_name,
       schema_name + '.' + object_name AS object,
       statement
FROM sys.fn_get_audit_file('E:\Audit\*.sqlaudit', NULL, NULL)
WHERE action_id = 'AL'           -- ALTER
  AND class_type = 'PG'          -- Stored Procedure
  AND event_time >= DATEADD(DAY, -1, GETDATE())
ORDER BY event_time DESC;

-- Failed login summary (brute force detection)
SELECT server_principal_name,
       client_ip,
       COUNT(*) AS attempts,
       MIN(event_time) AS first_attempt,
       MAX(event_time) AS last_attempt
FROM sys.fn_get_audit_file('E:\Audit\*.sqlaudit', NULL, NULL)
WHERE action_id = 'LGIF'         -- Login Failed
  AND event_time >= DATEADD(DAY, -1, GETDATE())
GROUP BY server_principal_name, client_ip
HAVING COUNT(*) > 10             -- more than 10 failures = suspicious
ORDER BY attempts DESC;
```

#### Audit File Management

- Audit files are written to the `FILEPATH` directory with `.sqlaudit` extension
- Files are readable with `sys.fn_get_audit_file()` or by opening in Windows Notepad
- Old files are NOT automatically deleted — you must manage retention manually

```sql
-- List audit files (from the audit metadata)
SELECT name AS audit_name,
       log_file_path,
       log_file_name,
       file_size, file_time,
       max_file_size,
       max_rollover_files
FROM sys.server_file_audits;

-- View current audit status
SELECT name,
       is_enabled,
       type_desc,
       on_failure_desc,
       queue_delay,
       -- 0 = running, 1 = failed, 2 = target_created, 3 = shutting_down
       status_desc
FROM sys.dm_server_audit_status;
```

**Retention strategy:** Archive audit files older than 90 days to cold storage. Delete files older than 180 days. Automate with a SQL Agent job that runs weekly:

```sql
-- Example cleanup (run as SQL Agent job)
-- Delete .sqlaudit files older than 90 days
EXEC xp_cmdshell 'forfiles /p "E:\Audit" /m *.sqlaudit /d -90 /c "cmd /c del @path"';
```

Or use PowerShell for more control:
```powershell
Get-ChildItem "E:\Audit\*.sqlaudit" | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-90) } | Remove-Item
```

#### Performance Considerations

- Audit I/O is sequential and generally lightweight — expect 1-3% CPU overhead under normal workloads
- Heavy DDL environments (CI/CD pipelines, frequent schema changes) generate more audit data
- Isolate audit files to a dedicated drive (not C:, not data/log drives)
- Monitor `sys.dm_server_audit_status` for `status_desc = 'FAILED'` — indicates the audit target is unreachable

#### Best Practices

1. **Always enable auditing before an incident occurs** — you cannot retroactively capture audit data
2. **Include `FAILED_LOGIN_GROUP`** — it's the most common request from security teams post-incident
3. **Do NOT audit every DML** on busy OLTP systems — the volume is overwhelming. Focus on DDL, login, and permission changes
4. **Set `ON_FAILURE = CONTINUE`** in production — `SHUTDOWN` kills SQL Server if the audit drive fills
5. **Secure the audit directory** — only DBAs and security team should have read access. Audit logs contain sensitive information
6. **Test audit shutdown behavior** — if you use `ON_FAILURE = SHUTDOWN`, verify the recovery procedure
7. **Centralize audit files** — in a consolidated platform, point all database audit specs to the same server audit

### Service Accounts

| Account | Purpose | Least Privilege |
|---------|---------|-----------------|
| SQL Server Engine | Runs sqlservr.exe | Network service, virtual account, or domain MSA |
| SQL Server Agent | Runs jobs | Job execution permissions only |
| SSIS | Package execution | Data source access only |
| Application | App connects to DB | EXECUTE on required procedures, SELECT on required tables |

---

## Interview Q&A

**Q:** What is TDE and what impact does it have?

> TDE encrypts data at rest — the MDF, LDF, and backup files. Applications don't need changes because decryption happens transparently as data is read into memory. There is CPU overhead (3–5% typical), but modern CPUs with AES-NI instructions reduce this significantly. The critical DBA responsibility is backing up the certificate — lose that, and you lose access to the data.

**Q:** How do you handle TDE with Always On Availability Groups?

> The certificate must be on all secondary replicas before the DEK is created on the primary. The workflow is: create the master key and certificate on the primary, back up the certificate and private key, restore them to every secondary replica, then create the DEK and enable encryption. If you enable TDE on a database that's already in an AG, the same rule applies — deploy the certificate to all replicas first. I also run a weekly audit query that checks `pvt_key_last_backup_date` on `sys.certificates` to ensure no TDE certificate has gone un-backed-up.

**Q:** How do you handle a developer requesting sysadmin access to troubleshoot?

> I explain why sysadmin is risky — they can modify or delete any data, change security, and there's no audit trail for their actions. Instead, I offer a controlled approach: grant read-only access to the databases they need, EXECUTE permission on specific stored procedures, or temporary elevated access with an expiry and a documented change ticket. I always log what was granted and why.

**Q:** What's the key difference between logins and users?

> A login is a server-level principal that can connect to SQL Server. A user is a database-level principal that has access to a specific database. The same login can map to different users in different databases, each with different permissions. This separation allows granular access control — a login might be db_owner in dev but only db_datareader in production.

**Q:** An auditor asks: "who changed the stored procedure that authorises payments?" How do you answer?

> If SQL Server Audit was configured before the change, I query `sys.fn_get_audit_file` for ALTER events on stored procedures during the relevant time window: `WHERE action_id = 'AL' AND class_type = 'PG'`. The audit log shows the exact statement, who ran it, from which client IP, and when. If audit wasn't configured, I check `sys.objects.modify_date` and SQL Agent job history, but there's no definitive answer — which is exactly why audit must be in place before incidents occur, not after.

**Q:** How do you handle audit file retention without filling the disk?

> I use `MAXSIZE` and `MAX_ROLLOVER_FILES` to cap total audit storage — typically 10-20 GB. I set up a SQL Agent job that archives files older than 90 days to cold storage and deletes files older than 180 days. I also monitor `sys.dm_server_audit_status` and alert if the status is anything other than 'running'. The audit drive is separate from data/log drives so audit I/O never competes with database I/O.

---

## T-SQL Quick Reference

```sql
-- Check who has sysadmin access
SELECT p.name AS login_name,
       r.name AS role_name
FROM sys.server_role_members rm
JOIN sys.server_principals p ON rm.member_princip al_id = p.principal_id
JOIN sys.server_principals r ON rm.role_principal_id = r.principal_id
WHERE r.name = 'sysadmin';

-- Find orphaned users (login missing)
SELECT dp.name AS orphaned_user,
       dp.type_desc
FROM sys.database_principals dp
LEFT JOIN sys.server_principals sp ON dp.sid = sp.sid
WHERE dp.type IN ('S', 'U')
  AND sp.sid IS NULL
  AND dp.name NOT IN ('dbo', 'guest', 'INFORMATION_SCHEMA', 'sys');

-- Check permissions for a login
SELECT perms.*
FROM sys.fn_my_permissions(NULL, 'SERVER') perms;

-- Check who backed up databases
SELECT database_name, user_name,
       backup_start_date, backup_finish_date
FROM msdb.dbo.backupset
ORDER BY backup_start_date DESC;

-- Monitor TDE encryption progress
SELECT DB_NAME(database_id) AS database_name,
       encryption_state,
       percent_complete,
       encryption_scan_state
FROM sys.dm_database_encryption_keys;

-- Find TDE certificates that have never been backed up
SELECT c.name AS cert_name,
       DB_NAME(dek.database_id) AS encrypted_db,
       c.pvt_key_last_backup_date
FROM sys.certificates c
INNER JOIN sys.dm_database_encryption_keys dek
    ON c.thumbprint = dek.encryptor_thumbprint
WHERE c.pvt_key_last_backup_date IS NULL;

-- Read recent audit events
SELECT event_time, server_principal_name, action_id,
       database_name, schema_name + '.' + object_name AS object,
       statement, succeeded, client_ip
FROM sys.fn_get_audit_file('E:\Audit\*.sqlaudit', NULL, NULL)
WHERE event_time >= DATEADD(DAY, -7, GETDATE())
ORDER BY event_time DESC;

-- Failed login brute force detection
SELECT server_principal_name, client_ip,
       COUNT(*) AS failed_attempts
FROM sys.fn_get_audit_file('E:\Audit\*.sqlaudit', NULL, NULL)
WHERE action_id = 'LGIF'
  AND event_time >= DATEADD(DAY, -1, GETDATE())
GROUP BY server_principal_name, client_ip
HAVING COUNT(*) > 10;

-- Check audit status
SELECT name, is_enabled, status_desc
FROM sys.dm_server_audit_status;
```
