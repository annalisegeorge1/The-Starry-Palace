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
export function filterPalaceSearchGroups(data,{rating='all',completion='all',sort='best'}={}){
 const groups=palaceSearchEmptyGroups();
 if(!data)return groups;
 for(const name of Object.keys(groups)){
  const incoming=Array.isArray(data[name])?data[name]:[];
  if(name!=='works'&&name!=='comics'){groups[name]=incoming;continue}
  const filtered=incoming.filter(work=>
   (rating==='all'||String(work.rating||'not_rated')===rating)
   &&(completion==='all'||String(work.completion_status||'')===completion)
  );
  groups[name]=sort==='best'?filtered:filtered.slice().sort((a,b)=>{
   if(sort==='recent'){
    const at=Date.parse(a.last_published_at||'')||0,bt=Date.parse(b.last_published_at||'')||0;
    return bt-at||String(a.title||'').localeCompare(String(b.title||''));
   }
   if(sort==='title')return String(a.title||'').localeCompare(String(b.title||''),undefined,{sensitivity:'base'});
   return 0;
  });
 }
 return groups;
}
export function countPalaceSearchGroups(groups,scope='all'){
 if(!groups)return 0;
 return scope==='all'
  ?Object.values(palaceSearchEmptyGroups()).reduce((sum,_,index)=>{
    const key=Object.keys(palaceSearchEmptyGroups())[index];
    return sum+(Array.isArray(groups[key])?groups[key].length:0);
   },0)
  :(Array.isArray(groups[scope])?groups[scope].length:0);
}
export function activePalaceSearchFacets({rating='all',completion='all'}={}){
 return rating!=='all'||completion!=='all';
}
