/**
 * Curator-side checks for directly author-supplied or separately authorized
 * manuscripts. This never downloads or alters text from FanFiction.Net/AO3.
 * The source manuscript is sent directly from the signed-in browser to the
 * Palace database; it is never provided to the site owner’s coding assistant.
 */
export const FANWORK_IMPORT_MAX_CHARACTERS=1800000;
export const FANWORK_IMPORT_MAX_FILE_BYTES=2500000;
const MAX_NOTE_LENGTH=1200;

export function safeManuscriptSource(value){
 const text=String(value||'').trim();
 try{
  const url=new URL(text);
  if(url.protocol!=='https:'||url.username||url.password)return '';
  return url.href.slice(0,1800);
 }catch{return ''}
}
export function countManuscriptWords(text){
 return (String(text||'').match(/\S+/gu)||[]).length;
}
export function validateFanworkManuscript({body,sourceUrl,deliveryMethod,evidenceNote}={}){
 const errors=[];
 // Keep chapter headings, punctuation, spacing and line endings as supplied.
 // A NoDerivatives licence makes even editorial rewriting inappropriate.
 const text=typeof body==='string'?body:'';
 const words=countManuscriptWords(text);
 if(!text.trim())errors.push('A complete author-supplied manuscript is required.');
 else if(words<20)errors.push('The supplied file looks incomplete. Check that the full story is present.');
 if(text.length>FANWORK_IMPORT_MAX_CHARACTERS)errors.push('This manuscript is too large for this staging form.');
 if(text.includes('\u0000'))errors.push('Only plain-text manuscripts are supported.');
 if(!safeManuscriptSource(sourceUrl))errors.push('Provide an HTTPS link to the original work or authorized edition.');
 if(!['author_supplied','rights_holder_supplied','separately_authorized_copy'].includes(deliveryMethod))
  errors.push('Record how you legally received the text.');
 const note=String(evidenceNote||'').trim();
 if(note.length<12)errors.push('Record a short description of the source and permission evidence.');
 if(note.length>MAX_NOTE_LENGTH)errors.push('Shorten the permission evidence note.');
 return {valid:errors.length===0,errors,wordCount:words,text};
}
export function curatorImportEditionNote({deliveryMethod,evidenceNote}={}){
 const method={
  author_supplied:'Author-supplied manuscript',
  rights_holder_supplied:'Rights-holder-supplied manuscript',
  separately_authorized_copy:'Separately authorized copy'
 }[deliveryMethod]||'Source not verified';
 return method+'; independently reviewed evidence: '+String(evidenceNote||'').trim().slice(0,MAX_NOTE_LENGTH)+
  '; DRAFT ONLY — rights review and independent publication approval still required.';
}
