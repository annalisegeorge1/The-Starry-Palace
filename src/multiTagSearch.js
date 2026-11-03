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
 // Interleave each name's suggestions so the first 24 visible options
 // do not all come from one broad term.
 const merged=new Map();
 const total=Math.max(0,...groups.map(rows=>rows?.length||0));
 for(let index=0;index<total;index++){
  for(const rows of groups){
   const tag=rows?.[index];
   if(tag?.id&&!merged.has(String(tag.id)))merged.set(String(tag.id),tag);
  }
 }
 return [...merged.values()];
}

/** A comma/semicolon-separated query with 2+ names is intended as tags.
 * Single-word queries and ordinary phrases retain the normal text search. */
export function isMultiTagPhrase(value){
 return /[,;\n]/.test(String(value||''))&&splitTagQueries(value).length>=2;
}
/** Only switch to ID-based AND filtering when *every* term is a unique,
 * accepted exact tag. Partial/fuzzy names remain ordinary text searches. */
export function resolveMultiTagPhrase(value,tags){
 if(!isMultiTagPhrase(value))return {complete:false,matches:[],unresolved:[]};
 const terms=splitTagQueries(value);
 const {matches,unresolved}=exactTagQueryMatches(
  (tags||[]).filter(t=>['canonical','community'].includes(t?.status)),value
 );
 return {complete:unresolved.length===0&&matches.length===terms.length,matches,unresolved};
}
