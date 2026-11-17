# Beta release follow-up — 18 November 2026

## Reviewed baseline

Reviewed GitHub's current merged/open PRs and main at
`9ffe2280da663c148e5629e00e0bff87acf2487c`, concentrating on the active work
after Worker 543. Dates in this heading use the reviewer's client date.

Read-only Cloudflare verification found the custom domain mapped to production
Worker `the-starry-palace`, version **554**, serving **100%** of traffic:
version `8d29e43d-cf03-404f-af27-f6e8da3d44ea`, deployment
`760b63cf-92dd-4757-a238-930a43b9f1a2`. The preceding version **553** is
`7b1b1c28-a0b6-4000-831b-a5085b7e27ad`. Version metadata did not identify a Git
commit; do not treat this observation alone as proof that the live asset bytes
match main. No production deployment or configuration was changed in this review.

## Completed work — do not repeat

| Work | Verified repository evidence |
| --- | --- |
| Persistent chapter comment label; Next chapter keyboard focus | Merged #314 and #315. |
| Nested chapter responses and separate reply drafts | Merged #316. |
| Server-authoritative reading checkpoints | Merged #317. Read-only production catalog checks confirmed the revision column, enabled guard trigger, matching invoker function bodies and member-only RPC execute access. The isolated SQL rehearsal also passed. |
| Appeals, Content Policy and legal-page readability | Merged #318, #320 and #322; later policy revisions #327 and #328 are also merged. No policy revisions are proposed here. |
| AI crawler/visibility explanations; Founding Writers pilot doorway | Merged #324 and #326. No outreach or mail is sent by this review. |
| Earlier Writing Desk conflict recovery and atomic publication | #299's final release record confirms Worker 535 and live acceptance checks. Historical draft notes are now explicitly marked historical. |
| Guest translation credits | Open draft #300 explicitly records its separately approved production migration `20261111215715` and successful live checks. Its open state does not mean the fix needs reinstalling. |

The latest six main-branch Palace build runs were successful, including
[run 44013363552](https://github.com/annalisegeorge1/The-Starry-Palace/actions/runs/44013363552)
for the reviewed main SHA. This session independently ran `npm run verify`:
**1,684 tests / 351 files passed**, followed by a successful production build.
The build reports its existing large-chunk advisory.

## Safe follow-up implemented

The reading-progress two-connection PostgreSQL rehearsal existed but no main
workflow ran it. The new narrowly triggered CI workflow executes that unchanged
fixture on relevant PRs and main pushes, using a disposable local cluster,
synthetic identities, no service credentials and pinned tooling outside the
application dependency tree. The local rehearsal and [GitHub rehearsal run 44154415414](https://github.com/annalisegeorge1/The-Starry-Palace/actions/runs/44154415414) passed concurrent insert/update,
stale writes, rereading, completion retention, mixed clients, account isolation,
chapter removal and rollback assertions. A README documents scope and limits.

## Verified remaining work and blockers

| Item | Remaining gate |
| --- | --- |
| Royal Envoy sealed invitations, #309 | Draft and conflicting with main. Hosted confirmation/mail/notification/cosmetic/anti-abuse acceptance tests remain required by its runbook. Schema installation, issuer bootstrap, activation switches, token key, Founding period and final rewards need separate decisions/approval. Existing ordinary invitations remain separate. |
| Achievement capacity, #313 | Draft and conflicting with main. The proposed 129–133 capacity, tier mapping, Envoy thresholds, discretionary criteria, art and authoritative award writer remain unapproved. Do not install the SQL or enable awards. |
| Guest Heritage observances, #298 | Read-only production catalog checks confirmed the original shared SELECT policy still calls the role helper, and anon lacks EXECUTE on that helper. An anonymous read-only published-row count reproduced `42501: permission denied for function has_platform_role`. The exact PR #298 SQL blob `1bbea8b992b17f8bd82930452f5de02de7d98c46` passed 15 assertions in a disposable PostgreSQL fixture: original denial, published-only guest reads, ordinary-member/Council/owner visibility, denied writes, unchanged grants and row-preserving rollback. Full hosted schema parity is not established. Production policy approval is still required; no permission change was made. |
| Reading-progress device acceptance | Production installation is now confirmed read-only; no reinstallation is needed. This session did not repeat signed-in two-device browser acceptance, so the catalog check and isolated fixture must not be represented as that test. |
| Wider beta readiness | The playbook requires actual volunteer task-completion and device/accessibility evidence. This repository review and isolated fixtures do not establish those outcomes or owner-held backup/restore readiness. Keep supervised beta until those gates have evidence. |

Older Observatory/security/design drafts were not merged wholesale or counted as
new post-543 blockers merely because they remain open. No confirmed new
application defect emerged from the targeted review and passing suite; no
speculative application rewrite was made. Approval-required work remains held.
