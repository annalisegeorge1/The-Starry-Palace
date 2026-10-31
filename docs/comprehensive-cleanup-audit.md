# The Starry Palace: cleanup and optimisation audit

**Review date:** 2026-10-30

**Repository:** `annalisegeorge1/The-Starry-Palace`

**Development branch:** `codex/comprehensive-cleanup-2026-10-30`
**Starting commit:** `f684a4b23d789e8a475b1ffc81d78d27a3688885`

## Scope and safeguards

This review covers the repository, its build and tests, the checked-in Supabase schema and migration sources, and read-only production Supabase security/performance metadata. It did not deploy code, change DNS or Cloudflare, apply migrations, change Auth settings, or inspect member row contents. Draft legal policies were not published or added to the app. The development branch is based on the starting commit; `main` was not modified or merged.

A pre-existing untracked file was present at `public/assets/palace-watercolours/.tier-frames.webp.cWdX9S`. It was left untouched and excluded from all changes.

## Baseline and after-change checks

| Check | Before cleanup | After cleanup |
| --- | --- | --- |
| `npm run audit:structure` | Passed; 577 source files, 183 CSS files | Passed; 579 source files, 184 CSS files (the extracted helper module and stylesheet) |
| `npm run audit:css` | Passed; 9,632 selector entries, 6,248 unique selector texts, 1,872 repeated selector texts | Passed; same selector counts as baseline |
| Vitest | 239 files, 1,179 tests passed | `npm run verify`: 239 files, 1,179 tests passed |
| Production build | Passed | Passed; Guidebook now appears as its own lazy JS and CSS chunks, and its prior ineffective dynamic-import warning is gone |
| Production dependency audit | Not run | `npm audit --omit=dev`: 0 vulnerabilities reported |

The after-change CSS overlap audit also passed with the same measured selector counts as baseline. Its repeated selector reports are candidates for manual review, not proof of conflicting or removable rules.

The build's main JS bundle changed from 1,169.66 kB (295.10 kB gzip) to 1,166.64 kB (294.43 kB gzip). The main CSS bundle changed from 1,799.19 kB (305.33 kB gzip) to 1,795.23 kB (304.64 kB gzip). The Guidebook page itself is emitted as a separate 3.25 kB JS chunk (1.39 kB gzip) and 3.99 kB CSS chunk (1.20 kB gzip), loaded when that page is opened. The remaining 500 kB chunk warnings point to the app entry bundle; this small, low-risk split does not solve the larger bundle issue.

## Implemented change

The `PalaceTopicHelp` and `PalaceFirstRoomHint` components used by reading, writing, comics, settings, Treasury and Grand Palace screens previously lived in `PalaceGuidebook.jsx`. Those static imports prevented Vite from keeping the Guidebook page lazy. The components and their existing style rules now live in `PalaceGuidebookHints.jsx` and `palace-guidebook-hints.css`; callers import the helpers directly. The Guidebook page remains lazy-loaded. The helper behavior, accessible labels, local-storage dismissal, Nightfall/Daylight colors, breakpoints and other existing styles were preserved. No feature or art asset was removed.

## CSS and asset observations

The largest source stylesheets are `polish.css` (about 557 KiB), `palace-next.css` (216 KiB) and `style.css` (210 KiB); the read-only audit counted 12,627 `!important` declarations. The selector-overlap report found many repeats across themes, media queries and layer order, so it cannot justify removing rules by itself. A broader CSS consolidation should group selectors by computed property, theme and breakpoint, then compare screenshots in Nightfall and Daylight at desktop and mobile sizes. No broad stylesheet rewrite was made in this change.

The public asset directory is about 132 MiB and includes authored artwork. Several large original badge and court illustrations are roughly 2.9–3.4 MiB each. Keep these originals; evaluate responsive WebP/AVIF derivatives, correct intrinsic sizing and lazy loading where the art is not immediately visible, with visual comparison before adoption.

## Security and reliability findings

- The client source scan found no Supabase service-role key or service-role client configuration. The browser uses the public Supabase client configuration.
- Read-only production metadata showed RLS enabled on all 194 public tables, with 337 policies; no public views lacking `security_invoker` were reported. These counts are a point-in-time inventory, not proof that every policy is correct.
- Reviewed policy boundaries include owner/collaborator draft access, published-work visibility, chapter access via `private.can_read_chapter`, creator-only comic writes, conversation membership for messages, sender/membership checks for message inserts, user-scoped notifications, and profile discovery gates. No database policy was changed.
- The Supabase security advisor reports 11 security-definer functions executable by `anon`, 145 executable by `authenticated`, and leaked-password protection disabled. Some anonymous RPCs appear to support intentional public reads, share tracking, or unsubscribe behavior; each function's body, grants and input/output exposure should be assessed before tightening grants. Enable leaked-password protection only after owner review of the Auth behavior and its user impact.
- The performance advisor flags the `profile_title_entitlements` SELECT policy for per-row `auth.uid()` evaluation. A migration could wrap the call as `(select auth.uid())`, after checking the authoritative migration history and validating query plans. This was not changed in production or source migrations.
- Unused-index advisor entries are candidates for measurement, not automatic drop targets; verify workload coverage and index usage over a representative period before any removal.
- `npm audit --omit=dev` reported zero production dependency vulnerabilities. The repository build still warns that the main JS and CSS chunks exceed 500 kB; further splitting should be measured against route loading and shared feature dependencies.
- `src/liveRooms.jsx` is the largest application module at about 617 KiB and 2,587 lines. Its feature screens share data helpers and stateful flows, so splitting it safely needs route-by-route dependency and interaction checks. The current change only addresses the verified Guidebook eager-import path.

## Features, navigation and visual behavior

The regression suite passed at baseline (1,179 tests across 239 files). Focused Guidebook/hint tests also pass after the split. Existing tests cover a broad range of auth gates, writing, reading, comics, messaging, notifications, Treasury/rewards, Grand Palaces, badges, community and navigation behavior. This review did not log into production or exercise member-specific workflows against live data. No runtime feature removal was made. The Palace Code is currently a community charter for creative rights, dignity, age/safety, moderation, appeals, privacy/messages and Council accountability; its page links to Council, Settings and the existing Lost Works policy.

## Legal and community-page recommendation

Keep the Palace Code as the conduct, safety, moderation and governance charter. Once each text is approved, add separate pages for Terms of Service, Privacy Policy, AI Policy and donation rules, linked from the public footer and relevant account/signup or donation flows. Cross-link the Code to the policies where conduct, privacy, AI-assisted work or donations are discussed. Keep policy drafts out of production routes and navigation until approved. This branch does not create or publish policy text.

## Follow-up requiring approval or additional evidence

1. Review the 11 anonymous and 145 authenticated security-definer RPC grants and function bodies, then prepare narrowly scoped changes for approval.
2. Decide whether to enable leaked-password protection in Supabase Auth after evaluating its sign-in/recovery effects.
3. Validate the `profile_title_entitlements` policy optimization against the live migration baseline and a representative query plan before applying a migration.
4. Gather production telemetry for JS/CSS route usage and database index utilization before further bundle splitting or index changes.
5. Approve the legal texts before adding legal routes or signup/donation consent links.

## Rollback

The branch starts at the recorded commit. The change is isolated to Guidebook helper extraction and documentation, and can be reverted with `git revert <cleanup-commit>` without touching `main` or production. No live rollback or deployment action has been taken.
