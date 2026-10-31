# The Starry Palace — synthetic-identity security acceptance plan

**Date:** 31 October 2026 · **Status:** REVIEW ONLY, not a live test or certification.

## Environment requirement
Run only against an isolated disposable Supabase staging project or approved development branch. The connected production project currently has no database branch; **do not** run data-seeding, SQL replacements, identity impersonation or destructive tests against production. Creating a Supabase branch may carry additional charges and requires owner approval. Do not use actual member manuscripts, messages, profiles, images, credentials or IDs in fixtures.

Use the actual Supabase client sign-in flow for distinct synthetic users rather than simulating privileged access with the service-role key. Inspect responses with each user's own JWT, and test a signed-out client separately. Stage one proposed SQL replacement at a time, save the original definition for rollback, and compare before/after.

## Synthetic identities
- **Owner (O):** age 18+, owner of private, public and members-only test works; has a hidden/discovery-private profile and Grand Palace membership.
- **Unrelated reader (R):** age 18+, neither collaborator nor blocked; a separate Grand Palace profile.
- **Younger member (Y):** age 13–15, with self-declared age gate. Use synthetic identity; never register a real child for testing.
- **Accepted collaborator (C):** age 18+, explicitly authorized on a test work as editor/co-writer.
- **Blocked viewer (B):** age 18+, blocked by O.
- **Guest (G):** a fresh signed-out browser/public client.

## Checks to run after installing the candidate SQL in staging

| Test | Identity | Expected result |
| --- | --- | --- |
| Public published 12+ work + chapter: retrieve | G, Y, R | Readable |
| Members-only published work | G | Not readable or discoverable |
| Members-only published work | R | Readable only if age-eligible |
| Published 18+ work | G, Y | Not readable, no reaction or bookmark counts |
| Published 18+ work | O, R | Accessible under applicable age and role |
| Hidden/draft work and its unpublished chapter | G, R | No content, no reaction counts, no bookmark-count row |
| Hidden/draft work and its unpublished chapter | O | Author access preserved |
| Hidden/draft work | C | Access only within assigned collaborator permissions |
| Public praise counts | G, R | Correct aggregates for readable content |
| Private praise counts | G, R, Y | Neutral zeros; no existence signal |
| Guest bookmark counts for published public 12+ work | G | Correct nonnegative count |
| Under-age bookmark counts for published 18+ work | Y | No returned row |
| Empty/too-large bookmark count request | G, R | No rows outside 1–100 IDs |
| Public Grand Palace profile with everyone discovery | G, R | Identity summary appears |
| Members-only Grand Palace profile | G | No identity summary |
| Members-only profile with members discovery | R | Identity summary appears |
| Discovery-private Grand Palace profile | R, G | No identity summary |
| Profile owner with hidden/discovery-private settings | O | Own identity summary appears |
| Blocked viewer of otherwise public profile | B | No identity summary |
| Public lore linked to unpublished unlock chapter | G, R | No unpublished chapter ID/title |
| Author's lore linked to unpublished unlock chapter | O | Author sees draft chapter ID/title |
| Lore after-chapter reveal linked to a draft chapter | G, R | Locked until eligible published chapter progress |
| Unknown work/chapter/profile IDs | G, R | Empty/neutral result |
| Other user's private chat and original artwork | G, R | Denied at table, RPC and storage layers |
| Own export and writing restore | O | Complete and accurate; no other user records |

## Before-merge release gates
1. Capture regression results for API calls **and** browser use (desktop/mobile, both themes). Guard legitimate public reading, creator studio access, chapter editing, Grand Palace profile cards, and reaction counts.
2. Run provider security advisors after staged SQL changes. Investigate grants/definer warnings individually; do not revoke every `EXECUTE` permission globally.
3. Verify that source-level tests pass. They protect intended SQL text only and are **not** a substitute for this role matrix.
4. Verify a trustworthy backup/rollback of the original function definitions and a simple reversal procedure.
5. Review Cloudflare AI crawler mitigation separately. The proposed `robots.txt` is advisory, not a security boundary. Keep ordinary Google/Bing indexing for discoverable, publicly published works.
6. Review the broader metadata exposure of public tag usage counts, public Palace news, and sharing/reaction point awards before describing the audit as exhaustive.

**Approval boundary:** The owner must explicitly approve a rollout after staged test results are reviewed. Until then, no merge to `main`, no Cloudflare policy changes, no Supabase Auth change and no production SQL deployment.

## Expanded tests for proposed reward and tag adjustments

Test these only with synthetic works, tags, comic metadata, controlled date-of-birth settings, and two distinct signed-in JWTs plus an anonymous client.

| Feature | Scenario | Expected result |
| --- | --- | --- |
| Praise award | Age-13 account sends heart/star/moon/crown to known 18+ public work ID | Reject; no new praise, point ledger entry, or balance change |
| Praise award | Age-13 account sends praise to known 18+ chapter ID | Reject; no new praise or point ledger entry |
| Praise award | Eligible adult sends praise to published 18+ content | Original amounts, caps and idempotency still apply |
| Sharing | Age-13 account calls share RPC with known 18+ work ID | Reject; neither giver nor creator gets points |
| Sharing | Eligible adult shares public work | Existing weekly idempotency and daily cap preserved |
| Tag discovery | Guest searches a tag present only on draft/hidden work/comic | `usage_count=0` in legacy and v2 search; family `used_count` not raised |
| Tag discovery | Guest searches public published 18+ content | No age-ineligible usage counted |
| Tag discovery | Adult searches published public/members age-eligible content | Correct totals for accessible works and comics |
| Tag discovery | A tag belongs to both private draft and public published story | Only published audience-eligible link contributes to visible count |
| Performance | Representative synthetic tag catalogue | Public tag search remains responsive at guest and signed-in scale |
| Regression | All proposed RPCs | Same signatures, JSON keys, normal public reading, and error contracts |

### Additional release checks

- Run the tests from the actual PostgREST API with the service role **only** for setting up synthetic fixtures; never treat service-role results as proof of end-user permissions.
- Observe both old and new results for public/members/18+ variants before staging SQL replacements.
- Validate source-contract tests and a full build, then perform staging API and browser checks independently.
- Archive a copy of the **function definitions**, not user data, to allow precise rollback.
- Measure crawler policies on public discovery and avoid blocking legitimate readers or mainstream search indexing.
