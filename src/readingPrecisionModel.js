/**
 * Loaded-shelf precision only. Full-archive date/crossover filtering requires
 * independently reviewed server-side search support before it can be offered.
 * Accepted fandom metadata, not guesses from titles, determines crossovers.
 */
export const READING_PRECISION_DEFAULTS=Object.freeze({
 includeMinWords:'',includeMaxWords:'',excludeMinWords:'',excludeMaxWords:'',
 dateField:'updated',includeFrom:'',includeTo:'',excludeFrom:'',excludeTo:'',
 crossover:'all'
});
const WORD_KEYS=['includeMinWords','includeMaxWords','excludeMinWords','excludeMaxWords'];
const DATE_KEYS=['includeFrom','includeTo','excludeFrom','excludeTo'];
const word=value=>{
 if(value===null||value===undefined||String(value).trim()==='')return '';
 if(!/^\d{1,9}$/.test(String(value).trim()))return '';
 const number=Number(value);
 return Number.isSafeInteger(number)&&number>=0&&number<=100000000?String(number):'';
};
const date=value=>{
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return '';
 const time=Date.parse(value+'T00:00:00.000Z');
 return Number.isFinite(time)&&new Date(time).toISOString().slice(0,10)===value?value:'';
};
export function cleanReadingPrecision(value){
 const input=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
 const result={...READING_PRECISION_DEFAULTS};
 for(const key of WORD_KEYS)result[key]=word(input[key]);
 for(const key of DATE_KEYS)result[key]=date(input[key]);
 if(['updated','published'].includes(input.dateField))result.dateField=input.dateField;
 if(['all','include','exclude'].includes(input.crossover))result.crossover=input.crossover;
 return result;
}
export function readingPrecisionCount(value){
 const p=cleanReadingPrecision(value);
 return Number(Boolean(p.includeMinWords||p.includeMaxWords))+
  Number(Boolean(p.excludeMinWords||p.excludeMaxWords))+
  Number(Boolean(p.includeFrom||p.includeTo))+
  Number(Boolean(p.excludeFrom||p.excludeTo))+
  Number(p.crossover!=='all');
}
export const hasReadingPrecision=value=>readingPrecisionCount(value)>0;

function inRange(value,from,to){
 if(value==null||value==='')return false;
 return (!from||value>=from)&&(!to||value<=to);
}
function day(value){
 if(!value)return null;
 const stamp=Date.parse(value);
 return Number.isFinite(stamp)?new Date(stamp).toISOString().slice(0,10):null;
}
function recordedCrossover(work){
 if(typeof work?.is_crossover==='boolean')return work.is_crossover;
 // Count different accepted fandom IDs only. A slash relationship tag
 // or the word "crossover" in the title is never evidence of a crossover.
 const fandomIds=new Set((work?.work_tags||[])
  .map(row=>row?.tags||row)
  .filter(tag=>tag?.category==='fandom'&&['canonical','community'].includes(tag.status)&&tag.id!=null)
  .map(tag=>String(tag.id)));
 return fandomIds.size>=2;
}
export function matchesReadingPrecision(work,filters){
 const p=cleanReadingPrecision(filters);
 const words=work?.reading_stats?.words;
 const n=words===null||words===undefined||words===''?null:Number(words);
 const knownWords=n!==null&&Number.isFinite(n)&&n>=0?n:null;
 if((p.includeMinWords||p.includeMaxWords)&&!inRange(knownWords,p.includeMinWords?Number(p.includeMinWords):null,p.includeMaxWords?Number(p.includeMaxWords):null))return false;
 if((p.excludeMinWords||p.excludeMaxWords)&&inRange(knownWords,p.excludeMinWords?Number(p.excludeMinWords):null,p.excludeMaxWords?Number(p.excludeMaxWords):null))return false;
 const publishedDay=day(work?.[p.dateField==='published'?'first_published_at':'last_published_at']);
 if((p.includeFrom||p.includeTo)&&!inRange(publishedDay,p.includeFrom,p.includeTo))return false;
 if((p.excludeFrom||p.excludeTo)&&inRange(publishedDay,p.excludeFrom,p.excludeTo))return false;
 if(p.crossover!=='all'){
  const isCrossover=recordedCrossover(work);
  if(p.crossover==='include'&&!isCrossover)return false;
  if(p.crossover==='exclude'&&isCrossover)return false;
 }
 return true;
}
