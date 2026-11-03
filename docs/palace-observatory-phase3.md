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

