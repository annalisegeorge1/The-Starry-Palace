/** Statistics are estimates for the writing desk, never server reward counts. */
export function manuscriptTextStats(value=''){
 const text=String(value||'').replace(/\r\n?/g,'\n');
 const trimmed=text.trim();
 const characters=Array.from(text).length;
 const charactersNoSpaces=Array.from(text.replace(/\s/g,'')).length;
 const words=(trimmed.match(/[^\s]+/gu)||[]).length;
 const paragraphs=trimmed?trimmed.split(/\n\s*\n|\n+/).filter(p=>p.trim()).length:0;
 return{characters,charactersNoSpaces,words,paragraphs,readingMinutes:words?Math.max(1,Math.ceil(words/220)):0};
}
export function manuscriptPlainTextFromHtml(html=''){
 const raw=String(html||'');
 if(typeof DOMParser!=='undefined'){
  try{
   const doc=new DOMParser().parseFromString(raw,'text/html');
   for(const el of doc.body.querySelectorAll('script,style,template'))el.remove();
   for(const node of doc.body.querySelectorAll('p,div,h1,h2,h3,h4,blockquote,li,br'))node.appendChild(doc.createTextNode('\n'));
   return doc.body.textContent||'';
  }catch{}
 }
 return raw.replace(/<\s*br\s*\/?\s*>/gi,'\n').replace(/<\/(?:p|div|h[1-6]|li|blockquote)>/gi,'\n').replace(/<[^>]*>/g,' ').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&');
}
