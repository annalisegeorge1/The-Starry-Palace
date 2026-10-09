/**
 * Display-only structure for imperfectly imported classic texts.
 * Never change the original archive text; editions and verse require care.
 */
// Historical editions use numerals and spelled-out chapter numbers.
// Keep the recognition conservative: sentences are not chapter titles.
const standaloneHeading=/^(?:chapter|book|part|volume|act|scene|prologue|epilogue|preface|introduction|contents|conclusion)$/i;
const numberedHeading=/^(?:chapter|book|part|volume|act|scene)\s+(?:the\s+)?(?:[ivxlcdm]+|\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth)(?:([ \t]*[:.\-–—][ \t]*|[ \t]+)(.+))?$/i;
function isClassicHeading(value){
 if(value.length>=100||!value.trim())return false;
 if(standaloneHeading.test(value))return true;
 const found=numberedHeading.exec(value);
 if(!found)return false;
 if(!found[2])return true;
 const title=found[2].trim();
 return !!title&&(/[:.\-–—]/.test(found[1])||/^[A-Z0-9]/.test(title));
}
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
  const rawLines=group.split('\n').filter(s=>s.trim());
  const lines=rawLines.map(s=>s.trim());
  if(!lines.length)continue;
  // Indented prose/dialogue in plain-text editions may encode paragraph
  // boundaries even without a blank line. Preserve that evidence first.
  const average=lines.reduce((n,line)=>n+line.length,0)/lines.length;
  const looksLikeDialogue=lines.filter(line=>/^[“"‘']/.test(line)).length>=2;
  const capitalLineStarts=lines.filter(line=>/^[“"‘']?[A-Z]/.test(line)).length;
  const linesWithoutStop=lines.filter(line=>!/[.!?;:]\s*[”"'’]?$/.test(line)).length;
  // Verse frequently uses intentional short, capitalized lines without
  // end-stop punctuation. Prose copied with hard wraps usually does not.
  const verseLineation=lines.length>=4&&average<54
   &&capitalLineStarts>=Math.ceil(lines.length*.75)
   &&linesWithoutStop>=Math.ceil(lines.length*.6);
  const likelyVerse=lines.length>=3&&average<54&&!looksLikeDialogue
   &&(lines.filter(line=>verseHint.test(line)).length>=Math.ceil(lines.length/3)||verseLineation);
  if(likelyVerse){result.push({kind:'verse',text:lines.join('\n')});continue;}
  let paragraph=[];
  const flush=()=>{
   if(!paragraph.length)return;
   const text=paragraph.join(' ').replace(/ {2,}/g,' ');
   // Only a genuinely flattened one-line import gets inferred breaks.
   // Never split paragraphs supported by line breaks or empty-line evidence.
   const recovery=groups.length===1&&rawLines.length===1;
   for(const block of recovery?segmentLongProse(text):[text])
    result.push({kind:'paragraph',text:block});
   paragraph=[];
  };
  for(let i=0;i<lines.length;i++){
   if(isClassicHeading(lines[i])){
    flush();
    result.push({kind:'heading',text:lines[i]});
    continue;
   }
   // Plain text editions often use a three-space first-line indentation.
   // Keep paragraphs in their original order instead of guessing based on
   // arbitrary sentence/character counts.
   if(paragraph.length&&/^(?: {3,}|\t)/.test(rawLines[i]))flush();
   paragraph.push(lines[i]);
  }
  flush();
 }

 return result;
}

/**
 * Repair archive story chapters imported into a single HTML paragraph.
 * Never rewrite or persist source material; only adjust the rendered copy.
 * Multi-paragraph chapters retain their original rich HTML.
 */
export function restoreFlatClassicChapterHtml(html=''){
 const original=String(html||'');
 if(typeof DOMParser==='undefined'||!original.trim())return original;
 try{
  const doc=new DOMParser().parseFromString('<body>'+original+'</body>','text/html');
  const nodes=[...doc.body.querySelectorAll('p,h2,h3,blockquote,li,pre')];
  if(nodes.length>2||nodes.some(x=>['H2','H3','PRE','BLOCKQUOTE','LI'].includes(x.tagName)))return original;
  // Do not erase inline emphasis, links, line breaks or intentional layout.
  // Repair only truly flattened plain-text paragraphs.
  if(doc.body.querySelector('strong,b,em,i,u,a,br,span,img,ul,ol,table,hr'))return original;
  const text=doc.body.textContent||'';
  if(text.trim().length<700)return original;
  const blocks=structureClassicText(text);
  if(blocks.length<2)return original;
  const escape=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  return blocks.map(b=>b.kind==='heading'?'<h2>'+escape(b.text)+'</h2>':
   b.kind==='verse'?'<p class="archive-classic-verse">'+escape(b.text)+'</p>':
   '<p>'+escape(b.text)+'</p>').join('');
 }catch{return original}
}
