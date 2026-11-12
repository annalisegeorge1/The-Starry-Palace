# Royal Invitation beta candidate

The additional SQL is review material. It is outside the automatic migration directory. Historic provider receipts remain in the original private ledger. The same ledger supplies rate limits for new sealed dispatches.

## Installation and activation

In an isolated environment, apply foundation.sql, recipient-api.sql, dispatch-api.sql and treasury.sql in that order as one release unit. The legacy invitation migration and the existing Treasury schema are prerequisites. A verified user needs a private.member_age row. A service-role session cannot call the private foundation functions. Session-bound RPCs use auth.uid(). Member issuing and recipient claiming default to disabled. No initial desk holder, Founding period or reward mapping is seeded.

Before hosted testing, configure five distinct final invitation-only gift records in royal_invitation.cosmetics, bootstrap an explicitly approved desk member, and configure a dedicated random 256-bit Edge token key. Keep the legacy administrator email allowlist. Define a finite Founding period in UTC. The Edge opt-in is PALACE_SEALED_INVITATIONS=enabled. Recipient claims and member issuance have separate database switches. Activation and real member grants require separate owner decisions.

The acceptance policy limits new-member honours to accounts created on or after issuance. Existing members retain their accounts. Suspension cancels pending offers, and redemption consumes a seal permanently. Unaccepted reservations can be returned only while their original grant is current. Quarterly allocations expire at the UTC quarter boundary. The default quota is two. Approved letters expire after 14 days by default. Retrying an ambiguous provider acknowledgement must reuse the original request UUID. Do not retry provider dispatch after its 23-hour safety window. Reopen the original email after cross-browser sign-in to claim a keepsake. A preview alone never performs redemption.

The Treasury trigger records one standard gift ledger entry for admission and one for a welcome selection. Existing inventory and notification triggers handle those entries. The fixture verifies inventory only. The five cosmetic IDs still need artwork, catalogue, wearability and trading review. A private selected title is not an equipped profile title. Milestones shown in My Royal Invitations count real acceptances. Persisted painted achievements and discretionary Grand Royal Envoy honours are outstanding.

## Isolated rehearsal

Copy rehearse.mjs and all SQL files to an empty temporary directory. Install embedded-postgres@18.6.0-beta.19 there with npm. Run node rehearse.mjs /absolute/path/to/supabase/migrations/20261111010000_palace_age_safe_outbound_invitations.sql. Use the final group count as the success criterion. The rehearsal creates its own local PostgreSQL cluster and synthetic users. It exercises concurrent connections, role grants, age checks, reception, retry, dispatch throttling and Treasury inventory. Never substitute a production connection string.

## Rollback and remaining gates

Use disable.sql and turn off the sealed Edge switch before reverting the frontend and Edge Function to their prior releases. Preserve redeemed honours and audit rows. Do not delete populated tables or reverse inventory grants. The original invitation function continues to accept legacy payloads.

Before production, verify the complete hosted confirmation journey with a controlled inbox, real Supabase Auth and the intended mail-provider tracking settings. Test same-reference failure recovery, expiry, notification privacy, display and trade rules for each cosmetic, active Council restrictions and organisation anti-abuse policy. Review rate controls for multiple account identities. Verify the public invite page and registration independently of the sealed service. The acceptance rehearsal in this repository supplies test identities. Existing member data is never needed.
