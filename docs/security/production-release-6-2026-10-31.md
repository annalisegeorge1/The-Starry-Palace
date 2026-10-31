# Production security release 6 — tag statistics privacy

**Production Supabase migration:** `privacy_aware_public_tag_search_counts` on project `sservftxygunkacmwsad`; 31 October 2026.

**Purpose:** Previously tag searches counted use by hidden, draft and age-ineligible works and comics. This could leak indirect discovery metadata. Applied `database/PROPOSED-public-tag-counts-visible-content-only-2026-10-31.sql`, replacing only the SQL bodies of:
- `public.search_palace_tags(text,text,integer)`
- `public.search_palace_tags_v2(text,text,integer)`
- `public.get_tag_family_counts()`

All response signatures, public tag names, category/status filtering and fuzzy ranking code were preserved.

**Staging:** Real hosted isolated Supabase test with 4,015 synthetic tags, invented public published 13+/18+ stories and comic panels, and private/draft content. Rollback-only test passed: guests see zero counts for all 13+ tagged works; signed-in 14-year-old sees eligible 13+ work/comic counts (2); signed-in adult sees the additional 18+ work (3); private/draft not counted; normal legacy and v2 80-result caps intact. One 4k-row benchmark query on hosted staging completed in 3.358 ms for tag family counts; this is not a full production latency benchmark.

**Production postflight:** Verified all three functions include reader-age checks; an anonymous search returned 200 rows with 15 tagged uses within the result set, and `get_tag_family_counts` returned 15 categories. These are smoke checks, not guaranteed latency/SLA proof. No content, accounts, tags or story records were modified.

**Rollback:** If a measurable production performance or display regression occurs, restore previously captured original definitions of the same three RPCs while preserving signatures and grants, with explicit acknowledgement that the old definitions count hidden/age-ineligible work. Prefer fix-forward.

**Not deployed in this migration:** the staged frontend authenticated chat-photo improvement, robots.txt crawler opt-out, new Cloudflare security headers or account recovery/backups. The larger draft PR remains unmerged.
