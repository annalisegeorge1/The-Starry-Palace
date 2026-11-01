/** Client-side preflight mirrors comic-pages and comic-covers storage bucket limits.
 * Never use filename extensions alone to permit an upload.
 */
export const COMIC_IMAGE_MIMES=Object.freeze(['image/jpeg','image/png','image/webp','image/avif']);
export const COMIC_IMAGE_ACCEPT=COMIC_IMAGE_MIMES.join(',');
export const COMIC_PAGE_MAX_BYTES=15*1024*1024;
export const COMIC_COVER_MAX_BYTES=8*1024*1024;
export const COMIC_UPLOAD_BATCH_LIMIT=12;

export function validateComicImage(file,kind='page'){
 const limit=kind==='cover'?COMIC_COVER_MAX_BYTES:COMIC_PAGE_MAX_BYTES;
 if(!file||typeof file.size!=='number')return 'Select an image file.';
 if(!COMIC_IMAGE_MIMES.includes(file.type))return 'Use JPEG, PNG, WebP or AVIF images. SVG, GIF and other file types are not supported.';
 if(file.size===0)return 'This image is empty.';
 if(file.size>limit)return 'Image exceeds the '+(kind==='cover'?'8':'15')+' MiB '+(kind==='cover'?'cover':'comic page')+' limit.';
 return '';
}
export function comicImageFingerprint(file){
 return [String(file?.name||''),Number(file?.size||0),Number(file?.lastModified||0)].join(':');
}
const imageOrder=new Intl.Collator(undefined,{numeric:true,sensitivity:'base'});
export function selectComicPageFiles(incoming,existing=[],limit=COMIC_UPLOAD_BATCH_LIMIT){
 const files=Array.from(incoming||[]).sort((a,b)=>imageOrder.compare(a.name,b.name));
 const seen=new Set(existing.map(item=>comicImageFingerprint(item.file||item)));
 const accepted=[],rejected=[];
 for(const file of files){
  const reason=validateComicImage(file,'page');
  const key=comicImageFingerprint(file);
  if(reason){rejected.push({name:file.name,reason});continue}
  if(seen.has(key)){rejected.push({name:file.name,reason:'This image is already in the upload queue.'});continue}
  if(existing.length+accepted.length>=limit){rejected.push({name:file.name,reason:'Upload up to '+limit+' pages per batch. Start another batch for more.'});continue}
  seen.add(key);accepted.push(file);
 }
 return {accepted,rejected};
}
export function comicUploadReady(entries){
 const waiting=(entries||[]).filter(x=>x.status!=='uploaded');
 if(!waiting.length)return {ready:false,reason:'Choose at least one image.'};
 for(const entry of waiting){
  const issue=validateComicImage(entry.file,'page');
  if(issue)return {ready:false,reason:entry.file.name+': '+issue};
  if(!entry.decorative&&!String(entry.altText||'').trim())return {ready:false,reason:'Add an image description for '+entry.file.name+' or mark it decorative.'};
 }
 return {ready:true,reason:''};
}
