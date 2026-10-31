# The Starry Palace: owner-held free backup and recovery runbook

**Status: prepared for private, owner-controlled execution. Not a completed production export or a tested full restore.** Updated 31 October 2026. The code is in `scripts/security/owner-backup.sh`, kept out of the deployed website.

## What exists

The live Supabase project is `sservftxygunkacmwsad`. The read-only preflight saw **194 public tables, six Storage buckets, and 14 Storage objects**. These counts will change as the Palace grows. Six buckets were identified (including private comics, covers, chats, and one public profile-media bucket) without retrieving the objects or writers' manuscripts.

Supabase **Free does not include managed scheduled database backups**. Supabase recommends owner-managed `supabase db dump` plus off-site preservation. A database backup is not itself a backup of Storage object bytes, Cloudflare scripts/secrets, email provider configuration, DNS, or source-code deployment settings.

**Important limitations:** The Supabase CLI filters managed schemas and might omit portions of Auth user/identity data, Storage metadata, Vault keys, extension state or project settings. Its three SQL dumps plus the six downloaded Storage buckets are a *partial recovery set*, NOT proof that all users and all services can be reconstructed. Also, SQL exports and Storage downloads are taken at different moments; they are not an atomic snapshot.

## Owner setup (on your trusted PC, not GitHub Actions)

1. Install Docker Desktop (or a compatible local container runtime), the official Supabase CLI, GNU tar/sha256sum, and the free open-source `age` encryption CLI. On Windows use a local WSL Linux terminal for this Bash script. **Never install or use an unknown browser extension to export member data.**
2. Turn on full-disk encryption for the computer. Create an *owner-held* age encryption identity:

~~~bash
mkdir -p "$HOME/.palace-keys"
chmod 700 "$HOME/.palace-keys"
age-keygen -o "$HOME/.palace-keys/recovery-age-key.txt"
chmod 600 "$HOME/.palace-keys/recovery-age-key.txt"
age-keygen -y "$HOME/.palace-keys/recovery-age-key.txt"
~~~

Save a **second offline copy of the private identity** separately from encrypted backups. Whoever holds it can read the archives; losing it makes recovery impossible.

3. Work in a fresh local checkout of the Palace project. Log in using the official Supabase CLI as the owner, and **link explicitly to production**:

~~~bash
supabase login
supabase link --project-ref sservftxygunkacmwsad
cat supabase/.temp/project-ref
~~~

The output must be `sservftxygunkacmwsad`, never the separate synthetic staging project.

4. In your local Supabase project dashboard use **Connect** to obtain a database URI for the source project (session pooler if needed). **Never paste the connection URI, database password, owner keys, service-role secrets, age private identity, or archives into ChatGPT or GitHub.** If password characters are special, percent-encode them correctly. In your WSL terminal:

~~~bash
read -r -s -p "Paste Palace production DB URI: " PALACE_DB_URL
echo
export PALACE_DB_URL
export AGE_IDENTITY_FILE="$HOME/.palace-keys/recovery-age-key.txt"
export AGE_RECIPIENT="$(age-keygen -y "$AGE_IDENTITY_FILE")"
export PALACE_BACKUP_PARENT="$HOME/PalaceEncryptedBackups"
mkdir -p "$PALACE_BACKUP_PARENT"
# Set to the confirmed current Storage object count (14 at the inspection).
export PALACE_EXPECTED_STORAGE_OBJECTS=14
bash scripts/security/owner-backup.sh
unset PALACE_DB_URL
~~~

If the object count has changed legitimately, update `PALACE_EXPECTED_STORAGE_OBJECTS` only after a fresh owner-controlled inspection. **Do not force an incomplete archive to pass.** Do not upload the plaintext temporary working folders or database URI anywhere.

The script intentionally stops on failed exports or missing/incorrect linked project, writes an encrypted `.tar.age` in the chosen folder outside Git, decrypts it into a separate private temporary folder, and verifies checksums. It does not delete anything from production. The temporary cleartext files are removed on normal exit; crash recovery, SSD snapshots, system backups and paging can retain remnants, so the computer and scratch disk must be encrypted.

5. Copy the finished encrypted archive to at least **two separate owner-controlled locations**, one off-site, with sufficient free storage. Test opening an archive with your offline recovery key. Do not store the age private key alongside the same backup copies. Rotate snapshots and maintain a dated recovery log without member data.

## Restore drill before claiming disaster recovery is ready

Use **a locally isolated Supabase Docker installation** (or a separately approved empty recovery environment). Never run restore commands against the actual live project or the existing synthetic staging database. First verify archive integrity, unpack with the age identity into an encrypted temporary folder, review SQL compatibility/roles/extensions and then follow Supabase's published backup/restore instructions for the correctly configured target. Confirm that synthetic-only project acceptance tests and expected public/role/age policies work. Reconnect Storage objects, preserve bucket access rules, confirm Auth users and session/email behavior, and check media checksums. An archive that merely decrypts is NOT a validated recovery.

**Stop and reassess** if Auth user identities, Storage metadata, private-media permissions, database extensions or Cloudflare configuration cannot be restored. No complete recovery procedure should be represented as passed until every component succeeds.

Sources:
- https://supabase.com/docs/guides/platform/backups
- https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore
- https://supabase.com/docs/guides/storage/management/download-objects
- https://supabase.com/docs/reference/cli/supabase-storage

## Rollout and safety rules

Do not schedule unattended exports, enable paid backup services, connect a public cloud backup bucket, copy production data into the synthetic staging project, or expose credentials in GitHub CI. No login automation, paid product, or AI model is introduced by this kit.
