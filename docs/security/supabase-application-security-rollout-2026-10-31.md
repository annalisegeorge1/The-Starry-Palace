# The Starry Palace — application security release decision (31 October 2026)

**Status:** technical review, no production implementation. **Scope:** GitHub source, metadata-only Supabase SQL inspection, official Supabase security/advisor docs. No member records, manuscripts, files, passwords or session tokens inspected.

## The distinction between platform safety and Palace safety

Supabase states it is SOC 2 Type 2 compliant, ISO 27001 certified, and encrypts stored customer data and traffic in transit. Its HIPAA-related guarantees are conditional on a BAA and customer obligations and **must not** be asserted for The Starry Palace's Free project. Provider security does not certify our application: RLS, function grants, private-file permissions, frontend secrets, application logic, logging, backups, and authenticated account testing remain our responsibility.

Official references:
- https://supabase.com/security
- https://supabase.com/docs/guides/database/secure-data
- https://supabase.com/docs/guides/api/securing-your-api
- https://supabase.com/docs/guides/database/postgres/row-level-security

## Verified production *configuration* (read-only)

- The React/Vite frontend initializes `@supabase/supabase-js` with a `VITE_SUPABASE_PUBLISHABLE_KEY` and URL, not a service-role key. This is the supported client architecture **when access policies are correct**. The check is limited to inspected source: it does not prove a secret was never leaked elsewhere.
- The checked publicly reachable `public`/storage relations do not have an obvious RLS-disabled table with SELECT granted to `anon` or `authenticated`. The manuscript, chapters, and chat-photo storage access rules are present.
- `public.treasury_catalogue_meta` is defined with `security_invoker=true`, which is preferable to a view that implicitly runs with its owner's access.
- Privileged platform access in `private.has_platform_role` uses the protected `public.platform_memberships` table. The table has only an own-row SELECT policy for signed-in members, no member UPDATE policy. We did not find evidence that a regular user can write their platform moderator role through the ordinary table API.
- User-editable profile `roles` are **not** the same as privileged `platform_memberships.platform_role`; avoid treating user profile fields as trusted administrative authorization.
- Read-only advisor counts: **69** RLS-enabled tables with no direct policies (generally deny direct access; examine intended RPC access), **11** anonymous-callable SECURITY DEFINER functions, **147** signed-in-callable SECURITY DEFINER functions (each requires least-privilege review), and **1** leaked-password-protection warning.
- Very broad *table/column grants* exist, including UPDATE privileges on many columns for `anon`/members, but RLS normally remains the enforcement barrier. Broad grants alone are not a demonstrated access breach. Reduce them carefully only after checking the complete frontend and RPC callers.

## Newly identified high-priority collaboration invitation issue

Current live policy `collaborators respond to invitation` permits UPDATE where the collaborator's `user_id` matches `auth.uid()`, including role/scope fields rather than just an invitation response. There is no live trigger on `public.work_collaborators` limiting field mutations. That means a recipient could potentially promote themselves from the invited `editor` role to `co_writer` or redirect the invitation to another work through a direct API request. Because collaborator permissions feed draft chapter access, this must be treated as **priority**. No real accounts or data were used to attempt exploitation.

Staged proposed fix: `database/PROPOSED-guard-work-collaboration-role-escalation-2026-10-31.sql`. It installs an insert/update guard requiring immutable work/member identity and owner-defined role. An invitee can only accept/decline while their invitation is still pending; owner-side reinvitations preserve existing app workflows and do not constitute the recipient accepting on their behalf. The role guard is designed to preserve `src/palaceData.js`'s `inviteWorkCollaborator` and `respondWorkCollaboration` calls unchanged.

Synthetic tests: `tests/security-db/fixture-collaboration-schema.sql` and `tests/security-db/fixture-collaboration-assertions.sql`, integrated into PR #174's ephemeral PostgreSQL CI. These check self-promotion, invite redirection, owner acceptance without consent, valid recipient acceptance, immutable invitation fields and permitted re-invitation. This is not a live regression test.

## What's already staged in draft PR #174

1. Advisory anti-AI-training crawler instructions while allowing legitimate site indexing.
2. Seven existing **unapplied** SQL candidate files covering private reactions, bookmark and engagement age limits, Grand Palace identity visibility, unpublished lore, and tag discovery privacy.
3. An additional **unapplied** collaboration invitation consent and role-escalation guard.
4. Authenticated session-based private chat-photo download with temporary browser Blob URL instead of storing a reusable one-hour signed Storage link in image markup.
5. Disposable PostgreSQL + PostgREST tests with invented users and data, including 42 HTTP/JWT test cases, role/RLS and storage object metadata checks, and focused React photo tests.

## When we can implement — release waves, not a big-bang deployment

**Release gate A: low-risk client/SEO protection.** Review and test actual `robots.txt` search indexing; private chat image preview on mobile/desktop using synthetic chat media in a proper Supabase test environment. Only then merge this subset and verify on the custom production domain. The `robots.txt` request alone cannot stop malicious scraping.

**Release gate B: urgent permission hardening.** Test the collaboration guard first in an isolated Supabase backend with real synthetic tokens and the existing database schema. Confirm author invitations, acceptance/decline, editor and co-writer chapter permissions, and other members' inability to edit. Back up the original function/trigger definitions. Apply the one approved change in production, monitor and keep rollback ready.

**Release gate C: remaining protected data functions.** Apply the other seven candidate SQL files individually after staging tests of each role/rating and UI flow. Benchmark tag-search query speed before enabling audience-aware aggregates.

**Release gate D: infrastructure and account controls.** After verifying Google/Bing discovery, enable Cloudflare's AI-training crawler block and inspect challenge behavior. Audit administrator MFA, Auth password protections, managed Storage signed URL/download, account deletion/export, and database backup/export guarantees. Some options may depend on plan eligibility and may incur charges — obtain approval before enabling paid services or creating new hosted projects.

Every wave must pass CI, isolated account-level security checks, and production smoke tests with rollback. **No estimated date or final release promise is justified until the isolated Supabase Auth/Storage environment is verified.** The owner has requested implementation, but this document does not authorize live SQL, deployment, service charges, or provider configuration changes. Separate go/no-go decisions will be recorded before rollout.

### Platform promises
The Palace's commitment not to submit member work, private messages or other member data to AI models must be implemented in its own processes and integrations, not conflated with preventing every third-party scraper. Published writing remains visible and technically copyable by human readers. Never claim end-to-end encryption, instantaneous revocation of all downloaded/signed assets, or guaranteed immunity from hackers.
