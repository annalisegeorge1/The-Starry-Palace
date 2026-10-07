import {useEffect,useId,useMemo,useState} from 'react';
import sheets from './approvedBadgeSheets.json';

const tiers=['bronze','silver','gold','platinum','emerald'];
const normalize=value=>String(value||'').toLowerCase().replace(/[^a-z0-9]/g,'');
const names=new Map(Object.entries(sheets).map(([id,entry])=>[normalize(entry.name),id]));
/* New Ink Duel paths intentionally inherit approved Palace watercolour motifs
   until their bespoke duel sheets are painted. This keeps them visually
   coherent and avoids introducing placeholder/cartoon art. */
const duelArtAliases={
 'first-bell-scribe':'draft-moon',
 'keeper-of-the-arena':'writing-circle-host',
 'many-form-quill':'infinite-inkwell',
 'blind-moon-juror':'sprint-moon',
 'crowned-in-ink':'crown-of-completion',
 'laurel-constellation':'prompt-collector',
 'twin-quills-victor':'collaboration-scribe',
 'court-of-eight':'community-host'
};
const imagePromises=new Map();
const cutoutPromises=new Map();

export function approvedBadgeFrame(family,tier='bronze'){
 const sourceId=duelArtAliases[family?.id]||family?.id;const entry=sheets[sourceId]||sheets[names.get(normalize(family?.name))];
 if(!entry)return null;
 const column=Math.max(0,tiers.indexOf(tier));
 return {...entry,box:entry.frames[column]};
}

function median(values){
 if(!values.length)return 0;
 values.sort((a,b)=>a-b);
 return values[Math.floor(values.length/2)];
}

export function removeConnectedBadgeBackground(imageData,width,height,{threshold=54}={}){
 const data=imageData.data||imageData;
 const count=width*height;
 if(!data||data.length<count*4)return imageData;

 const rs=[],gs=[],bs=[];
 const sample=(x,y)=>{
  const i=(y*width+x)*4;
  if(data[i+3]<24)return;
  rs.push(data[i]);gs.push(data[i+1]);bs.push(data[i+2]);
 };
 for(let x=0;x<width;x+=Math.max(1,Math.floor(width/36))){sample(x,0);sample(x,height-1)}
 for(let y=1;y<height-1;y+=Math.max(1,Math.floor(height/36))){sample(0,y);sample(width-1,y)}
 if(!rs.length)return imageData;

 const bg=[median(rs),median(gs),median(bs)];
 const thresholdSq=threshold*threshold;
 const visited=new Uint8Array(count);
 const queue=new Int32Array(count);
 let head=0,tail=0;

 const backgroundLike=p=>{
  const i=p*4;
  if(data[i+3]<24)return true;
  const dr=data[i]-bg[0],dg=data[i+1]-bg[1],db=data[i+2]-bg[2];
  const distance=dr*dr+dg*dg+db*db;
  if(distance<=thresholdSq)return true;
  const max=Math.max(data[i],data[i+1],data[i+2]);
  const min=Math.min(data[i],data[i+1],data[i+2]);
  const lum=.2126*data[i]+.7152*data[i+1]+.0722*data[i+2];
  const bgLum=.2126*bg[0]+.7152*bg[1]+.0722*bg[2];
  return lum<=Math.max(52,bgLum+18)&&(max-min)<=36;
 };
 const add=p=>{if(p<0||p>=count||visited[p]||!backgroundLike(p))return;visited[p]=1;queue[tail++]=p};
 for(let x=0;x<width;x++){add(x);add((height-1)*width+x)}
 for(let y=1;y<height-1;y++){add(y*width);add(y*width+width-1)}

 while(head<tail){
  const p=queue[head++],x=p%width,y=Math.floor(p/width);
  if(x>0)add(p-1);if(x<width-1)add(p+1);if(y>0)add(p-width);if(y<height-1)add(p+width);
 }
 for(let p=0;p<count;p++)if(visited[p])data[p*4+3]=0;

 // Feather one pixel of the cut edge so the watercolour does not keep a dark rectangular halo.
 const alpha=new Uint8Array(count);
 for(let p=0;p<count;p++)alpha[p]=data[p*4+3];
 for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++){
  const p=y*width+x;if(!alpha[p])continue;
  if(alpha[p-1]||alpha[p+1]||alpha[p-width]||alpha[p+width]){
   const touchesClear=!alpha[p-1]||!alpha[p+1]||!alpha[p-width]||!alpha[p+width];
   if(touchesClear){
    const i=p*4,dr=data[i]-bg[0],dg=data[i+1]-bg[1],db=data[i+2]-bg[2];
    const distance=Math.sqrt(dr*dr+dg*dg+db*db);
    if(distance<86)data[i+3]=Math.min(data[i+3],Math.max(0,Math.round((distance-24)/62*255)));
   }
  }
 }
 return imageData;
}

