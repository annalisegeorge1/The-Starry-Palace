# Frame redesign validation

- Reviewed PR #264 at 3af0b2747ee9e1aeca5833c987bcbf45aff9b27d; replaced its procedural artwork, retaining the draft implementation as `src/FineFrameArtworkLegacy.jsx`.
- Compared against `public/assets/palace-watercolours/chamber-frames.webp` and the unchanged original 35 frame components.
- All 24 new frames have separate transparent illustrated assets. Six broad royal settings, six artisan settings (including two delicate), twelve gemstone settings; names and categories remain unchanged.
- Inspected all 24 in the browser at 40px, 84px and 132px avatar container sizes. Existing MemberAvatar CSS gives frames 120.482% of that container; this scaling was preserved.
- Inspected gallery at desktop width and 320px / 390px iframe viewports. Narrow-page content widths matched container widths (305/305 and 375/375 after scrollbars). No horizontal overflow in the picker.
- Tested collection filtering, selection preview, available-frame action and disabled locked-frame action. No member records were saved during QA. This is isolated component QA, not a claim of an authenticated live-account save test.
- Inspected dark and daylight backgrounds; selected preview and visible text remain readable.
- Corrected background haze on Starlit Amethyst and Opal Dream through separate image-generation edits.
- `npm test`: 320 files, 1,564 tests passed.
- Targeted frame/avatar regression suite: 5 files, 17 tests passed.
- `npm run build`: passed. Existing large-chunk advisory remains.
- No changes to paintedCollection.js, OrnamentalFrame.jsx, MemberAvatar.jsx, unlock calculation, database migrations, member selections, existing artwork assets, or DNS.

Screenshots: [Desktop](desktop-royal.png), [Mobile dark/light](mobile.png).

Reproduce visual review with `npm run dev`, then `/docs/atelier/review.html` or `/docs/atelier/mobile-review.html`. Add `?classic` to the review URL for the original 35 frames; `?picker` isolates the picker. Review fixtures use initials, never private member images. Do not press Wear this frame in a fixture; selection and eligibility can be tested without saving.

Production release is pending: automatic approval review blocked reads of the production Worker source and routing bindings. No production Worker configuration was retrieved or changed, and no DNS changes were made.
