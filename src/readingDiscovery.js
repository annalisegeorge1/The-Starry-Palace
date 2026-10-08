/**
 * Reading Rooms: a quiet, deterministic description of active discovery lenses.
 * UI can remove one choice at a time without discarding any of the others.
 */
const ORIGIN_LABELS={original:'Original Fiction',fandom:'Fandom'};
const READER_LENS_LABELS={unread:'Unread',reading:'In progress',new:'New chapters',saved:'Saved',following:'Following',finished:'Finished'};
export function readingFilterChips({origin='all',query='',rating='all',status='all',vibeDoor='all',readerLens='all'}={},moodLabels={}){
 const chips=[];
 if(origin!=='all')chips.push({key:'origin',label:'Room: '+(ORIGIN_LABELS[origin]||origin)});
 if(vibeDoor!=='all')chips.push({key:'vibeDoor',label:'Feeling: '+(moodLabels[vibeDoor]||vibeDoor)});
 if(String(query||'').trim())chips.push({key:'query',label:'Search: '+String(query).trim()});
 if(rating!=='all')chips.push({key:'rating',label:'Rating: '+rating});
 if(status!=='all')chips.push({key:'status',label:'Status: '+String(status).replaceAll('_',' ')});
 if(readerLens!=='all')chips.push({key:'readerLens',label:'My shelf: '+(READER_LENS_LABELS[readerLens]||readerLens)});
 return chips;
}
/** Never silently ignore the filters a reader has selected. */
export function chooseReadingSurprise(visible,random=Math.random){
 if(!Array.isArray(visible)||visible.length===0)return null;
 const value=typeof random==='function'?random():random;
 const roll=Number.isFinite(value)?Math.max(0,Math.min(0.999999999,value)):0;
 return visible[Math.floor(roll*visible.length)]||null;
}
