# The Palace Observatory — staging schema gap audit

**Audit date: 2026-11-04 (Trinidad and Tobago). REVIEW ONLY. NO SCHEMA OR DATA CHANGES.**

## Environment identities

- Production database reference: `sservftxygunkacmwsad`. **Read-only catalog metadata** was examined; no member manuscripts or user records were queried or copied.
- Independent security-test database reference: `ysbntuyyprnhptlxxsng`. Connected exclusively to the separate, **undeployed** Cloudflare Pages project `starry-palace-observatory-stage`.
- GitHub source: Draft PR #242, not merged into the production branch.

## Read-only inventory findings

| Component | Production | Security staging | Result |
| --- | --- | --- | --- |
| Public tables | 197 | 9 | Full web-app schema not present in staging |
| Private tables | 3 | 3 | Staging private objects are primarily fixtures; do not assume equivalent |
| `public.works`, `chapters`, `tags`, `work_tags` | Present | Present | Staging variants contain only reduced columns and are **not** full application-compatible tables |
| `public.profiles` | Present | Missing | Blocks author metadata and authenticated member experience |
| `public.fandom_directory` | Present | Missing | Blocks curated fandom aliases/media |
| `public.archive_records` | Present | Missing | Blocks archive fanworks and hosted classics |
| `public.platform_memberships` | Present | Missing | Blocks Observatory Owner-role verification |
| `public.user_settings`, `comments`, `reading_lists` | Present | Missing | Blocks relevant application components |
| `public.observatory_issues`, `observatory_issue_events`, `observatory_evidence` | Not yet in either environment | Missing | Separate Phase 3 review proposal, **not approved for installation** |
| Published-search RPC `search_published_works_v2` | Used by draft | Absent from staging function inventory | Blocks actual fanfiction discoverability verification |
| `private.has_platform_role` | Expected by draft | Absent from staging function inventory | Blocks secure Owner-only review |

The existing 12 security-staging migrations are synthetic security fixtures for collaboration, photos, ratings, age control, rewards and tag discovery. **Do not replace or mutate them with a blind production schema copy.** Existing fixtures should be inventoried and preserved before designing a compatible, independent staging baseline.

## Security advisory review

Security advisors reported 10 `rls_enabled_no_policy` findings, including RLS-enabled public fixture tables. They also reported 6 anonymous-callable and 6 authenticated-callable `SECURITY DEFINER` function warnings (overlapping six public functions). Some may be intentionally callable fixtures; **review grants, function predicates and least-privilege access individually** before allowing an externally accessible test site.

Reference: https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable and https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

## Non-production schema preparation steps (not executed)

1. Inventory the application's real schema dependencies from repository migrations, Auth configuration, Storage and RPCs. Compare with production **structure only**, not row contents.
2. Decide whether to use a fresh isolated staging database rather than overwrite the existing security-test fixture project. If using the same project, preserve its fixtures and reconcile incompatible table definitions in a separately reviewed plan.
3. Generate a minimal **staging-only schema baseline**, without member data, public announcements or production credentials. Review RLS and explicit grants for every exposed table and RPC before applying anything.
4. Use synthetic authors, reader accounts, fandom tags, General/Mature/Explicit metadata, protected text and source-link provenance. Avoid real manuscripts, conversations, passwords or personal information.
5. Verify restricted chapter reads with actual authenticated test sessions and signed-out clients, not only SQL under a privileged role.
6. Run Supabase security/performance advisors and non-owner/owner RLS tests. No Owner role grants without explicit review; no proposed Observatory issue tables or screenshot bucket until separately approved.
7. Run `npm run build:observatory-stage` using staging-only publishable environment variables. The build guard rejects the production URL and service-role-like keys without ever outputting key values.
8. Once all staging prerequisites pass and approval is given, build an **isolated** Pages deployment and run the 15 unverified manual acceptance cases.

## Explicit blockers

- The existing reduced staging schema cannot support end-to-end reading/fandom verification.
- A fail-closed build environment guard is now present in Draft PR #242 and the independent Cloudflare Pages project uses `npm run build:observatory-stage`, but **the site is not deployed**.
- This audit is preparation only. **No migrations, user grants, test-account creation, Storage changes, GitHub merge, production updates or site deployment have occurred.**
