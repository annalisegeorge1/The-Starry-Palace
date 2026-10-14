# CSS cascade hotspot review (13 October 2026)

This is a read-only **heuristic source inventory**, not a finding that any CSS rule is redundant or an audit of live page speed. The four reviewed files are polish.css, palace-next.css, style.css, and palace-glass-coverage.css.

## Scale of main style layers

| Source file | Approx. source bytes | !important count |
|---|---:|---:|
| src/polish.css | 569,961 | 3,005 |
| src/palace-next.css | 221,344 | 1,283 |
| src/style.css | 215,438 | 87 |
| src/palace-glass-coverage.css | 12,616 | 41 |

## Exact selector overlap candidates

| Selector | polish.css | palace-next.css | style.css |
|---|---:|---:|---:|
| .nav-toggle | 11 | 6 | 4 |
| .write-action | 13 | 2 | 4 |
| .comic-card | 12 | 4 | 3 |
| .top-icon-link | 11 | 4 | 3 |
| .full-top-actions | 10 | 4 | 4 |
| .brandmark | 10 | 6 | 1 |
| .full-topbar-row | 10 | 3 | 2 |

**Method limitations:** A simple selector scan stripped comments, normalized whitespace, and counted matches among brace-delimited CSS rules. It does not understand the whole CSS cascade, @media, @supports, layers, grouping, specificity or import order. Repeated text may be purposeful, especially mobile or theme overrides. Counts should be regarded as leads for review, not authoritative parser output or directions to delete anything.

## Targeted sequence, without damaging site appearance

1. Start with navigation controls (.nav-toggle, .full-top-actions, .top-icon-link, .brandmark). Trace the final computed rules in Nightfall/Daylight at narrow, tablet and desktop widths, and test keyboard/mouse interactions before consolidating a declaration.
2. Then inspect writing actions (.write-action), covering active, disabled, saving and offline conditions; do not weaken draft save or recovery.
3. Then inspect comic cards (.comic-card) against comic navigation, page fit and horizontal/vertical reader modes.
4. Consolidate only one component-scoped family at a time, with before/after screenshots and tests in both themes.

Preserve artist-approved badge art, decorative frames, member-chosen chamber colours, data access boundaries, and saved member work. **No CSS declarations were deleted during this review.**

## Other boundary tightened

The reader HTML cleaning function was moved from the large liveRooms module into src/readerHtmlSanitizer.js, with tests for rich text formatting, prohibited embeds and event attributes, and safe escaping without a DOM parser. No stored user content, Supabase tables or permissions were altered.
