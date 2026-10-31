# Production security release 3 — lore privacy and age-restricted bookmark counts

**Live migrations (31 October 2026):** `hide_unpublished_lore_chapter_metadata` and `age_guard_reading_room_bookmark_counts` on production project `sservftxygunkacmwsad`.

- Applied the independently reviewed SQL proposals:
  - `database/PROPOSED-hide-unpublished-lore-chapter-metadata-2026-10-31.sql`
  - `database/PROPOSED-guard-bookmark-counts-by-reader-age-2026-10-31.sql`
- Previous production read-only preflight: 9 works, including published works with age requirements 16 and 18; 10 chapters; 1 lore item; 1 saved-work row; zero collaboration invitations. No member-written text or private media was read.
- **Lore postflight:** actual production function definition checks confirmed that unpublished chapter unlock UUID/title are hidden for ordinary readers; `anon` EXECUTE grant retained and unknown work UUID returns `[]`.
- **Bookmark postflight:** production function uses `private.member_meets_age(w.minimum_reader_age)`; `anon` and authenticated EXECUTE privileges retained. SQL executed as `anon` verified that none of the published 16+/18+ works produced a bookmark-count row.
- These changes only replace SQL functions; no member data updates, file operations, DNS, Cloudflare, or frontend deployment.
- **Rollback:** use the original function definitions captured in the read-only production audit and recorded in prior PR history, then reverify grants/signatures and behavior. A rollback would reintroduce disclosed metadata/statistics; prefer fix-forward if an API regression occurs.
- **Remaining:** full member browser/device regression tests, six? See current PR for count of outstanding proposals; other reward and tag aggregate changes remain staged. No paid services.
