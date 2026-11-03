# The Palace Observatory — Manual Acceptance Protocol

**DRAFT / REVIEW ONLY.** No automated publishing, merging, role assignment, database activation, or deployment is authorized.

## Purpose

Verify public fanfiction, fandom, Reading Rooms, Global Search, tag and reader surfaces while preserving the unified browsing experience. A passing SQL search does not prove a page rendered. A code-level candidate finding is not a confirmed live bug.

Minimum membership age is 13. Mature and Explicit work metadata should appear when its tags match and the user has not excluded it, but access to restricted chapter text must remain age-gated. Relationship identities are not themselves mature-content ratings. Do not access private member drafts or use manuscript text or images with AI services.

## Capture test context

Before each test, record date, environment (preview or live), public URL, logged-in state, browser, OS and viewport width. Use public titles and public metadata only. Test small Android (320–390px), tablet and desktop sizes. Do not create a child account or impersonate members to test reader access; use authorized compliance test profiles only.

## Thirteen acceptance cases

1. Signed-out Reading Rooms Fanfiction: public hosted and author-source-linked entries share the catalogue, with accurate link versus hosting labels.
2. Fandom Atlas Fanfiction: real selected fandoms find their related public hosted and source-linked works; clearing filters restores the default view.
3. Include two accepted tags (a fandom and a relationship category); confirm the expected public work IDs.
4. Exclude a selected tag and confirm matching works disappear while unaffected works remain.
5. Search by title and accepted tag on Global Search as well as Reading Rooms. Check both independently.
6. Confirm discoverability of published Mature and Explicit metadata for matching tags without granting chapter access.
7. Confirm restricted chapter content remains unavailable to unauthorized or underage readers under the site's age policy.
8. Confirm licensed intake marked permission-pending is not shown as an approved hosted text and author-source links are not silently mirrored.
9. Confirm private and unpublished member works do not appear in public search results.
10. Confirm visitors and non-Owners cannot access the Observatory route or private issues. Do not grant roles for this test without prior authorization.
11. When separately approved on isolated staging, test Owner-only RLS, immutable issue history, stale-update rejection, private screenshot access and temporary signed URL expiry.
12. Check Android for header transparency, bottom-bar overlap, popover collisions, filter controls, focus order and horizontal scrolling bugs.
13. On tablet/desktop, repeat the same queries and compare results, ratings, tags and controls; ensure keyboard access.

## Evidence handling

Mark each case Not verified, Pass, Mismatch, or Blocked. Never infer Pass from an automated model or SQL query alone. Record exact steps, expected outcome and actual observation. Use only redacted/cropped screenshots of content you have permission to retain; do not capture unpublished works, DMs or member information. A saved issue requires a real observation, not a placeholder such as "Not independently tested."

The proposed Issue Register is Owner-only and requires explicit setup approval. A status of Fixed does not mean released. A status of Rechecked requires fresh verification in the relevant environment. Neither status initiates deployment.

## Release gates

Privacy, age-gate, permissions, and public discovery cases must be independently reviewed. Critical mismatches require a documented disposition. The isolated Observatory tests and full website compilation must pass. Full-repository test failures must be triaged rather than silently ignored.

The owner retains every decision on database schema activation, Storage bucket creation, role assignment, GitHub merge and Cloudflare publication.
