import React,{useEffect,useMemo,useState} from 'react';

const tiers=['bronze','silver','gold','platinum','emerald'];
const normal=value=>String(value||'').toLowerCase().replace(/[^a-z0-9]/g,'');
const courtImageCache=new Map();
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
 ...Object.entries(mergedCourtPaths).map(([id,x])=>[id,{...x,id,type:'court'}])
]);
for(const [id,x] of Object.entries(mergedCourtPaths))byName.set(normal(x.name),{...x,id,type:'court'});

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
 return{
  x:art.column*cellWidth,
  y:art.row*cellHeight,
  width:cellWidth,
  height:cellHeight
 };
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

async function cropCourtPortrait(art){
 const src='/assets/palace-courts/'+art.sheet+'.png?v=portrait-cell-1';
 const image=await loadCourtSheet(src);
 const cell=courtPortraitCellRect(image.naturalWidth,image.naturalHeight,art);
 const pad=Math.round(Math.max(cell.width,cell.height)*.12);
 const canvas=document.createElement('canvas');
 canvas.width=Math.ceil(cell.width+pad*2);
 canvas.height=Math.ceil(cell.height+pad*2);
 const ctx=canvas.getContext('2d');
 if(!ctx)throw new Error('Canvas unavailable');
 ctx.clearRect(0,0,canvas.width,canvas.height);
 ctx.drawImage(
  image,
  Math.floor(cell.x),Math.floor(cell.y),Math.ceil(cell.width),Math.ceil(cell.height),
  pad,pad,Math.ceil(cell.width),Math.ceil(cell.height)
 );
 return canvas.toDataURL('image/png');
}

function courtCropKey(art){
 return art.sheet+':'+art.row+':'+art.column;
}

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
  let live=true;
  setSrc('');setFailed(false);
  if(typeof Image==='undefined'||typeof document==='undefined'){setFailed(true);return()=>{live=false}}
  getCourtPortrait(art).then(value=>{if(live)setSrc(value)}).catch(()=>{if(live)setFailed(true)});
  return()=>{live=false};
 },[key]);

 const label=(name||art.name)+' · '+art.tier+' · '+art.court+' court watercolour';
 if(src)return <img className="merged-court-portrait" src={src} alt={label}/>;
 return <span
  className={'merged-court-portrait-placeholder'+(failed?' is-fallback':'')}
  role="img"
  aria-label={label}
  data-court-cell={art.column+':'+art.row}
 />;
}

export function MergedBadgeArt({art,name}){
 if(!art)return null;
 if(art.type==='object'){
  const src='/assets/palace-collectibles/'+art.asset+'-'+art.tier+'.png';
  return <img className="merged-badge-object" src={src} alt={(name||art.name)+' · '+art.tier+' watercolour'} loading="lazy" decoding="async"/>;
 }
 return <CourtPortraitArt art={art} name={name}/>;
}
