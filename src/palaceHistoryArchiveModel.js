/* Shared chronological data for Palace Life's public/member-visible archive.
 * This is NOT personal reading history: that remains inside My Library. */
const epoch=value=>{
 const ms=Date.parse(value||'');
 return Number.isFinite(ms)?ms:0;
};
const readable=value=>String(value??'').trim();
const norm=(value,limit=500)=>readable(value).replace(/\s+/g,' ').slice(0,limit);
const allowedKinds=new Set(['all','stories','forum','stars','highlights']);

export function buildPalaceChronicle({threads=[],introductions=[],highlights=[],stories=[],chaptersReady=false}={}){
 const entries=[];
 for(const thread of threads||[]){
  const at=epoch(thread?.created_at);
  if(!thread?.id||!at)continue;
  entries.push({
   id:'forum-'+thread.id,kind:'forum',at,title:readable(thread.title)||'An open conversation',
   summary:norm(thread.body),label:'Commons conversation',byline:'',
   room:'forum',href:null,chapterCount:null,wordCount:null,chapterTitle:null
  });
 }
 for(const person of introductions||[]){
  const at=epoch(person?.created_at);
  if(!person?.id||!at)continue;
  entries.push({
   id:'star-'+person.id,kind:'stars',at,title:readable(person.title)||readable(person.profiles?.display_name)||'Member introduction',
   summary:norm(person.body),label:'A new star arrived',
   byline:readable(person.profiles?.display_name||person.profiles?.username),
   room:'stars',href:null,chapterCount:null,wordCount:null,chapterTitle:null
  });
 }
 for(const highlight of highlights||[]){
  const at=epoch(highlight?.created_at);
  if(!highlight?.id||!at)continue;
  entries.push({
   id:'highlight-'+highlight.id,kind:'highlights',at,
   title:readable(highlight.title)||readable(highlight.profiles?.display_name)||'Community recognition',
   summary:norm(highlight.reason),label:'Community recognition',
   byline:readable(highlight.profiles?.display_name||highlight.profiles?.username),
   room:'highlights',href:null,chapterCount:null,wordCount:null,chapterTitle:null
  });
 }
 for(const {work,details} of stories||[]){
  if(!work?.id||!work.slug)continue;
  const at=epoch(details?.lastChangedAt)||epoch(work.last_published_at);
  const known=chaptersReady&&Number.isFinite(details?.chapterCount)&&details.chapterCount>0;
  const status=known?(details.changeKind==='updated'?'Chapter updated':details.changeKind==='chapter'?'New chapter published':'Published story'):'Published story';
  entries.push({
   id:'story-'+work.id,kind:'stories',at,
   title:readable(work.title)||'Untitled story',
   summary:norm(work.summary,700),
   label:status,
   byline:readable(work.profiles?.display_name||work.profiles?.username)||'Palace writer',
   room:null,href:'/work/'+encodeURIComponent(work.slug),
   chapterCount:known?details.chapterCount:null,
   wordCount:known?Math.max(0,Number(details.wordCount)||0):null,
   chapterTitle:known?readable(details.chapterTitle):null
  });
 }
 return entries;
}

export function filterPalaceChronicle(entries=[],{kind='all',query='',period='any',sort='newest',now=new Date()}={}){
 const wanted=allowedKinds.has(kind)?kind:'all';
 const search=readable(query).toLocaleLowerCase();
 const validPeriod=['any','week','month','year'].includes(period)?period:'any';
 const days={week:7,month:30,year:365}[validPeriod];
 const nowMs=now instanceof Date?now.getTime():epoch(now);
 const floor=Number.isFinite(nowMs)&&days?nowMs-days*86400000:0;
 const filtered=entries.filter(e=>(wanted==='all'||e.kind===wanted)
  &&(!days||(e.at>0&&e.at>=floor&&e.at<=nowMs))
  &&(!search||[e.title,e.summary,e.label,e.byline,e.chapterTitle].filter(Boolean).join(' ').toLocaleLowerCase().includes(search)));
 return [...filtered].sort((a,b)=>sort==='oldest'?(a.at||0)-(b.at||0)||a.id.localeCompare(b.id):
  sort==='title'?a.title.localeCompare(b.title)||b.at-a.at:(b.at||0)-(a.at||0)||a.id.localeCompare(b.id));
}
export function palaceChronicleBucket(timestamp,now=new Date()){
 if(!timestamp)return 'Date not recorded';
 const date=new Date(timestamp),today=new Date(now);
 if(!Number.isFinite(date.getTime()))return 'Date not recorded';
 const start=d=>new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime();
 const elapsed=Math.floor((start(today)-start(date))/86400000);
 if(elapsed===0)return 'Today';
 if(elapsed===1)return 'Yesterday';
 if(elapsed>=2&&elapsed<7)return 'Earlier this week';
 return date.toLocaleDateString(undefined,{month:'long',year:'numeric'});
}
export function groupPalaceChronicle(entries=[],now=new Date()){
 const groups=[];
 for(const e of entries){
  const label=palaceChronicleBucket(e.at,now);
  const last=groups[groups.length-1];
  if(last?.label===label)last.items.push(e);
  else groups.push({key:label+'-'+groups.length,label,items:[e]});
 }
 return groups;
}
export const PALACE_CHRONICLE_TYPES=[
 ['all','All moments'],['stories','Stories'],['forum','Conversations'],
 ['stars','Introductions'],['highlights','Recognition']
];
