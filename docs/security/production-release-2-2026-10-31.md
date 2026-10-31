# Production security release 2 — Grand Palace discoverability

**Deployed 31 October 2026.** Project `sservftxygunkacmwsad`; Supabase migration `respect_grand_palace_profile_discovery_privacy`.

## Purpose and scope

The previous `public.get_grand_palace_identity(uuid)` function used `(p.visibility <> 'hidden' OR p.id = auth.uid())`, which could return private Grand Palace identity/profile data without honoring the member's separate discovery preference or profile blocking rules.

The applied function is exactly the reviewed `database/PROPOSED-guard-grand-palace-identity-discovery-2026-10-31.sql`. It substitutes `private.viewer_can_discover_profile(p.id)`, the existing production helper that enforces profile visibility, discovery visibility, and blocked relationships. The signature, output JSON fields, `anon`/authenticated EXECUTE rights, and other site behavior were preserved.

## Verification and rollback

- Production function definition checked after deployment: uses `private.viewer_can_discover_profile(p.id)`.
- Both `anon` and `authenticated` keep EXECUTE rights.
- `SET LOCAL ROLE anon` verified an invented, unknown member UUID returns `null`.
- Production currently has 13 Grand Palace membership rows; existing member identifiers, profiles or private data were not read.
- Disposable database fixture and real signed-JWT HTTP synthetic checks tested the intended behavior before this production release.

**Rollback:** restore the preceding `get_grand_palace_identity(uuid)` definition from the original production schema, preserving function signature/return and grants. This is a privacy regression and should only be considered if the new helper causes an unexpected outage, after evaluating fix-forward. No DML, storage, auth config, DNS or frontend deployment was performed.

**Outstanding:** browser-level owner/non-owner/blocked-member regression tests, signed-in production-equivalent tests without using real member data; rollback rehearsal and protection of backups. The remaining **six** other privacy/age SQL proposals stay unmerged and unapplied to production. No paid services were enabled.
