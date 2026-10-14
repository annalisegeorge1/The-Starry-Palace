import {buildPalaceChronicle,groupPalaceChronicle} from './palaceHistoryArchiveModel';
import {storyHistoryDetails} from './storyHistoryModel';

const millis=value=>{const n=Date.parse(value||'');return Number.isFinite(n)?n:0};
const truncate=(s,max=520)=>String(s||'').replace(/\s+/g,' ').trim().slice(0,max);
const safePercent=value=>Math.max(0,Math.min(100,Math.round(Number(value)||0)));
const available=map=>map&&typeof map==='object'?map:{};

/**
 * One account-private view of public and personal history.
 * Private progress entries are never written to community feeds or public APIs.
 * updated_at is the last saved reading position, NOT a historical visit log.
 */
export function buildLibraryHistoryEntries({progress=[],comicProgress=[],historyChapters={},stories=[],community={},chaptersReady=false}={}){
 const entries=[];
 for(const item of progress||[]){
  const work=item?.works||{},id=item?.work_id||work.id;
  if(!id)continue;
  const at=millis(item.updated_at),changed=millis(work.last_published_at);
  const hasChapters=Object.prototype.hasOwnProperty.call(available(historyChapters),id);
  const chapter=hasChapters?storyHistoryDetails(work,historyChapters[id]):null;
  const newer=Boolean(at&&changed>at);
  const workHref=work.slug?'/work/'+encodeURIComponent(work.slug):null;
  const resumeHref=workHref&&item.chapter_id&&!item.completed?workHref+'/chapter/'+encodeURIComponent(item.chapter_id):null;
  entries.push({
   id:'private-work-'+id,category:'reading',private:true,kind:'reading',at,
   title:work.title||'Story',summary:truncate(work.summary),
   label:newer?'Story updated since your saved place':item.completed?'Finished reading':'Saved reading position',
   href:workHref?(resumeHref&&!newer?resumeHref:workHref):'/reading',resumeHref,lastPublishedAt:changed||null,
   cover:work.cover_url||null,progress:safePercent(item.progress_percent),
   chapterPercent:safePercent(item.chapter_progress_percent),
   completed:!!item.completed&&!newer,
   chapterCount:chapter?.chapterCount??null,wordCount:chapter?.wordCount??null,
   chapterTitle:null,byline:'',newer,room:null
  });
 }
 for(const item of comicProgress||[]){
  const comic=item?.comics||{},id=item?.comic_id||comic.id;
  if(!id)continue;
  const at=millis(item.updated_at),last=millis(comic.last_published_at),newer=Boolean(at&&last>at);
  entries.push({
   id:'private-comic-'+id,category:'reading',private:true,kind:'comic',at,
   title:comic.title||'Comic',summary:'',byline:'',
   label:newer?'New episode since your saved place':item.completed?'Finished comic':'Saved comic reading place',
   href:comic.slug?('/comic/'+encodeURIComponent(comic.slug)+(item.episode_id&&!newer&&!item.completed?'/episode/'+encodeURIComponent(item.episode_id):'')):'/comics',
   cover:item.cover_url||null,completed:!!item.completed&&!newer,
   progress:null,chapterPercent:null,chapterCount:null,wordCount:null,
   chapterTitle:null,newer,room:null
  });
 }
 const publicEntries=buildPalaceChronicle({
  threads:community?.threads||[],
  introductions:community?.communityIntroductions||[],
  highlights:community?.highlights||[],
  stories,chaptersReady
 });
 for(const item of publicEntries)entries.push({
  ...item,category:item.kind==='stories'?'updates':'community',private:false,
  cover:item.kind==='stories'?(stories.find(s=>s.work?.id===item.id.replace(/^story-/,''))?.work?.cover_url||null):null,
  progress:null,completed:null,newer:false
 });
 return entries;
}

export function filterLibraryHistory(entries=[],{category='all',query='',period='any',sort='newest',now=new Date()}={}){
 const q=String(query||'').trim().toLocaleLowerCase();
 const validCategory=['all','reading','updates','community'].includes(category)?category:'all';
 const dayCount={week:7,month:30,year:365}[period]||0;
 const nowMs=now instanceof Date?now.getTime():millis(now);
 const floor=dayCount&&Number.isFinite(nowMs)?nowMs-dayCount*86400000:0;
 const visible=(entries||[]).filter(item=>
  (validCategory==='all'||item.category===validCategory)
  &&(!floor||(item.at>=floor&&item.at<=nowMs))
  &&(!q||[item.title,item.summary,item.label,item.byline,item.chapterTitle].some(x=>String(x||'').toLocaleLowerCase().includes(q)))
 );
 return [...visible].sort((a,b)=>sort==='oldest'?a.at-b.at||a.id.localeCompare(b.id)
  :sort==='title'?a.title.localeCompare(b.title)||b.at-a.at:b.at-a.at||a.id.localeCompare(b.id));
}

export function groupLibraryHistory(entries,sort='newest',now=new Date()){
 if(sort==='title')return entries.length?[{key:'alpha',label:'A–Z',items:entries}]:[];
 return groupPalaceChronicle(entries,now);
}
export const LIBRARY_HISTORY_CATEGORIES=[
 ['all','All history'],['reading','My reading'],['updates','Story updates'],['community','Palace activity']
];
