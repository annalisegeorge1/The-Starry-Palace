/**
 * Shared multi-tag query helpers for Reading Rooms, Advanced Search and
 * Search Room filters. Commas, semicolons and new lines separate tag names;
 * spaces and slashes inside names (e.g. "Rick/Michonne") are preserved.
 * A query finds suggestions, it does not add an unverified/fuzzy tag filter.
 */
export function splitTagQueries(value,max=8){
 const limit=Math.max(1,Math.min(16,Math.floor(Number(max)||8)));
 return [...new Set(String(value||'').split(/[,;\n]+/)
  .map(term=>term.trim().toLocaleLowerCase()).filter(Boolean))].slice(0,limit);
}
export function matchesTagQueries(name,value){
 const terms=splitTagQueries(value);
 const candidate=String(name||'').toLocaleLowerCase();
 return terms.length>0&&terms.some(term=>candidate.includes(term));
}
/** Return only unambiguous, exact tag names: fuzzy matches remain selectable by hand. */
export function exactTagQueryMatches(tags,value){
 const names=splitTagQueries(value);
 const resolved=[],unresolved=[],seen=new Set();
 for(const name of names){
  const found=(tags||[]).filter(tag=>String(tag?.name||'').trim().toLocaleLowerCase()===name);
  if(found.length!==1){unresolved.push(name);continue}
  const tag=found[0];
  if(tag?.id&&!seen.has(String(tag.id))){resolved.push(tag);seen.add(String(tag.id))}
 }
 return {matches:resolved,unresolved};
}
/** Search every entered name, not the comma-joined text, then dedupe real tag IDs. */
export async function searchSeveralTags(search,value,category='all',limitPerTerm=35){
 const names=splitTagQueries(value);
 if(!names.length)return [];
 const groups=await Promise.all(names.map(name=>search(name,category,limitPerTerm)));
 const merged=new Map();
 for(const rows of groups)for(const tag of rows||[]){
  if(tag?.id&&!merged.has(String(tag.id)))merged.set(String(tag.id),tag);
 }
 return [...merged.values()];
}
