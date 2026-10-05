# Treasury artwork and browsing refinement

- Recovered the existing Writing and Legendary atlases, covering the missing 20 families / 100 tier designs. All 100 expanded families now have mapped artwork.
- Replaced equal-height sheet divisions with 500 individually measured crop rectangles. Row gaps are located from the paintings themselves. Every SVG image has an explicit clip rectangle and 9% presentation padding, preventing neighbouring rows from showing through letterboxed views.
- Visually reviewed contact sheets of all 100 Emerald designs, including their widest ornaments.
- Added 24-family pagination, search resetting to page one, direct expanded-collection links, and accessible native-dialog artwork previews with tier selection and keyboard dismissal.
- Repainted four original prizes as individual full PNG assets: Spice Midnight Audience, Spice Royal Correspondence, Spice Dream Screen (Majapahit), and Lion Hidden Passage (Achaemenid).
- Adjusted all three character sheets for consistent hair and headwear within each five-tier row. Kept the no-hands correction and natural skin tones.
- Binary uploads must match local Git blob hashes before inclusion in the commit. Asset-integrity tests gate production builds.

No unlock thresholds, member ownership, moderation or payment data are changed by this release. Court character paintings remain previews pending defined achievement assignments.

## 600-treasure reward collection — 5 October 2026

- Replaced the active 520-item reward pool with 500 historical court treasures plus 100 original keepsakes. `treasure:<original-id>` is the stable database key; catalogue numbers 1–600 match the artwork manifest.
- Legacy gifts retain their IDs, names, inventory and ledger history. Their numbers move to 10001–10520 and reward eligibility is disabled. They remain readable for existing cabinet/history joins, but never appear in the new reward pool.
- The old `collection=original-treasures` link opens the unified live gift catalogue. The renderer resolves exact keys/names, never catalogue-number collisions. Original painting edition and owned Bronze–Emerald collection rank are explicitly distinct.
- Four named artworks were redrawn with the built-in image generator using the Moonlit Tea silver painting as a style reference. The Dream Screen has three equal-height panels and a level top. All four use restrained cool watercolour and simpler, coherent object construction. This is a four-piece redraw, not a claim that all 600 paintings were repainted.
- Fixed gift ascension through a private, authenticated ledger trigger. The public RPC remains SECURITY INVOKER; clients have no direct inventory write policy. The trigger locks the source, checks ownership and adjacent rank, consumes exactly 3, and creates exactly 1. A rolled-back authenticated-role test verified success, insufficient copies, invalid rank jumps, cross-user rejection and blocked direct inventory changes.
- Existing security advisor notices remain for intentionally authenticated monthly-draw/account-deletion endpoints and disabled leaked-password protection. No new advisory concerns from the upgrade trigger.
