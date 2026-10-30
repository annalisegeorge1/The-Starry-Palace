# The Starry Palace — Discovery & Community Launch

**Status:** Development plan. Do not imply invitations, email subscriptions, or public creator awards are live until actually implemented and tested.

## Who we're inviting
A home for original fiction, fanfiction, poetry, comics, literary classics and creative communities. Read publicly without an account; register to comment, save, follow and participate. The Palace is **not** exclusively a cozy-fiction site.

## First release goals
- A first reader understands the proposition and opens a real story or a reading room.
- The Start Reading slot recommends **only** public, published, completed, general-rated original fiction or poetry. It does **not** claim a story is short unless verified against published chapters.
- Readers can share published public stories using their canonical thestarrypalace.com URL.
- Writers can discover the Writer's Door without login; drafting and community interaction remain gated.
- No invented popular works, testimonials, user counts, or editorial endorsement.

## Early writer outreach (manual, permission-first)
1. Invite 10–20 potential early contributors individually. Ask whether they'd like to review the site's reading/writing experience; don't imply a contract or guaranteed recognition.
2. Reach out to writers in communities **where self-promotion is explicitly permitted**. Check each forum or server's current rules. Do not post canned promotional comments or private-message strangers en masse.
3. Start with a real story excerpt supplied or authorized by its author. Always include rating, fandom/genre where appropriate, and a working public story link. Respect third-party copyright.
4. Encourage writers to publish at their own pace, keep control of their work, and share specific feedback about upload, editing, comments, discoverability and mobile reading.
5. Keep a small consent-based launch contact sheet outside public source control; never commit personal email addresses, contact lists or OAuth credentials to GitHub.

## Suggested invitation wording (edit for each recipient)
> I'm building The Starry Palace, a reading and writing community for original stories, fanfiction, poetry, comics and other creative work. Stories can be read free without an account, and writers choose when to publish. I'm inviting a small group of early writers to try the site and tell me what feels useful or confusing. No obligation to post. Would you be interested in looking around?

Avoid describing this as a paid partnership or promising special badges until those policies exist.

## Search visibility release gate
- Verify Search Console ownership for https://thestarrypalace.com and submit the existing sitemap.
- Confirm rendered title, description, robots and canonical on a **public** story using URL Inspection.
- Current static `public/sitemap.xml` lists top-level routes, **not published story URLs**. Implement a separate, safe story-sitemap generator/server route after validating Pages deployment and public-only data access.
- Do not publish private/unlisted/draft stories, hidden profiles or unpublished chapters into a sitemap.
- JavaScript-applied metadata may be less reliable than server-rendered metadata for unfurlers and search crawlers. Test real story links in Search Console and social share debuggers rather than assuming indexing.
- Check page load on mobile, particularly first-time visitors on slow connections, before advertising broadly.

## Retention: don't build an email list without consent infrastructure
- Newsletter is **not yet live**. Before launching, specify an email provider, explicit opt-in, identity verification, unsubscribe endpoint, frequency, retention period and abuse/rate limits.
- Preserve the existing sign-in requirement for comments to limit spam and protect authors. Avoid claiming "guest comments" are available.
- Do not suggest that authors must migrate all their work; allow a single trial story.

## Practical 30-day test
- Week 1: test the newcomer story path and public share links; inspect search indexing and mobile experience.
- Week 2: invite the first 10 writers by permission-appropriate channels; gather structured feedback.
- Week 3: improve the top three recurring onboarding obstacles; invite a second group if earlier feedback is resolved.
- Week 4: review *aggregated*, privacy-respecting indicators: published works, authors who voluntarily return, story opens, readers who return, comments per published work and self-reported friction. Do not publish member-level reading history.

**Launch decision:** Stay in development until code checks, mobile visual review, canonical sharing and user approval pass.
