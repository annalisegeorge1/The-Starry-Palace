# The Palace Observatory — Phase 2: public placement verification

**Review branch only; do not merge or deploy without explicit owner approval.**

## Added on November 3, 2026
- A \`Verification\` tab with an explicit **Run anonymous visibility checks** button. It performs no writes.
- A separate **sessionless, nonpersisting** Supabase client using only the existing browser publishable key. It cannot use the current Owner session to inflate guest-visibility results.
- Expected public-work records come from a freshly re-authorized Owner metadata read.
- Actual observations are made from guest-visible \`works\` and \`archive_records\` metadata plus the existing \`search_published_works_v2\` function used by Reading Rooms.
- For each published public member fanwork, the checks compare guest listing, unfiltered reading search and fanfiction-origin reading search. Eligible hosted fanfiction archive metadata is separately checked for guest visibility.
- Up to eight **real published public fanworks** get title, accepted fandom-tag inclusion, two required tags, exclude-overrides-include and (where applicable) Mature/Explicit rating-search tests. Scenarios query real data and real canonical IDs. An error or truncated response is **not** reported as "missing."
- The existing \`UnifiedFanworkCatalogue\` filter is also compared in memory with the intended tagged discovery rule. This identifies likely Mature/Explicit suppression without reading chapters or bypassing age restrictions.
- Results can be filtered to mismatches, passing checks or all checks. These are ephemeral findings; no persistent issue, screenshot, action, or release record is created yet.

## Existing backend findings (read-only production project queries)
The query execution context had no signed-in user identity for these checks. The SQL execution connection itself is privileged; therefore these **do not substitute** for a true browser guest/RLS acceptance test:

| Check | Result |
| --- | --- |
| Published public member fanworks expected | 6 |
| Returned by \`search_published_works_v2\` with origin=fandom | 6 |
| General / Mature / Explicit returned | 3 / 2 / 1 |
| Matching works returned when a fandom AND relationship tag are included | 6 of 6 |
| Matching works incorrectly returned with its fandom tag both included and excluded | 0 of 6 |

This suggests the existing search RPC handles those tag scenarios, while the default unified fanfiction filter hides Mature/Explicit entries. **Do not remove chapter access controls.** For external author-source links, destination age and permission handling requires separate review.

## Non-goals and blockers
- Global Search uses a different discovery function; this first guest check verifies the Reading Rooms backend, not the global Search UI.
- The Fandom Atlas also has its own selected-fandom and client-side routes. Those routes, public card rendering and chapter gates still need independent browser checks.
- Direct mobile/tablet/desktop and accessibility tests require an approved preview, supported devices, and screenshots. No browser tests are claimed here.
- Membership configuration presently has no Owner role assignment; the Observatory stays inaccessible until independently authorized owner provisioning.
- No AI service or training endpoint receives member content. Neither SQL nor the verification client reads chapter bodies.
- The current GitHub test-and-build workflow has pre-existing failures in existing fanfiction/navigation assertions, and the full branch build must pass before release. The new pure Phase 2 verification-model checks passed in lightweight evaluation; the GitHub pipeline must independently verify them.
- No production data, code on \`main\`, user roles, DNS, Cloudflare deployment, or published work status was changed.

## Review checklist
1. Confirm the assigned Owner account identity separately; do not guess or automatically elevate a member.
2. Verify RLS behavior using a truly signed-out test browser; compare against the Observatory's anonymous client results.
3. Confirm every public fanwork's fandom and relationship tags lead to its card on the live UI, including filtered navigation and deep links.
4. Verify Mature/Explicit **metadata** discovery with a selected tag, then separately check that restricted chapter text stays age-gated.
5. Compare preview on small Android, tablet and desktop widths; document screenshots and reproduction steps.
6. Review all proposed fixes in a later PR; do not automatically publish, merge or deploy.
