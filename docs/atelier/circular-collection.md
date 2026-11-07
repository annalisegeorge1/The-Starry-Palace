# Circular profile frames and achievement badges

The 35 classic frame slugs now select individual illustrated WebP overlays. Their round portrait masks are fitted to the inner metal rims. The 24 frames introduced in PR #264 retain their separate artwork. The previous classic renderer and badge composition are archived in `legacy/`. No original image, unlock rule, achievement record or customization key changed.

Each achievement keeps its existing tier-specific subject (including the 500 cells in the approved sheets). Bronze has a hammered laurel bezel; Silver has pearl and fern wirework; Gold has an acanthus wreath and fleur-de-lis; Platinum has a diamond crown; Emerald has a jeweled diadem. The five new settings live under `public/assets/badges-illustrated/v2/`. Profile artwork lives under `public/assets/atelier-illustrated/classic-v2/`.

Review `/docs/atelier/circular-review.html` in the local development preview. Compare each frame with its prior design, at 40, 84 and 132 CSS pixels. The badge view renders real object, portrait, approved, painted and original-sheet subjects across all five tiers. The preview uses a public Palace illustration instead of member data.

Visual QA: desktop profile and badge views; dark and light backgrounds; 320px and 390px responsive viewports. Their content widths matched the available widths (305px and 375px after scrollbars). No live member records were edited. See [desktop badges](circular-badges-desktop.png) and [mobile](circular-mobile.png). All 1,564 tests and the production build passed. No DNS, database or unlock changes.

The frame chooser uses one 2× thumbnail sheet for its 59 choices. Full-size artwork loads for the selected preview and for worn frames; browsing the grid does not download the whole full-resolution collection.
