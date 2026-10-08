# The Starry Palace — Beta Release Playbook

## Purpose
Test **ease of use, trust, and reliability** before adding another major feature family. The first-visit tour is optional, and all community activity shown on the homepage must come from published records, not invented engagement.

## Beta cohort
Invite **10–20 consenting volunteers**, ideally a mix of first-time readers, fanfiction writers, original fiction writers, comic readers/artists and at least one accessibility-focused tester. Include newcomers who have never seen the site. No one should need a personal relationship with the site creator to give criticism.

Suggested device/browser matrix:
- Android phone/tablet: Chrome and Samsung Internet where available.
- Windows 11 desktop: Chrome and Edge.
- iOS/iPadOS Safari and macOS browsers when volunteer access permits.
- Keyboard-only navigation and zoom at 200%.
- Both dark and light themes, narrow screens, and slow/intermittent connection.

Do **not** ask participants for passwords, unpublished manuscripts, private messages, financial details, or identifiable personal information.

## Tester workflow
1. Explain that this is a trial and which features may be unfinished. Let testers opt out of any task.
2. Direct them to **/beta**. They can choose a short reader, writer, artist or community track, with the option to show all tasks.
3. Let them attempt tasks without coaching; watch where they stop, backtrack or refresh.
4. Ask the participant to mark **Worked**, **Had trouble**, or **Skipped**. They can add multiple structured issue reports, then copy, share, or save the complete text report and deliver it privately through a channel they choose. The checklist does **not** auto-submit or upload personal notes.
5. Collect only minimal bug details: route, device/browser, approximate time, expected behaviour, observed behaviour, repeatability and severity.
6. Triage problems by impact, fix them, repeat the exact failing steps and run regression tests.
7. Have a second round of at least five volunteers try resolved issues without assistance.

## The beta checkpoints
The built-in tracks contain a subset of 13 optional checkpoints covering: first-arrival discovery, mobile navigation, story filters, resume-reading progress, saved/followed works, private drafts, autosave, recovery under network loss, multiple tags, comics, Palace activities, Council rules, and accessibility/contrast.

## Release gates
**Blocking (must be zero unresolved):**
- Loss of draft content, data corruption, overwriting newer edits with older cloud saves.
- Blank routes that persist after ordinary navigation or cause a refresh loop.
- Incorrect authorization: seeing another member's private work, reports or votes.
- Inability to publish, save or reopen a chapter or authenticate reliably.
- Council voting accepting multiple votes beyond its configured limits.
- Major inaccessible flows for keyboard users.

**Experience targets** (benchmarks for this beta, not existing measurements):
- At least **90% task completion without coaching** for reading, starting a draft, saving, and navigating between rooms.
- At least **80%** of first-time participants can locate the Reading Rooms and Writing Chamber within 30 seconds.
- No reliably reproducible text-loss event in a 30-minute editor session.
- Every high-severity issue has a regression test and a verified retest.
- Good contrast, visible keyboard focus and usable touch targets in both themes.

## Issue report template
- Page/route:
- Device and browser:
- Theme and screen size:
- What I tried:
- Expected:
- Actual:
- Frequency (once / intermittent / every time):
- Severity (blocker / major / minor / suggestion):
- Screenshot or recording if comfortable (crop personal data):
- Can it be reproduced after a normal reload?

## Technical regression checklist
- Run `npm run verify` (the full Vitest suite followed by the production build). The standalone `npm run build` does not run tests.
- Verify protected routes and navigation (desktop and mobile).
- Run two fast successive autosaves while typing; confirm the newest text survives a reload.
- Simulate failed save and reconnect; confirm local recovery is retained until the latest successful save.
- Switch chapters during a pending save; previous chapter must finish first.
- Confirm active reader progress routes to the saved chapter, never to a private or unpublished work.
- Publish an event, then confirm only published, future events appear in the homepage pulse.
- Confirm Council and voting RLS protects private data and result visibility.
- Load slow networks, light mode, zoomed mobile, keyboard-only, reduced-motion.
- Validate error screens recover without hiding existing local draft recovery.
- While typing disposable text on a draft, simulate a stale chunk or a temporary network error and confirm no automatic browser reload occurs. Save or export the text before using the manual recovery button; on ordinary public reading pages confirm recovery is still available.

## Rules for further feature expansion
No new major mechanics until **reliability blockers** are closed and new members can complete the primary reading and writing journeys. Prefer consolidating modules, removing obsolete CSS, and strengthening existing features before expanding the collectible catalogue.

## Tester communications and issue triage
See [TESTER_BRIEF_AND_TRIAGE.md](./TESTER_BRIEF_AND_TRIAGE.md) for permission-first invitation copy, realistic 20-minute sessions, severity categories and a private issue tracker template. Treat unshared reports as unknown outcomes—not successes.

## Follow-up
At the end of the beta, summarize the **top five points of friction**, completion rates, accessibility findings and unresolved blockers. Re-test all blockers on actual devices before the release is declared ready.
