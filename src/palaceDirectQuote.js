/* Direct-message quotations are deliberately plain text. They do not create a
 * server-side reply relationship or imply persistent message IDs. Group replies
 * continue to use their real reply_to_id column. */
export function makePalaceDirectQuoteDraft(message,sender,current=''){
 const source=message?.media_path?'a photo':String(message?.body||'').startsWith('🎞️ GIF: ')?'a GIF':String(message?.body||'');
 const excerpt=source.replace(/[\r\n\t]+/g,' ').replace(/\s+/g,' ').trim().slice(0,140);
 if(!excerpt)return String(current||'').slice(0,3000);
 const from=String(sender||'Palace member').replace(/[\r\n\t]+/g,' ').replace(/\s+/g,' ').trim().slice(0,65);
 const quote='↩ Quoting '+(from||'Palace member')+': “'+excerpt+(source.length>140?'…':'')+'”';
 const existing=String(current||'').trim();
 return (existing?existing+'\n\n'+quote+'\n':quote+'\n\n').slice(0,3000);
}
