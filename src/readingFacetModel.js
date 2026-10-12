/** AO3-style precision with Palace-native terminology; only loaded works are
 * filtered here. The UI labels this scope honestly while more pages load. */
export const READING_SORT_OPTIONS=[
 ['updated','Date updated: newest'],
 ['published','Date published: newest'],
 ['oldest','Date published: oldest'],
 ['title','Title: A–Z'],
 ['words','Word count: longest'],
 ['chapters','Chapters: most'],
 ['comments','Comments: most'],
 ['bookmarks','Bookmarks: most'],
];
export const READING_FACET_ORDER=['fandom','character','relationship','warning','genre','trope','additional','theme','mood','setting','format','other'];
export const READING_FACET_NAMES={
 fandom:'Fandoms',character:'Characters',relationship:'Relationships',
 warning:'Content warnings',genre:'Genres',trope:'Tropes',additional:'Additional tags',
 theme:'Themes',mood:'Moods',setting:'Settings',format:'Formats',other:'Other tags'
};
export function readingTagRows(work){
 return (work?.work_tags||[]).map(row=>row?.tags).filter(tag=>
  tag?.id!=null&&tag.name&&['canonical','community'].includes(tag.status)
 );
}
export function buildReadingFacets(works=[]){
 const groups=new Map();
 for(const work of works){
  const seen=new Set();
  for(const tag of readingTagRows(work)){
   const id=String(tag.id);
   if(seen.has(id))continue;
   seen.add(id);
   const family=READING_FACET_ORDER.includes(tag.category)?tag.category:'other';
   const group=groups.get(family)||new Map();
   const previous=group.get(id);
   group.set(id,{id,name:String(tag.name),category:family,count:(previous?.count||0)+1});
   groups.set(family,group);
  }
 }
 return READING_FACET_ORDER.filter(family=>groups.has(family)).map(category=>({
  category,label:READING_FACET_NAMES[category],
  tags:[...groups.get(category).values()].sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name))
 }));
}
export function matchesReadingFacets(work,included=[],excluded=[]){
 const ids=new Set(readingTagRows(work).map(t=>String(t.id)));
 return included.every(id=>ids.has(String(id)))&&!excluded.some(id=>ids.has(String(id)));
}
export function sortReadingWorks(works=[],sort='updated'){
 const date=(w,key)=>{const time=Date.parse(w?.[key]||'');return Number.isFinite(time)?time:null};
 const metric=(w,key)=>{const value=w?.reading_stats?.[key];return value===null||value===undefined||!Number.isFinite(Number(value))?null:Number(value)};
 const keys=['words','chapters','comments','bookmarks'];
 return [...works].sort((a,b)=>{
  if(sort==='title')return String(a.title||'').localeCompare(String(b.title||''))||String(a.id).localeCompare(String(b.id));
  const val=w=>keys.includes(sort)?metric(w,sort):date(w,sort==='updated'?'last_published_at':'first_published_at');
  const av=val(a),bv=val(b);
  // Missing aggregated metadata must not place a work ahead of known values.
  if(av===null&&bv!==null)return 1;
  if(bv===null&&av!==null)return -1;
  if(av!==null&&bv!==null&&av!==bv)return sort==='oldest'?av-bv:bv-av;
  return (date(b,'last_published_at')||0)-(date(a,'last_published_at')||0)||String(a.title||'').localeCompare(String(b.title||''))||String(a.id).localeCompare(String(b.id));
 });
}
