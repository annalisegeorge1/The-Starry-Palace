# The Palace Observatory — staging schema compatibility plan

**2026-11-04 · Review-only proposal; no database migrations executed.**

This is a plan for the **independent Security Staging Supabase project** `ysbntuyyprnhptlxxsng`, not the production Palace. The Cloudflare staging project remains **undeployed** and unconnected to Git. Draft PR #242 stays unmerged.

## Machine-verified preflight

The read-only, reusable audit is `database/palace-observatory-stage-preflight.sql`. It was executed against staging as a **SELECT** only. Its result:

- **50 missing required table/column pairs** across the selected public discovery and Observatory metadata surfaces.
- Existing `public.works`: **10 missing app fields** (including title, slug, work_type and rating); `chapters`: **1 missing field**.
- Entirely missing: `profiles` (5 required fields), `fandom_directory` (5), `archive_records` (12), `archive_rights_records` (8), `archive_texts` (3), `platform_memberships` (3), and `comments` (3).
- The published-search RPC `public.search_published_works_v2` is **absent**. The Owner authorization helper `private.has_platform_role` is **absent**.
- RLS is enabled for staging `works`, `chapters`, `tags`, and `work_tags`. Only `works` has a policy in this selected subset; the other three currently have zero policies. Do not simply turn RLS off to make the preview pass.
- Staging has **12 historical synthetic security migrations** which must be preserved and regression-tested. The previous audit separately showed **9 public tables** in staging versus **197** in production. This preflight tests only the narrower reader/Observatory subset and is **not** proof that the full application will work.

### Database function security assessment

Six functions are declared `SECURITY DEFINER` and currently callable at the SQL privilege layer by both `anon` and `authenticated`. Each uses a fixed search path. This is not by itself proof of a data leak.

| Function | Purpose indicated by staged definition | Review disposition |
| --- | --- | --- |
| `get_palace_praise_state` | Returns praise metadata after a work/chapter reader-eligibility check; inaccessible targets return neutral counts | Potentially legitimate anonymous read; test work, member-only and age restrictions |
| `get_tag_family_counts` | Reads counts for accepted canonical/community tag categories, with visibility and age conditions for usage | Potentially legitimate public aggregates; confirm no private-tag or unpublished counts leak |
| `search_palace_tags` | Searches accepted tags and computes visible-work usage counts | Potentially legitimate anonymous directory search; check both published and restricted cases |
| `search_palace_tags_v2` | Same search, with fuzzy match scoring | Potentially legitimate public search; verify query limits, visibility and restricted counts |
| `give_palace_praise` | Writes praise/reward records; function body rejects `auth.uid() IS NULL` | **Propose revoking anonymous EXECUTE** after testing signed-out, member, role and age paths; keep Owner review of grants |
| `record_palace_share` | Writes share reward ledger events; function body rejects `auth.uid() IS NULL` | **Propose revoking anonymous EXECUTE** after testing, retaining signed-in-only path and rate limits |

The security advisor reported 10 RLS-without-policy notices and 6 anonymous / 6 authenticated definer-execute warnings across those six functions. Review each with Supabase's [public-definer-function linter](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable) and [RLS policy linter](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy). **Do not revoke functions or change RLS speculatively before tests**; some are intentionally public, while two are mutations that already check authentication.

## Production schema structural cross-check (read-only)

The **same** preflight was also run against the production database's schema catalogue, without fetching content rows or manuscripts. It reported **zero missing required columns** and verified both `public.search_published_works_v2` and `private.has_platform_role` exist. The 11 selected production tables each have RLS enabled and at least one policy; these are structural facts, not proof that every policy permits the correct audience.

The comparison corroborates that the **50 missing items are staging compatibility gaps**, not a failure of the corresponding production schema. This is not an approval to copy or sync production data, role assignments or policy grants into staging.

## Minimal compatibility slice — ordered proposal, not installation

