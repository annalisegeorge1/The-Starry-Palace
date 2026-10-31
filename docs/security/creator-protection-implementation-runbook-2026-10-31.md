# The Starry Palace — security release runbook (OWNER APPROVAL REQUIRED)

**Prepared 31 October 2026. Status: planned; not executed.**

The owner requested further preparation before implementing the set of protections. Nothing in this document authorizes a deployment. The draft PR is [#174](https://github.com/annalisegeorge1/The-Starry-Palace/pull/174).

## Release principles

1. **No member data in test fixtures or AI tools.** Use synthetic accounts, stories and private messages. Never export, copy or query real manuscripts to validate access controls.
2. **A passing build is necessary but not sufficient.** The database changes require API authorization tests with real distinct test-account JWTs against an isolated staging database.
3. **Small, reversible changes.** Keep a signed-off baseline for each function definition. Deploy and test one independently before the next.
4. **Preserve creator rights.** Drafts remain private; original artwork remains with its owner; public reading/search and existing reading controls remain functional.
5. **Don't silently change prices, point economics, badge issuance, settings, content ratings, age registration rules, or member-facing UI.**
6. **Don't merge the review PR until staging results and owner approval are recorded.**

## Gate 0 — staging and cost approval

The connected Supabase project has no development branches as of this review. Creating one may involve a charge. **Quote any actual cost and obtain explicit approval before creating a hosted branch.** An isolated local stack is an acceptable alternative if the schema, extensions, storage and authentication configuration can be reproduced without touching production. Never use production data to seed it.

## Gate 1 — verify infrastructure (read only)

- Confirm Cloudflare zone routes, HTTPS redirection, managed WAF, DNS, current Pages origin, active Worker and rollback deployment.
- Record whether AI bot policies are enabled, Search/Training/Agent behavior, Bot Preference Sync, robots.txt content and the effective live response after any later change.
- Identify administrators, privileged service credentials and MFA status without copying passwords or secrets into the audit.
- Take a fresh Supabase advisor report and inspect precise roles, function grants and RLS policy definitions.
- Verify that code still contains the approved 13-year **account** minimum and creator-selected reading restrictions.

## Gate 2 — prepare rollback

Before each SQL change in staging, save the existing function definition and EXECUTE grants, and record the old output for representative synthetic roles. For production rollout later, verify a secure backup and an exact rollback plan for the targeted function. Do not undo database data or overwrite unrelated migrations. Keep the original live function definitions confidential to maintainers.

## Gate 3 — stage the database proposals in this order

All paths are in `database/` and start with `PROPOSED-`. **They have not been applied**.

| Sequence | Candidate file | Risk addressed | Critical regression |
| --- | --- | --- | --- |
| 1 | `PROPOSED-guard-grand-palace-identity-discovery-2026-10-31.sql` | Hidden/blocked profiles exposed through Palace identity | Public Palace cards and owner access |
| 2 | `PROPOSED-restrict-praise-state-visibility-2026-10-31.sql` | Private work/chapter reaction counts | Normal praise counts, collaborator access |
| 3 | `PROPOSED-guard-bookmark-counts-by-reader-age-2026-10-31.sql` | Age-gated work bookmark counts | Visible story listings and bookmarks |
| 4 | `PROPOSED-hide-unpublished-lore-chapter-metadata-2026-10-31.sql` | Draft chapter metadata in public lore | Lore unlock/reveal progression |
| 5 | `PROPOSED-guard-shares-by-reader-age-2026-10-31.sql` | Underage share rewards on restricted work | Existing weekly/daily points and deduplication |
| 6 | `PROPOSED-guard-praise-awards-by-reader-age-2026-10-31.sql` | Underage praise rewards on restricted work/chapter | Four praise tiers, daily limits, reward accounting |
| 7 | `PROPOSED-public-tag-counts-visible-content-only-2026-10-31.sql` | Unpublished/private/age-ineligible tags reflected in search counts | Legacy and v2 tag discovery, family totals and performance |

One tag-count candidate replaces three related functions. Do not stage it without testing query plans and a realistic synthetic tag catalogue. The other six replace one function each.

For each candidate, compare output in distinct browser/API sessions: guest, author, accepted collaborator, unrelated adult, younger reader, blocked viewer. Validate no unauthorized rows or metadata are returned and no authorized operations break. Require no production user-data reads for test setup.

## Gate 4 — search and AI bot controls

- Review the staged `public/robots.txt` so **normal search indexing stays enabled** while specified AI crawlers receive disallow signals.
- Validate site `/robots.txt`, `/sitemap.xml`, public reading and search pages after a preview deploy.
- Enable Cloudflare's AI **Training** block on production only after owner approval and verification that selected behavior, origin Worker, managed robots.txt and user-agent matching do not cause legitimate search/reader issues.
- Bot controls and content signals cannot guarantee protection against every unauthorized scraper; never describe them as foolproof.
- Evaluate Bot Fight Mode separately. On Free plans it can cause challenges to desired automation and cannot be selectively bypassed with custom WAF rules.

## Gate 5 — authentication, storage, reliability and policy alignment

- Review Supabase leaked-password protection, admin MFA, and recovery options with tested fallback and compatibility before changing Auth configuration.
- Validate private chat-photo and comic-originals storage rules with unrelated test JWTs.
- Test private manuscript export, recovery, editor autosave, history and collaboration permissions.
- Inventory cookies, local storage, analytics, email-delivery and third-party processors before claiming the public privacy policy is complete.
- Verify data-retention and account deletion outcomes rather than promising immediate permanent deletion without evidence.
- Reconcile the Privacy, Cookies and AI notices with actual provider configuration before separately approving policy changes.

## Gate 6 — owner-reviewed implementation

Collect staging evidence for all seven SQL candidates, tests, screenshot/browser review, current advisor findings, query performance and rollback checklists. Obtain explicit go/no-go approval. Deploy **in small increments**, monitor error logs and member feedback, and stop/roll back if core writing, reading, messaging, privacy or sign-in regresses.

## What is and is not done

**Done:** read-only configuration and security-definer review, proposed source changes, source-level regression tests and this release plan.

**Not done:** create paid staging, execute SQL, impersonate accounts, validate live access by synthetic JWTs, change Cloudflare bot settings, merge PR, publish policy drafts, or deploy production.

## Completed first validation — synthetic PostgreSQL CI

A zero-production-data PostgreSQL 17 service now runs in the existing **Palace build checks** workflow for pull requests. The scripts `tests/security-db/fixture-schema.sql` and `tests/security-db/fixture-assertions.sql` create a disposable schema, compile all seven proposed SQL candidate files (nine functions), and execute role-simulation assertions using deliberately invented UUIDs, ages, story metadata and reaction counts.

**First observed result:** [GitHub Actions run 41205701735](https://github.com/annalisegeorge1/The-Starry-Palace/actions/runs/41205701735), job **Synthetic security RPC checks (ephemeral database)** passed, including fixture creation, compiling proposals and synthetic role checks. The normal `test-and-build` job is a separate gate.

**Important remaining boundary:** This CI uses `auth.uid()` backed by a controlled synthetic session variable and small test helper functions. It **does not** reproduce the full live Supabase Auth, JWT claims, PostgREST exposure/grants, actual RLS policy implementation, storage rules, network edge protections, or production migration history. A full isolated Supabase staging environment and signed-in JWT/PostgREST tests remain required before the proposals can be deployed.

## Added permission-layer validation — 31 October 2026

GitHub Actions now also executes `tests/security-db/fixture-role-rls-assertions.sql` in the disposable PostgreSQL 17 environment, **after** the synthetic data and proposed functions load. This script creates real PostgreSQL roles named `anon` and `authenticated`, enables RLS on synthetic `works` and `chapters`, installs the currently observed policy expressions, and tests permitted and denied reading/editing scenarios under those roles. It checks guest visibility, 13+ and 18+ viewing differences, unrelated editors' denied writes, an accepted editor's allowed chapter editing, and an author's ability to manage drafts. The initial role/RLS job passed in [GitHub Actions run 41214823120](https://github.com/annalisegeorge1/The-Starry-Palace/actions/runs/41214823120).

**Scope boundary:** This is real Postgres role evaluation, but still uses synthetic session variables for `auth.uid()`; no signed JWT or Supabase gateway is involved. Policy text is mirrored manually from the read-only metadata review rather than reimported from a complete migration history. Further end-to-end Auth, PostgREST, storage, backup and production environment checks remain required. GitHub Actions CI consumes normal account workflow minutes/quotas; it is not a permanent paid Supabase branch.

## Synthetic signed-JWT HTTP API validation — 31 October 2026

The pull-request CI now launches a disposable PostgREST 14.18 HTTP server connected to the same temporary PostgreSQL 17 database. Its connection uses a restricted `palace_ci_authenticator` role that can impersonate only the fixture `anon` and `authenticated` roles. A **fresh random, disposable signing key** is generated within each GitHub run; it is not a Supabase key or production secret.

`tests/security-db/postgrest-http-assertions.py` creates synthetic HS256 tokens and sends real HTTP requests to the temporary REST endpoints and RPCs. It checks guest, younger member, unrelated adult, author and editor read access; prohibited draft updates versus owner updates; privacy of engagement counts; Grand Palace discovery; draft lore; visible tag counts; and rejection of forged/expired JWTs. The test also preserves the prior SQL and role/RLS assertions.

**Verified result:** [GitHub Actions run 41217243892](https://github.com/annalisegeorge1/The-Starry-Palace/actions/runs/41217243892) completed the synthetic database and HTTP security job successfully, reporting **25 passed HTTP/JWT/PostgREST checks**. The temporary services and invented data are removed after the job. A preceding fixture-only test run failed due to retained synthetic profile visibility; the fixture was corrected and this successful rerun verified the intended private state.

**Still unverified:** this is a PostgREST API test, not managed Supabase Auth/GoTrue, Auth signup/email flows, Storage signed URLs, all live schemas/policies, original media download restrictions, the production Edge/Cloudflare configuration or a realistic browser regression suite. The synthetic helper definitions approximate the live project and are not a substitute for full staging. Actual production function replacements remain prohibited until the owner approves release after staging validation.

## Synthetic Supabase Storage policy checks — 31 October 2026

The pull-request CI now also uses `tests/security-db/fixture-storage-schema.sql` and `tests/security-db/fixture-storage-rls-assertions.sql`. These create **invented** comic covers, published reader-page references, original-art paths and direct/group-chat photo metadata in a disposable PostgreSQL `storage.objects` table. No actual image or media bytes are loaded.

The test recreates the reviewed `storage.objects` policies for comic asset owner operations, published reader copies, original files and membership-gated chat photos; it also mirrors the live comic metadata SELECT policies so the storage checks cannot bypass the reader age and publication gates. It exercises real PostgreSQL `anon` and `authenticated` roles with synthetic session identities, verifying:
- Signed-out users see public 12+ comic covers and published reader copies but cannot see originals or chat photos.
- A 13-year-old member sees members-eligible covers while 18+ and draft comic pages remain inaccessible.
- An unrelated adult sees published reader copies, but not another author's original files or private group chat photos.
- Owners can access/upload their own comic originals and photos, while unrelated callers cannot upload into another author's folder.
- Only direct conversation members and group members see the corresponding private chat photos.

**Evidence:** [GitHub Actions run 41220450189](https://github.com/annalisegeorge1/The-Starry-Palace/actions/runs/41220450189), synthetic database security job **passed**. An earlier fixture run was stopped by missing comic metadata table grants, corrected to reflect the actual comic metadata RLS policy dependencies; the new run verified these permissions.

**Limits:** This reproduces PostgreSQL *object metadata RLS*, not the complete managed Supabase Storage HTTP endpoints, signed-URL issuance/expiry, file transformations, bucket configuration in a hosted service, or the full production database. Continue to require separate hosted or equivalent full Supabase staging tests with real synthetic accounts before deployment.
