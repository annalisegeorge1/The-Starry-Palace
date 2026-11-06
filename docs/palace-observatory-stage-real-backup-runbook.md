# Palace Observatory — real Security Staging backup and restore gate

**Prepared 2026-11-04 · NOT EXECUTED · Draft PR #242 · No production operations.**

This is the remaining recovery gate before applying *any* Observatory staging SQL. Passing a PostgreSQL backup/restore test in GitHub Actions with invented fixtures does **not** prove that the existing Supabase staging project can be restored.

## 0. Hard target restrictions

| Purpose | Verified project reference |
| --- | --- |
| **Security Staging only** | `ysbntuyyprnhptlxxsng` |
| **DO NOT CONNECT OR RESTORE**: production | `sservftxygunkacmwsad` |

The Supabase organization is currently **Free**. Automatic daily database backups are not a guaranteed Free-plan feature. Supabase recommends keeping off-site manual backups.

**Do not run `scripts/security/owner-backup.sh` for staging.** That script intentionally pins the **production** reference and additional production Storage buckets. Do not change its target as a shortcut. The existing nine-table staging fixture database and 12 security-fixture migrations must be preserved.

Do this only on a trusted owner-controlled computer, never in the public GitHub repository or a GitHub Actions job. Requires Supabase CLI, Docker (the CLI dump runs containerized `pg_dump`), a protected off-repository folder, a working PostgreSQL 17-compatible disposable restore target, and an encryption/backup method. If the owner's computer cannot meet these requirements, **stop here**; do not substitute a production backup or claim a staged migration is reversible.

## 1. Snapshot stage metadata, not user content

Confirm the Dashboard project's name and reference. Record the read-only results from:

- `database/palace-observatory-stage-preflight.sql` and `database/palace-observatory-stage-access-preflight.sql`.
- Existing migration history (12 original security-fixture migration versions) and a protected inventory of fixture table counts, RLS flags, policies, and function/grant signatures.
- Staging project Postgres version and installed extensions.

Current pre-installation expectations: **9 public tables, 9/9 RLS enabled, `private.staging_chat_rooms` present, `public.profiles` and `public.fandom_directory` absent, six exposed privileged functions**. Capture the snapshot immediately before any eventual migration because these expectations can change.

## 2. Make a protected staging-only logical dump (owner-operated)

See the current [Supabase Database Backups guidance](https://supabase.com/docs/guides/platform/backups), [`supabase db dump` reference](https://supabase.com/docs/reference/cli/supabase-db-dump), and [CLI backup/restore guide](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore).

On a trusted computer, inspect `supabase db dump --help` for installed CLI-version options. Obtain the **staging-only** database connection string through that project's Dashboard **Connect** control. Never paste the connection string or password into ChatGPT, GitHub, a ticket, or a file committed to source.

The following are illustrative POSIX-shell commands; do not run them until all prerequisites and the staging URL have been checked:

```bash
# STAGE_DB_URL is entered locally and not saved in the repository.
# STAGE_SNAPSHOT is an ABSOLUTE path outside the Git checkout on protected storage.
[[ "$STAGE_DB_URL" == *"db.ysbntuyyprnhptlxxsng.supabase.co"* ||
   "$STAGE_DB_URL" == *"postgres.ysbntuyyprnhptlxxsng@"* ]] ||
  { echo "Wrong database target; STOP"; exit 1; }
[[ "$STAGE_DB_URL" != *"sservftxygunkacmwsad"* ]] ||
  { echo "Production target forbidden"; exit 1; }
test -d "$STAGE_SNAPSHOT" || exit 1
umask 077
supabase db dump --db-url "$STAGE_DB_URL" -f "$STAGE_SNAPSHOT/roles.sql" --role-only
supabase db dump --db-url "$STAGE_DB_URL" -f "$STAGE_SNAPSHOT/schema.sql"
supabase db dump --db-url "$STAGE_DB_URL" -f "$STAGE_SNAPSHOT/data.sql" --use-copy --data-only
```

**Secure the output immediately**: plaintext SQL can include data and should never live in a public repository, chat, unsecured Downloads folder, or CI artifact. Store only an encrypted archive and its integrity verification record in an owner-controlled backup destination. Do not put the decryption key alongside the encrypted archive. Keep an independent off-site copy and confirm it can be decrypted.

Supabase's CLI intentionally excludes managed schemas including `auth` and `storage` from its normal dumps. Such a dump is **not** a complete backup of every external service, Storage object, Auth provider configuration, credential or Cloudflare setting. Review these exclusions explicitly; do not claim full disaster recovery on the strength of three SQL files.

## 3. Verify a restore to a different disposable destination

Use a separate **disposable PostgreSQL 17/Supabase-compatible environment**, never the existing Security Staging project, production project, or its connection URL. Check roles, extensions and required Supabase-internal schema compatibility before import. The [official backup/restore guide](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore) documents the appropriate `psql` restore order: roles, schema, then data; a reviewer must adapt it to the isolated target and handle role/default-grant differences safely.

The restore is **not proven** merely because SQL files exist or a checksum matches. The reviewer must:

1. Decrypt the saved copy in a protected local scratch directory; verify archive checksums and record the restore target identity.
2. Restore roles/schema/data in the disposable destination with stop-on-error enabled; do not overwrite any existing service.
3. Re-run the read-only schema/access preflights and compare the recorded **before/after** fixture row counts, original RLS policies, function signatures and table grants.
4. Verify the original fixture sentinel and 9 public tables, absence of the compatibility additions, and expected 12 fixture migration versions or explicitly document if migration tracking is stored outside the dump.
5. Investigate every skipped object, role/grant mismatch, extension, constraint, Auth/Storage omission or restore warning; a failed or incomplete restore means **NOT READY**.
6. Destroy the *disposable* restore target only after recording a clear owner-approved recovery result. Retain the encrypted off-site staging backup under owner control.

Never run `supabase db reset --linked`, `db push`, or an unreviewed `DROP` against the existing staging or production projects to perform this rehearsal.

## 4. Recorded sign-off (must be completed by an authorized reviewer)

| Gate | Current result |
| --- | --- |
| Staging project ID reconfirmed immediately before snapshot | **Not verified for a backup session** |
| Original 12 fixture migrations and policy snapshot captured | **Not verified** |
| Staging-only encrypted backup created and independently retrievable | **Not verified** |
| Actual staging backup decrypted and restored into a different disposable database | **Not verified** |
| Fixture schema, row counts, RLS/grants/functions matched after restore | **Not verified** |
| Staging additive SQL independently approved | **Not approved** |
| Site preview deployment separately approved | **Not approved** |

Record reviewer, UTC dates, **nonsecret** encrypted-archive identifier and integrity digest, disposable target type, preflight evidence, unexpected differences, and final **PASS/FAIL**. Never record passwords, connection URIs, private Auth payloads, member names or manuscript contents.

**If any recovery gate is missing, do not install the staging SQL proposals, create Owner users, publish the Pages preview, or merge PR #242.**
