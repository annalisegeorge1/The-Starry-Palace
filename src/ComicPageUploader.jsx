import React,{useEffect,useRef,useState} from 'react';
import {PalaceDialog} from './PalaceLivePrimitives';
import PalaceIcon from './PalaceIcon';
import {uploadComicPage} from './palaceData';
import {COMIC_IMAGE_ACCEPT,COMIC_UPLOAD_BATCH_LIMIT,comicUploadReady,selectComicPageFiles} from './comicUploadPreparation';
import './comic-page-uploader.css';

/** The browser keeps files locally until an artist explicitly begins uploading.
 * Uploads run in display order, stop at the first error, and never retry a completed page.
 */
export default function ComicPageUploader({userId,comicId,episodeId,episodeTitle,episodePublished=false,onUploaded}){
 const[open,setOpen]=useState(false);
 const[entries,setEntries]=useState([]);
 const[busy,setBusy]=useState(false);
 const[message,setMessage]=useState('');
 const[publishedAck,setPublishedAck]=useState(false);
 const activeRef=useRef(false);
 const nextQueueId=useRef(0);
 const launchInputRef=useRef(null);
 const previews=useRef(new Set());
 useEffect(()=>()=>{for(const url of previews.current)URL.revokeObjectURL(url);previews.current.clear()},[]);
 const createdUrl=file=>{
  if(typeof URL.createObjectURL!=='function')return '';
  const url=URL.createObjectURL(file);previews.current.add(url);return url;
 };
 const releaseUrl=url=>{if(!url)return;URL.revokeObjectURL(url);previews.current.delete(url)};
 const clearQueue=()=>{
  if(activeRef.current)return;
  entries.forEach(x=>releaseUrl(x.preview));
  setEntries([]);setPublishedAck(false);setMessage('');
 };
 function receiveFiles(fileList){
  if(activeRef.current)return;
  const {accepted,rejected}=selectComicPageFiles(fileList,entries);
  if(accepted.length)setEntries(current=>[...current,...accepted.map(file=>({
   id:'queued-'+(++nextQueueId.current),file,preview:createdUrl(file),caption:'',altText:'',decorative:false,status:'pending',error:''
  }))]);
  setOpen(true);
  if(rejected.length){
   const sample=rejected.slice(0,4).map(x=>x.name+': '+x.reason).join(' ');
   setMessage(rejected.length+' image'+(rejected.length===1?' was':'s were')+' not added. '+sample+(rejected.length>4?' And '+(rejected.length-4)+' more.':''));
  }else if(accepted.length){
   setMessage(accepted.length+' image'+(accepted.length===1?'':'s')+' added to the queue. Nothing has been uploaded yet.');
  }
 }
 const update=(id,patch)=>{if(activeRef.current)return;setEntries(rows=>rows.map(x=>x.id===id?{...x,...patch}:x))};
 function move(id,delta){
  if(activeRef.current||entries.some(x=>x.status==='uploaded'))return;
  setEntries(rows=>{
   const from=rows.findIndex(x=>x.id===id),to=from+delta;
   if(from<0||to<0||to>=rows.length)return rows;
   const copy=[...rows];[copy[from],copy[to]]=[copy[to],copy[from]];return copy;
  });
 }
 const remove=id=>{
  if(activeRef.current)return;
  const x=entries.find(x=>x.id===id);
  if(!x||x.status==='uploaded')return;
  releaseUrl(x.preview);
  setEntries(rows=>rows.filter(e=>e.id!==id));
 };
 const close=()=>{if(!activeRef.current)setOpen(false)};
 async function start(){
  if(activeRef.current)return;
  const ready=comicUploadReady(entries);
  if(!ready.ready){setMessage(ready.reason);return}
  if(episodePublished&&!publishedAck){setMessage('Confirm that you understand these pages will be visible immediately in this published episode.');return}
  activeRef.current=true;setBusy(true);setMessage('');
  let completed=0;
  for(const entry of entries.filter(x=>x.status!=='uploaded')){
   setEntries(rows=>rows.map(x=>x.id===entry.id?{...x,status:'uploading',error:''}:x));
   try{
    await uploadComicPage(userId,comicId,episodeId,entry.file,{
     caption:entry.caption,alt_text:entry.decorative?'':entry.altText,decorative:entry.decorative
    });
    completed+=1;
    setEntries(rows=>rows.map(x=>x.id===entry.id?{...x,status:'uploaded',error:''}:x));
   }catch(e){
    const reason=String(e?.message||'Upload failed. Check your connection and try again.');
    setEntries(rows=>rows.map(x=>x.id===entry.id?{...x,status:'error',error:reason}:x));
    setMessage('Upload stopped at '+entry.file.name+': '+reason+' The successfully added pages are safe. If your connection dropped, check the episode before retrying to avoid accidental duplicates.');
    break;
   }
  }
  activeRef.current=false;setBusy(false);
  if(completed){
   try{await onUploaded?.()}catch{ /* Reloading the list may fail without affecting successful uploads. */ }
  }
  if(completed===entries.filter(x=>x.status!=='uploaded').length){
   setMessage('All '+completed+' remaining page'+(completed===1?'':'s')+' uploaded in the order shown. You can view or rearrange them in the episode.');
  }
 }
 const waiting=entries.filter(x=>x.status!=='uploaded');
 const done=entries.length-waiting.length;
 const ready=comicUploadReady(entries);
 const orderLocked=busy||done>0;
 const hasFailures=entries.some(x=>x.status==='error');
 return <>
  <button type="button" className="outline-button comic-upload-launch" disabled={busy} onClick={()=>launchInputRef.current?.click()}>Add comic pages</button>
  <input ref={launchInputRef} className="comic-upload-launch-file" type="file" accept={COMIC_IMAGE_ACCEPT} multiple hidden disabled={busy} onChange={e=>{receiveFiles(e.target.files);e.target.value=''}}/>
  <PalaceDialog open={open} className="comic-upload-dialog" title="Add pages to this episode" eyebrow="COMICS STUDIO · IMAGE UPLOADS" onClose={close}
   actions={<>
    <button type="button" className="quiet-button" disabled={busy} onClick={close}>{done&&waiting.length===0?'Done':'Keep queue for later'}</button>
    <button type="button" disabled={busy||!ready.ready||(episodePublished&&!publishedAck)} onClick={start}>{busy?'Uploading…':hasFailures?'Retry remaining':waiting.length===1?'Upload 1 page':'Upload '+waiting.length+' pages'}</button>
   </>}>
   <div className="comic-upload-intro"><strong>{episodeTitle}</strong><p>JPEG, PNG, WebP or AVIF. Up to 15 MiB per image and {COMIC_UPLOAD_BATCH_LIMIT} pages per batch. Files are ordered by filename first; adjust the order below before uploading. If this episode is a draft, the pages stay private until publication.</p></div>
   {episodePublished&&<label className="comic-upload-published-warning"><input type="checkbox" disabled={busy} checked={publishedAck} onChange={e=>setPublishedAck(e.target.checked)}/><span><strong>This episode is already published.</strong> New pages will become visible to its permitted readers as soon as each upload finishes. I understand.</span></label>}
   <div className="comic-upload-summary" aria-live="polite"><span>{done} of {entries.length} added</span>{busy&&<span>Uploading in sequence; keep this dialog open</span>}</div>
   {message&&<p className={'comic-upload-feedback'+(hasFailures?' is-error':'')} role="status">{message}</p>}
   <label className="comic-upload-addmore">Add more images to this batch
    <input type="file" accept={COMIC_IMAGE_ACCEPT} multiple disabled={busy||entries.length>=COMIC_UPLOAD_BATCH_LIMIT} onChange={e=>{receiveFiles(e.target.files);e.target.value=''}}/>
   </label>
   {!ready.ready&&waiting.length>0&&!busy&&<p className="comic-upload-readiness">{ready.reason}</p>}
   <div className="comic-upload-queue" aria-label="Pages queued for upload">
    {entries.map((entry,i)=><article className={'comic-upload-item status-'+entry.status} key={entry.id}>
     <div className="comic-upload-item-head">
      <div className="comic-upload-thumb">{entry.preview?<img src={entry.preview} alt="" />:<span aria-hidden="true"><PalaceIcon name="comic-book" size={23}/></span>}</div>
      <div className="comic-upload-file">
       <strong>{String(i+1).padStart(2,'0')} · {entry.file.name}</strong>
       <small>{(entry.file.size/1048576).toFixed(2)} MiB · {entry.status==='uploaded'?'Uploaded':entry.status==='uploading'?'Uploading…':entry.status==='error'?'Needs retry':'Ready to prepare'}</small>
      </div>
      <div className="comic-upload-reorder">
       <button type="button" aria-label={'Move '+entry.file.name+' earlier'} disabled={orderLocked||i===0} onClick={()=>move(entry.id,-1)}>↑</button>
       <button type="button" aria-label={'Move '+entry.file.name+' later'} disabled={orderLocked||i===entries.length-1} onClick={()=>move(entry.id,1)}>↓</button>
       {entry.status!=='uploaded'&&<button type="button" aria-label={'Remove '+entry.file.name+' from queue'} disabled={busy} onClick={()=>remove(entry.id)}>Remove</button>}
      </div>
     </div>
     {entry.status==='error'&&<p className="comic-upload-item-error" role="alert">{entry.error}</p>}
     <div className="comic-upload-fields">
      <label>Caption <small>(optional)</small><input maxLength={500} value={entry.caption} disabled={busy||entry.status==='uploaded'} onChange={e=>update(entry.id,{caption:e.target.value})} placeholder="Shown below the image"/></label>
      <label>Image description <small>{entry.decorative?'Not required':'Required for meaningful pages'}</small>
       <textarea rows={2} maxLength={1200} value={entry.altText} disabled={busy||entry.decorative||entry.status==='uploaded'} onChange={e=>update(entry.id,{altText:e.target.value})} placeholder="Describe the artwork for readers using assistive technology"/>
      </label>
      <label className="comic-upload-decorative"><input type="checkbox" checked={entry.decorative} disabled={busy||entry.status==='uploaded'} onChange={e=>update(entry.id,{decorative:e.target.checked})}/> Purely decorative image</label>
     </div>
    </article>)}
   </div>
   {done>0&&!busy&&<p className="comic-upload-complete">{done} uploaded page{done===1?'':'s'} will remain in this episode even if you close the uploader. Completing a batch does not publish the episode.</p>}
   {done>0&&waiting.length===0&&!busy&&<button className="quiet-button comic-upload-newbatch" type="button" onClick={clearQueue}>Prepare another batch</button>}
  </PalaceDialog>
 </>;
}
