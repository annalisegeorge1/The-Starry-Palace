/* A read-only overview of existing My Library data. No new tables or writes. */
const list=value=>Array.isArray(value)?value:[];
const timestamp=value=>{
 const parsed=Date.parse(value||'');
 return Number.isFinite(parsed)?parsed:0;
};
export function newerPublishedSince(lastPublished,progressUpdated){
 const published=timestamp(lastPublished),lastRead=timestamp(progressUpdated);
 return Boolean(published&&lastRead&&published>lastRead);
}
const route=(type,slug,id=null)=> {
 if(typeof slug!=='string'||!slug.trim())return null;
 const base=(type==='comic'?'/comic/':'/work/')+encodeURIComponent(slug);
 return id?base+(type==='comic'?'/episode/':'/chapter/')+encodeURIComponent(String(id)):base;
};
function toReadingStory(entry){
 const work=entry?.works;
 const base=route('story',work?.slug);
 if(!entry?.work_id||!base)return null;
 const newer=newerPublishedSince(work.last_published_at,entry.updated_at);
 const finished=Boolean(entry.completed&&!newer);
 return {key:'story:'+entry.work_id,type:'story',title:work.title||'Untitled story',
  cover:work.cover_url||null,href:newer&&entry.completed?base:route('story',work.slug,entry.chapter_id)||base,
  overviewHref:base,updatedAt:entry.updated_at||'',progress:entry.chapter_progress_percent,
  subtitle:newer?'New chapter since your last reading':finished?'Finished story':'Continue reading',
  newer,finished};
}
function toReadingComic(entry){
 const comic=entry?.comics;
 const base=route('comic',comic?.slug);
 if(!entry?.comic_id||!base)return null;
 const newer=newerPublishedSince(comic.last_published_at,entry.updated_at);
 const finished=Boolean(entry.completed&&!newer);
 return {key:'comic:'+entry.comic_id,type:'comic',title:comic.title||'Untitled comic',
  cover:entry.cover_url||null,href:newer&&entry.completed?base:route('comic',comic.slug,entry.episode_id)||base,
  overviewHref:base,updatedAt:entry.updated_at||'',progress:null,
  subtitle:newer?'New episode since your last reading':finished?'Finished comic':'Continue reading',
  newer,finished};
}
const dedupe=rows=>{
 const seen=new Set();
 return rows.filter(row=>{if(!row||seen.has(row.key))return false;seen.add(row.key);return true});
};
export function buildLibraryOverview(library={},organizers={}){
 const progress=list(library?.progress),comicProgress=list(library?.comicProgress);
 const reading=dedupe([...progress.map(toReadingStory),...comicProgress.map(toReadingComic)])
  .sort((a,b)=>timestamp(b.updatedAt)-timestamp(a.updatedAt));
 const active=reading.filter(item=>!item.finished);
 const finished=reading.filter(item=>item.finished);
 const readStories=new Set(progress.map(row=>String(row.work_id)));
 const readComics=new Set(comicProgress.map(row=>String(row.comic_id)));
 const savedForLater=dedupe([
  ...list(library?.saved).filter(row=>row?.works?.id&&!readStories.has(String(row.works.id))).map(row=>{
   const work=row.works,href=route('story',work.slug);
   return href?{key:'story:'+work.id,type:'story',title:work.title||'Untitled story',cover:work.cover_url||null,href,subtitle:'Saved story',updatedAt:row.saved_at||''}:null;
  }),
  ...list(library?.savedComics).filter(row=>row?.comics?.id&&!readComics.has(String(row.comics.id))).map(row=>{
   const comic=row.comics,href=route('comic',comic.slug);
   return href?{key:'comic:'+comic.id,type:'comic',title:comic.title||'Untitled comic',cover:row.cover_url||null,href,subtitle:'Saved comic',updatedAt:row.saved_at||''}:null;
  })
 ]).sort((a,b)=>timestamp(b.updatedAt)-timestamp(a.updatedAt));
 const storyProgress=new Map(progress.filter(x=>x?.work_id).map(x=>[String(x.work_id),x]));
 const comicProgressById=new Map(comicProgress.filter(x=>x?.comic_id).map(x=>[String(x.comic_id),x]));
 const updates=dedupe([
  ...list(library?.subscriptions).filter(row=>row?.enabled!==false).map(row=>{
   const work=row?.works,p=storyProgress.get(String(row?.work_id)),href=route('story',work?.slug);
   return href&&p&&newerPublishedSince(work.last_published_at,p.updated_at)?{
    key:'story:'+row.work_id,type:'story',title:work.title||'Untitled story',href,subtitle:'New published chapter',updatedAt:work.last_published_at
   }:null;
  }),
  ...list(library?.comicSubscriptions).filter(row=>row?.enabled!==false).map(row=>{
   const comic=row?.comics,p=comicProgressById.get(String(row?.comic_id)),href=route('comic',comic?.slug);
   return href&&p&&newerPublishedSince(comic.last_published_at,p.updated_at)?{
    key:'comic:'+row.comic_id,type:'comic',title:comic.title||'Untitled comic',href,subtitle:'New published episode',updatedAt:comic.last_published_at
   }:null;
  })
 ]).sort((a,b)=>timestamp(b.updatedAt)-timestamp(a.updatedAt));
 return {
  counts:{reading:active.length,finished:finished.length,later:savedForLater.length,
   saved:list(library?.saved).length+list(library?.savedComics).length,
   subscriptions:list(library?.subscriptions).length+list(library?.comicSubscriptions).length,
   writers:list(library?.followedWriters).length,collections:list(organizers?.collections).length,
   lists:list(organizers?.lists).length,notes:list(organizers?.notes).length,updates:updates.length},
  continueReading:active.slice(0,4),savedForLater:savedForLater.slice(0,4),updates:updates.slice(0,4),
  collectionPreview:list(organizers?.collections).slice(0,3).map(x=>({id:x.id,name:x.name||'Untitled collection'})),
  listPreview:list(organizers?.lists).slice(0,3).map(x=>({id:x.id,name:x.name||'Untitled reading list'}))
 };
}
