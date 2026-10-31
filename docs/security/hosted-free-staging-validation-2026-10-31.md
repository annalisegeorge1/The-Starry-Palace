# The Starry Palace — $0 hosted security staging

**Prepared 31 October 2026. Test environment, NOT production.**

Supabase management returned a quote of **$0/month** to create a second project in the existing Free-plan Palace organization. The owner explicitly authorized all necessary free security work. An isolated project, **The Starry Palace - Security Staging**, was created in `ca-central-1`, project ref `ysbntuyyprnhptlxxsng`.

No real member accounts, manuscripts, chat messages, images, secrets, or production table contents were copied.

## Completed

- A **minimal synthetic collaboration schema** was installed in the hosted staging database, with two tables (`works` and `work_collaborators`), appropriate sample RLS policies and narrowly scoped `private` ownership helpers. It is NOT a schema clone of the production Palace.
- Applied the *proposed* collaboration role-guard trigger on staging only; production remains unchanged.
- Hosted Supabase PostgreSQL role tests used distinct synthetic `auth.uid()` claims and `SET LOCAL ROLE authenticated` in rollback-only transactions.
- Verified denial of invitee role self-promotion, work redirection, inviter spoofing and replay of a declined invitation.
- Verified invited user can accept or decline; author may re-invite with a new role, after which the invited user can accept.
- Both hosted test transactions rolled back; no synthetic invitation remains from those test operations.

## Remaining before any production rollout

- Managed Supabase Auth sign-in tokens are **not** yet tested; the SQL tests simulate signed-in PostgreSQL role + `auth.uid()`.
- Managed Storage private-bucket file downloads and signed URLs, including revoked membership, remain untested in this hosted environment.
- Staging currently has only the minimal collaboration schema, not the full application schema, RLS functions, triggers, migrations, network or media settings.
- Rehearse actual browser/API invitation flow and production-equivalent service-role maintenance using invented accounts in isolated staging.
- Review the full proposed SQL including privileged operations and perform rollback test.
- All seven other proposed privacy SQL changes and the private photo client require separate staging validation.
- Review RLS, database advisors and build check results after every subsequent change; no live deploy until separately authorized.

**Cost guardrail:** The initial Supabase project creation quote was $0/month. Do not enable paid add-ons, create chargeable branches, exceed plan quota, or assume cost remains $0 after pricing/usage changes. This project is a test environment and may pause under Free-plan rules.

Source: https://supabase.com/docs/guides/platform/billing-on-supabase

## Hosted private-photo policy test

A separate migration, `tests/security-db/hosted-storage-staging-setup-2026-10-31.sql`, was applied **only to the Free staging project**, creating synthetic room/membership tables, a non-public `palace-security-fixture` Storage bucket (1 MiB image/webp restriction), and narrowly scoped Storage-object read/upload policies. No image bytes were uploaded, and this is a minimal test-specific design rather than a replica of the Palace's complete production chat schema.

A rollback-only hosted PostgreSQL check confirmed that active synthetic conversation members pass the read/upload path helpers, outsiders are excluded, revoked members lose access for subsequent authorization checks, and a direct conversation path cannot masquerade as a group-chat path. The test returned **PASS**. The rolled-back room and membership records are not retained.

Subsequent Supabase security-advisor check returned **two informational RLS-without-policy entries** for the private synthetic tables; these are intentionally inaccessible directly to API clients. The staging bucket is private and has zero objects.

**Still open:** use actual managed Supabase-issued access tokens to verify Storage REST upload/download and signed-link expiry/revocation, not merely SQL role simulation. Real login confirmation and test-only account management must be arranged securely. Keep project billing within the $0 Free plan; do not move staging into production.

## Disposable managed Auth + Storage integration (31 October 2026)

An **additional isolated local test** has now passed, using real Supabase GoTrue authentication and Storage services in Docker — not just emulated SQL roles. This is separate from the $0 hosted staging project, which remains intact and was **not** used for these accounts or files.

- Files: `tests/security-db/local-managed-foundation.sql`, `tests/security-db/local-managed-auth-storage.mjs`, and `.github/workflows/palace-managed-security.yml`.
- Local setup: pinned Supabase CLI **2.122.0**, Docker Postgres, GoTrue, PostgREST, Storage and Mailpit; email confirmation explicitly **enabled**. All credentials were generated locally and no hosted Supabase secrets were supplied to GitHub.
- Test accounts: unique fake `@example.test` addresses, local-only admin-confirmed test users, password-based sign-ins, and a separate unconfirmed signup whose login must fail. Mailpit intercepts confirmation email instead of sending to the internet.
- Private media: a synthetic single-pixel WebP is uploaded to a **private** bucket. An authorized member can download it; unrelated and guest accounts cannot. Other members cannot upload into the sender's folder; unsigned public-bucket URLs cannot fetch the private object.
- Revocation: removing a synthetic member prevents their **subsequent authenticated download and newly created signed URLs**, even while their prior login session still exists.
- **Important expected limitation confirmed by live local Storage testing:** a signed URL issued **before** membership revocation remained accessible until its expiry. A signed URL is a bearer link; neither sign-out nor a member's removal guarantees immediate revocation of a preissued link. Avoid giving long-lived private signed links to browsers. The staged `PalaceChatPhoto` enhancement downloads through the member's current authenticated session instead.
- All synthetic user accounts, object bytes and Docker volumes were cleaned up. Only the source test files remain.

**Verified:** [GitHub Actions run 41227332903](https://github.com/annalisegeorge1/The-Starry-Palace/actions/runs/41227332903), local integration job **passed**, **7 named integration checks** with real local Auth/Storage.

**Limits:** This reproduces a **minimal** Palace collaboration/media schema. Hosted staging still has zero Auth users and zero Storage objects; the tests were not run against production members or the managed Supabase cloud Storage edge/CDN. More complete staging with the Palace's full schema and cross-device UI checks is required before a production rollout. The repo's CI currently gates this extra workflow to the approved review branch, so future independent branches do not accidentally run tests against the hosted project.

Official testing references:
- https://supabase.com/docs/guides/auth/testing-auth-flows
- https://supabase.com/docs/guides/storage/serving/downloads
- https://supabase.com/docs/guides/storage/cdn/smart-cdn
