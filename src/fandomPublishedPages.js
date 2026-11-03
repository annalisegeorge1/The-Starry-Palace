/**
 * Paginate real published works for selected fandom tags via the site's existing
 * indexed published-search RPC. No new SQL or permission rules are required.
 *
 * Multi-fandom "any" combines one server-side page per selected tag (the
 * archive RPC's include list is an AND). "All" uses a single AND query.
 *
 * The RPC may return members-only records for a signed-in session, so every
 * result must be independently verified as PUBLIC before returning it to
 * the anonymous Fandom Atlas / fanfiction catalogue.
 */
const UUID=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
export const FANDOM_STORY_PAGE_SIZE=24;
export const eligibleFandomIds=ids=>[...new Set((Array.isArray(ids)?ids:[])
 .map(id=>String(id)).filter(id=>UUID.test(id)))].slice(0,5);

export async function paginatePublicFandomStories({
 tagIds=[],mode='any',offset=0,limit=FANDOM_STORY_PAGE_SIZE,
 verifyFandoms,searchPublished,listPublicIds
}={}){
 const chosen=eligibleFandomIds(tagIds);
 const start=Math.max(0,Math.min(100000,Math.floor(Number(offset)||0)));
 const size=Math.min(48,Math.max(1,Math.floor(Number(limit)||FANDOM_STORY_PAGE_SIZE)));
 const empty={results:[],hasMore:false,offset:start,limit:size};
 if(!chosen.length)return empty;
 const verified=await verifyFandoms(chosen);
 if(!Array.isArray(verified))throw Error('The selected fandoms could not be verified.');
 const accepted=new Set(verified.map(String));
 const actual=chosen.filter(id=>accepted.has(id));
 if(!actual.length||mode==='all'&&actual.length!==chosen.length)return empty;
 const batches=mode==='all'?[actual]:actual.map(id=>[id]);
 const pages=await Promise.all(batches.map(include=>searchPublished({
  include,offset:start,limit:size,sort:'updated',origin:'all'
 })));
 for(const page of pages){
  // The published-search RPC supplies both a page and its total from the
  // same database query. A short middle page must not silently skip works.
  const total=Number(page?.total);
  const expected=Math.min(size,Math.max(0,total-start));
  if(!page||!Array.isArray(page.results)||!Number.isSafeInteger(total)
   ||total<0||page.results.length!==expected)
   throw Error('Fandom search was incomplete. Older works have not been marked missing.');
 }
 const found=new Map();
 for(const page of pages)for(const work of page.results){
  if(work?.id&&!found.has(String(work.id)))found.set(String(work.id),work);
 }
 const ids=[...found.keys()];
 if(!ids.length)return {...empty,hasMore:pages.some(page=>Number(page.total)>start+size)};
 const publicIDs=await listPublicIds(ids);
 if(!Array.isArray(publicIDs))throw Error('Public visibility could not be verified.');
 const allowed=new Set(publicIDs.map(String));
 const results=[...found.entries()].filter(([id])=>allowed.has(id)).map(([,work])=>work)
  .sort((a,b)=>String(b.last_published_at||'').localeCompare(String(a.last_published_at||''))
   ||String(a.id).localeCompare(String(b.id)));
 return {...empty,results,hasMore:pages.some(page=>Number(page.total)>start+size)};
}
