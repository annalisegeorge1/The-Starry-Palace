# Production security release 1 — 31 October 2026

**Status: DEPLOYED AND READ-ONLY VERIFIED in the production Supabase project** `sservftxygunkacmwsad`. No app build, frontend merge, DNS, Worker, Auth setting, or Storage bucket change occurred in this release.

## Scope and authorization

The Palace owner authorized all necessary free security work and requested implementation. These two SQL changes were isolated, tested in $0 Supabase staging `ysbntuyyprnhptlxxsng` and in disposable real GoTrue/Storage and PostgreSQL CI tests before production release. Both live DDL operations returned success.

### 1. Collaboration invitation authorization guard

Production migration: `secure_work_collaboration_invitation_consent`. SQL source: `database/PROPOSED-guard-work-collaboration-role-escalation-2026-10-31.sql`.

- Enforces fixed collaborator role, inviter, work identity, author-only invitation/re-invitation and invitee-only response.
- Keeps trusted administrative operations possible.
- Preserves existing React client `inviteWorkCollaborator` and `respondWorkCollaboration` flows.
- Preflight confirmed **zero** collaboration rows and no preexisting guard trigger.
- Postflight confirmed exactly **one enabled** `guard_work_collaboration_write` trigger and still zero rows.
- **Rollback** if real production regression: `drop trigger if exists guard_work_collaboration_write on public.work_collaborators; drop function if exists private.guard_work_collaboration_write();` This restores the *previous permissions* (which were weaker). Prefer fix-forward if practical; execute rollback only on clear regression after evaluating risk.

### 2. Excessive public table grants removed

Production migration: `revoke_excess_public_table_ddl_privileges`. SQL source: `database/PROPOSED-revoke-excessive-public-table-privileges-2026-10-31.sql`.

- Removed `TRUNCATE`, `TRIGGER`, `REFERENCES`, `MAINTAIN` permissions from browser-facing `anon`/`authenticated` roles for every ordinary/partitioned public application table, preserving their existing SELECT/INSERT/UPDATE/DELETE and RLS.
- Before production: 132 publicly exposed tables had direct `anon` TRUNCATE/TRIGGER/REFERENCES grants; 134 had equivalent `authenticated` grants. **This is a least-privilege finding, not proof someone used these grants.**
- After production: verified **zero** public ordinary/partitioned tables with those unsafe checked TRUNCATE/TRIGGER/REFERENCES permissions for either role.
- Verified existing normal `authenticated` UPDATE permission on `work_collaborators` and SELECT on `works` remain granted.
- **Rollback guidance:** do not blanket regrant these potentially destructive permissions. If an unexpected trusted operation depends on a specific grant, diagnose the actual database role and grant only the narrowest permission to a trusted role, not to `anon` or general users.

## Remaining warnings and release boundaries

Production Supabase Security Advisor after migration continued to show informational 69 no-policy RLS tables, 11 anonymous-executable security-definer routines, 147 authenticated-executable security-definer routines, and 1 password leak protection warning. These preexisting findings require *individual assessment*; they were not changed by this release.

**Not yet live:** seven other proposed privacy/age SQL guards; the private-photo frontend improvement, the `robots.txt` AI-crawler request, application build improvements and further Cloudflare settings. The draft PR #174 remains draft and unmerged.

**Required verification remaining:** member-level end-to-end creation/acceptance of a collaboration in the full production app, and mobile/desktop smoke tests, all without reading private manuscripts or using real user credentials. A SQL postflight is not a full product acceptance test.

**Backups:** Free-plan Supabase does not provide managed automated database backups; do not claim disaster-recovery readiness until independent access-controlled backups and actual restore drills are established. Do not save sensitive member data, credentials, test passwords, JWTs or backup snapshots in a public GitHub repository.
