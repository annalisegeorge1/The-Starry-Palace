# Royal Invitations — controlled hosted test and activation runbook

**Status:** Review and test plan only. No production database migration, privilege grant, feature flag, secret or real member email is authorized by the existence of this file.

**Current live baseline:** Worker 542, merged UI commit `f30b054a6d4a99b7f41fe97d234244960cb4aaf5`, existing ordinary welcome-invitation service. The ordinary/admin role boundary was checked in production. Keep it stable.

**Draft under test:** PR #309 (`feature/royal-invitation-seals`), which is intentionally not deployed. First Desk holder identity is approved as TheBlueMoonJune (`50c3246a-db88-4bdd-a355-4e6562ebf744`); privilege installation itself is not authorized for production.

## Environment gate (mandatory)

1. Prepare a **separate hosted test project** with controlled test mailboxes, a disposable auth population, and synthetic data only. Do not reuse production Auth users, recipient addresses, inventory, grants or secret values.
2. Current Security Staging project `ysbntuyyprnhptlxxsng` is **not ready** for these tests: it lacks the existing Treasury `virtual_gifts` and `gift_grant_ledger` tables as well as the Royal Invitation schema. Do not simply execute review SQL against it; first establish equivalent prerequisite schema and fixtures without importing real members.
3. Apply the reviewed SQL in the order listed in `README.md` to the *isolated* environment. Confirm the older age-safe invitation ledger migration exists first. Keep `member_sending=false` and `recipient_claims=false` initially; set a finite Founding window only for this environment.
4. For testing, grant `desk` privilege to **one synthetic verified adult operator account**, not the production owner UID. Create one synthetic eligible Envoy (verified, 13+) and at least two independent recipient inboxes. Record synthetic Auth IDs and keep their emails out of logs and screenshots.
5. Review all eight catalogue mappings (three admission seals and five choices), the inventory grants, catalogue numbering and ownership rules. Review and approve their synthetic test art state only in the isolated environment. Do not mark live catalogue items final as a side effect of rehearsal.
6. Use a **test-only** random, sufficiently long `PALACE_INVITATION_TOKEN_KEY` and separate test provider configuration. Confirm an authenticated ordinary member cannot use the admin dispatch API. Enable the `PALACE_SEALED_INVITATIONS` Edge opt-in only in the isolated environment after exercising the default-off case.
7. Preserve a list of every test-mode toggle and rollback action; never allow these toggles to modify a live project.

## Required hosted browser journey

| Step | Action | Required evidence |
| --- | --- | --- |
| 1. Operator | Sign in as the synthetic Desk account and review a recipient-bound Royal letter. | Review screen lists the correct class/recipient; one intentional confirmation sends one message. |
| 2. Delivery | Confirm the controlled mailbox received a **unique sealed link** (not the ordinary public invitation link). | Provider receipt and inbox are reconciled; no reusable token appears in application logs. |
| 3. Registration | Open the link signed out. Register with the same mailbox using the standard Palace 13+ flow and verify email. | No age bypass; account ID created after issuance; both registration and confirmation succeed. |
| 4. Continuity | Complete confirmation in a second browser, sign back in, and reopen the **original invitation email**. | Recipient can continue without copying a token across OAuth, localStorage or signup URL. |
| 5. Redemption | Accept the sealed letter once. | Only the intended verified user receives the matching admission keepsake; accepted status/audit event exactly once. |
| 6. Gift | Preview all three portrait frames and both palettes, choose one, confirm permanently. | Two grant ledger entries total (admission + chosen gift), exactly one permanent welcome choice. |
| 7. Equipment | Select the owned portrait frame or palette in the Chamber. Refresh and open a fresh signed-in session. | Selected cosmetic remains equipped, and no non-owner can equip or receive it. |
| 8. Envoy | Approve the synthetic Envoy, allocate the quarterly quota, enable member sending only for test, and send a letter. | Exact seal counts (available/reserved/accepted) and no double consumption. |
| 9. Read-only | Open another member's Chamber and Royal Invites page. | No private recipient or personal invite token is disclosed; unowned cosmetics cannot be selected. |

## Negative/abuse acceptance cases

- **Direct authorization:** Ordinary account sends authenticated requests to the protected legacy admin endpoint and sealed dispatch endpoint. Both are rejected independently of any hidden UI, with no email or seal mutation.
- **Recipient binding:** A signed-in account using a different email, an unverified account, an existing pre-issue account, and a user with no valid age record fail redemption. No benefit is granted.
- **Replay:** Same recipient may retry its successful redemption without acquiring a second seal or grant. Different gift choice after confirmation must be rejected.
- **Race:** Two concurrent redemptions, two simultaneous gift selections, and two sends for the last Envoy seal preserve exactly-once reservations/grants, with audited results.
- **Revocation and expiry:** Revoked, expired, suspended-Envoy and expired-quarter invitations do not authorize new claims. An issued but unredeemed seat returns to availability only while valid.
- **Provider ambiguity:** Retry dispatch using the **same request UUID** only, respect the 23-hour safety window and provider idempotency receipt; do not send a duplicate.
- **Privacy/trading:** Invited gift ownership and private notifications cannot be read by unrelated members or traded/deleted through ordinary inventory endpoints.
- **Presentation:** Check mobile 360px, typical tablet, large desktop and all Daybreak/Nightfall/Midnight modes. Verify keyboard focus, clear selected state, contrast, image containment around circular avatars, and reduced motion.

## Hard blockers before production authorization

1. PR #309 must be mergeable and all latest-commit frontend, build and 21-group native database checks green.
2. Real hosted Auth/inbox/recipient and Envoy acceptance must pass **in isolation**.
3. The owner must approve **exactly which five gifts and their final art**; preview/fixture-only items are not automatically released.
4. The current 128/128 achievement family catalogue has a hard numeric limit. Prepare an additive extension and an authoritative event-driven progress path, with new art/threshold/Grand Royal Envoy criteria reviewed separately. Do not overwrite any existing achievement.
5. The owner must separately authorize the production SQL plan, first Desk privilege installation and Founding start/end in UTC. Apply DB changes with both recipient and member switches disabled, verify role grants/security, and document rollback.
6. Only after another production-specific approval, roll out a single controlled recipient first, then one Envoy with a small seal quota, before any wider enablement.

## Abort and rollback

If data ownership, authorisation, delivery accounting or exactly-once grants fail, **do not** activate production. Shut down the sealed Edge flag and claim/member switches before reverting client/Edge code; follow `disable.sql`. Preserve redeemed honours, existing inventory and audit rows; never delete populated production data as a rollback shortcut. Ordinary public invitation and 13+ signup must continue working throughout.

## Reporting format for Work

Report the environment/project IDs (never credentials), Worker and Edge versions, PR head SHA, all automated run links, a pass/fail row for each numbered journey and negative case, test-only operator and recipient identity *types* (not full private email/token), the exact change/rollback commands proposed (not silently executed in production), and any owner decision still required. Do not report the system release-ready if an item above is still unverified.
