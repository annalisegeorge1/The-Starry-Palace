# The Starry Palace — Architecture and cleanup audit
**Audit date:** 13 October 2026  
**Repository:** `annalisegeorge1/The-Starry-Palace`  
**Scope:** Source-code structure and risk; not a claim that production user flows have been fully tested.

## What we found

A recursive inventory of the main branch before this pass reported **712 tracked files**, including **271 JavaScript, 119 JSX and 149 CSS** files. The largest production files were:

| File | Size before refactor | Why it matters |
| --- | ---: | --- |
| `src/liveRooms.jsx` | 677,132 bytes | 27 named page exports plus shared dialogs, state components and many data/UI imports |
| `src/polish.css` | 570,134 bytes | Dense global cascade: approximately 4,356 brace groups and 3,005 `!important` declarations |
| `src/palace-next.css` | 221,410 bytes | Second large global style layer |
| `src/style.css` | 215,450 bytes | Broad foundational CSS |
| `src/palaceData.js` | 166,493 bytes | Approximately 233 exported data functions, across multiple product domains |
| `src/main.jsx` | 59,536 bytes | Shell, navigation and route wiring mixed together |

These figures describe maintainability and coupling risks, **not** audited network payloads, database latency, or load times. Bundling and CSS compression can change delivered sizes substantially.

### 1. The main risk is cross-feature coupling

`liveRooms.jsx` held almost every major area: reading, writing, editor, Library, Palace Life, profiles, Treasury, events, comics, and moderation. A small import or state change could introduce a runtime failure in a different room. Splitting modules makes ownership more explicit; it does **not automatically reduce** production JavaScript loading while the shell still eagerly imports them.

### 2. CSS deletion would be premature

The styling cascade contains many overlapping layers that deliberately preserve Nightfall/Daylight appearance, custom chambers, profiles, artwork, badge frames, and mobile layout. A rule can appear redundant but override an older rule on one device or theme. Don't bulk-delete selectors or `!important` overrides without screenshots and regression checks for both themes and responsive widths.

### 3. Data boundaries need their own review

The large `palaceData.js` file contains readers, writers, social features, and other server actions in one import surface. **No Supabase queries, row-level security, database tables, or migrations were rewritten in this pass.** A later refactor should group functions by domain while keeping the original module as a compatibility façade; RLS and actual authorization must be evaluated separately.

### 4. Tests must follow behavior, not file placement

Some launch checks literally expected a string inside `liveRooms.jsx` rather than checking the component where it now lives. We updated those checks after extracting the shared primitives and added direct render tests. Future checks should preferentially assert rendered interactions, routes, privacy constraints and navigation outcomes.

## Changes made in this pass

1. **`src/PalaceLivePrimitives.jsx`** now owns `PalaceDialog` and `State`, preserving the existing portal placement, waiting/empty/error appearance and button behavior.
2. **`src/SettingsRoom.jsx`** contains the unchanged account, privacy, notifications, preferences and deletion controls, with explicit imports.
3. **`src/PalaceActivityRoom.jsx`** contains activity/notifications filters, marking read, saving and dismissal, with explicit imports.
4. **`src/liveRooms.jsx`** retains the original named exports through re-exports; callers don't have to change their routes or import statements.
5. Added **`src/PalaceLivePrimitives.test.jsx`** and **`src/palaceRoomBoundaries.test.js`**; adjusted launch tests to find moved behavior in the correct module.

**Estimated removed from the monolith:** roughly 38,000 bytes; the monolith is still large. The extracted files were moved, not erased. No member-generated content, artwork, frame sizes, collectibles, database records or site destinations were deleted.

## Priority work remaining

| Priority | Next action | Safety check |
| --- | --- | --- |
| P0 | Test real guest-read → signed-in comment, chapter resume, draft save → publish, chat open → send, and mobile Back/Forward flows | Browser-level tests using a non-production test account; exercise full routes, not only unit tests |
| P1 | Extract Library and profile-specific logic into independent room modules with a small shared component interface | Preserve all imported helpers and named route exports; run existing tests after each extraction |
| P1 | Identify redundant CSS selectors with import-order and theme-aware comparison; introduce clear layers/tokens before removing overrides | Nightfall + Daylight screenshots at mobile, tablet and desktop widths; verify collectibles and custom chambers |
| P1 | Review data functions by domain (reader, writing, social, settings, Treasury) and define consistent errors/loading behavior | Preserve exports and Supabase RLS/permissions; compare call behavior and public-vs-private access |
| P2 | Move selected routes to lazily loaded page modules where safe, using existing loading and recovery boundaries | Measure actual bundle output and compare navigation load/performance |
| P2 | Add a scoped lint/static analysis pipeline and remove confirmed unused imports or duplicate hooks | Don't mechanically delete code used by event handlers or dynamic routes |

## Acceptance criteria for deeper cleanup

- No changes to private reading/writing data or existing user holdings.
- No lost navigation routes, public-reading access, or deep links.
- No regressions in editor saving, chapter navigation, mobile modal closing, Nightfall/Daylight contrast, or profile/avatar sizing.
- Each PR/commit group passes the full test and production build; runtime journeys should be exercised before claims of launch readiness.
- Keep the approved watercolor art direction and tier-specific collector styling intact.

This is a staged audit and initial refactor, **not** a completed site-wide CSS or data-architecture rewrite.
