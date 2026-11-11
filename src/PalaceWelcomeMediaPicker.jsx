import React,{useEffect,useId,useState} from 'react';
import {PALACE_IMAGE_ACCEPT,validatePalaceWelcomeImage} from './palaceWelcomeMediaModel';

export default function PalaceWelcomeMediaPicker({kind,label,file,onChange,existingImage='',disabled=false}) {
 const id=useId();
 const [preview,setPreview]=useState('');
 const [message,setMessage]=useState('');
 useEffect(()=>{
  if(!file || typeof URL.createObjectURL!=='function'){setPreview('');return;}
  const url=URL.createObjectURL(file);
  setPreview(url);
  return()=>URL.revokeObjectURL(url);
 },[file]);
 function choose(e){
  const selected=e.target.files?.[0]||null;
  if(!selected){return;}
  const issue=validatePalaceWelcomeImage(selected);
  if(issue){setMessage(issue);e.target.value='';return;}
  setMessage('');onChange(selected);
 }
 function remove(){setMessage('');onChange(null);}
 return <div className={'palace-welcome-media-card '+(kind==='avatar'?'portrait':'cover')}>
  <div className="palace-welcome-media-copy">
   <strong id={id+'-label'}>{label}</strong>
   <small>Optional · JPG, PNG, WebP or GIF · up to 6 MB</small>
  </div>
  <div className="palace-welcome-media-preview">
   {preview||existingImage?<img src={preview||existingImage} alt={(preview?'Selected ':'Current ')+label.toLowerCase()+' preview'}/>:<span aria-hidden="true">{kind==='avatar'?'✧':'✦'}</span>}
  </div>
  <label className="palace-welcome-media-choose">
   <span>{file?'Choose another image':kind==='avatar'?'Choose a portrait':'Choose a chamber cover'}</span>
   <input type="file" accept={PALACE_IMAGE_ACCEPT} aria-label={'Upload '+label.toLowerCase()+' image'} aria-describedby={id+'-label'} onChange={choose} disabled={disabled}/>
  </label>
  {file&&<button className="palace-welcome-media-remove" type="button" onClick={remove} disabled={disabled}>Remove selected image</button>}
  <p className="palace-welcome-media-filename" aria-live="polite">{file?.name||(existingImage?'Current image will be kept':'No image selected')}</p>
  {message&&<p className="palace-welcome-media-error" role="alert">{message}</p>}
 </div>;
}
