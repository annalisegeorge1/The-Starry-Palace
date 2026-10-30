/** AO3-style precision with Palace-native terminology; only loaded works are
 * filtered here. The UI labels this scope honestly while more pages load. */
export const READING_SORT_OPTIONS=[
 ['updated','Updated: newest first','archive'],
 ['published','Published: newest first','archive'],
 ['oldest','Published: oldest first','archive'],
 ['title','Title: A–Z','archive'],
 ['words','Word count: longest first','archive'],
 ['chapters','Chapters: most first','archive'],
 ['comments','Comments: most first','archive'],
 ['updated_oldest','Updated: oldest first','loaded'],
 ['title_desc','Title: Z–A','loaded'],
 ['words_asc','Word count: shortest first','loaded'],
 ['chapters_asc','Chapters: fewest first','loaded'],
 ['comments_asc','Comments: fewest first','loaded'],
 ['bookmarks','Bookmarks: most first','loaded'],
 ['bookmarks_asc','Bookmarks: fewest first','loaded']
];
/** The live archive RPC supports only the archive-marked modes. */
export const isArchiveReadingSort=key=>READING_SORT_OPTIONS.some(([id,,scope])=>id===key&&scope==='archive');
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
 const numericSorts=new Set(['words','words_asc','chapters','chapters_asc','comments','comments_asc','bookmarks','bookmarks_asc']);
 const key=sort.replace(/_asc$/,'');
 const metric=w=>{const value=w?.reading_stats?.[key];return value==null||value===''||!Number.isFinite(Number(value))?null:Number(value)};
 const dateKey=['published','oldest'].includes(sort)?'first_published_at':'last_published_at';
 const ascending=['oldest','updated_oldest','words_asc','chapters_asc','comments_asc','bookmarks_asc'].includes(sort);
 const titleSort=(a,b)=>String(a?.title||'').localeCompare(String(b?.title||''),undefined,{sensitivity:'base',numeric:true});
 const tie=(a,b)=>(date(b,'last_published_at')??0)-(date(a,'last_published_at')??0)||titleSort(a,b)||String(a?.id||'').localeCompare(String(b?.id||''));
 return [...(Array.isArray(works)?works:[])].sort((a,b)=>{
  if(['title','title_desc'].includes(sort)){
   const diff=titleSort(a,b);
   return (sort==='title_desc'?-diff:diff)||tie(a,b);
  }
  const av=numericSorts.has(sort)?metric(a):date(a,dateKey);
  const bv=numericSorts.has(sort)?metric(b):date(b,dateKey);
  if(av==null&&bv!=null)return 1;
  if(bv==null&&av!=null)return -1;
  if(av!=null&&bv!=null&&av!==bv)return ascending?av-bv:bv-av;
  return tie(a,b);
 });
}
