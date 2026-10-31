# Production security release 4 — readable-only praise statistics

**Deployment:** Supabase production project `sservftxygunkacmwsad`; migration `restrict_praise_state_to_readable_work_chapter`, 31 October 2026.

**Scope:** Applied the reviewed `database/PROPOSED-restrict-praise-state-visibility-2026-10-31.sql` to `public.get_palace_praise_state(text,uuid)`. The privileged RPC now checks the manuscript's publication, visibility and minimum reader age, or chapter access, before returning aggregate counts. Inaccessible/nonexistent target IDs return neutral reaction counts and no personal reaction, preserving response keys.

**$0 staging evidence:** Using synthetic only, a rollback-only hosted PostgreSQL test verified guest access to ordinary public reactions but denied 18+, drafts and chapter metadata. Another test verified signed-in 14-year-old can't see 18+ reaction counts, can see 13+ reactions, and adult can see 18+. No real member profiles or manuscripts were copied.

**Production postflight:** Confirmed age and chapter-access predicates are present in the installed function; anonymous EXECUTE privilege remains; a synthetic nonexistent ID returns neutral `{praise:null,counts:{heart:0,star:0,moon:0,crown:0}}`. No member tables were updated; existing praise and Celestial Point balances unchanged.

**Remaining:** Separate age-aware awards for shares/praise, tag aggregate discovery (three remaining proposed SQL files), chat photo frontend, no-AI-training crawler controls, secure backups, full author/editor browser smoke testing. The new function has not been tested with actual production member sessions; do not claim full end-to-end proof.

**Rollback:** Restore previous `get_palace_praise_state(text,uuid)` function only if essential for service restoration, knowing that it reintroduces the information leak. Prefer fix-forward. Do not modify live praise rows, balances or catalogues as part of rollback.
