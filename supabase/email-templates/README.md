# Palace Authentication Recovery — Safe Release Plan

## Scope

This release adds `/auth/forgot-password` and `/auth/verify`, retains the current Google/Supabase OAuth callback, and prepares **seven** Palace-branded hosted Supabase templates. No API keys, SMTP settings, domain nameservers, or member data are changed by this PR.

### Why the new email links differ

The existing Supabase PKCE flow redirects an email link to `/auth/callback?code=...`. When Gmail opens a separate in-app browser, that browser can lack the original PKCE verifier and displays **Finish signing in**. The new templates link to `https://thestarrypalace.com/auth/verify#token_hash={{ .TokenHash }}&type=...`. That token hash is a one-time Supabase credential which `verifyOtp` redeems **only on a deliberate button click**. Fragments do not travel to the server in HTTP requests and the new page removes the hash from visible browser history after capturing it. This works without sharing browser-local PKCE verifier state.

The existing `/auth/callback` remains intact for Google OAuth and legacy emails.

**Passwordless Magic Link nuance:** Supabase now documents `verifyOtp({token_hash, type:'email'})` for Magic Link PKCE sessions, not `type:'magiclink'`. The Magic Link template uses `#token_hash={{ .TokenHash }}&type=email&intent=magiclink`. The `intent` fragment only selects Palace passwordless sign-in wording; it never changes the OTP type sent to Supabase. Confirm signup continues using `type=email` without `intent`.

### Mandatory staged release (owner/deployer checklist)

1. **Review and test the PR**: lint/build and Vitest; inspect login, forgot password, verification and recovery on desktop and Android. Check Nightfall, Daybreak and Midnight. No live emails should be sent from an unreviewed preview.
2. **Deploy the frontend through the actual custom-domain Worker**, not just Cloudflare Pages. Check that `https://thestarrypalace.com/auth/forgot-password` and `https://thestarrypalace.com/auth/verify` load directly on a fresh tab. If using a separate Pages preview, remember it does not replace the live Worker. Keep rollback ready.
3. In **Supabase Dashboard → Authentication → Email Templates** for project `sservftxygunkacmwsad`, apply the subject and HTML shown below. **Start with the Recovery template only after the new front end is live**. Never paste credentials into GitHub, PRs or chat.
4. Apply **Confirm signup** and **Magic link** templates. Email links will now use `TokenHash` verification in `/auth/verify`. The `{{ .ConfirmationURL }}` format is still supported by the legacy callback, but it cannot reliably sign in across browsers.
5. Add the Invite / Change email / Reauthentication templates if supported. The Password changed security notification is **optional**; don't turn on new notification types without reviewing platform availability and email budget. Preserve other existing notifications.
6. Send test signups and password resets to accounts **you control**. Confirm the sender is `The Starry Palace <no-reply@thestarrypalace.com>`, the email links open in Gmail in-app browser and Chrome, that the link works once only, that resetting a password works, and that Google login still works. In Resend email logs, verify accepted/delivered status. Verify that no unauthenticated user gains a session without redeeming the correct one-time token.
7. If a test fails, **revert the affected Supabase template** first (restore previous HTML), then roll back the Worker deploy if necessary. Restoring only the GitHub branch or Pages build will not revert a hosted Supabase email-template setting.

### Hosted email templates

| Hosted Supabase template | Subject | File |
| --- | --- | --- |
| Confirm signup | Confirm Your Place Among the Stars \| The Starry Palace | `confirmation.html` |
| Reset password | Reset Your Palace Password \| The Starry Palace | `recovery.html` |
| Magic link / OTP | Your One-Time Palace Entrance \| The Starry Palace | `magic_link.html` |
| Invite user | An Invitation Awaits You \| The Starry Palace | `invite.html` |
| Change email address | Confirm Your New Palace Email | `email_change.html` |
| Reauthentication | Your Palace Verification Code | `reauthentication.html` |
| Password changed notification (optional) | Your Palace Password Was Changed | `password_changed_notification.html` |

The invitation is intentionally more ceremonial than the other transaction emails: a royal-blue and gold letter, special invitation seal, elegant serif headline, and a distinct **Accept My Invitation** action. It remains image-free, accessible, and uses the same secure one-time `type=invite` token link. The invitation is for existing Supabase **Invite user** operations, not a general marketing email.

All HTML files are in this `supabase/email-templates/` directory. Copy **the full raw HTML** and matching subject into the corresponding hosted Supabase template editor. These are transactional emails; they avoid marketing, trackers, remote fonts, and untrusted external images. The wordmark is text-based so it remains visible even when Gmail blocks images.

**Only supported email action types** are sent to `/auth/verify`: `email`, `magiclink`, `invite`, `email_change`, and `recovery`. The separate reauthentication email uses `{{ .Token }}` as a code and does not change the verification URL.

### Supabase settings and safety

* Preserve `sservftxygunkacmwsad` Google OAuth client, Supabase PKCE `flowType:'pkce'`, and existing callback.
* Preserve Resend SMTP host `smtp.resend.com`, sender address, DNS-only CNAMEs, and secret API key unchanged.
* The password-reset request uses `resetPasswordForEmail` with the previously allowed `/auth/callback` redirect for legacy templates, avoiding new redirect allowlist changes. The new Recovery email template links directly to `/auth/verify` instead.
* Do not put `token_hash` in query strings, analytics events, screenshots or logs. Links use a URL fragment and the app strips it from browser history after mount. Do not automatically redeem links on GET, to avoid mail-scanner prefetch burning single-use tokens.
* The recovery-request page does not reveal whether an account exists, even when the provider returns an error. Abuse protections, email rate limits, and the site's minimum signup age remain in place.
* Do not publish the forgot-password link into production before installing a working recovery template with the matching frontend, because the old recovery link may lead to the legacy callback rather than the password-change form.

### Verification not yet performed

GitHub CI checks unit tests and build. Hosted Supabase template installation, live email delivery, login redirects, mobile browser screenshots, and actual production Worker deployment require explicit follow-up verification. **Do not label any of those complete based solely on a successful GitHub build.**

Supabase docs: https://supabase.com/docs/guides/auth/auth-email-templates
