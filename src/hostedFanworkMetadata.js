import {intakeFandomNames} from './fanworkFandomNavigation';

/**
 * Read curator-supplied metadata already stored alongside a licensed edition.
 * This is descriptive metadata, NOT proof that a fanwork may be hosted.
 * The actual text and independent rights evidence are gated elsewhere.
 */
const RATINGS=new Set(['general','teen','mature','explicit','not_rated']);
const STATUSES=new Set(['in_progress','complete','hiatus','abandoned']);
const TAG_GROUPS=Object.freeze({
 genre:'genres',trope:'tropes',character:'characters',
 relationship:'relationships',warning:'warnings'
});
function cleanText(value,limit=120){
 return typeof value==='string'?value.trim().slice(0,limit):'';
}
function cleanList(value,limit=32){
 if(!Array.isArray(value))return [];
 return [...new Set(value.slice(0,limit).map(item=>cleanText(item)).filter(Boolean))];
}
function cleanHttps(value){
 const text=cleanText(value,1500);
 try{
  const url=new URL(text);
  return url.protocol==='https:'?url.href:'';
 }catch{return ''}
}
export function parseHostedFanworkMetadata(work){
 if(work?.category!=='licensed_fanfiction'&&work?.archive_category!=='licensed_fanfiction')return null;
 const raw=work?.source_notes;
 if(typeof raw!=='string'||!raw.trim()||raw.length>30000)return null;
 let data;
 try{data=JSON.parse(raw)}catch{return null}
 if(!data||typeof data!=='object'||Array.isArray(data))return null;
 const rating=RATINGS.has(data.rating)?data.rating:'not_rated';
 const completionStatus=STATUSES.has(data.completion_status)?data.completion_status:'in_progress';
 const tags=[];
 const add=(category,names)=>{
  for(const name of names)if(!tags.some(t=>t.category===category&&t.name.toLowerCase()===name.toLowerCase()))
   tags.push({category,name});
 };
 const fandomNames=Array.isArray(data.fandom)?
  cleanList(data.fandom).flatMap(intakeFandomNames):intakeFandomNames(cleanText(data.fandom,400));
 add('fandom',[...new Set(fandomNames)].slice(0,15));
 add('format',['Fanfiction','Anime & Manga']);
 const language=cleanText(work.original_language||data.language,40);
 if(language)add('language',[language]);
 for(const [category,key] of Object.entries(TAG_GROUPS))add(category,cleanList(data[key]));
 return {
  rating,sourceRating:cleanText(data.source_rating,100)||null,ratingBasis:rating==='not_rated'?'unrated':'source',
  tags,contentWarnings:cleanList(data.warnings),
  completionStatus,chapters:Number.isSafeInteger(data.chapter_count)&&data.chapter_count>0?data.chapter_count:null,
  sourceUrl:cleanHttps(data.source_url),permissionUrl:cleanHttps(data.permission_url),
  sourceLicense:cleanText(data.license,300)
 };
}
