import {safeReaderHtml} from './readerHtmlSanitizer';

const MAX_FILE_BYTES=12*1024*1024;
const MAX_XML_BYTES=7*1024*1024;
const MAX_CHAPTER_HTML=550000;
const ZIP_LOCAL=0x04034b50,ZIP_CENTRAL=0x02014b50,ZIP_END=0x06054b50;
const encoder=new TextDecoder('utf-8',{fatal:false});
const escapeHtml=text=>String(text??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

function direct(node,local){return [...(node?.children||[])].filter(child=>child.localName===local)}
function descendant(node,local){return [...(node?.getElementsByTagName('*')||[])].filter(child=>child.localName===local)}
function first(node,local){return descendant(node,local)[0]||null}
function attr(node,key){return node?.getAttribute('w:'+key)||node?.getAttribute(key)||''}

export function docxXmlToPalaceHtml(xml){
 if(typeof DOMParser!=='function')throw Error('This browser cannot read Word document XML.');
 if(String(xml).length>MAX_XML_BYTES)throw Error('This document is too long to import as one chapter.');
 const doc=new DOMParser().parseFromString(String(xml),'application/xml');
 if(doc.querySelector('parsererror'))throw Error('This Word document contains malformed text.');
 const body=first(doc.documentElement,'body');
 if(!body)throw Error('This Word file has no readable document body.');
 const warnings=[];
 const blocks=[];
 let listType=null,listContent=[];
 const finishList=()=>{if(listContent.length){blocks.push('<'+listType+'>'+listContent.join('')+'</'+listType+'>');listContent=[]}listType=null;};
 function run(node){
  if(node.localName==='t'||node.localName==='delText')return node.localName==='delText'?'':escapeHtml(node.textContent);
  if(node.localName==='tab')return '&nbsp;&nbsp;&nbsp;&nbsp;';
  if(node.localName==='br'||node.localName==='cr')return '<br>';
  if(node.localName==='r'){
   const props=direct(node,'rPr')[0];
   let text=[...node.children].filter(n=>n.localName!=='rPr').map(run).join('');
   if(!text)return '';
   const enabled=name=>{const e=direct(props,name)[0];return Boolean(e)&&!['0','false','off'].includes(attr(e,'val').toLowerCase())};
   if(enabled('b'))text='<strong>'+text+'</strong>';
   if(enabled('i'))text='<em>'+text+'</em>';
   if(enabled('u'))text='<u>'+text+'</u>';
   if(enabled('strike')||enabled('dstrike'))text='<s>'+text+'</s>';
   return text;
  }
  return [...node.children].map(run).join('');
 }
 function paragraph(node){
  const props=direct(node,'pPr')[0];
  const style=attr(direct(props,'pStyle')[0],'val').toLowerCase();
  const heading=/^(heading1|title)$/.test(style)?'h2':/^(heading2|heading3|subtitle)$/.test(style)?'h3':style==='quote'?'blockquote':'p';
  const isList=direct(props,'numPr').length>0||style.startsWith('list');
  const numPr=direct(props,'numPr')[0];
  const numId=attr(direct(numPr,'numId')[0],'val');
  let kind='ul';
  if(numId){
   // Word's abstract numbering definitions vary; keep the visible list semantics
   // if no numbering metadata can be safely resolved.
   kind='ul';
  }
  const contents=[...node.children].filter(n=>n.localName!=='pPr').map(run).join('');
  if(isList){if(listType!==kind)finishList();listType=kind;listContent.push('<li>'+(contents||'&nbsp;')+'</li>');return;}
  finishList();
  if(!contents.trim()&&blocks.length===0)return;
  blocks.push('<'+heading+'>'+(contents||'&nbsp;')+'</'+heading+'>');
 }
 function table(node){
  finishList();
  if(!warnings.includes('Tables are converted to readable text rows; original column widths are not retained.'))warnings.push('Tables are converted to readable text rows; original column widths are not retained.');
  for(const tr of direct(node,'tr')){
   const cellText=direct(tr,'tc').map(cell=>descendant(cell,'p').map(p=>[...p.children].filter(n=>n.localName!=='pPr').map(run).join('')).join(' / '));
   blocks.push('<blockquote><p>'+cellText.join(' &nbsp; | &nbsp; ')+'</p></blockquote>');
  }
 }
 for(const n of body.children){
  if(n.localName==='p')paragraph(n);
  else if(n.localName==='tbl')table(n);
 }
 finishList();
 return {html:safeReaderHtml(blocks.join('')),warnings};
}

function zipEntries(bytes){
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),end=bytes.byteLength;
 let pos=-1;
 for(let i=end-22;i>=Math.max(0,end-65557);i--){if(view.getUint32(i,true)===ZIP_END){pos=i;break}}
 if(pos<0)throw Error('This is not a valid .docx Word file.');
 const count=view.getUint16(pos+10,true),centralSize=view.getUint32(pos+12,true),centralOffset=view.getUint32(pos+16,true);
 if(count>2000||centralOffset+centralSize>end)throw Error('This Word file is unusually large or damaged.');
 const entries=new Map();let at=centralOffset;
 for(let n=0;n<count;n++){
  if(at+46>end||view.getUint32(at,true)!==ZIP_CENTRAL)throw Error('The Word file has an invalid archive directory.');
  const flags=view.getUint16(at+8,true),method=view.getUint16(at+10,true);
  const size=view.getUint32(at+20,true),uncompressed=view.getUint32(at+24,true);
  const nameSize=view.getUint16(at+28,true),extra=view.getUint16(at+30,true),comment=view.getUint16(at+32,true);
  const offset=view.getUint32(at+42,true);
  if(at+46+nameSize+extra+comment>end)throw Error('The Word file has an invalid archive entry.');
  const name=encoder.decode(bytes.subarray(at+46,at+46+nameSize));
  if(name==='word/document.xml')entries.set(name,{flags,method,size,uncompressed,offset});
  at+=46+nameSize+extra+comment;
 }
 return {view,entries};
}
async function extractDocumentXml(bytes){
 const {view,entries}=zipEntries(bytes),info=entries.get('word/document.xml');
 if(!info)throw Error('This file has no Word document text. Save it as a .docx file.');
 if(info.flags&1)throw Error('Password-protected Word documents cannot be imported.');
 if(![0,8].includes(info.method))throw Error('Unsupported Word compression. Save a fresh .docx copy.');
 if(info.uncompressed>MAX_XML_BYTES||info.size>MAX_FILE_BYTES)throw Error('The document is too long to import as one chapter.');
 const off=info.offset;
 if(off+30>bytes.length||view.getUint32(off,true)!==ZIP_LOCAL)throw Error('The Word file has a damaged text entry.');
 const start=off+30+view.getUint16(off+26,true)+view.getUint16(off+28,true);
 if(start+info.size>bytes.length)throw Error('The Word file is incomplete.');
 const compressed=bytes.subarray(start,start+info.size);
 if(info.method===0)return encoder.decode(compressed);
 if(typeof DecompressionStream==='undefined')throw Error('Your browser cannot unpack .docx. Try a recent browser or import HTML/text.');
 let stream;
 try{stream=new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate-raw'))}
 catch{throw Error('Your browser cannot unpack this Word file. Save it as .docx or use a newer browser.')}
 const reader=stream.getReader(),chunks=[];let total=0;
 try{
  while(true){
   const {done,value}=await reader.read();
   if(done)break;
   total+=value.byteLength;
   if(total>MAX_XML_BYTES)throw Error('The expanded Word document is too large to import safely.');
   chunks.push(value);
  }
 }finally{reader.releaseLock();}
 const output=new Uint8Array(total);let at=0;
 for(const chunk of chunks){output.set(chunk,at);at+=chunk.length}
 return encoder.decode(output);
}

function textToHtml(text){
 const lines=String(text||'').replace(/\r\n?/g,'\n').split('\n');
 const blocks=[];let list=[];
 const close=()=>{if(list.length){blocks.push('<ul>'+list.map(x=>'<li>'+escapeHtml(x)+'</li>').join('')+'</ul>');list=[]}};
 for(const line of lines){
  const value=line.trim();
  if(!value){close();continue}
  const h=/^(#{1,3})\s+(.+)$/.exec(value);
  if(h){close();blocks.push('<'+(h[1].length===1?'h2':'h3')+'>'+escapeHtml(h[2])+'</'+(h[1].length===1?'h2':'h3')+'>');continue}
  const li=/^[-*+]\s+(.+)$/.exec(value);
  if(li){list.push(li[1]);continue}
  close();
  if(value==='***'||value==='---'){blocks.push('<hr>');continue}
  if(value.startsWith('> ')){blocks.push('<blockquote><p>'+escapeHtml(value.slice(2))+'</p></blockquote>');continue}
  blocks.push('<p>'+escapeHtml(value)+'</p>');
 }
 close();return blocks.join('');
}
export async function convertDocumentFile(file){
 if(!file||typeof file.name!=='string')throw Error('Choose a document from your device.');
 if(file.size>MAX_FILE_BYTES)throw Error('Choose a document under 12 MB, or split it into chapters.');
 const name=file.name.trim(),ext=name.split('.').pop()?.toLowerCase();
 if(ext==='doc')throw Error('Older .doc files must be saved as .docx in Word before importing.');
 if(!['docx','txt','md','html','htm'].includes(ext))throw Error('Supported files: .docx, .txt, .md or .html.');
 let html,warnings=[];
 if(ext==='docx'){
  const bytes=new Uint8Array(await file.arrayBuffer());
  const result=docxXmlToPalaceHtml(await extractDocumentXml(bytes));
  html=result.html;warnings=result.warnings;
  warnings=[...warnings,'Images, page headers, columns, exact fonts and page margins are not transferred.'];
 }else {
  const text=await file.text();
  html=ext==='html'||ext==='htm'?safeReaderHtml(text):safeReaderHtml(textToHtml(text));
  if(ext==='md')warnings.push('Basic Markdown headings, lists and paragraphs are retained. Advanced Markdown formatting is not imported.');
 }
 if(!html||!html.replace(/<[^>]*>/g,'').replace(/&nbsp;/g,'').trim())throw Error('This document contains no readable chapter text.');
 if(html.length>MAX_CHAPTER_HTML)throw Error('This manuscript is too long for one chapter. Split it into smaller files.');
 const title=name.replace(/\.[^.]+$/,'').replace(/[_-]+/g,' ').trim().slice(0,180)||'Imported chapter';
 const text=html.replace(/<[^>]+>/g,' ').replace(/&[^;]+;/g,' ').trim();
 return {title,html,words:text.split(/\s+/).filter(Boolean).length,warnings,filename:name};
}
