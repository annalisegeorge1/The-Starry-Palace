import React,{useEffect,useMemo,useState} from 'react';

const tiers=['bronze','silver','gold','platinum','emerald'];
const normal=value=>String(value||'').toLowerCase().replace(/[^a-z0-9]/g,'');
const courtImageCache=new Map();
const courtAnalysisCache=new Map();
const courtCropCache=new Map();

export const mergedObjectPaths={
 'reading-circle-host':{name:'Reading Circle Host',label:'Moonlit Tea',asset:'moonlit-tea'},
 'lunar-lantern':{name:'Lunar Lantern',label:'Moonflower Lanterns',asset:'moonlit-lantern'},
 'crown-of-completion':{name:'Crown of Completion',label:'Crescent Crowns',asset:'moonlit-crown'},
 'infinite-inkwell':{name:'Infinite Inkwell',label:"Poet’s Inkwells",asset:'moonlit-inkwell'},
 'story-pilgrim':{name:'Story Pilgrim',label:'Celestial Folios',asset:'moonlit-book'}
};

export const mergedCourtPaths={
 'thoughtful-voice':{name:'Thoughtful Voice',court:'Mali',sheet:'courts-1',row:0},
 'welcome-lantern':{name:'Welcome Lantern',court:'Egypt',sheet:'courts-1',row:1},
 'community-host':{name:'Community Host',court:'Ethiopia',sheet:'courts-1',row:2},
 'reading-festival-voyager':{name:'Reading Festival Voyager',court:'Tang China',sheet:'courts-1',row:3},
 'salon-guest':{name:'Salon Guest',court:'Korea',sheet:'courts-2',row:0},
 'workshop-scholar':{name:'Workshop Scholar',court:'Britain',sheet:'courts-2',row:1},
 'event-steward':{name:'Event Steward',court:'Rome',sheet:'courts-2',row:2},
 'club-founder':{name:'Club Founder',court:'Persia',sheet:'courts-2',row:3},
 'steward-s-key':{name:"Steward's Key",court:'Mongol',sheet:'courts-3',row:0},
 'circle-of-moons':{name:'Circle of Moons',court:'Ottoman',sheet:'courts-3',row:1},
 'cross-court-visitor':{name:'Cross-Court Visitor',court:'Greek',sheet:'courts-3',row:2},
 'community-bridge':{name:'Community Bridge',court:'Russian',sheet:'courts-3',row:3}
};

const byName=new Map([
 ...Object.entries(mergedObjectPaths).map(([id,x])=>[normal(x.name),{...x,id,type:'object'}]),
 ...Object.entries(mergedCourtPaths).map(([id,x])=>[normal(x.name),{...x,id,type:'court'}])
]);
const byId=new Map([
 ...Object.entries(mergedObjectPaths).map(([id,x])=>[id,{...x,id,type:'object'}]),
 ...Object.entries(mergedCourtPaths).map(([id,x])=>[id,{...x,id,type:'court'}])
]);

export const mergedBadgePathCount=byId.size;

export function mergedBadgeArtwork(family,tier='bronze'){
 const rank=tiers.includes(tier)?tier:'bronze';
 const id=String(family?.id||'');
 const found=byId.get(id)||byName.get(normal(family?.name));
 if(!found)return null;
 return{...found,tier:rank,column:tiers.indexOf(rank)};
}

export function courtPortraitCellRect(width,height,art){
 const cellWidth=width/5;
 const cellHeight=height/4;
 return{x:art.column*cellWidth,y:art.row*cellHeight,width:cellWidth,height:cellHeight};
}

function median(values){
 if(!values.length)return 0;
 values.sort((a,b)=>a-b);
 return values[Math.floor(values.length/2)];
}

