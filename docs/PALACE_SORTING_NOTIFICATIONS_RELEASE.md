# Palace Reading Sorts and Notifications — Safe Release Notes

## Reader sorting
The existing full-archive server RPC still provides seven real archive-wide sorts (updated/newest, publication/newest/oldest, title A–Z, words/chapters/comments most).
Reverse sort directions and bookmark sorts are explicitly **loaded-shelves only**. Choosing them switches the browsing scope rather than reversing one page of results and misleading readers. Missing numerical values are placed last, not falsely counted as zero.

## Notification settings
The existing member-owned `notification_preferences` table has category toggles, in-Palace digest, quiet hours, and the separate `email_digest` flag. We now display the distinct in-Palace digest toggle and validate quiet hours. In-Palace presets do **not** write `email_digest`, even in All Activity mode.

**Email delivery is not active.** The Email Digest option records only a future opt-in preference; it does not send mail. Never claim that choosing it enables actual emails.

## Email delivery activation gates
1. Verify `thestarrypalace.com` with an email sending provider; configure SPF/DKIM/DMARC and store provider keys only in server-side secrets.
2. Verify member inbox addresses and use separate explicit opt-in for digest versus immediate event alerts. Require clear frequency controls and an unsubscribe mechanism.
3. Build an authenticated/server-side sender with idempotent job records, retry limits, throttling, bounce/complaint suppression, privacy filtering and opt-out enforcement. Never send private message text, draft material, unlisted work content, or blocked-user details.
4. Validate all SQL and RLS against an isolated staging Supabase project before applying migrations to production. Security and sign-in email must remain separate from marketing/activity opt-ins.
5. Test with consenting accounts, unsubscribes, invalid/bounced addresses, duplicate event delivery, quiet hours and preview environments.

This update does not send emails, add DB migrations, or require privileged keys.

## Release checks
- GitHub test suite and Vite production build
- Cloudflare branch preview and mobile/desktop Nightfall/Daylight review
- Full-archive sorting versus loaded-only sorting scope and count check
- Test-account settings: All/Focused/Quiet do not change email opt-in; explicit email choice persists after save and reload; quiet hours reject missing times
