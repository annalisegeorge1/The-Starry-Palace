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
