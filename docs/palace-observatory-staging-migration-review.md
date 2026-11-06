# Palace Observatory — additive security-staging package (PROPOSAL ONLY)

**Prepared: November 2026. Draft PR #242. No SQL changes have been applied.**

## Scope and verified starting point

Existing Security Staging Supabase reference: `ysbntuyyprnhptlxxsng`. This database has **9 public tables** (rather than the main Palace's **197**) and 12 security-fixture migrations; the reader/Observatory preflight reported **50 missing required column/table pairs** and two absent helpers. The structural preflight reported no missing pairs in the production database, but **no production content, Auth identities or manuscripts were queried or copied**.

Separate Cloudflare Pages project `starry-palace-observatory-stage` has no Git source or deployment. Its build command checks isolated credentials via `npm run build:observatory-stage`.

These scripts are deliberately located in **`database/*-PROPOSAL.sql`, NOT in `supabase/migrations/`**. They are not CI-applied or approved for use as-is. A SQL reviewer must create a proper versioned staging migration through the project's current Supabase CLI after additional sign-off, not simply copy these proposals to the production migration directory.

## Files and proposed application sequence

| File | Purpose | Installation status |
| --- | --- | --- |
| `database/palace-observatory-stage-preflight.sql` | Read-only inventory of required fields, RLS policies, role/function grants | Already executed SELECT-only on staging and production |
| `database/palace-observatory-stage-additive-schema-PROPOSAL.sql` | Add missing reader metadata columns; minimal profiles, fandom, archive metadata, rights, private text index, membership and comments; create conservative RLS policies and isolated role helper | **Not executed** |
| `database/palace-observatory-stage-published-search-PROPOSAL.sql` | Port the already committed `search_published_works_v2` function exactly, keeping `SECURITY INVOKER` | **Not executed** |
| `database/palace-observatory-stage-age-13-PROPOSAL.sql` | Independently review anonymous access to general age-13 chapter text without granting 18+ access | **Not executed** |
| `database/palace-observatory-stage-mutation-rpc-grants-PROPOSAL.sql` | Independently revoke anonymous EXECUTE on the two existing praise/share mutation RPCs; preserve signed-in EXECUTE and public read/search RPCs | **Not executed** |
| `tests/fixtures/palace-observatory-stage-scenarios.json` | Fictional test design only; no personal information, real copyrighted stories, Auth credentials or database INSERTs | Reference-only |

**Ordered gating:** real staging backup **and independent restore PASS** plus schema preflight and fixture snapshot → explicit approval of additive schema → re-run old security-fixture tests → explicit approval of published-search, age and mutation-RPC permission proposals → create new synthetic Auth users only through a separately approved staging-only procedure → seed original invented stories/tags → RLS tests across personas → full CLI database/security advisors → staging preview approval → 15 manual Observatory acceptance checks.

## Guardrails built into the proposals

1. The additive and function scripts start by checking the **`private.staging_chat_rooms` staging fixture sentinel**. If absent, SQL aborts rather than touching an unknown project. Existing profiles/fandom-directory objects also block an accidental replay. These are safety backstops, not substitutes for manually checking the project reference.
2. All schema work is additive, wrapped in a transaction and confined to the existing security-test database. The draft contains **no DROP, TRUNCATE, DELETE of member content, existing fixture policy removals, or production role changes**.
3. The synthetic fixture's `works.author_id` rows cannot yet be assumed to match staging Auth profiles. The proposed `works_author_id_fkey` is **NOT VALID** to preserve existing synthetic rows; new writes must refer to staged profiles. **Do not validate it or create author accounts** until all fixture authors have been reviewed.
4. **Public published metadata is intentionally searchable at all ratings**, including Mature and Explicit where appropriate. `chapters.body_html` is governed separately by `private.can_read_chapter` and the age helper. Private drafts, members-only works, and age-restricted chapter text must be tested under actual signed-out and test-account sessions.
5. `archive_texts.body_text` is not granted to the browser. An authorized synthetic Owner can query **only `record_id`, `word_count`, and `source_url`**, through column-level grants plus RLS; no unapproved source text is published. Rights records are publicly visible only where verified and tied to published archive metadata.
6. No public client writes to new metadata, Owner role membership or archival records are authorized. Synthetic creation requires an independently approved staging-only privileged setup, followed by privilege and RLS review.
7. The Owner helper checks `auth.uid()` against `platform_memberships`, including the suspended flag. **There is no Owner identity or permission grant in these proposals**. The proposed private issue tables, event history and screenshot Storage bucket are expressly out of scope.
8. Six pre-existing, anonymously executable staging `SECURITY DEFINER` functions remain unchanged in the real staging database. Review them individually before an externally accessible preview. A **fourth, independently reviewable proposal** removes `PUBLIC` and `anon` EXECUTE from the two praise/share reward-mutation RPCs, retaining authenticated EXECUTE; public read/search RPCs remain callable. The proposal refuses an unknown project, incomplete staging compatibility schema, changed function signatures/ACL baseline or accidental replay.
9. The age-13 proposal is isolated because the existing staging function uses an anonymous **12-year** threshold, inconsistent with the new platform minimum of 13. It retains the **18+ restriction** for adult chapters. Review its interaction with all old synthetic security fixtures before any installation.
10. This package makes the **read-only Observatory/fandom discovery slice more compatible**, not the entire 197-table website. Other routes may still be incomplete in an isolated staging preview until a separately scoped compatibility rollout is approved.

## Fictional acceptance scenarios

Use the JSON fixture manifest to create invented works and fandoms—not actual member accounts or copyrighted fanfiction. The expected outcomes include: anonymous discovery of published General/Mature/Explicit metadata; denial of 18+ chapter text to signed-out and underage visitors; private draft not visible to other members; member-only metadata not anonymously visible; fandom alias/crossover multiple-tag matching; include/exclude filters; and citation-only fanwork records that cannot be hosted while rights are pending.

All account IDs must come from newly created **staging-only** Auth users. Do not seed a real name, email, phone number, password, member biography, manuscript, message, payment identity, screenshot or third-party API credential. Public links for staged citations should resolve to a synthetic `example.invalid` placeholder, never a real author's site.

## Reviewer / rollback checklist

**Before installation:** capture staging schema snapshots, fixture migration versions and per-table row counts; assess table and function grants; confirm backups/restore access and project reference; test the proposal in a throwaway local Postgres + Supabase environment first. The proposals have now been executed successfully against ephemeral PostgreSQL **16 and 17** databases in PR-only CI, using entirely fictional users and works, without connecting to Supabase. This verifies SQL compatibility with the disposable fixture, **not** the complete existing security-staging schema or its permissions. Staging installation and rollback still require independent review.

**If approved for installation:** apply separately and check every stage atomically. After each stage, re-run `database/palace-observatory-stage-preflight.sql` plus the original synthetic security regression suite. Test public RPC counts/tags and private chapter-denial outcomes with anonymous/authenticated Supabase publishable clients. Run [Supabase RLS advisory](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) and [definer-execute advisory](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable).

**Recovery:** do not use `DROP TABLE` or destructive reset on shared security staging while original fixtures are present. Prefer restore from the captured staging-only recovery point; otherwise create a reviewer-approved, separately tested reverse-diff plan that preserves original tables and data. Do not treat an unapplied SQL proposal as a rollback script.

**Disposable PostgreSQL security evidence:** `.github/workflows/palace-observatory-postgres-review.yml` runs the four staging proposal files against disposable PostgreSQL 16 and 17 services, including anonymous-denied/authenticated-allowed reward RPC privileges. Bootstrap and smoke SQL live in `tests/sql/`. It verifies invented signed-out, adult and Owner test sessions; General/Explicit metadata versus restricted chapters; pending source rights; column-level archive-text restrictions; rejected unrelated databases and rejected schema replay. It never logs into Supabase, uses secret credentials, or deploys anything. This is a **simulation**, and real Supabase Auth and Storage policies still require isolated staging tests.

**Approval boundary:** nothing here authorizes a production deployment, live database modification, DNS adjustment, GitHub merge, synthetic Owner grant, migration execution, use of real member data, payment, email or third-party notifications.
