# Palace Royal Invitations — invitation-first, account-later

## Why this exists
Supabase Authentication → Users → Invite user tries to insert an Auth user immediately. The Starry Palace has a **mandatory 13+ database trigger** requiring `raw_user_meta_data.palace_birth_date` at signup. The Supabase dashboard invite dialog accepts only an email, so this operation must remain blocked. **Do not remove, weaken or skip the age trigger.**

This feature sends a **royal letter inviting someone to the Palace**, not a Supabase Auth invitation. The email links to `https://thestarrypalace.com/invitation`; the recipient chooses **Create my Palace chamber**, which links to the existing `/login?mode=signup` page. They enter their own age information privately; the existing `auth.users` trigger enforces age 13+ before any account exists. The link does not grant any access, create users, or bypass screening.

## GitHub changes
- `/invitation`: public royal letter landing page; no login required.
- `/admin/invitations`: login-protected invitation desk; anyone can share the public URL, but only the Edge Function can authorize automatic email sends.
- `supabase/functions/palace-invitations/index.ts`: administrator-authenticated Resend sender; compares confirmed user email to a **server-only allowlist**, never trusts client claims of admin status.
- `supabase/functions/palace-invitations/email.ts`: email-safe royal HTML and plain-text counterpart; sender identity `The Starry Palace <no-reply@thestarrypalace.com>`.
- `supabase/migrations/20261111010000_palace_age_safe_outbound_invitations.sql`: **private log only**, keyed HMAC of recipient address; no email address stored in database, atomic server-only quotas (20/day/admin, 5 per 10min/admin, 2/day per admin+recipient).
- Tests for invitation wording, 13+ path, server-only authentication, no Auth user creation and provider key isolation.

The existing Supabase **Invite user** hosted email template is **not** used by this new feature. It cannot independently work until Supabase's built-in invite flow can collect the verified age data first, which the dashboard cannot currently do.

## Production rollout and security checks
1. Merge code only when tests/build pass. Verify the actual custom-domain Worker auto-deploys; do not confuse it with Pages.
2. Apply the SQL migration to Supabase project `sservftxygunkacmwsad` using the controlled migration tool. It creates a table and two service-role-only functions; it does **not** touch Auth signup triggers or member records.
3. Deploy the Edge Function `palace-invitations` with JWT verification enabled. Entrypoint `index.ts`; include `email.ts`.
4. At **Supabase Dashboard → Edge Functions → Secrets**, securely configure:
   - `RESEND_API_KEY`: a Resend API key with **Sending** permission for the already-verified Palace domain. Never put this in GitHub, chat, JavaScript bundle or client environment variables.
   - `PALACE_INVITE_ADMIN_EMAILS`: the confirmed Palace owner's sign-in email, with additional administrator emails comma-separated **only if explicitly approved**. Don't put personal email allowlists in public repository code.
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_ANON_KEY` are normally Supabase-provided Edge Function environment variables; confirm they exist. Never expose service-role key in browser.
5. Sign in as the authorized Palace owner, open `/admin/invitations`, and verify the send button reports ready. If not configured, the desk still lets you copy the public invitation link.
6. Send **one** invitation to a fresh test email you control. Verify Resend Accepted/Delivered and Gmail arrival; click **Accept My Invitation**. The landing page must not create a user or grant authentication.
7. From the landing page, go to **Create my Palace chamber**. Test a valid 13+ DOB and confirm the resulting account can complete the normal confirmation flow. Test a **nonexistent test account younger than 13**; it must not be created or gain member access. Do not create real underage test identities.
8. Verify non-admin signed-in users receive 403 and no email is sent, missing provider secrets fail closed, and sending quotas return 429.
9. Confirm existing Google OAuth, confirmation, recovery, magic links and existing signed-in member paths still work.

## Safety and resilience
- API always revalidates JWT with Supabase Auth before allowing a send. **The client's appearance or URL is not authorization**.
- Resend and service role credentials live only server-side. The caller never supplies HTML, subject, or sender.
- Server logs never contain recipient addresses, recipient hashes, one-time passwords or API credentials. Error responses intentionally avoid provider response bodies.
- HMAC fingerprint is keyed with the server-side service-role secret, preventing offline guessing from a leaked dispatch log.
- Resend acceptance is **not** equivalent to delivery; verify real inbox and logs.
- The invitation URL is public and has **no account privileges**; anyone could share it. No single-use tracking tokens are needed for a plain invitation to join. If future invitation-only memberships are required, add a separately reviewed server-side token redemption process, without bypassing the 13+ trigger.
- Rollback: stop Resend sending by removing/rotating `RESEND_API_KEY` or admin allowlist. The public landing page may remain, and no existing Auth account data needs to be altered. Keep the new private ledger for audit unless there is a reviewed retention procedure.
