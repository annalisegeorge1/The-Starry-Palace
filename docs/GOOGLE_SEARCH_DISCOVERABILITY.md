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
Search indexing and ranking are **Google's decisions**. Public search queries alone cannot confirm the complete indexing status. Search Console is the authoritative source for crawl and indexing reports. No Google Search Console property or sitemap submission was verified during this work.

Google supports JavaScript rendering, but some crawlers and social link previews do not. Public sections currently receive route-specific metadata after React runs. If Search Console later reports 'Crawled — currently not indexed', failed rendering, soft 404, or incorrect canonical selection, investigate the specific inspected rendered HTML first. Consider static rendering or server-generated head metadata in a separate reviewed release; do not add blanket rewrites that might affect private reader, author or login routes.

## Free Search Console setup — account owner action
1. Visit https://search.google.com/search-console and choose **Add property**. A Domain property named `thestarrypalace.com` covers all protocols and subdomains; Google normally asks for DNS TXT verification. **Do not add or modify DNS without owner approval.** Copy the exact Google-provided verification value when ready; never invent a verification record. Alternatively use the URL-prefix property with a Google-offered verification method.
2. Once ownership is verified, open **Indexing → Sitemaps** and submit `https://thestarrypalace.com/sitemap.xml`. Check for `Success`, discovered URL count and any fetch warnings. Merely declaring a sitemap in robots.txt is helpful, but is not the same as a verified Search Console submission.
3. Use **URL inspection → Test live URL** for `/`, `/writers`, `/reading`, `/fandoms` and `/tags`. Review 'Page fetch', robots eligibility, rendered HTML, selected canonical and status. Request indexing on the most important URL if it is not indexed.
4. In **Performance → Search results**, review queries and pages after Google gathers impressions: branded names (`the starry palace`); writer discovery (`where to publish original stories`, `publish fanfiction`); reader discovery (`read original fiction online`, `fanfiction reading community`). These are *queries to monitor*, not guaranteed ranked keywords.
5. Monitor **Pages indexing** for genuine blockers. Excluded private pages, account settings and internal site-search pages are expected. Never enable indexing of private works simply to raise the URL count.

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
