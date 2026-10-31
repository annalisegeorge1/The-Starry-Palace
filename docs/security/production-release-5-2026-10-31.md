# Production security release 5 — rewards age eligibility

**Applied to production Supabase project** `sservftxygunkacmwsad` on 31 October 2026:
- `age_guard_share_rewards`: reviewed `database/PROPOSED-guard-shares-by-reader-age-2026-10-31.sql`
- `age_guard_praise_rewards`: reviewed `database/PROPOSED-guard-praise-awards-by-reader-age-2026-10-31.sql`

Staging `ysbntuyyprnhptlxxsng`: created a synthetic reward fixture, enabled the same proposed functions and verified in a rollback-only transaction that a synthetic 14-year-old cannot share/praise an 18+ work to create point rewards; an adult's first share awards 2 giver points and a repeat 0; an adult's first Heart praises awards 1 giver point and a repeat 0. Both staged tests returned PASS.

Production postflight confirmed both functions contain `private.member_meets_age(w.minimum_reader_age)` and retain authenticated EXECUTE. The existing counts of ledger entries (9) and palace praises (1) were unchanged. No member content, balances, assets or records were copied to staging. A full account/device smoke test is not yet complete.

**Rollback:** capture the original function definitions from documented production preflight and restore only the relevant RPC if essential to service recovery. Doing so restores the age-eligibility weakness. No ledger rows should be edited as part of rollback. Prefer fix-forward.

**Still pending:** age-aware tag aggregate privacy, chat photo frontend, AI crawler rules, security headers and encrypted owner-held backups with a restore drill. No paid services enabled.
