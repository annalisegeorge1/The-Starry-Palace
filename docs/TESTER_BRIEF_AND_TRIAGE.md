# The Starry Palace · Tester Invitation & Feedback Triage

**Purpose:** Learn where people struggle before recruiting a larger community. Start with 5–8 volunteers, then expand toward the existing 10–20-person usability pilot. Do not call the site perfect based on automated checks alone.

## Share this tester entrance

**Tester link:** https://the-starry-palace.onrender.com/beta

**When using a parallel preview:** The fixed Render link below is for the existing live host only. Open `/beta` on the actual preview (`*.pages.dev` or future custom domain) and choose **Copy a friendly tester invitation** there. The generated invitation uses that verified page's current origin, so people do not accidentally test an older Render build. Do not share a localhost link. Keep the original Render URL unchanged until an alternative is explicitly tested and approved.

**Short invitation:**
> Hello! I'm inviting a few readers, writers and comic lovers to try The Starry Palace, a new literary community. You don't need technical experience, and there's no obligation to publish. Pick a short testing track and tell me what felt confusing or didn't work. Please use disposable writing when testing the editor. Your checklist and notes stay on your device until you choose to share your report. Would you be interested?
>
> https://the-starry-palace.onrender.com/beta

**For writers specifically:**
> I'd really value your opinion on the Writing Chamber. Could you create a test story, type a few disposable lines, save, leave and reopen it? Please don't upload valuable unpublished work as part of this test. The guide includes an easy way to record issues and share your report privately.
>
> https://the-starry-palace.onrender.com/beta

**Suggested tester mix:** 3 original or fanfiction writers, 2 readers, 1 comic reader/artist, 1 keyboard/accessibility tester, and 1 person entirely new to online writing communities. Ask participants whether they can spare 15–25 minutes, but they may stop at any time.

## How the beta guide works

- Testers choose a **reader**, **writer**, **artist**, or **community** path. Only relevant checkpoints appear by default; they can show all checkpoints.
- For each attempted task, they select **Worked**, **Had trouble**, or **Skipped**. These results do not falsely count skipped tasks as passes.
- They can add **multiple separate issues** with route, steps, expected result, observed result, severity and frequency.
- The guide saves checklist selections and report drafts **only in that browser**. It does **not** send reports automatically. Don't promise feedback has reached the site owner until the tester actually shares it.
- **Shared device:** The beta report is not protected by a member account. Anyone subsequently using the same browser may see its saved notes. Have each volunteer **Copy / Save as text file**, verify their own backup, then choose **Start a fresh tester report** and confirm before passing the device to the next volunteer. Do not reset someone else's in-progress notes without their permission.
- Reports can be **copied**, opened in the device **share sheet**, or **saved as a plain text file**. The tester chooses their recipient and channel.
- Testers should never send passwords, private work, private messages, or screenshots exposing other people's personal information.

## The first 20 minutes

1. **No hints at first:** Ask the tester to open the homepage and find the Reading Rooms and Writing Chamber.
2. **One primary task:** Readers find and open a chapter; writers create an entirely disposable chapter and try saving; artists inspect comics and controls.
3. **Return test:** Navigate elsewhere, then return. Can the reader resume at the right place? Can the writer reopen their test draft without missing text?
4. **Mobile check:** Ask whether navigation is clear in both orientations and whether any content is clipped. Test light and dark themes where practical.
5. **Feedback:** Ask them to mark outcomes in `/beta`, add individual issues and share the report privately through a channel they choose.

**Do not** require users to publish, vote on live Council matters, give app permissions, or deliberately disconnect their internet if that makes them uncomfortable.

## Triage issues as they arrive

Maintain an owner-only list (private document or issue tracker) using:

| ID | Problem | Route | Device | Severity | Reproducible? | Status | Retest result |
|---|---|---|---|---|---|---|---|
| BUG-001 | Example: blank after navigation | /reading | Android Chrome | blocker | unknown | new | — |

Statuses: `new` → `reproducing` → `fixing` → `awaiting retest` → `verified` (or `cannot reproduce`, with evidence).

**Blocker:** writing lost, unable to sign in/save/publish, persistent blank page, private information exposed, unexpected consequential vote. Suspend inviting people to the affected journey and fix first.

**Major:** repeatedly broken core navigation, truncated controls, missing search/filter state, high-impact accessibility barriers.

**Minor:** layout flaws, confusing labels, inconsistent spacing or contrast where functionality remains available.

**Suggestion:** improvements to flow, discoverability, visual feel or wording.

Combine duplicates by root cause, while keeping device/browser evidence. Do not expose names or private reports in a public GitHub issue.

## Questions to ask after a test

- What did you want to do first, and did you find it?
- Was there a moment you had to guess what a button meant?
- Did anything feel slow, crowded, or visually tiring?
- Did you trust that your work or reading place was saved?
- What would make you want to return—and what might stop you?

Ask for one thing they loved and one thing they would change. Avoid prompting them toward positive answers.

## Release decisions

Use the criteria in [BETA_RELEASE_PLAYBOOK.md](./BETA_RELEASE_PLAYBOOK.md). Blockers first. Require a real-device retest after code fixes. Then tackle navigation, mobile usability, accessibility, writer confidence, and finally decorative polish. Don't add more badge, Palace or Council systems during the reliability test window.

**Measuring the pilot:** Track invited participants, task outcomes, total blocker/major/minor reports, and which fixes survived retesting. These figures are targets and observed reports, not engagement counts. If a tester chooses not to share their report, don't assume their tasks passed.
