/**
 * Display-only structure for imperfectly imported classic texts.
 * Never change the original archive text; editions and verse require care.
 */
const heading=/^(?:chapter|book|part|volume|act|scene|prologue|epilogue|preface|introduction|contents|conclusion)\b(?:\s+[ivxlcdm\d]+)?(?:\s*[:.\-–—].*)?$/i;
const verseHint=/^(?:\s{2,}|[—–])|[;,:]$/;
function segmentLongProse(value){
 const words=value.trim();
 if(words.length<=680)return [words];
 // Split on actual sentence boundaries, not each physical line from a scan.
 const sentences=words.match(/[^.!?]+(?:[.!?]+(?=\s|$)|$)/g)||[words];
 if(sentences.length<3)return [words];
 const chunks=[];let paragraph='';
 for(const sentence of sentences){
  const s=sentence.trim();if(!s)continue;
  if(paragraph.length>=350&&paragraph.length+s.length>570){chunks.push(paragraph);paragraph='';}
  paragraph+=(paragraph?' ':'')+s;
 }
 if(paragraph)chunks.push(paragraph);
 return chunks;
}
export function structureClassicText(source=''){
 const raw=String(source||'').replace(/\r\n?/g,'\n').replace(/\u00a0/g,' ').replace(/[\t ]+\n/g,'\n').trim();
 if(!raw)return [];
 const groups=raw.split(/\n\s*\n+/);
 const result=[];
 for(const group of groups){
  const lines=group.split('\n').map(s=>s.trim()).filter(Boolean);
  if(!lines.length)continue;
  for(let i=0;i<lines.length;i++){
   if(heading.test(lines[i])&&lines[i].length<100){
    result.push({kind:'heading',text:lines[i]});
    lines.splice(i,1);i--;
   }
  }
  if(!lines.length)continue;
  // Single newlines are common in Gutenberg and other copied prose.
  // Keep short, deliberately broken lines as verse instead of merging them.
  const average=lines.reduce((n,line)=>n+line.length,0)/lines.length;
  const likelyVerse=lines.length>=3&&average<54&&lines.filter(line=>verseHint.test(line)).length>=Math.ceil(lines.length/3);
  if(likelyVerse){result.push({kind:'verse',text:lines.join('\n')});continue;}
  const text=lines.join(' ').replace(/ {2,}/g,' ');
  // Existing paragraph boundaries are authoritative. Only rescue unusually
  // long blocks that arrived without breaks.
  for(const block of segmentLongProse(text))result.push({kind:'paragraph',text:block});
 }
 return result;
}
