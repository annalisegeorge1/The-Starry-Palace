/**
 * A local, plain-text escape hatch for the writing room. This does not
 * communicate with the server or claim to represent a cloud-saved revision.
 */
export function writerBackupFilename(workTitle,chapterTitle){
 const clean=value=>String(value||'').normalize('NFKC')
  .replace(/[\u0000-\u001f\u007f\\/:*?"<>|]/g,' ')
  .replace(/\s+/g,' ').trim().replace(/^\.+|\.+$/g,'').slice(0,65).trim();
 const title=clean(chapterTitle)||clean(workTitle)||'untitled-chapter';
 return 'starry-palace-'+title.replace(/\s+/g,'-')+'.txt';
}

export function writerBackupText({workTitle='',chapterTitle='',body='',revisionNote='',exportedAt=''}={}){
 const lines=[
  'THE STARRY PALACE — PRIVATE WRITING BACKUP',
  'Work: '+String(workTitle||'Untitled work').trim(),
  'Chapter: '+String(chapterTitle||'Untitled chapter').trim(),
  'Copied: '+String(exportedAt||'Date not recorded'),
  '',
  '--- CHAPTER TEXT ---',
  String(body||'').replace(/\r\n?/g,'\n').trimEnd()
 ];
 if(String(revisionNote||'').trim()){
  lines.push('','--- PRIVATE REVISION NOTE ---',String(revisionNote).trim());
 }
 lines.push('','This is an on-device text copy, not confirmation of a cloud save.');
 return lines.join('\n')+'\n';
}

export function writerSavePhase(message=''){
 const text=String(message||'').toLowerCase();
 if(/cannot|failed|unavailable|export draft now|not completed/.test(text))return 'attention';
 if(/recovery copy|recovered on this device|restored locally|unsaved cloud edits/.test(text))return 'recovery';
 if(/waiting|saving|pasted without outside formatting/.test(text))return 'pending';
 if(/saved to palace/.test(text))return 'saved';
 return 'ready';
}
