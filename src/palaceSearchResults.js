import {READING_FACET_ORDER,READING_FACET_NAMES,readingRelationshipTypes,matchesReadingRelationships} from './readingFacetModel';

/**
 * Small client-side refinements for results already found by the Palace.
 * Server visibility, rights and query ranking remain authoritative.
 */
export const SEARCH_RESULT_KINDS=Object.freeze([
 ['all','All rooms'],['works','Stories'],['comics','Comics'],
 ['members','Members'],['tags','Tags'],['clubs','Clubs'],['archive','Classics & archive']
]);
export const SEARCH_RATINGS=Object.freeze([
 ['all','Any rating'],['general','G · General'],['teen','T · Teen'],
 ['mature','M · Mature'],['explicit','E · Explicit'],['not_rated','NR · Not rated']
]);
export const SEARCH_COMPLETION=Object.freeze([
 ['all','Any status'],['complete','Complete'],['in_progress','In progress'],['hiatus','Hiatus']
]);
export function palaceSearchEmptyGroups(){
 return {works:[],comics:[],members:[],tags:[],clubs:[],archive:[]};
}
export function filterPalaceSearchGroups(data,{
 rating='all',completion='all',sort='best',
 includeTags=[],excludeTags=[],includeRelationships=[],excludeRelationships=[]
}={}){
 const tagMatches=work=>{
  const ids=new Set((work.facet_tags||[]).map(x=>String(x?.id||'')).filter(Boolean));
  return includeTags.every(id=>ids.has(String(id)))&&!excludeTags.some(id=>ids.has(String(id)));
 };
 const groups=palaceSearchEmptyGroups();
 if(!data)return groups;
 for(const name of Object.keys(groups)){
  const incoming=Array.isArray(data[name])?data[name]:[];
  if(name!=='works'&&name!=='comics'){groups[name]=incoming;continue}
  const filtered=incoming.filter(work=>
   (rating==='all'||String(work.rating||'not_rated')===rating)
   &&(completion==='all'||String(work.completion_status||'')===completion)
   &&tagMatches(work)
   &&matchesReadingRelationships(work,includeRelationships,excludeRelationships)
  );
  groups[name]=sort==='best'?filtered:filtered.slice().sort((a,b)=>{
   if(sort==='recent'){
    const at=Date.parse(a.last_published_at||'')||0,bt=Date.parse(b.last_published_at||'')||0;
    return bt-at||String(a.title||'').localeCompare(String(b.title||''));
   }
   if(sort==='oldest'){
    const at=Date.parse(a.last_published_at||'')||0,bt=Date.parse(b.last_published_at||'')||0;
    return at-bt||String(a.title||'').localeCompare(String(b.title||''));
   }
   if(sort==='title_desc')return String(b.title||'').localeCompare(String(a.title||''),undefined,{sensitivity:'base'});
   if(sort==='title')return String(a.title||'').localeCompare(String(b.title||''),undefined,{sensitivity:'base'});
   return 0;
  });
 }
 return groups;
}
export function countPalaceSearchGroups(groups,scope='all'){
 if(!groups)return 0;
 return scope==='all'
  ?Object.keys(palaceSearchEmptyGroups()).reduce((sum,key)=>sum+(Array.isArray(groups[key])?groups[key].length:0),0)
  :(Array.isArray(groups[scope])?groups[scope].length:0);
}
export function activePalaceSearchFacets({
 rating='all',completion='all',sort='best',
 includeTags=[],excludeTags=[],includeRelationships=[],excludeRelationships=[]
}={}){
 return rating!=='all'||completion!=='all'||sort!=='best'
  ||includeTags.length>0||excludeTags.length>0||includeRelationships.length>0||excludeRelationships.length>0;
}

/** Expose only verified tag metadata from the displayed search result set. */
export function buildSearchTagFacets(data){
 const byCategory=new Map();
 for(const work of [...(data?.works||[]),...(data?.comics||[])]){
  const seen=new Set();
  for(const tag of work?.facet_tags||[]){
   if(!tag?.id||!tag.name||!['canonical','community'].includes(tag.status))continue;
   const id=String(tag.id);
   if(seen.has(id))continue;seen.add(id);
   const category=READING_FACET_ORDER.includes(tag.category)?tag.category:'other';
   const group=byCategory.get(category)||new Map();
   const item=group.get(id);
   group.set(id,{id,name:tag.name,category,count:(item?.count||0)+1});
   byCategory.set(category,group);
  }
 }
 return READING_FACET_ORDER.filter(key=>byCategory.has(key))
  .map(category=>({
   category,label:READING_FACET_NAMES[category],
   tags:[...byCategory.get(category).values()].sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name))
  }));
}

