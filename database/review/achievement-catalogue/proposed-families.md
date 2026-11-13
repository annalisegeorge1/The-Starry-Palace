# Proposed invitation achievement definitions

Review material for catalogue numbers 129–133. The names and keys below are proposals. No catalogue insert, award job, privilege, badge art, or tier economy is enabled.

| Number | Proposed key | Display name | Subject and qualifying evidence |
| --- | --- | --- | --- |
| 129 | invitation_royal_guest | Royal Guest | Recipient of a redeemed royal-class letter. |
| 130 | invitation_honoured_guest | Honoured Guest | Recipient of a redeemed honoured-class letter. |
| 131 | invitation_founding_guest | Founding Guest | Recipient of a redeemed founding-class letter issued within the configured Founding window. Acceptance follows the letter expiry rules. |
| 132 | invitation_envoy_welcome | Envoy Welcome | Issuer of a redeemed letter backed by a seal allocated to that issuer. Count distinct accepted letters. Desk-only letters without an allocated seal do not qualify. |
| 133 | invitation_grand_envoy | Grand Royal Envoy | A discretionary award requires an explicit, authorized Desk decision naming the recipient and an immutable approval identifier. The current issuer role alone cannot qualify. The approval record and selection criteria require owner review. |

## Acceptance cases for review

For each guest definition, use the redeemed letter ID and accepted_by as evidence. A retry of the same letter must produce exactly one qualifying fact. A pending, revoked or expired letter yields none. A welcome gift selection or duplicated delivery notification adds no achievement progress. A member cannot earn two guest classes from a single letter.

For the issuer, count distinct redeemed sealed letters by issuer_id. Two accepted letters from different recipients count twice. A resend, an unredeemed letter and a letter issued by a different member add zero.

For the discretionary award, refuse unapproved, self-approved and replayed decisions. Confirm that the named subject, approving Desk authority and award decision survive an independent audit before enabling it.

The three recipient distinctions are one-time by design in the sealed-letter schema. Owner decisions are needed on how these map to the catalogue's five required tiers, the thresholds for the Envoy family, the Grand Royal Envoy criteria and final art. Keep the five keys out of the live catalogue until those decisions and the authoritative award writer have been reviewed.
