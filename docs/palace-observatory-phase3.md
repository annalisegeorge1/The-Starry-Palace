# The Palace Observatory — Phase 3 review notes

Status: DRAFT ONLY. No production or staging database has been changed.

## Prepared
The Issues tab offers a private Owner-only register with filters, creation and editing, proposed fixes, expected versus observed behavior, reproduction steps, device/browser details, and status history.

A button on Findings or Verification prefills a review issue. It never creates or saves one automatically.

The statuses are New, Investigating, Fix Proposed, Awaiting Review, Fixed, Rechecked, and Reopened. Moving to Fixed or Rechecked requires a fresh evidence note; these are administrative labels and never publish, merge or deploy code.

Private screenshot uploads are designed for PNG, JPEG, or WebP images of six MiB or less. The proposed storage bucket is nonpublic, allows Owner access only, and issues time-limited signed links. Screenshot images and member manuscripts are not placed into the public repository or processed by AI.

## Setup is deliberately withheld
The proposed SQL file is docs/palace-observatory-phase3-schema-proposal.sql. It proposes Owner-restricted issues, immutable event history, screenshot metadata, and private storage object policies. The Storage bucket itself must be created separately through the approved Supabase Storage API or Dashboard, with public=false, a 6 MiB limit and only PNG/JPEG/WebP MIME types. Neither step has been executed, and the proposal is deliberately NOT in a deployed migration folder.

Until schema approval, the UI displays "Issue storage pending review" rather than silently writing to a missing table. The current Supabase memberships do not assign an Owner, so the main private room remains locked too. Identity and role provisioning require a separate explicit decision.

## Security and technical review
- Existing community_reports and conversation_reports are for member moderation, not quality-assurance issues; they remain untouched.
- Owner privileges must be enforced by RLS using private.has_platform_role and authenticated identity checks, not by mutable user metadata.
- The private security-definer triggers append audit events. Browser code cannot edit history or delete issues.
- Private screenshots must be cropped/redacted if they reveal personal data or manuscript text. A signed link temporarily grants file access until expiry.
- Concurrent edits must be rejected when their updated_at values no longer match.
- An uploaded file whose metadata insert fails can become an orphan in private storage. Investigate a safe cleanup process before enabling screenshots.
- The schema is a proposed review artifact, not an approved migration. Validate isolated staging and RLS with anon, regular member and Owner test accounts only if explicitly authorized.
- Do not merge/deploy/publish or modify member works automatically.

## Acceptance checklist
1. Verify account ownership separately and never assume a GitHub identity matches a Supabase user.
2. Test anonymous and ordinary accounts cannot read issues, event logs or screenshots.
3. Test all status transitions, note requirements, immutable history and stale edit rejection.
4. Test private screenshot mime limits, file sizes, no upsert, and short signed URL expiry.
5. Check the form on Android, tablet and desktop with safe-area padding and keyboard focus.
6. Review before any schema application or live release. Preserve the existing age-13 membership minimum, rights distinctions and mature-content chapter gates.

The separate PR-only verification workflow is designed to run model and issue lifecycle tests and compile the entire site without deployment. The standard full-project test workflow has independently reported failures in existing areas.

## Phase 4 review hardening (unapplied)
- Browser screenshot uploads now inspect image signatures as well as MIME labels and sizes. These byte checks do not prove that a file is harmless or redact its content. Authors/administrators must crop or redact screenshots before adding them.
- Screenshot previews auto-hide after 110 seconds and offer a Close preview control, before the 120-second signed URL expiry. Closing a preview **cannot revoke** a signed URL already created.
- Audit event proposals record changed field names, not duplicate old issue text.
- Storage policies constrain screenshot paths to saved issue UUID folders. The proposed SQL explicitly avoids direct writes to storage.buckets.
- The Catalogue tab has an optional two-entry metadata comparison for rights, hosting, fandom, tags, publication status, expected surfaces and original-source links. It cannot open member draft or chapter text.
- PR-only tests include screenshot-signature checks, static SQL safety assertions, and the two-record comparison model.

## Phase 6 integrity review (draft only)
- The existing private.has_platform_role function requires a matching unsuspended membership; this was verified read-only. No membership was changed or Owner role granted.
- The full repository workflow previously completed with 8 failures (1,488 passing tests). One failure came from the Observatory's screenshot-help wording, which has now been aligned with the site's launch-copy policy. Seven other failures concerned existing reading/navigation/fanfiction test expectations. Recheck the full workflow before any release.
- An unindexed private image upload is a recognized recoverable error, not an approved attachment. The proposed Storage **SELECT** policy now requires a matching indexed evidence record. The client independently verifies the matching evidence ID, issue ID and path before requesting a short preview URL.
- Screenshot upload still precedes metadata indexing, so a failed metadata insert may leave a storage-only orphan. The proposal intentionally provides no client DELETE privileges; a separately approved administrator reconciliation process is needed before enabling evidence uploads. No such cleanup job has been installed.
- The Owner issue register now loads 100 issues at a time, shows when older pages exist, and searches only the loaded records. Insertions during pagination may require a full refresh to avoid offset drift; it is not a complete cross-database search.
- New mocked regression cases cover Owner authorization, invalid image signatures, indexed-versus-unindexed screenshot previews, and upload metadata failure. They do not query or mutate live Supabase data.
- Release review remains human-operated; a passing workflow never automatically approves or deploys anything.
 
