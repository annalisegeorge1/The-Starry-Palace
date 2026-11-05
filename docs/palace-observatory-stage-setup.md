# The Palace Observatory — isolated staging setup

**Prepared 2026-11-04. DRAFT / NO DEPLOYMENT.** Do not use a production credential, production member account, or real user manuscripts during staging.

## Verified existing resources

- Cloudflare Pages project: `starry-palace-observatory-stage`, separate from production `the-starry-palace`.
- Hosting project currently has **zero deployments** and **no connected Git source**. No preview website has been published.
- Its **production and preview** `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` variables point to the existing, independent **The Starry Palace - Security Staging** Supabase project (reference `ysbntuyyprnhptlxxsng`). Publishable keys must not be copied into this document; secret/service-role credentials must never appear in a client bundle.
- Google login is disabled in staging (`VITE_GOOGLE_LOGIN_ENABLED=false`). The separate, production Cloudflare Pages project, Workers and live site are unchanged.
- Staging Supabase is healthy but has **only a reduced security-testing schema** (9 RLS-enabled public tables). It does not currently contain the full Palace schema, RPCs or test accounts needed for a true end-to-end Observatory review.

## Build isolation guard now configured

The separate Cloudflare Pages project has no Git source and zero deployments. Its build command is now `npm run build:observatory-stage`. The opt-in build guard at `scripts/verify-observatory-stage-env.mjs` explicitly requires the independent Security Staging Supabase URL, a frontend publishable key, disabled Google OAuth and a staging marker. It fails without running the normal production build when any guard fails.

The read-only schema audit is at `docs/palace-observatory-staging-schema-gap-audit.md`. The current small security-test database is intentionally **not** a production-equivalent schema; inspect that report before any migration or synthetic data seeding.

## Hard gates before any staging deployment

1. Confirm an independently reviewed and migrated **non-production** full Palace schema on staging, including only the app's required functions and policies. Keep all real member data, passwords, drafts, chats, production Auth identities and Storage objects out of staging.
2. Seed synthetic-only public Original/Fanwork examples, approved fandom tags, Mature/Explicit metadata and restricted-content test cases. Never copy actual member manuscripts or account records.
3. Validate read/write permissions through separate synthetic signed-out, member, authorized-age and Owner test personas. Provision Owner only in the **isolated staging** environment after separate authorization.
4. Verify that the Cloudflare Pages project remains disconnected from production DNS and Workers. Its environment URLs and publishable keys must match the staging Supabase project, with no fallback to production.
5. Review external integrations: no mail delivery to members, payment transactions, production uploads, AI model calls on member data, live social integrations, or outbound notifications from staging. Apply appropriate protection if a staging URL will become accessible to external testers.
6. Build **Draft PR #242** as an isolated staging artifact only after these checks and explicit deployment approval. Do not attach the production domain, merge the PR, change the production Worker, or configure auto-deployments.
7. Run all Observatory human acceptance checks (see `src/palaceObservatoryAcceptance.js`) on mobile, tablet and desktop, recording independent Pass/Mismatch/Blocked results; protected chapter and RLS tests are mandatory.
8. Only after user review, separately consider activating approved Owner-only issue tables and private evidence Storage in staging, test their policies, then seek new explicit approval for any production schema or site release.

## Known blockers

- Staging's current reduced schema is intentionally unsuitable for a fully working Palace reader/Observatory. **Do not** treat an empty preview or missing APIs as proof the real site has no matching work.
- The Phase 3 Observatory schema in `docs/palace-observatory-phase3-schema-proposal.sql` is **a proposal, not an applied migration**. Private issue storage and Owner role are not activated.
- The manual checklist in `docs/palace-observatory-manual-acceptance.md` has an older numbered outline; the executable draft acceptance list is `src/palaceObservatoryAcceptance.js` and contains 15 cases as of this setup.
- Last verified Draft PR #242 CI: 1,526 full-repository tests passed and Vite built. This verifies code, **not** staging availability or browser/privacy behavior.

## Release boundary

The separate Cloudflare project creation and environment configuration are **staging setup only**. No deployment, production DNS adjustment, GitHub merge, production Owner permission, Supabase schema/storage migration or real member data modification has been authorized or performed.
