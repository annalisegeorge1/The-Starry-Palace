# The Starry Palace — architecture and cleanup audit
**Baseline:** 13 October 2026, `main` branch.  
**Scope:** structure, import boundaries, CSS cascade, routine navigation reliability. This is a source audit, **not** a completed security, accessibility, or production-load audit.

## What the repository actually contains

| Area | Source measurement | Implication |
|---|---|---|
| `src/liveRooms.jsx` before this pass | ~677 KB; 27 exported page/room components | One edit can regress unrelated reader, writer, social or comic rooms. Too much is coupled to one eager import. |
| `src/palaceData.js` | ~166 KB; 233 exported functions | A very broad Supabase API surface; difficult to audit query/permission behavior by domain. |
| `src/polish.css` | ~570 KB; ~4,356 blocks and ~3,005 `!important` declarations | Cascade overrides and theme/mobile drift are major maintenance risks. |
| `src/palace-next.css` | ~221 KB | Another large layer of global styles with potential selector overlap. |
| `src/style.css` | ~215 KB | Baseline rules need to remain stable while later style layers are consolidated. |
| Repository | 712 tracked blobs in the recursive tree; 149 `.css` files | Large surface for regressions; file count alone is not proof of duplication or unused code. |

These are source measurements from GitHub, not measured live download size, CPU time, or user-perceived performance.

## Key findings and risk ranking

1. **High — `liveRooms.jsx` is a god module.** Core rooms are imported eagerly from one giant file by `src/main.jsx`. This is the largest architectural risk. Extract public, self-contained rooms first; keep reading and the Writing Studio eager until independent loading and recovery tests exist. Maintain deep links and the `Frame` contract.
2. **High — CSS specificity accumulation.** Styles are spread across overlapping broad selectors and many `!important` declarations. Do **not** mass-delete or merge the CSS files; some are essential to mobile parity, custom chambers, trophies and restored visual effects. Inventory selectors, group by feature, and consolidate one tested family at a time.
3. **High — broad `palaceData.js` API.** Separate query domains logically before splitting physical modules. The database permissions and RLS policies must be checked independently; moving a query between files does not improve data security.
4. **Medium/high — interactions across deep-linked tabs and loading states.** Earlier History and chat regressions proved green builds can miss inactive route runtime errors. Add route-level rendering tests and real browser testing for each high-risk journey.
5. **Medium — import side effects and lazy loading.** Changes to eager imports can reorder styles or create stale-chunk errors. Use the app's existing `importWithRecovery` and `React.Suspense` conventions for non-core routes.
6. **Medium — file size obscures reviews.** Focused components and pure data helpers make change review more reliable. Keep behavioral refactors separate from visual polish and run the complete test/build suite after each meaningful boundary change.

## This pass: safe boundaries established

- Moved **The Palace Code** to `src/PalaceCodeRoom.jsx`.
- Moved **Lost Works** and its archive reader presentation to `src/PalaceLostWorksRoom.jsx`.
- Loaded both public secondary routes lazily from `src/main.jsx` using the established chunk recovery and loading fallback.
- Removed the two component implementations from `src/liveRooms.jsx` (reducing that file by ~12.6 KB), and removed obsolete archive imports.
- Preserved exact public route URLs, `Frame` compatibility, archive filters, citation-only handling, save action, and hosted reader.
- Added focused rendered route tests and updated the provenance regression to read the newly extracted module.

**Important:** This is a small separation of concerns; it does **not** make the much larger `liveRooms.jsx` problem disappear, nor does it establish actual frontend bundle-size improvement without comparing Vite output.

## Recommended next cleanup phases

### Phase 2 — CSS inventory without visual regression
- Map duplicate/high-specificity selectors in `polish.css`, `palace-next.css` and `style.css`.
- Standardize the reading/writing/library/page shell tokens for Nightfall, Daylight and mobile.
- Remove individual redundant declarations only after side-by-side screenshots at phone, tablet and desktop widths; protect personalized colours, frames, watercolours and gradients.

### Phase 3 — feature-level JS seams
- Move simple bounded public rooms next, one per PR, with test fixtures before altering imports.
- For `ReadingLive`, `WritingLive`, `WorkStudioLive` and `ReaderChapter`, start by moving presentational subcomponents or pure helpers. **Do not** split tightly coupled save, scroll or draft recovery effects as a first step.
- Maintain explicit loading/error/offline fallbacks and focus/scroll restoration.

### Phase 4 — data, permissions and reliability
- Inventory `palaceData.js` functions by reading, writing, community, moderation, Treasury and profiles.
- Audit relevant Supabase RLS, storage access, mutation validations and unread/report policies before any data-layer rewrite.
- Test anonymous browse/read, member account operations, draft save and recovery, deep links, chat, and mobile back/forward against a deployed staging preview.

## Guardrails
- No mass deletion, no asset/frame/badge redesign or reward removal, and no rewrite of stored member data.
- Every extraction preserves existing routes and tests, plus adds focused regression coverage.
- A passing unit test and Vite build are necessary but **not** proof of a deployed, fully tested experience.