## Phase 7 — unified fanfiction metadata discovery (draft code only)
- The unified fanfiction shelf no longer hides public Mature/Explicit **metadata cards** behind an "I am 18+" acknowledgement. Ratings and content notes stay visible; age-restricted chapter access is still enforced independently by each reader route, which was **not** modified.
- The same catalogue now receives Reading Rooms' include/exclude tag IDs and names. Hosted entries match canonical IDs; original-author source links have descriptive tag names and are matched by exact names. An excluded tag takes precedence over an included one.
- The Reading Rooms fanfiction view now also passes relationship include/exclude controls to the shelf. It does not infer a relationship category from character names or sexual orientation.
- Previously excluded Mature/Explicit hosted archive metadata is no longer filtered out of the prepared Reading Rooms collection solely for its rating. Publication status, Supabase visibility and hosted-text rights checks remain the upstream responsibility.
- This is a **front-end/code-path fix**, not proof that all published cards render on every public browser route or that all archive pages have been fetched. The 13-case manual acceptance checklist remains mandatory.
- Review workflow now tests the actual unified catalogue, fandom navigation and hosted-archive integration alongside the Observatory model, without deployment. If the standard project-wide suite still fails on unrelated expectations, triage those separately.

 
## Phase 8 — public catalogue completeness and hosting-rights guard (draft only)
- A permission-pending, draft or unverified archive record must **not** displace a valid original-author link. The hosted display model now carries `archive_display_ready`, calculated from the existing verified-hosting rule. The unified catalogue accepts a hosted archive entry only when this flag is true.
- Public discovery excludes records explicitly marked private, members-only or unpublished, even if they were accidentally included among supplied results. The shared published-work query now includes publication and visibility fields so the catalogue can enforce that distinction. Existing RLS remains the primary protection.
- The Fandom Atlas previously requested only the first 48 published records. It now explicitly offers on-demand older pages, counting *all* fetched records in its offset while displaying only the public fanworks. This avoids falsely treating the first page as the whole collection.
- Fandom-selected results and the general paged catalogue are combined without duplicate cards. The external-author links remain independent and do not require an account.
- The existing fandom-specific public query still has a 100-work cap and tag-link query limit. Loading more general public pages can supplement those results but this change does **not** prove exhaustive results for a large fandom. Do not label the full catalogue verified until the public search/Atlas is manually checked, including total counts and pagination.
- Updated the reader discovery regression to reflect the approved Mature/Explicit *metadata* rule, not the obsolete 18+ acknowledgement switch. Actual restricted chapter access was not modified.

## Phase 9 — selected-fandom pagination and access checks (draft only)
- The prior `getStoriesForFandoms` routine had silent 3,000 tag-association and 100 candidate-work limits. Its new paginated implementation delegates matching to the already deployed `search_published_works_v2` RPC, with a default page of 24 and a visible load-more action. No migration or stored function was changed.
- A multi-fandom **all** query uses the RPC's conjunctive include-tag behavior; **any** queries independently page each selected fandom and de-duplicate the union. Cross-fandom totals are deliberately not asserted as exact because stories may share tags.
- The existing published-search RPC may include members-only works for an authenticated session. Each returned page is therefore independently checked against `works.publication_status='published'` **and** `works.visibility='public'` before any result reaches public Atlas cards.
- The Fandom Directory and Fanfiction view can both load older selected-fandom matches; results are keyed to the active selection to prevent stale responses after changing fandom or match mode.
- Local searches inside the selected fandom are clearly described as searching **loaded stories**. Missing results are not inferred when the search returns incomplete pages or when the owner has not finished manually browsing.
- The original link recommendations remain source-linked, and all age restrictions on chapter text remain unchanged. Unit tests use stubs for server responses; browser acceptance and full-project testing remain separate release gates.

- Fanwork-card links that specify a fandom **name** (rather than a UUID) now resolve an exact accepted directory tag name to an ID, then use the same paged query. Unrecognized names still use the general discovery shelf; they are not falsely reported as having zero matching works.

## Phase 11 — trustworthy empty states and loading controls (draft only)
- The full-project Phase 10 check ultimately passed **1,512 tests across 306 files** and the Vite build. Automated green checks do not establish that a real browser displays every match, so manual acceptance and Owner approval remain mandatory.
- Fandom Atlas no longer declares a selected fandom empty while its indexed query reports more pages. A local search is explicitly a search of *already loaded* stories; an initial page containing only restricted-to-members records must not produce a false missing-work claim.
- The unified fanwork shelf no longer shows a conclusive zero-result message while hosted results are loading or the request has failed. When further pages remain, it says the currently loaded subset has no matching works.
- General/selected-fandom pagination has separate control state. When a fandom is selected, the catalogue's load-more control continues **that fandom's** query instead of switching to unrelated general pages.
- The load-more button reports its busy state and is disabled during the request, including on mobile; Reading Rooms and Fandom Atlas pass their existing busy-state flags through without adding new service calls.
- Expanded UI regression coverage for loading, empty, incomplete, and error states, plus updated manual acceptance instructions to independently check an initial empty public page followed by a page with a valid public match.
- No database writes, Storage bucket or role setup, manuscript reads, merging, publication, Cloudflare deployment, or changes to the minimum age and separate restricted-chapter gates.

