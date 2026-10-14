/**
 * Preserve the Palace reader's limited editorial markup without permitting
 * attributes, embeds, active HTML, or executable content to reach its renderer.
 *
 * This module is deliberately independent of page state and browser routing.
 */
const READER_TAGS=new Set(['P','BR','STRONG','B','EM','I','U','S','STRIKE','H2','H3','BLOCKQUOTE','HR','UL','OL','LI']);
const DROP_WITH_CONTENT=new Set(['SCRIPT','STYLE','NOSCRIPT','IFRAME','OBJECT','EMBED','TEMPLATE','SVG','MATH','FORM']);

function escapeText(value){
 return value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

/** HTML safe to insert with dangerouslySetInnerHTML; no DOM: render text only. */
export function safeReaderHtml(raw=''){
 const source=String(raw??'');
 if(typeof DOMParser==='undefined'){
  // A non-browser environment cannot validate parsed HTML. Do not return
  // untrusted markup or trust a regex to remove every possible event handler.
  return escapeText(source);
 }
 const doc=new DOMParser().parseFromString('<body>'+source+'</body>','text/html');
 // Walk descendants in reverse so removal of a forbidden parent cannot leave
 // its contents or descendants behind for later unwrapping.
 const nodes=[...doc.body.querySelectorAll('*')].reverse();
 for(const element of nodes){
  const name=element.tagName.toUpperCase();
  if(DROP_WITH_CONTENT.has(name)){
   element.remove();
  }else if(!READER_TAGS.has(name)){
   const replacement=doc.createDocumentFragment();
   while(element.firstChild)replacement.appendChild(element.firstChild);
   element.replaceWith(replacement);
  }else{
   // Even allowed tags cannot keep style, event handlers, links, IDs or classes.
   for(const attribute of [...element.attributes])element.removeAttribute(attribute.name);
  }
 }
 return doc.body.innerHTML;
}