1. **Snapshot and preserve staging.** Record schema definitions, grants, policy names, fixture migration versions and synthetic table counts; verify rollback via a separate recovery path. No production data export, authentication tokens, member manuscripts or real email addresses.
2. **Resolve existing-table discrepancies.** Prepare an additive, individually reviewed set of `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` changes for the ten missing `works` fields and one `chapters.word_count` field; verify existing constraints and defaults first. Do not drop, replace, truncate or overwrite the synthetic fixtures.
3. **Create only missing metadata tables for the chosen test scope.** Profiles, fandom directory, archive metadata/rights/text indexes, and platform memberships need independently reviewed foreign keys, constraints, RLS and `GRANT` statements. Start all new exposed tables **deny-by-default**; never provide a public shortcut for unpublished works or private drafts.
4. **Add required published-search dependencies.** Staging must provide accepted `tags` and `work_tags` visibility, publication-safe `comments` counts, and `public.search_published_works_v2` as **SECURITY INVOKER**, with the exact verified function signature and public/members constraints. Build from reviewed schema/migration source, not an invented shortened imitation.
5. **Test synthetic-only discovery.** Seed original fictional data for public General/Teen/Mature/Explicit works, distinct fandom and relationship tags, author-source versus hosted rights, unpublished private drafts, and works above the reader's age. No real member records, chats or artwork.
6. **Test actual client identities and RLS.** Anonymous, signed-in adult, authorized younger-reader simulator using a compliant test profile, non-Owner and Owner personas must be kept in **staging Auth only**. RLS/age access must be tested using those clients rather than just an admin SQL session.
7. **Owner/admin phase remains separate.** Independently review `private.has_platform_role`, the platform membership policy, and Owner grants before creating any synthetic Owner role. The private `observatory_issues`/events/evidence proposal and private bucket require separate schema+storage sign-off. Never grant a production account any role here.
8. **External-service isolation.** Block actual member email, analytics to production, payments, Giphy/GitHub uploads, AI access to manuscripts or private images, real notifications, and production OAuth redirects. Keep the Cloudflare preview off the public domain and disconnected until a browser test deployment is specifically approved.
9. **Run validation gates.** Run the staging preflight, Supabase security advisors, older fixture regression cases, targeted Observatory tests, full project tests/build and the staging-only environment checker. Critical mismatches block the preview.
10. **Then request staging deployment approval** for the dedicated Cloudflare Pages project, with no GitHub merge or production routing. A working site must then pass the Observatory's 15 real-browser acceptance cases.

## Decision boundary

**Do not execute a bulk production-schema clone against this existing security fixture project.** It could break security tests and conceal real differences. The next schema package must include a preflight result, exact reversible changes and policies, realistic synthetic seed fixtures, an expected RLS matrix and rollback instructions. Prepare and review that package before any DDL or account grants are applied.

The present work is read-only schema inspection and proposal creation. No schema migration, private manuscript read, Owner assignment, staging deployment, production DNS update or public-site release has taken place.

## Proposed SQL and synthetic review package — ready for independent review

The following **unapplied** draft assets have now been prepared on PR #242:

- `database/palace-observatory-stage-additive-schema-PROPOSAL.sql` — staged-only metadata extensions, new public tables, default-grant revocations, explicit RLS policies and column-scoped archive-text metadata access. It uses the staging fixture sentinel, a transaction, and an intentionally **NOT VALID** author-profile FK to avoid rejecting old synthetic fixture rows.
- `database/palace-observatory-stage-published-search-PROPOSAL.sql` — exact existing production-reviewed search RPC copied under a separate staging guard with `SECURITY INVOKER`, not a newly invented privileged shortcut.
- `database/palace-observatory-stage-age-13-PROPOSAL.sql` — deliberately separate review of guest access to age-13 General/Teen chapter text while keeping 18+ content restricted.
- `tests/fixtures/palace-observatory-stage-scenarios.json` — fictional cases for public, members-only, adult-rated, private, cross-fandom, alias and rights-pending discovery, plus explicit non-Owner denial.
- `docs/palace-observatory-staging-migration-review.md` — prescribed approval sequence, migration backup and recovery gates.

**Not yet performed:** SQL syntax/application validation in local PostgreSQL, live-stage RLS verification, synthetic Auth-user provisioning, any data seeding, Owner authorization, Observatory issue/evidence migration, stage deployment or production release. The package is a reviewed *proposal*, not an installed staging database.

The remaining full-project test failures reported before this package (in chat responsiveness, relationship-filter lookup and Grand Palace banner geometry) are tracked separately from the Observatory's isolated tests and must also be addressed before release.
