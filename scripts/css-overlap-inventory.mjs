#!/usr/bin/env node
/**
 * Read-only selector-overlap inventory. No CSS rewrites or automatic deletions.
 *
 * This finds potential cascade hotspots across the three oldest global sheets.
 * Media/theme-context differences, specificity, import order and computed
 * styles still need human review before any declaration can be removed.
 */
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join,resolve} from 'node:path';

export const GLOBAL_STYLES=['src/style.css','src/polish.css','src/palace-next.css'];

function tidy(value){
 return String(value||'').trim().replace(/\s+/g,' ');
}
function splitSelectors(header){
 const out=[];
 let part='',parens=0,brackets=0,quote='',escape=false;
 for(const ch of header){
  if(escape){part+=ch;escape=false;continue}
  if(quote){
   part+=ch;
   if(ch==='\\')escape=true;
   else if(ch===quote)quote='';
   continue;
  }
  if(ch==='"'||ch==="'"){quote=ch;part+=ch;continue}
  if(ch==='(')parens++;
  if(ch===')')parens=Math.max(0,parens-1);
  if(ch==='[')brackets++;
  if(ch===']')brackets=Math.max(0,brackets-1);
  if(ch===','&&parens===0&&brackets===0){if(tidy(part))out.push(tidy(part));part='';continue}
  part+=ch;
 }
 if(tidy(part))out.push(tidy(part));
 return out;
}

/** A safe *inventory*, not a full CSS grammar/parser. */
export function collectCssSelectors(source,file='unnamed.css'){
 const css=String(source||'');
 const stack=[],items=[];
 let token='',quote='',escaped=false,comment=false,line=1,tokenLine=1;
 const pushChar=ch=>{if(!token.trim()&&!/\s/.test(ch))tokenLine=line;token+=ch};
 const directives=()=>stack.filter(x=>x.startsWith('@'));
 for(let i=0;i<css.length;i++){
  const ch=css[i],next=css[i+1];
  if(ch==='\n')line++;
  if(comment){if(ch==='*'&&next==='/'){comment=false;i++}continue}
  if(quote){
   pushChar(ch);
   if(escaped)escaped=false;
   else if(ch==='\\')escaped=true;
   else if(ch===quote)quote='';
   continue;
  }
  if(ch==='/'&&next==='*'){comment=true;i++;continue}
  if(ch==='"'||ch==="'"){quote=ch;pushChar(ch);continue}
  if(ch==='{'){
   const header=tidy(token);
   const parents=directives();
   const insideKeyframes=parents.some(x=>/@(?:-[\w]+-)?keyframes\b/.test(x));
   if(header&&!header.startsWith('@')&&!insideKeyframes&&!header.includes(';')){
    for(const selector of splitSelectors(header)){
     if(!selector.startsWith('@')&&!selector.startsWith('%')&&!/^\d+(?:\.\d+)?%$/.test(selector)){
      items.push({file,selector,context:parents.join(' > ')||'root',line:tokenLine});
     }
    }
   }
   stack.push(header);
   token='';tokenLine=line;
   continue;
  }
  if(ch==='}'){stack.pop();token='';tokenLine=line;continue}
  if(ch===';'){token='';tokenLine=line;continue}
  pushChar(ch);
 }
 return items;
}

export function summarizeCssOverlaps(fileSources){
 const all=Object.entries(fileSources).flatMap(([path,css])=>collectCssSelectors(css,path));
 const bySelector=new Map();
 for(const item of all){
  const record=bySelector.get(item.selector)||{selector:item.selector,occurrences:0,files:new Set(),contexts:new Set(),rootCount:0};
  record.occurrences++;
  record.files.add(item.file);
  record.contexts.add(item.context);
  if(item.context==='root')record.rootCount++;
  bySelector.set(item.selector,record);
 }
 const duplicates=[...bySelector.values()].filter(x=>x.occurrences>1).sort((a,b)=>
  b.occurrences-a.occurrences||a.selector.localeCompare(b.selector));
 return {
  totalDeclarations:all.length,
  uniqueSelectors:bySelector.size,
  repeatedSelectors:duplicates.length,
  crossFileSelectors:duplicates.filter(x=>x.files.size>1).length,
  hotspots:duplicates.map(x=>({
   selector:x.selector,
   occurrences:x.occurrences,
   files:[...x.files],
   contexts:[...x.contexts],
   rootCount:x.rootCount
  }))
 };
}

export function renderCssOverlapReport(summary,limit=25){
 const top=summary.hotspots.slice(0,Math.max(0,limit));
 const result=[
  'Starry Palace CSS overlap candidates — READ ONLY',
  'Rules counted by selector text: '+summary.totalDeclarations,
  'Unique selector texts: '+summary.uniqueSelectors,
  'Repeated selector texts: '+summary.repeatedSelectors,
  'Repeated across files: '+summary.crossFileSelectors,
  'These are NOT automatically redundant: media queries, order and theme variants matter.',
  '',
  'Frequent selector texts (occurrences; number of files; number of contexts):'
 ];
 for(const h of top)result.push(' '+String(h.occurrences).padStart(3)+' × '+h.files.length+' files / '+h.contexts.length+' contexts  '+h.selector);
 return result.join('\n');
}

function main(){
 const base=process.cwd();
 const sources=Object.fromEntries(GLOBAL_STYLES.map(p=>[p,readFileSync(join(base,p),'utf8')]));
 console.log(renderCssOverlapReport(summarizeCssOverlaps(sources)));
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main();
