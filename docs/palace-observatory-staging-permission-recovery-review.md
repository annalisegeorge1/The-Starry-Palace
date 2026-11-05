# Observatory — Security Staging permission and recovery review

**2026-11-04, owner draft only. NO staging SQL was applied.**

## Read-only inventory, verified on independent Security Staging

Project: `ysbntuyyprnhptlxxsng` (not the production Supabase project). The reproducible read-only query is `database/palace-observatory-stage-access-preflight.sql`.

- The staging fixture sentinel exists. Both `public.profiles` and `public.fandom_directory` remain absent, confirming that the compatibility migration has **not** been installed.
- **9/9** public fixture tables have RLS enabled. Existing policies: `works` 1, `work_collaborators` 4; the other seven currently have zero. RLS-enabled-without-policy means access is blocked under ordinary restricted roles unless a security-definer or privileged access route applies. Do not disable RLS to work around these intentional fixture protections.
- The four reader/discovery fixtures `works`, `chapters`, `tags` and `work_tags` all currently grant `SELECT/INSERT/UPDATE/DELETE` to both `anon` and `authenticated` at the table privilege layer. RLS remains a separate authorization barrier, but broad grants are unnecessary for this read-only staging review. The proposed additive SQL now revokes `INSERT/UPDATE/DELETE` from `PUBLIC`, `anon` and `authenticated` for **only those four tables**; no other existing reward, chat, collaboration or comic fixture grant is changed.
- Six public `SECURITY DEFINER` functions remain anonymously executable. Two (praise and share) mutate data but check for a logged-in identity in their bodies. The remaining functions expose reader-aware aggregates or tag searches. No function grants have been changed; their execution permissions require explicit QA before exposing any staged website.

Reference: [Supabase RLS documentation](https://supabase.com/docs/guides/database/postgres/row-level-security), [RLS-without-policy advisory](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy), [anonymous definer function advisory](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable).

## Actual database backup: blocker, not verified

Supabase organization `The Starry Palace` (`wufskbhpeffgjfhfmcsq`) was inspected read-only on 2026-11-04 and reports `plan: free`, `tier: tier_free`. Supabase's official [Database Backups guide](https://supabase.com/docs/guides/platform/backups) says guaranteed daily backups are included on Pro/Team/Enterprise, **not on Free**; it recommends regular offsite logical dumps for free-tier projects. A manual staging-only logical backup, secure retrieval, and successful restore have **not** been verified. Do not assume automatic backups or that migration rollback exists.

Before real staging DDL: an authorized reviewer must confirm the project's backup/restore eligibility or create a protected **staging-only** backup via the supported CLI connection; record its retrieval and encryption/access restrictions, rehearse a restore into a *different* disposable database, verify fixture counts, function definitions, RLS and privileges, and obtain separate installation approval. Do not copy production records or credentials into GitHub or CI. A database migration transaction alone is not a recovery strategy after commit.

## Recovery validation in pull-request CI

`.github/workflows/palace-observatory-postgres-review.yml` now performs a **synthetic-only** pre-installation logical dump and restores it to a separate disposable PostgreSQL 16 database using matching PostgreSQL 16 utilities **inside the temporary service container**. The test checks that the original `works` row, absent compatibility tables, staging fixture sentinel and previous `works` policy survive restoration. It also tests a proposal installation against a separate ephemeral DB and requires a refused replay.

This is a **simulation** of recovery mechanics and cannot verify a real Supabase backup, actual Auth configuration, Storage or external integrations. CI scripts do not use Supabase service keys or connect to the live project.

## Approval gates before staging database installation

1. Independently confirm an accessible and successfully restored backup of the *actual* Security Staging database; verify the 12 original fixture migrations and original policies.
2. Review the additive compatibility SQL and its narrow-grant changes, especially anonymous versus authenticated metadata and chapter-text access.
3. Review the age-13 helper and all six public `SECURITY DEFINER` RPCs, with denied/allowed behavior using real staging-only identities.
4. Approve and apply the staging-only schema, published-search, and age-13 proposals in their documented order, stopping on any unexpected change.
5. Test RLS, published mature/explicit metadata, protected chapters, privately owned drafts and licensed/source-linked works with synthetic users only.
6. Obtain **separate** staging website deployment approval. Production Cloudflare, DNS, Supabase data, Owners and GitHub main remain out of scope.

**Outstanding full-project integration:** CI also reports unrelated chat polling, relationship-filter and banner geometry assertions. The Observatory's isolated suite and SQL workflow are not substitutes for that full-project release gate.
