#!/usr/bin/env bash
# Owner-operated backup. Never run in GitHub Actions or on untrusted hosts.
set -Eeuo pipefail
umask 077
REF='sservftxygunkacmwsad'
BUCKETS=(comic-covers comic-originals comic-pages duel-art palace-chat-photos profile-media)
: "${PALACE_DB_URL:?Set your owner-only production database connection URI (never commit it)}"
: "${PALACE_BACKUP_PARENT:?Provide a local folder OUTSIDE the repository}"
: "${AGE_RECIPIENT:?Supply the public age encryption recipient}"
: "${AGE_IDENTITY_FILE:?Supply the locally held age private identity for verification}"
[[ "$PALACE_DB_URL" == *"db.${REF}.supabase.co"* || "$PALACE_DB_URL" == *"postgres.${REF}"* ]] || { echo 'Refusing unrecognized database target.' >&2; exit 2; }
[[ "$AGE_RECIPIENT" == age1* ]] || { echo 'Invalid age recipient.' >&2; exit 2; }
[[ -f "$AGE_IDENTITY_FILE" ]] || { echo 'Private age identity file not found.' >&2; exit 2; }
for cmd in supabase age tar sha256sum find mktemp; do command -v "$cmd" >/dev/null || { echo "Missing $cmd" >&2; exit 2; }; done
[[ -d "$PALACE_BACKUP_PARENT" ]] || { echo 'Backup destination does not exist.' >&2; exit 2; }
[[ "$PALACE_BACKUP_PARENT" = /* ]] || { echo 'Use an absolute backup destination.' >&2; exit 2; }
[[ -r supabase/.temp/project-ref ]] && [[ "$(cat supabase/.temp/project-ref)" == "$REF" ]] || {
  echo 'Supabase CLI is not linked to the Palace PRODUCTION project.' >&2; exit 2;
}
repository="$(pwd -P)"; parent="$(cd "$PALACE_BACKUP_PARENT" && pwd -P)"
[[ "$parent" != "$repository" && "$parent" != "$repository/"* ]] || { echo 'Backup destination must be outside Git checkout.' >&2; exit 2; }
work="$(mktemp -d "${TMPDIR:-/tmp}/palace-owner-backup.XXXXXXXX")"
verify_dir=""
partial=""
cleanup(){ [[ -z "$partial" ]] || rm -f -- "$partial"; rm -rf -- "$work"; [[ -z "$verify_dir" ]] || rm -rf -- "$verify_dir"; }
trap cleanup EXIT
mkdir -p "$work/storage"
# Temporary plaintext on the owner's trusted encrypted disk; CLI uses Docker.
supabase db dump --db-url "$PALACE_DB_URL" -f "$work/roles.sql" --role-only
supabase db dump --db-url "$PALACE_DB_URL" -f "$work/schema.sql"
supabase db dump --db-url "$PALACE_DB_URL" -f "$work/data.sql" --use-copy --data-only -x storage.buckets_vectors -x storage.vector_indexes
# The linked Storage CLI command is experimental: check the installed CLI version.
for bucket in "${BUCKETS[@]}"; do
  mkdir -p "$work/storage/$bucket"
  supabase storage cp "ss:///$bucket" "$work/storage/$bucket" --recursive --linked --experimental
done
object_count="$(find "$work/storage" -type f | wc -l | tr -d ' ')"
if [[ -n "${PALACE_EXPECTED_STORAGE_OBJECTS:-}" && "$object_count" != "$PALACE_EXPECTED_STORAGE_OBJECTS" ]]; then
  echo "Object count mismatch: downloaded $object_count; expected $PALACE_EXPECTED_STORAGE_OBJECTS. No snapshot published." >&2
  exit 1
fi
printf 'Backup format: palace-owner-archive-v1\nSource project: %s\nCreated UTC: %s\nStorage objects: %s\n' "$REF" "$(date -u +%FT%TZ)" "$object_count" >"$work/README.txt"
(cd "$work" && find . -type f ! -name SHA256SUMS -print0 | sort -z | xargs -0 sha256sum > SHA256SUMS)
name="palace-${REF}-$(date -u +%Y%m%dT%H%M%SZ).tar.age"
archive="$parent/$name"
[[ ! -e "$archive" ]] || { echo 'Refusing to overwrite previous backup.' >&2; exit 1; }
partial="$archive.partial"
(tar -C "$work" -cf - . | age -r "$AGE_RECIPIENT" -o "$partial")
# Decrypt and verify full archive and checksums in a second private temporary folder.
verify_dir="$(mktemp -d "${TMPDIR:-/tmp}/palace-verify.XXXXXXXX")"
age -d -i "$AGE_IDENTITY_FILE" "$partial" | tar -C "$verify_dir" -xf -
(cd "$verify_dir" && sha256sum -c --quiet SHA256SUMS)
mv -- "$partial" "$archive"; partial=""
echo "Encrypted backup created AND decrypt/hash-verified: $archive"
echo "Storage files archived: $object_count. NOT YET a database restore drill."
echo 'Move the encrypted .age file to an independently owned off-site location.'