export function buildCourtForegroundMask(imageData,width,height){
 const data=imageData.data||imageData;
 const mask=new Uint8Array(width*height);
 let sampled=0,transparent=0;
 for(let y=0;y<height;y+=4)for(let x=0;x<width;x+=4){
  sampled++;
  if(data[(y*width+x)*4+3]<220)transparent++;
 }
 const usesAlpha=sampled&&transparent/sampled>.008;
 if(usesAlpha){
  for(let p=0;p<mask.length;p++)if(data[p*4+3]>18)mask[p]=1;
  return mask;
 }

 const rs=[],gs=[],bs=[];
 const take=(x,y)=>{
  const i=(y*width+x)*4;
  rs.push(data[i]);gs.push(data[i+1]);bs.push(data[i+2]);
 };
 const stepX=Math.max(1,Math.floor(width/48)),stepY=Math.max(1,Math.floor(height/48));
 for(let x=0;x<width;x+=stepX){take(x,0);take(x,height-1)}
 for(let y=1;y<height-1;y+=stepY){take(0,y);take(width-1,y)}
 const bg=[median(rs),median(gs),median(bs)];
 for(let p=0;p<mask.length;p++){
  const i=p*4,dr=data[i]-bg[0],dg=data[i+1]-bg[1],db=data[i+2]-bg[2];
  if(dr*dr+dg*dg+db*db>38*38)mask[p]=1;
 }
 return mask;
}

export function findTransparentGridCuts(mask,width,height,parts,axis){
 const length=axis==='x'?width:height;
 const cross=axis==='x'?height:width;
 const activity=new Uint32Array(length);
 if(axis==='x'){
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(mask[y*width+x])activity[x]++;
 }else{
  for(let y=0;y<height;y++){
   let count=0;for(let x=0;x<width;x++)if(mask[y*width+x])count++;
   activity[y]=count;
  }
 }
 const cuts=[0],span=length/parts;
 for(let i=1;i<parts;i++){
  const expected=i*span;
  const lo=Math.max(1,Math.floor(expected-span*.3));
  const hi=Math.min(length-2,Math.ceil(expected+span*.3));
  const radius=Math.max(1,Math.floor(span*.025));
  let best=Math.round(expected),bestScore=Infinity;
  for(let p=lo;p<=hi;p++){
   let score=0;
   for(let d=-radius;d<=radius;d++)score+=activity[Math.max(0,Math.min(length-1,p+d))];
   const distancePenalty=Math.abs(p-expected)*cross*.00015;
   if(score+distancePenalty<bestScore){bestScore=score+distancePenalty;best=p}
  }
  const low=Math.max(1,Math.floor(cross*.012));
  let a=best,b=best;
  while(a>lo&&activity[a-1]<=low)a--;
  while(b<hi&&activity[b+1]<=low)b++;
  cuts.push(Math.round((a+b)/2));
 }
 cuts.push(length);
 return cuts;
}

export function foregroundBounds(mask,width,height,x0,y0,x1,y1){
 let minX=x1,minY=y1,maxX=x0-1,maxY=y0-1;
 for(let y=Math.max(0,y0);y<Math.min(height,y1);y++)for(let x=Math.max(0,x0);x<Math.min(width,x1);x++){
  if(!mask[y*width+x])continue;
  if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y;
 }
 if(maxX<minX||maxY<minY)return null;
 return{x:minX,y:minY,width:maxX-minX+1,height:maxY-minY+1};
}

function loadCourtSheet(src){
 if(!courtImageCache.has(src))courtImageCache.set(src,new Promise((resolve,reject)=>{
  const image=new Image();
  image.decoding='async';
  image.onload=()=>resolve(image);
  image.onerror=()=>{courtImageCache.delete(src);reject(new Error('Court portrait sheet failed to load'))};
  image.src=src;
 }));
 return courtImageCache.get(src);
}