## Phase 12 — exact-name fandom link and directory loading states (draft only)
- Confirmed Phase 11's full-project GitHub Actions run was green: **1,516/1,516 tests across 306 files**, plus the complete website compile. This does not replace real browser checks.
- A fanwork's fandom tag links to `/fandoms?section=fanfiction&fandom=<name>`, rather than passing the directory tag UUID. Resolving that name requires fetching the accepted public tag directory. The unified shelf now exposes that pending state instead of appearing conclusively empty while resolution is in progress.
- The exact-name path uses the same server-page loading and error states as manually selected fandom IDs. If a name cannot be resolved to an accepted public fandom tag, a non-judgmental notice explains that hosted placement cannot be verified from the name alone; author-source links remain accessible rather than being incorrectly marked missing.
- A separate Owner acceptance case covers the named link from a story, public visibility of matched works, unresolved names and mobile/desktop navigation. The acceptance case is *unverified* until a real tester runs it. Nothing is saved, approved, published, or deployed by the checklist.

## Phase 13 — safe fandom alias links (draft only)
- Confirmed Phase 12 full-project test/build checks succeeded: 1,517 tests across 306 files; this is automated coverage, not a real-browser approval.
- A linked fanwork's fandom tag may use a registered alternate name rather than the canonical fandom title. Exact-name resolution previously ignored aliases, so a tag link could show only source-linked works despite matching Palace-hosted stories.
- Fandom name routing now uses the directory's existing name normalizer and resolves a public canonical title first; otherwise it accepts **one unique, approved alias**. Alias collisions and unapproved/non-fandom entries **never** guess a fandom or merge different canons. A matching unique alias is displayed and filtered under its canonical fandom title.
- Kept the author-source versus hosted distinction and all age-gated chapter rules unchanged. Alias matching preserves Unicode letters (including Chinese, Japanese and Korean fandom titles) rather than stripping non-Latin names. Expanded review-only tests and the Owner acceptance checklist for canonical priority, punctuation/case, multilingual names, unique aliases, ambiguous aliases, unapproved labels and unknown names.
- No database changes, role grants, network writes to member content, merge, publication or deployment. Browser tests for live examples remain unverified.
 
## Phase 14 — script-safe fandom title matching (draft only)
- Confirmed the Phase 13 full-project GitHub run completed successfully: **1,518 tests in 306 files**, plus a full website build.
- The exact-name/alias link matcher previously discarded **all Unicode combining marks**. For Japanese kana this could wrongly collapse a voiced character (e.g. カ vs ガ), making two distinct fandom titles resolve to the same canonical tag. This is a correctness risk when following fanwork tag links.
- Alias matching now removes accent marks only when attached to Latin letters. Combining marks in Japanese and other scripts remain significant. Existing Latin diacritic tolerance (e.g. Pokémon/Pokemon), punctuation handling, and canonical-first alias ambiguity guards are preserved.
- Added explicit test cases for voiced/unvoiced Japanese names, decomposed kana, Latin accents, ambiguous aliases and separate canons. This changes only local read-only navigation, not member tags or stored fandom metadata.
- This correction remains unverified by a human in real browser sessions. It must not be interpreted as approval to publish, merge, deploy or modify the database/role/storage configuration.

## Phase 15 — complete fandom directory and multilingual search (draft only)
- Confirmed Phase 14's full-project GitHub workflow passed **1,518 tests in 306 files**, plus a successful website build. This is automated validation, not a release or browser acceptance.
- The fandom directory previously loaded only up to **1,500 accepted fandom tags**, and fetched curated alias/media metadata with a single capped `.limit(1500)` call. Those fixed cutoffs could silently hide registered fandoms and strip accepted aliases from the browsing model as the community grows.
- Added a small, read-only page scanner for both approved fandom tags and their optional curated metadata using stable ordered ranges of 250. Complete pages are followed by an additional check, duplicate IDs and invalid/incomplete pages are rejected, and a bounded 20,000-record safety ceiling raises an error rather than returning a false complete directory. Missing optional metadata tables may fall back to the built-in catalogue; unexpected errors fail visibly instead of dropping aliases.
- Directory free-text lookup now uses the same Unicode-aware name normalizer as the exact-name fandom links, preserving distinct Japanese voiced kana while supporting Chinese, Korean and Latin-alias searches.
- Added regression fixtures for more than 1,500 fandoms, metadata pagination, exact-boundary completion, overlapping IDs, unexpected backend failures, non-Latin text search and Latin diacritics.
- This is review-only application code and tests. No live schema, tag assignments, member works, role permissions, storage, deployment or production DNS were changed.
