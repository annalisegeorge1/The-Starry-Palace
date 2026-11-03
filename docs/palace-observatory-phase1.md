# The Palace Observatory — Phase 1 review notes

Status: **development branch only**, November 3, 2026. No production release or database migration.

## Scope and sources
- Private route: \`/admin/observatory\`, lazy-loaded and not linked from public navigation.
- Access: signed-in \`platform_memberships.platform_role = 'owner'\` and \`suspended = false\`. Checked before each refresh. Supabase RLS is still authoritative; a frontend guard alone is not security.
- Data: existing \`works\` (published and publicly visible metadata only), \`archive_records\`, \`archive_rights_records\`, \`archive_texts\` (only record ID, word count and original-source URL), plus the existing code-defined \`MODERN_FANFICTION_LINKS\`.
- Does **not** fetch chapter bodies, archive manuscript bodies, private member works, profile contact information, or personal data.
- No duplicate database catalogue or second publishing pathway. Existing records remain the source of truth.
- Checks include missing accepted fandom tags on published fanworks, relationship-classification review, suspected cross-source duplicate metadata, missing hosted-text metadata and missing active, verified hosting grants.
- Source-linked fanfiction remains explicitly distinct from hosted text. A "licensed" label does not prove permission to republish; human evidence review remains required.
- The catalogue's "expected" locations are predictions. A candidate finding is **not** proof of a live navigation, search or visibility failure.

## Important current blocker
At the time of the read-only inspection on November 3, 2026, all 13 \`platform_memberships\` rows had \`platform_role = member\`, \`council_enabled = false\`, and \`suspended = false\`. No account has the Owner role required for the Observatory. Consequently the new UI will deny access until explicit, independently authorized owner-role provisioning. **No permission or account change has been made.**

## Release protection
- No DB writes, data imports, merges, deployments, Cloudflare changes or member-content publication.
- The "Release review" view is non-operational and clearly says no releases are pending.
- The feature-branch commit does not trigger the existing GitHub deployment workflows, which are restricted to \`main\`; review PR checks may run tests/build only.

## Known Phase 1 limitations
- Linked recommendations are presently defined in existing site code rather than being fetched live from GitHub at runtime. Future GitHub integration must use least-privilege server credentials, never expose tokens to the browser.
- The browser route cannot directly prove whether a work appears in public search/fanfiction/tag/profile pages. Phase 2 needs independent route queries and guest/member test cases, including explicit/mature metadata discovery with chapter access controls preserved.
- Findings are computed in memory; there is no persistent issue tracker, screenshot collection, test device/browser metadata, audit history or approval system yet.
- Only the Owner role is allowed. Council membership is not treated as ownership.
- No full deployment or browser acceptance test has yet run. Review RLS and run tests on an isolated preview before considering any release.

## Recommended acceptance checks for Phase 2
1. A guest sees the intended public catalogue results, an owner sees private intake metadata, and an ordinary member cannot open the Observatory.
2. Each published eligible fanwork is returned by its fandom, relationship, included-tag and excluded-tag searches. Exclusion takes precedence over inclusion.
3. Mature and Explicit metadata are discoverable by selected matching tags as intended while chapter-content gates remain enforced for minors.
4. Filter, reader and search results match on Android mobile, tablet and desktop, including direct deep links.
5. Missing, unpublished, linked-only, no-rights and no-hosted-text works are distinguished correctly; there must be no false "missing work" claim caused by an unpublished draft.
6. Proposed corrections remain pending until explicit approval, and implementation and recheck are separately recorded.
