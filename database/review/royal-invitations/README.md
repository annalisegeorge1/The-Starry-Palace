# Royal Invitation beta candidate

The additional SQL is review material. It is outside the automatic migration directory. Historic provider receipts remain in the original private ledger. The same ledger supplies rate limits for new sealed dispatches.

## Approved initial Royal Invitation Desk holder

The Palace owner approved **TheBlueMoonJune** as the first sealed Royal Invitation Desk administrator on 2026-11-13. The approved production Supabase Auth user ID is `50c3246a-db88-4bdd-a355-4e6562ebf744`. Production read-only verification confirmed that this ID belongs to the `thebluemoonjune` profile, its Auth account has a confirmed email, and a private member-age eligibility record exists. A profile name, visible title, or email address by itself must never grant the desk privilege.

This is **approval of the designated identity only**, not approval to install the Royal Invitation schema, enable sealed dispatch/redemption, or grant privileges in live production immediately. During a separate, approved migration/activation window, verify the same Auth identity and age/confirmation eligibility again. Bootstrap only that verified account as a `royal_invitation.issuers` row of kind `desk` using the reviewed, idempotent operator script `initial-desk-holder.review.sql`; do not automatically seed the desk holder when installing foundation.sql. Keep both production activation switches disabled until the hosted end-to-end tests and reward integrations have passed. Record the manual authorization event in the deployment handover.

## Installation and activation

In an isolated environment, apply foundation.sql, recipient-api.sql, dispatch-api.sql then treasury.sql, catalogue.sql, exclusive-inventory.sql and atelier.sql in that order as one release unit. The legacy invitation migration and the existing Treasury schema are prerequisites. A verified user needs a private.member_age row. A service-role session cannot call the private foundation functions. Session-bound RPCs use auth.uid(). Member issuing and recipient claiming default to disabled. Neither a desk holder nor a Founding period is seeded.

Before hosted testing, review the three class distinctions and five welcome gifts created by catalogue.sql. They start reference-ready and block grants until explicitly approved as final. Catalogue numbers and UUIDs are allocated by the destination database. Then bootstrap an explicitly approved desk member, and configure a dedicated random 256-bit Edge token key. Keep the legacy administrator email allowlist. Define a finite Founding period in UTC. The Edge opt-in is PALACE_SEALED_INVITATIONS=enabled. Recipient claims and member issuance have separate database switches. Activation and real member grants require separate owner decisions.

The acceptance policy limits new-member honours to accounts created on or after issuance. Existing members retain their accounts. Suspension cancels pending offers, and redemption consumes a seal permanently. Unaccepted reservations can be returned only while their original grant is current. Quarterly allocations expire at the UTC quarter boundary. The default quota is two. Approved letters expire after 14 days by default. Retrying an ambiguous provider acknowledgement must reuse the original request UUID. Do not retry provider dispatch after its 23-hour safety window. Reopen the original email after cross-browser sign-in to claim a keepsake. A preview alone never performs redemption.

The Treasury trigger records one standard gift ledger entry for admission and one for a welcome selection. Existing inventory and notification triggers handle those entries. The native rehearsal covers all 15 class and gift combinations, the actual frame and palette setters, per-member ownership, persistence with independent connections and retry behaviour. Chamber visibility and palette-state projection are simplified in the fixture. Notification delivery, hosted Auth, mail and achievement awards still require integration. The member hub reports verified acceptance counts. Proposed Founding period is [2026-11-01, 2027-02-01) UTC, pending approval. Production remains on ordinary invitation mail. The member guide shipped separately via #310. Do not deploy this draft or enable any database switch from the guide release.

## Isolated rehearsal

Copy rehearse.mjs and all SQL files to an empty temporary directory. Install embedded-postgres@18.6.0-beta.19 there with npm. Run node rehearse.mjs /absolute/path/to/supabase/migrations/20261111010000_palace_age_safe_outbound_invitations.sql. Use the final group count as the success criterion. The rehearsal creates its own local PostgreSQL cluster and synthetic users. It exercises concurrent connections, role grants, age checks, reception, retry, dispatch throttling and Treasury inventory. Never substitute a production connection string.

## Rollback and remaining gates

Use disable.sql and turn off the sealed Edge switch before reverting the frontend and Edge Function to their prior releases. Preserve redeemed honours and audit rows. Do not delete populated tables or reverse inventory grants. The original invitation function continues to accept legacy payloads.

Before production, verify the complete hosted confirmation journey with a controlled inbox, real Supabase Auth and the intended mail-provider tracking settings. Test same-reference failure recovery, expiry, notification privacy, display and trade rules for each cosmetic, active Council restrictions and organisation anti-abuse policy. Review rate controls for multiple account identities. Verify the public invite page and registration independently of the sealed service. The acceptance rehearsal in this repository supplies test identities. Existing member data is never needed.

## Achievement integration blocker

Production metadata shows all 128 achievement-family slots occupied, a constraint limiting catalogue numbers to 1–128 and no family matching the five invitation honours. Before registering new awards, review the catalogue extension, all five tier requirements, the progress-write path, and discretionary criteria for Grand Royal Envoy. Issue awards from authoritative redemption or desk approval events. Preserve the existing badge collection. No achievement, production cosmetic, or invited member has been created by this review.