function loadSource(src){
 if(!imagePromises.has(src))imagePromises.set(src,new Promise((resolve,reject)=>{
  const image=new Image();
  image.decoding='async';
  image.onload=()=>resolve(image);
  image.onerror=()=>{imagePromises.delete(src);reject(new Error('Badge sheet failed to load'))};
  image.src=src;
 }));
 return imagePromises.get(src);
}

async function createCutout(frame){
 const [x,y,w,h]=frame.box;
 const pad=Math.max(w,h)*.13;
 const sx=Math.max(0,Math.floor(x-pad));
 const sy=Math.max(0,Math.floor(y-pad));
 const ex=Math.min(frame.width,Math.ceil(x+w+pad));
 const ey=Math.min(frame.height,Math.ceil(y+h+pad));
 const sw=Math.max(1,ex-sx),sh=Math.max(1,ey-sy);
 const src='/assets/palace-courts/'+frame.asset+'?v=transparent-cutout-1';
 const image=await loadSource(src);
 const canvas=document.createElement('canvas');
 canvas.width=sw;canvas.height=sh;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});
 if(!ctx)throw new Error('Canvas unavailable');
 ctx.clearRect(0,0,sw,sh);
 ctx.drawImage(image,sx,sy,sw,sh,0,0,sw,sh);
 const pixels=ctx.getImageData(0,0,sw,sh);
 removeConnectedBadgeBackground(pixels,sw,sh);
 ctx.clearRect(0,0,sw,sh);
 ctx.putImageData(pixels,0,0);
 return canvas.toDataURL('image/png');
}

function cutoutKey(frame){
 return frame.asset+':'+frame.box.join(',');
}

function getCutout(frame){
 const key=cutoutKey(frame);
 if(!cutoutPromises.has(key))cutoutPromises.set(key,createCutout(frame).catch(error=>{cutoutPromises.delete(key);throw error}));
 return cutoutPromises.get(key);
}

function OriginalCrop({frame,id,name,tier}){
 const [x,y,w,h]=frame.box,pad=Math.max(w,h)*.09;
 return <svg className="approved-badge-art approved-badge-fallback" viewBox={[x-pad,y-pad,w+pad*2,h+pad*2].join(' ')} preserveAspectRatio="xMidYMid meet" role="img" aria-label={`${name} · ${tier} watercolour`} focusable="false">
  <defs><clipPath id={id} clipPathUnits="userSpaceOnUse"><rect x={x} y={y} width={w} height={h}/></clipPath></defs>
  <image href={'/assets/palace-courts/'+frame.asset+'?v=complete-3'} width={frame.width} height={frame.height} clipPath={`url(#${id})`}/>
 </svg>;
}

export default function ApprovedBadgeArt({frame,name,tier}){
 const id=useId();
 const key=useMemo(()=>cutoutKey(frame),[frame.asset,frame.box.join(',')]);
 const[cutout,setCutout]=useState(null);
 const[failed,setFailed]=useState(false);

 useEffect(()=>{
  let live=true;setCutout(null);setFailed(false);
  getCutout(frame).then(src=>{if(live)setCutout(src)}).catch(()=>{if(live)setFailed(true)});
  return()=>{live=false};
 },[key]);

 if(cutout)return <img className="approved-badge-art approved-badge-cutout" src={cutout} alt={`${name} · ${tier} watercolour`} loading="lazy" decoding="async"/>;
 if(failed)return <OriginalCrop frame={frame} id={id} name={name} tier={tier}/>;
 return <span className="approved-badge-art approved-badge-cutout-loading" role="img" aria-label={`${name} · ${tier} watercolour loading`} />;
}
