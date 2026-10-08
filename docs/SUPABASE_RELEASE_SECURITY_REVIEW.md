# The Starry Palace — Supabase release security review

**Read-only inspection:** 8 October 2026 (UTC). Based on the connected project's Supabase table inventory and Database Advisors. No member records, draft text, private messages, vote content or credentials were retrieved or changed.

This is a **triage record**, not a penetration test, user-data audit, or certification that the Palace is secure. Supabase advisors flag architectural patterns that need human review; a warning alone is **not proof** of unauthorized access.

## What we verified

- **189/189 public tables had row-level security (RLS) enabled.** Enabling RLS alone does not prove every policy, RPC and storage bucket is correct.
- **66 tables had RLS enabled but no direct RLS policies** (advisor info). That commonly means REST reads/writes are denied by default. Some may be intentionally reachable only through constrained `SECURITY DEFINER` RPC functions; others may explain empty or broken member features. Do **not** add a blanket `USING (true)` policy.
- **8 privileged (`SECURITY DEFINER`) functions were executable by anonymous clients** (advisor warn): `get_grand_palace_identity`, `get_palace_praise_state`, `get_relay_balcony`, `get_tag_family_counts`, `get_work_lore`, `record_palace_share`, `search_palace_tags`, and `search_palace_tags_v2`.
- **130 privileged functions were executable by signed-in clients** (advisor warn). Many Palace operations deliberately use such functions for voting, rewards and memberships. They require per-function authorization review, not blanket revocation.
- **Leaked-password protection** appeared as an Auth security warning (one finding). Review whether it is available and enabled under Supabase Auth password security settings.
- Performance notices: **104 unindexed foreign-key findings**, **1 Auth/RLS initplan warning**, and **122 potentially unused indexes**. These are optimization candidates—not by themselves evidence of an outage or security compromise.

## Targeted review of anonymous functions

These eight function names and their SQL definitions were inspected without reading table contents.

- **Confirmed policy mismatch in `get_work_lore` (requires fix):** The ordinary `works` SELECT policy allows non-owners to read a published work marked `members` only when `auth.uid()` is present. The earlier `SECURITY DEFINER` lore RPC admitted both `public` and `members` visibility without checking whether a non-owner was signed in. An anonymous caller who knew a members-only published work's UUID could potentially read its non-private lore despite the work's member-only restriction. This was established from policy/function definitions—not from any user work. The minimal replacement in [`database/guard-member-only-lore-rpc.sql`](../database/guard-member-only-lore-rpc.sql) requires a signed-in caller for members-only works while preserving owner and public access. **Verify that migration was actually applied before calling this resolved.**
- `record_palace_share` checks for a signed-in caller and a published work before granting participation points. Although executable by the anonymous database role, its implementation raises on a missing authenticated user ID; consider reducing unnecessary role grants **only after** an RPC regression test.
- `get_grand_palace_identity` checks profile visibility and whether the caller is the member.
- `get_relay_balcony` checks whether a room permits audience access or the current user is a permitted host/member.
- `get_tag_family_counts` and `search_palace_tags` / `search_palace_tags_v2` expose catalog information, apparently for public tag discovery.
- `get_palace_praise_state` returns aggregate reactions and the signed-in caller's own reaction, apparently by design.

These are **code observations**, not adversarial verification of every parameter, role grant, or nested function.

## Release review order

1. **Protect unpublished work and account data.** In a controlled test setup, sign in as two unrelated accounts and verify one cannot obtain the other's drafts, unpublished chapters, writing notes, private messages, account export, or private Council matters through either table APIs or RPCs. Check storage bucket policies separately.
2. **Review privileged RPC grants.** For each anonymous and authenticated `SECURITY DEFINER` function, document the intended audience, owner role, `auth.uid()`/authorization logic, parameter constraints and return fields. Only revoke, move or change functions after confirming which frontend routes invoke them. Avoid blanket `REVOKE`/alterations that break essential features.
3. **Classify the 66 no-policy tables.** Mark each as *RPC-only intentionally*, *needs direct owner-scoped policy*, *server-only*, or *unused*. Prioritize active features such as Grand Palaces, Council, manuscript folders and Chamber palettes. A table without policies can be **inaccessible**, not public; query the exact client workflow before changing it.
4. **Check Auth and password protections.** Review login redirects on both Render and any Pages preview, magic-link behavior, session persistence, password strength and whether leaked-password protection can be enabled. Never put secret/service-role keys in Vite environment variables.
5. **Test the Council and Celestial economy.** Use disposable accounts to verify one vote per permitted member where configured, points and gift constraints, idempotency, rate/cap limits, and no self-granted titles or staff roles.
6. **Defer general index cleanup until behavior and data safety are stable.** The database is still small and many tables are empty; indexing or deleting indexes from an advisor count alone is premature. Recheck advisors before the public launch.

## Actions taken

**Read-only audit and a narrowly scoped SQL correction prepared in GitHub.** Before marking this closed, verify the migration status against the live function definition. No member records, manuscripts, private messages, vote content or passwords were queried.

## Advisor references

- [RLS enabled with no policies](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)
- [Anonymous clients can execute a privileged function](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable)
- [Authenticated clients can execute a privileged function](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable)
- [Password strength and leaked-password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)
- [Unindexed foreign keys](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys)
- [Auth/RLS initialization planning](https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan)

The release is **not** security-approved merely because all public tables have RLS enabled or because GitHub unit tests pass. Repeat the audit after actual permissions changes and test from the same client identities real members use.
