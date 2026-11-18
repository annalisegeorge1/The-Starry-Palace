# Google discoverability — The Starry Palace

**Prepared:** 17 November 2026  
**Domain:** https://thestarrypalace.com  
**Goal:** Help readers searching for original stories or fanfiction, and writers looking for places to publish their own work, discover the public Palace.

## What is implemented in the repository
- Public homepage, Writer's Door (`/writers`), Reading Rooms (`/reading`), fandoms and tags use accurate search-focused titles, descriptions and canonical URLs when React renders.
- The initial HTML includes a descriptive homepage title, summary and WebSite site-name structured data. The SPA intentionally does not ship a hard-coded homepage canonical on every deep link: route-aware metadata is applied when the app renders.
- `public/robots.txt` welcomes ordinary search indexing while retaining existing opt-outs for named AI-training crawlers, including Google-Extended (distinct from Googlebot).
- `public/sitemap.xml` lists indexable public sections, including the public tags directory. It intentionally does **not** list members-only pages, private drafts, internal search URLs, or unverified member works.
- The public Writer's Door and homepage include useful human-facing explanations of original fiction, fanfiction, private drafting, reader permissions and discovering stories. No guarantee of traffic, audience or rankings.

## Important limitation
Search indexing and ranking are **Google's decisions**. Public search queries alone cannot confirm the complete indexing status. Search Console is the authoritative source for crawl and indexing reports. Search Console **property, sitemap-submission and page-indexing status must be checked in the owner's account** before claiming success. Do not publish private performance or indexing notifications in this public repository.

Google supports JavaScript rendering, but some crawlers and social link previews do not. Public sections currently receive route-specific metadata after React runs. If Search Console later reports 'Crawled — currently not indexed', failed rendering, soft 404, or incorrect canonical selection, investigate the specific inspected rendered HTML first. Consider static rendering or server-generated head metadata in a separate reviewed release; do not add blanket rewrites that might affect private reader, author or login routes.

## Google Search Console follow-through — owner account

1. Visit https://search.google.com/search-console and **select the existing property if it is already verified**. Do not add a duplicate property or modify DNS unnecessarily. If it is *not* already verified, use the verification method Google explicitly supplies, and obtain approval before any production DNS edit.
2. Open **Indexing → Pages**. For any **Excluded by 'noindex' tag** and **Page with redirect** warnings, inspect the affected URL examples, not just the notification's generic reason. These categories can be entirely expected:
   - **Intended noindex:** login/authentication, unpublished or non-public manuscripts, settings, internal `/search` results, and member-private pages.
   - **Intended redirects:** canonical URL changes, deliberate legacy redirects, sign-in and authorization flows.
   - **Investigate:** the public homepage, `/writers`, `/reading`, `/fandoms`, `/tags`, `/comics`, and genuinely published, public stories if they appear in either category unexpectedly.
3. For a questionable URL, use **URL inspection → Test live URL**. Compare rendered HTML, final URL, **Indexing allowed**, and **Google-selected canonical**. Confirm any fix on the exact affected URL before requesting indexing or validation. Search Console's historical reports can lag newly deployed changes.
4. Open **Indexing → Sitemaps**, and check whether `https://thestarrypalace.com/sitemap.xml` is already recorded as **Success**. Submit only if the sitemap is missing; a robots.txt declaration by itself is not proof of successful Search Console submission.
5. In **Performance → Search results**, compare *actual* clicks, impressions, CTR, queries and pages for relevant non-branded searches, including writer queries (`publish fanfiction`, `where to publish original stories`) and reader queries (`read original fiction online`). Do not infer rankings from an email milestone or a single site: search.
6. If Search Console exports a specific list of affected public URLs, document and fix **only the confirmed public problem**. Never remove `noindex` from private drafts, member settings or gated works in pursuit of larger indexed-URL counts.

**Access limitation:** This repository cannot authenticate to a private Search Console report, submit its sitemap, or see current indexed URL examples. Those operations require the property owner's account or an explicitly authorized Search Console integration. No unrelated DNS, access-control, billing, auth or database change is part of this work.

## Release validation
- Confirm `/robots.txt` serves text and includes a Sitemap line; `/sitemap.xml` serves valid XML with public URLs.
- Confirm the rendered `/writers` HTML title describes publishing original fiction and fanfiction, has an `index,follow` robots tag and a canonical URL ending in `/writers`.
- Confirm rendered `/reading`, `/fandoms`, `/tags` titles and canonical URLs match their paths.
- Confirm `/search`, private work and unpublished chapter routes remain `noindex`.
- Check both mobile and desktop. Avoid changing member security, auth, DNS, AI crawler restrictions or private reading access during SEO work.

## References
- Google Search Essentials: https://developers.google.com/search/docs/essentials
- JavaScript SEO: https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
- Sitemaps: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- Search Console property setup: https://support.google.com/webmasters/answer/34592
- URL Inspection: https://support.google.com/webmasters/answer/9012289
