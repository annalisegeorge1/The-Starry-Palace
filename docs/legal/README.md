# Published legal and community pages

These six Markdown files are the source for the public `/legal` pages:

- `terms-of-service.md` — Terms of Service and Palace Code annex
- `privacy-policy.md` — personal information, including self-declared account age
- `site-rules.md` — community rules
- `cookie-notice.md` — cookies and browser storage
- `ai-policy.md` — member work and AI use
- `donation-rules.md` — voluntary support and external payment links

`src/PalaceLegalPages.jsx` imports the pages as raw Markdown and renders them at `/legal` and `/legal/:policy`. The public drafts remain separate source files and are not imported by the application.

Review the wording whenever the site's data handling, service providers, age checks, payment features or moderation process changes. The published dates in the pages identify this initial version, not a legal review or certification.
