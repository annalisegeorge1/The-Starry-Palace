import {supabase} from './supabase';

export const PALACE_CHAT_PHOTO_BUCKET='palace-chat-photos';
export const PALACE_CHAT_PHOTO_MAX_UPLOAD=6*1024*1024;
const allowed=new Set(['image/jpeg','image/png','image/webp','image/avif']);

export async function preparePalaceChatPhoto(file){
 if(!file||!allowed.has(file.type))throw new Error('Choose a JPEG, PNG, WebP or AVIF photo.');
 if(file.size>18*1024*1024)throw new Error('Choose a photo smaller than 18 MB.');
 // Re-encoding removes EXIF location metadata and prevents arbitrary file
 // content from being stored as a chat image.
 if(typeof document==='undefined')throw new Error('Photo preparation requires a browser.');
 const bitmap=typeof createImageBitmap==='function'?await createImageBitmap(file):await new Promise((resolve,reject)=>{
  const img=new Image(),src=URL.createObjectURL(file);
  img.onload=()=>{URL.revokeObjectURL(src);resolve(img)};
  img.onerror=()=>{URL.revokeObjectURL(src);reject(new Error('Photo could not be read.'))};
  img.src=src;
 });
 try{
  const w=bitmap.width||bitmap.naturalWidth,h=bitmap.height||bitmap.naturalHeight;
  if(!w||!h)throw new Error('Photo dimensions are unavailable.');
  const scale=Math.min(1,1600/Math.max(w,h));
  const canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(w*scale));
  canvas.height=Math.max(1,Math.round(h*scale));
  const ctx=canvas.getContext('2d',{alpha:false});
  if(!ctx)throw new Error('Photo editing is not supported in this browser.');
  ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
  const blob=await new Promise((resolve,reject)=>canvas.toBlob(v=>v?resolve(v):reject(new Error('Could not prepare photo.')),'image/webp',.84));
  if(blob.type!=='image/webp')throw new Error('This browser cannot prepare safe WebP photos.');
  if(blob.size>PALACE_CHAT_PHOTO_MAX_UPLOAD)throw new Error('The prepared photo is over 6 MB. Try another photo.');
  return blob;
 }finally{bitmap.close?.()}
}

export async function uploadPalaceChatPhoto({kind,roomId,userId,file}){
 if(!supabase)throw new Error('Palace Storage is unavailable.');
 if(!['direct','group'].includes(kind)||!roomId||!userId)throw new Error('Choose a conversation first.');
 const photo=await preparePalaceChatPhoto(file);
 const path=kind+'/'+roomId+'/'+userId+'/'+crypto.randomUUID()+'.webp';
 const {error}=await supabase.storage.from(PALACE_CHAT_PHOTO_BUCKET).upload(path,photo,{contentType:'image/webp',cacheControl:'3600',upsert:false});
 if(error)throw error;
 return path;
}
export async function discardPalaceChatPhoto(path){
 if(!supabase||!path)return;
 const {error}=await supabase.storage.from(PALACE_CHAT_PHOTO_BUCKET).remove([path]);
 if(error)throw error;
}
export async function signedPalaceChatPhoto(path){
 if(!supabase||typeof path!=='string'||!/^(direct|group)\/[0-9a-f-]{36}\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.webp$/.test(path))throw new Error('Invalid private photo location.');
 const {data,error}=await supabase.storage.from(PALACE_CHAT_PHOTO_BUCKET).createSignedUrl(path,3600);
 if(error)throw error;
 return data.signedUrl;
}
