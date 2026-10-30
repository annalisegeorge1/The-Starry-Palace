# The Starry Palace — Cloudflare email alerts foundation

## Status: prototype, no member emails sent
This branch is not deployed to the public domain and the accompanying SQL migration is NOT applied to the production Supabase project. The dedicated scheduled Cloudflare Worker is not deployed and `PALACE_EMAILS_ENABLED` defaults to **false**.

## What exists in code
- Explicit member consent (off by default), event categories and immediate/daily/weekly frequency models.
- A private server-side queue populated only from the Palace's existing real notifications.
- Read/claim/ack RPCs restricted to the Supabase service role. User credentials and notification bodies are not stored in the queue.
- A scheduler-only Cloudflare Worker with a kill switch and server-side-only Supabase service-role credential; safe HTML and text templates summarize category counts without private details.
- A public unsubscribe route with a random-token-only permission to turn email off.
- Isolated unit tests for defaults, consent and sender-off behavior.
- Guarded UI: `VITE_PALACE_EMAIL_SCHEMA_READY` must be explicitly set to `true` only AFTER the migration is verified. It is not set by this branch.

## Critical deployment gates
1. Test the SQL migration and RLS policies in a separate staging Supabase project. Verify no user can call claim/ack RPCs, read the private queue, or see recipient emails.
2. Review the new unsubscribe route for unknown tokens, already unsubscribed members and failure states. Confirm it returns no private data.
3. Enable Cloudflare **Email Service Sending** and authorize the integration for Email Sending permissions; verify `thestarrypalace.com` and sender address. Cloudflare requires Workers Paid for arbitrary recipient email sending.
4. Configure `SUPABASE_SERVICE_ROLE_KEY` **as a Cloudflare Worker secret only**. Never put it in a Vite variable, the repository, or any public endpoint. Don't print it.
5. Deploy the dedicated Worker with `PALACE_EMAILS_ENABLED=false`; test the cron trigger and missing binding behavior.
6. Verify opt-in, accurate sender identity, unsubscribes, bounced-address suppression, rate limits, abuse controls, deliverability and idempotency with dedicated test accounts BEFORE changing the gate to true.
7. Check local-time scheduling and replace UTC daily/weekly boundaries if time zones are needed. Evaluate retry duplicates when provider accepts a send but the acknowledgement fails.

## Email semantics
- Existing `email_digest` is just a legacy expression of interest and never turns this new system on.
- The new `email_alerts_enabled` requires explicit opt-in. No automatic enrollment, including users who selected an in-Palace preset.
- Activity emails never include messages, personal notes, drafts, or private story content.
- Security and password emails remain outside the marketing/activity switches.
- Unsubscribe links only disable; the public RPC doesn't reveal whether a member exists or provide personal information.

## Cloudflare access observed during development
- Connected account can inspect the active domain and Pages project.
- Email Sending API returns HTTP 401 / permission error, so access is not sufficient to activate sending. This must be resolved before deployment.

## Test status
GitHub Actions runs `npm run verify`. No database migration or real email integration test was run against production.
