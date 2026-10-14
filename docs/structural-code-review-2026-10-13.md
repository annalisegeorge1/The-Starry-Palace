# The Starry Palace — Structural Code Review
**Reviewed:** 2026-10-13 (repository main branch)
**Scope:** application module boundaries, page rendering, stylesheets, access boundaries, test coverage and the safest cleanup order.

## Findings supported by the repository

| Area | Observed evidence | Concern |
| --- | --- | --- |
| Page assembly | `src/liveRooms.jsx` was about 675 KB at the initial review, exported 27 page components, contained over 75 React effects and imported more than 100 dependencies. | Small edits can affect unrelated rooms; tests and navigation errors are harder to isolate. |
| Styling | `src/polish.css` about 570 KB, 4,356 blocks and 3,005 `!important` declarations; `src/palace-next.css` about 221 KB and 1,284 more `!important` uses. | Later rules must compete with large older override layers. Removing apparently redundant CSS can change badges, theme colours and responsive layouts elsewhere. |
| Data access | `src/palaceData.js` about 166 KB with 233 exported functions. | Different Palace features share one broad client data interface; makes permissions, queries, errors and changes harder to audit by domain. |
| Entry point | `src/main.jsx` about 60 KB; routes for core reading, writing and community rooms come from one eager `liveRooms.jsx` import. | Splitting source files alone does **not** reduce initial download size. Route-level chunks will need a separate, measured change with reliable failure fallbacks. |
| Regression protection | Broad automated safety tests inspect literal source text in `liveRooms.jsx`, in addition to rendering and unit tests. | Good safeguards can fail during a harmless file extraction if they assume all page code remains in a single file. Migrate those assertions to the new owners rather than weaken requirements. |

Approximate sizes above are based on source-file inspection, **not** a production bundle-size or performance measurement. Responsiveness and visual quality still require browser testing.

## Completed in this first extraction pass

1. **Throne of Honour:** moved its full room component to `src/HonourRoom.jsx`; `liveRooms.jsx` retains the same exported route-facing `HonourLive` adapter. Existing public browsing, member recommendations, gallery, and monthly courts remain in place.
2. **Series Shelves:** moved its browsing, collection editing and reading-order UI to `src/SeriesRoom.jsx`; the `SeriesLive` route-facing adapter remains. The existing data functions and story routes are unchanged.
3. **Regression protection:** added rendering tests for both new rooms and adjusted broad launch-safety assertions to inspect their real owners rather than requiring them to reside in the former shared module.

**Explicitly not changed:** database tables, RLS policies, authentication and permissions, personal reading history, manuscripts, comics, community messages, earned items, chamber styling, awards, collectible art and decorative frames.

## Recommended staged cleanup

### Stage A — safer boundaries (continue first)

- Extract one self-contained room at a time, preserving the exported route API and importing the same data functions.
- Keep the central `liveRooms.jsx` route exports stable while updating structural assertions and adding render tests.
- Prioritize lower-risk, readable pages before attempting the 70 KB community room or 100 KB manuscript studio.
- Never put work-save or chapter-publication changes in the same commit as a visual or module extraction.

### Stage B — data modules and access review

- Group the `palaceData.js` interface by domain: stories/chapters, reading progress, creator studio, Commons and community, member profile, Treasury, events, moderation.
- First keep function signatures and calls identical; only then reduce repeated query logic.
- Check authorization and row-level security with the actual database policies and signed-in/guest tests before claiming access is protected. Front-end route hiding is not authorization.
- Inspect query limits and concurrent requests so moving between areas does not repeatedly fetch unrelated data.

### Stage C — predictable CSS ownership

- Create a documented styling order: global tokens → shell/layout → feature scope → day/night overrides.
- Identify duplicate selector ownership with an automated report before removing any `!important` declarations.
- Migrate a single feature stylesheet per pass and compare mobile, tablet, desktop and both themes.
- Do **not** indiscriminately delete old stylesheets: historic overrides include bespoke art composition and responsive repairs.

### Stage D — loading and launch confidence

- Split core routes into independently recoverable chunks **after** measuring build output and preserving the existing import-retry/error-boundary protections.
- Add browser-based journeys for guest story reading; signing in; finding/resuming a chapter; editing and saving a private draft; moving between Library tabs; Commons and chat; permissions and sign-out.
- Validate deployment on the real hosting environment: a successful GitHub build does not prove that new assets have been deployed, cached correctly or displayed properly.

## Priority order

1. **High:** Keep reader and writer save/resume flows dependable. Avoid regressions while extracting large modules.
2. **High:** Audit actual database permissions and sensitive queries against policies, not merely UI conditions.
3. **High:** Reduce cross-page CSS conflicts with a controlled stylesheet-ownership plan.
4. **Medium:** Reduce eager route coupling with measured lazy loading and recovery.
5. **Medium:** Improve accessibility and responsive experience through browser journey tests.
6. **Later:** Remove genuinely unused selectors and functions only after proving no references or visual regressions.

## Definition of done for each cleanup batch

- No routes or member-owned data disappear.
- Existing permissions and publishing behaviour remain unchanged.
- Focused unit/render regressions pass, plus the complete project test suite.
- Production bundle builds successfully.
- Live-site functionality is reported as **unverified** unless the deployed URL and critical journeys were checked separately.
