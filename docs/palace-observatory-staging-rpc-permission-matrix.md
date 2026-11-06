# Palace Observatory — privileged RPC permission review (read-only evidence)

**Review date:** 2026-11-04 (Trinidad and Tobago). **Draft PR #242 only.**
**No SQL, grants, policies, Auth records, real works, or deployments were changed.**

## Scope and verified evidence

- Inspected PostgreSQL catalog metadata and function definitions in the **independent Security Staging** project `ysbntuyyprnhptlxxsng`, without calling any of the six RPCs or reading any members' records.
- Supabase's staging security advisor currently reports **six anonymous-callable** `SECURITY DEFINER` functions, the same six authenticated-callable functions, and **10 RLS-enabled-without-policy** notices across public and private fixture tables. These are overlapping warnings, not twelve distinct functions.
- For three tag RPCs, a production **function-metadata-only** comparison in `sservftxygunkacmwsad` confirmed that they also use `SECURITY DEFINER`, are anonymously callable, and check publication, visibility and reader age. No production story rows or members were read.
- `SECURITY DEFINER` runs with the owner's rights and can bypass table RLS; explicit predicates and minimal EXECUTE grants must be reviewed independently. A sign-in check **inside** a function does not eliminate the exposed execution-permission warning.

## Function-by-function review

| Existing public function | Anonymous EXECUTE | Observed staging behavior from source | Review requirement |
| --- | --- | --- | --- |
| `get_palace_praise_state(text,uuid)` | Granted | Reads counts/my-praise only after owner/collaborator or published visibility/age checks; returns a neutral response for ineligible targets | Synthetic guest, member, underage, private-draft and inaccessible-target tests; verify count disclosures |
| `get_tag_family_counts()` | Granted | Counts public taxonomy and used published work/comic tags, with visibility **and age** checks | Verify that guest tag counts do not falsely imply Mature/Explicit published metadata is absent |
| `search_palace_tags(text,text,int)` | Granted | Searches canonical/community tag names; computed usage count includes only published visible **age-eligible** works/comics | Guest/search/tag-count parity test across General, Mature and Explicit metadata; guard wildcard/large-query performance |
| `search_palace_tags_v2(text,text,int)` | Granted | Similar to the previous search but adds relevance/fuzzy matching; counts also include an age predicate | Same rating/visibility tests, alias/multilingual and performance cases |
| `give_palace_praise(text,uuid,text)` | Granted | Mutates praise/points, but raises if `auth.uid()` is null before its write path | Prefer removing anonymous EXECUTE *if compatible*, after separate change review; test unsigned denial and no ledger mutation |
| `record_palace_share(uuid)` | Granted | Mutates points after a non-null `auth.uid()` check | Prefer removing anonymous EXECUTE *if compatible*, after separate change review; test unsigned denial and no ledger mutation |

**Interpretation:** This is source inspection, **not an exploit finding** and **not** a passing runtime security test. The two signed-in mutation checks are visible in their staging function bodies. Real signed-out/authenticated behavior has not been exercised through the staging REST API. Do not revoke all guest EXECUTE grants indiscriminately: public search/read functions may intentionally support signed-out discovery.

## Discoverability inconsistency to test before release

The project's desired policy is that **published public Mature and Explicit metadata cards and tags remain discoverable**, even when separate chapter text requires adult verification. All three tag-count/search functions in both inspected environments include an age predicate when calculating usage, which **could** lead a guest to see missing or zero usage for an otherwise valid tag on adult-rated published works. This is a *candidate* discoverability bug, **not proof** that a public card is currently missing. Verify actual result-card inclusion separately; do not conflate tag counts with protected chapter access.

Proposed acceptance cases using wholly invented staging works only:

1. Guest: a tag attached only to a published public Explicit work is searchable, and its metadata card appears when selected, even if the tag usage counter is initially misleading.
2. Guest: no chapter body belonging to an 18+ work is readable.
3. Synthetic 15-year-old: published public adult-rated metadata appears in results, but restricted chapter text is denied.
4. Guest and member: private/unpublished or members-only records do not leak through tag counts, titles, source links or search RPC results beyond their visibility settings.
5. Anonymous calls to the two mutation RPCs fail with no change in reward ledger; authenticated eligible tests follow the existing limits.
6. Fandom names and relationship tags work through independent include/exclude and public/source-linked filters, on mobile and desktop.

Record expected outcome, observed outcome, person and date, evidence link, and exact project ID. Do not insert real fanfiction, member accounts, private drafts, author screenshots or copyrighted chapter text to create the test fixtures.

## Approval and remediation boundary

- **Now:** no permissions or SQL changed. Observatory findings should be listed as **unverified** until actual REST/RLS acceptance tests.
- **Before a public staging preview:** verify a real restorable staging-only backup; approve staging-compatible schema/functions/fixture accounts separately; run public RPC and `anon`/`authenticated` permission tests; rerun security advisors.
- **Prepared, not installed:** `database/palace-observatory-stage-mutation-rpc-grants-PROPOSAL.sql` proposes removing both `PUBLIC` and `anon` EXECUTE from only the two mutation RPCs, while preserving the existing authenticated grants and leaving all four guest-readable search/count/praise-state RPCs alone. It has a staging sentinel, signature/baseline checks and a replay guard, with synthetic PostgreSQL 16/17 CI permission tests. A separately reviewed `SECURITY INVOKER`-preferred metadata/count correction may be considered if the discoverability issue is independently confirmed. **Real staging and production RPC privileges are unchanged; no installation approval has been given.**

References: [Supabase anon SECURITY DEFINER advisor](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable), [authenticated advisor](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable), [RLS-without-policy advisory](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).
