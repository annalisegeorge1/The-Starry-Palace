import {PaintedBadge,PaintedBadgePainting} from './PaintedPalaceArt';
import {paintedFamily} from './paintedCollection';
import {useEffect,useId,useState} from 'react';
import {resolveBadgeFrame} from './badgeArtwork';
import originals from './originalBadges.json';
import ApprovedBadgeArt,{approvedBadgeFrame} from './ApprovedBadgeArt';
import {MergedBadgeArt,mergedBadgeArtwork} from './MergedBadgeArt';
import './treasury.css';
import './circular-achievement-badges.css';
const protectArt={onContextMenu:e=>e.preventDefault(),onDragStart:e=>e.preventDefault(),onCopy:e=>e.preventDefault(),onCut:e=>e.preventDefault()};

const ranks=['bronze','silver','gold','platinum','emerald'];
const normal=value=>String(value||'').toLowerCase().replace(/[^a-z0-9]/g,'');
const catalogue=new Map(originals.map(b=>[normal(b.name),b.id]));
const aliases={'chaptervoyager':'read','chapterarchitect':'chapter','quietshelf':'bookmark','thoughtfulvoice':'comment','artistsseal':'art','communityhost':'event','eventsteward':'eventhostupdates','writingcirclehost':'eventwriting','readingcirclehost':'eventreading','clubfounder':'club','forumconstellation':'clubpost','heritagevisitor':'festival','sprintmoon':'eventwriting'};

const frameLoaders={
 bronze:()=>import('./badgeFrames.bronze.json'),
 silver:()=>import('./badgeFrames.silver.json'),
 gold:()=>import('./badgeFrames.gold.json'),
 platinum:()=>import('./badgeFrames.platinum.json'),
 emerald:()=>import('./badgeFrames.emerald.json')
};
const frameCache=new Map();
function loadFrames(rank){
 if(!frameCache.has(rank))frameCache.set(rank,frameLoaders[rank]().then(m=>m.default||m).catch(error=>{frameCache.delete(rank);throw error}));
 return frameCache.get(rank);
}
function SheetArt({frame,id,mount=false,className=''}) {
 const base=mount?'original-badge-mount':'original-badge-picture';
 return <svg {...protectArt} className={base+(className?' '+className:'')} viewBox={frame.box.join(' ')} preserveAspectRatio={mount?'xMidYMid meet':'xMidYMid meet'} focusable="false" aria-hidden="true"><defs><clipPath id={id} clipPathUnits="userSpaceOnUse"><path d={frame.clip} transform={`translate(${frame.box[0]} ${frame.box[1]})`} fillRule={mount?'evenodd':undefined} clipRule={mount?'evenodd':undefined}/></clipPath></defs><image href={'/assets/palace-originals/'+frame.asset} width={frame.width} height={frame.height} clipPath={`url(#${id})`}/></svg>;
}

const tierMounts={
 bronze:{box:[0,50,434,595],clip:'M0 0H434V595H0Z M106 146H328V390H106Z',width:2172,height:724,asset:'palace-watercolour-tier-mounts.png'},
 silver:{box:[434,50,435,595],clip:'M0 0H435V595H0Z M107 146H328V390H107Z',width:2172,height:724,asset:'palace-watercolour-tier-mounts.png'},
 gold:{box:[869,50,434,595],clip:'M0 0H434V595H0Z M106 146H328V390H106Z',width:2172,height:724,asset:'palace-watercolour-tier-mounts.png'},
 platinum:{box:[1303,50,435,595],clip:'M0 0H435V595H0Z M107 146H328V390H107Z',width:2172,height:724,asset:'palace-watercolour-tier-mounts.png'},
 emerald:{box:[1738,50,434,595],clip:'M0 0H434V595H0Z M106 146H328V390H106Z',width:2172,height:724,asset:'palace-watercolour-tier-mounts.png'}
};

function PaintedTierMount({rank,id}){
 return <SheetArt frame={tierMounts[rank]||tierMounts.bronze} id={id} mount className="painted-tier-mount"/>;
}

// Art never grants achievements: unlock records remain authoritative.
export default function PalaceBadge({family,tier='bronze',locked=false,catalogueFrame=false}){
 const id=useId();
 const rank=ranks.includes(tier)?tier:'bronze';
 const key=normal(family?.name);
 const originalId=family?.id;
 const namedId=catalogue.get(key)||aliases[key];
 const painted=paintedFamily(family);
 const merged=mergedBadgeArtwork(family,rank);
 const approved=merged?null:approvedBadgeFrame(family,rank);
 const[frame,setFrame]=useState(null);
 const[loading,setLoading]=useState(true);

 useEffect(()=>{
  let alive=true;
  setFrame(null);setLoading(true);
  if(painted||merged||approved||(!originalId&&!namedId)){setLoading(false);return()=>{alive=false}}
  loadFrames(rank).then(frames=>{if(alive){setFrame(resolveBadgeFrame(frames,originalId,namedId));setLoading(false)}}).catch(()=>{if(alive){setFrame(null);setLoading(false)}});
  return()=>{alive=false};
 },[rank,originalId,namedId,Boolean(approved),Boolean(merged),Boolean(painted)]);

 const name=family?.name||'Palace achievement';
 const subject=painted?(catalogueFrame?<PaintedBadgePainting family={painted} fitted/>:<PaintedBadge family={painted} tier={rank} showFrame={false}/>)
  :merged?<MergedBadgeArt art={merged} name={name}/>
  :approved?<ApprovedBadgeArt frame={approved} name={name} tier={rank}/>
  :frame?<SheetArt frame={frame} id={id}/>
  :<span role="status">{loading?'Artwork loading…':'Artwork unavailable'}</span>;
 if(!catalogueFrame){
  const paintedMount=Boolean(merged||approved);
  let art=subject;
  if(paintedMount){
   const stage=merged?'merged-badge-stage':'approved-badge-stage';
   const shape=merged?.type==='court'?'is-character':'is-object';
   art=<span className={`original-badge-stage painted-tier-stage ${stage} ${shape}`}>
    <span className="painted-badge-inner">{subject}</span>
    <PaintedTierMount rank={rank} id={id+'-painted-tier'}/>
   </span>;
  }else if(!painted){
   art=<span className={'original-badge-stage'+(frame?.character?' is-character':'')} role="img" aria-label={name+' · '+rank+' artwork'}>{subject}
    {frame?.mount&&<SheetArt frame={frame.mount} id={id+'-mount'} mount/>}
   </span>;
  }
  return <figure {...protectArt} className={'palace-watercolour-badge protected-palace-art tier-'+rank+(locked?' is-locked':'')+(painted?' has-painted-round no-new-badge-frames':'')+(paintedMount?' has-original-tier-frame':'')}>
   {art}<figcaption>{rank}{locked?' · Preview':''}</figcaption>
  </figure>;
 }
 return <figure {...protectArt} className={'palace-watercolour-badge protected-palace-art circular-achievement-badge tier-'+rank+(locked?' is-locked':'')}>
  <span className="circular-achievement-stage" data-tier={rank} role="img" aria-label={name+' · '+rank+' artwork'+(locked?' (preview)':'')}>
   <span className={'circular-achievement-subject'+(painted?' is-painted':'')}>{subject}</span>
   <img className="circular-achievement-mount" src={'/assets/badges-illustrated/v2/'+rank+'.webp'} alt="" aria-hidden="true" draggable="false" loading="lazy"/>
  </span>
  <figcaption>{rank}{locked?' · Preview':''}</figcaption>
 </figure>;
}