async function analyseCourtSheet(src){
 if(courtAnalysisCache.has(src))return courtAnalysisCache.get(src);
 const promise=(async()=>{
  const image=await loadCourtSheet(src);
  const width=image.naturalWidth,height=image.naturalHeight;
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  if(!ctx)throw new Error('Canvas unavailable');
  ctx.drawImage(image,0,0);
  const pixels=ctx.getImageData(0,0,width,height);
  const mask=buildCourtForegroundMask(pixels,width,height);
  return{
   image,width,height,mask,
   xCuts:findTransparentGridCuts(mask,width,height,5,'x'),
   yCuts:findTransparentGridCuts(mask,width,height,4,'y')
  };
 })().catch(error=>{courtAnalysisCache.delete(src);throw error});
 courtAnalysisCache.set(src,promise);
 return promise;
}

async function cropCourtPortrait(art){
 const src='/assets/palace-courts/'+art.sheet+'.png?v=portrait-content-aware-1';
 const analysis=await analyseCourtSheet(src);
 const{xCuts,yCuts,mask,width,height,image}=analysis;
 const cellX0=xCuts[art.column],cellX1=xCuts[art.column+1];
 const cellY0=yCuts[art.row],cellY1=yCuts[art.row+1];
 const found=foregroundBounds(mask,width,height,cellX0,cellY0,cellX1,cellY1);
 const fallback=courtPortraitCellRect(width,height,art);
 const box=found||fallback;
 const pad=Math.max(5,Math.round(Math.max(box.width,box.height)*.055));
 const sx=Math.max(cellX0,Math.floor(box.x-pad));
 const sy=Math.max(cellY0,Math.floor(box.y-pad));
 const ex=Math.min(cellX1,Math.ceil(box.x+box.width+pad));
 const ey=Math.min(cellY1,Math.ceil(box.y+box.height+pad));
 const sw=Math.max(1,ex-sx),sh=Math.max(1,ey-sy);
 const canvas=document.createElement('canvas');canvas.width=sw;canvas.height=sh;
 const ctx=canvas.getContext('2d');
 if(!ctx)throw new Error('Canvas unavailable');
 ctx.clearRect(0,0,sw,sh);
 ctx.drawImage(image,sx,sy,sw,sh,0,0,sw,sh);
 return canvas.toDataURL('image/png');
}

function courtCropKey(art){return art.sheet+':'+art.row+':'+art.column}
function getCourtPortrait(art){
 const key=courtCropKey(art);
 if(!courtCropCache.has(key))courtCropCache.set(key,cropCourtPortrait(art).catch(error=>{courtCropCache.delete(key);throw error}));
 return courtCropCache.get(key);
}

function CourtPortraitArt({art,name}){
 const key=useMemo(()=>courtCropKey(art),[art.sheet,art.row,art.column]);
 const[src,setSrc]=useState('');
 const[failed,setFailed]=useState(false);

 useEffect(()=>{
  let live=true;setSrc('');setFailed(false);
  if(typeof Image==='undefined'||typeof document==='undefined'){setFailed(true);return()=>{live=false}}
  getCourtPortrait(art).then(value=>{if(live)setSrc(value)}).catch(()=>{if(live)setFailed(true)});
  return()=>{live=false};
 },[key]);

 const label=(name||art.name)+' · '+art.tier+' · '+art.court+' court watercolour';
 if(src)return <img className="merged-court-portrait" src={src} alt={label} loading="lazy" decoding="async" draggable="false"/>;
 return <span className={'merged-court-portrait-placeholder'+(failed?' is-fallback':'')} role="img" aria-label={label} data-court-cell={art.column+':'+art.row}><i aria-hidden="true">☾</i><small>{failed?(art.court||'Palace court'):'Watercolour gathering…'}</small></span>;
}

export function MergedBadgeArt({art,name}){
 if(!art)return null;
 if(art.type==='object'){
  const src='/assets/palace-collectibles/'+art.asset+'-'+art.tier+'.png';
  return <img className="merged-badge-object" src={src} alt={(name||art.name)+' · '+art.tier+' watercolour'} loading="lazy" decoding="async" draggable="false"/>;
 }
 return <CourtPortraitArt art={art} name={name}/>;
}
