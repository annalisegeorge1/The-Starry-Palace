import {useEffect,useId,useState} from 'react';
import {resolveBadgeFrame} from './badgeArtwork';
import originals from './originalBadges.json';
import ApprovedBadgeArt,{approvedBadgeFrame} from './ApprovedBadgeArt';
import {MergedBadgeArt,mergedBadgeArtwork} from './MergedBadgeArt';
import './treasury.css';

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
function SheetArt({frame,id,mount=false}){
 return <svg className={mount?'original-badge-mount':'original-badge-picture'} viewBox={frame.box.join(' ')} preserveAspectRatio={mount?'none':'xMidYMid meet'} focusable="false" aria-hidden="true"><defs><clipPath id={id} clipPathUnits="userSpaceOnUse"><path d={frame.clip} transform={`translate(${frame.box[0]} ${frame.box[1]})`} fillRule={mount?'evenodd':undefined} clipRule={mount?'evenodd':undefined}/></clipPath></defs><image href={'/assets/palace-originals/'+frame.asset} width={frame.width} height={frame.height} clipPath={`url(#${id})`}/></svg>;
}

// Art never grants achievements: unlock records remain authoritative.
export default function PalaceBadge({family,tier='bronze',locked=false}){
 const id=useId();
 const rank=ranks.includes(tier)?tier:'bronze';
 const key=normal(family?.name);
 const originalId=family?.id;
 const namedId=catalogue.get(key)||aliases[key];
 const merged=mergedBadgeArtwork(family,rank);
 const approved=merged?null:approvedBadgeFrame(family,rank);
 const[frame,setFrame]=useState(null);
 const[loading,setLoading]=useState(true);

 useEffect(()=>{
  let alive=true;
  setFrame(null);setLoading(true);
  if(merged||approved||(!originalId&&!namedId)){setLoading(false);return()=>{alive=false}}
  loadFrames(rank).then(frames=>{if(alive){setFrame(resolveBadgeFrame(frames,originalId,namedId));setLoading(false)}}).catch(()=>{if(alive){setFrame(null);setLoading(false)}});
  return()=>{alive=false};
 },[rank,originalId,namedId,Boolean(approved),Boolean(merged)]);

 const name=family?.name||'Palace achievement';
 
 return <figure className={'palace-watercolour-badge tier-'+rank+(locked?' is-locked':'')}>
  {merged?<span className={'original-badge-stage merged-badge-stage '+(merged.type==='court'?'is-character':'is-object badge-tier-frame')}><MergedBadgeArt art={merged} name={name}/>{merged.type==='object'&&<span className="badge-tier-ornament" aria-hidden="true"><i/><i/><i/></span>}</span>:approved?<span className="original-badge-stage approved-badge-stage is-object badge-tier-frame"><ApprovedBadgeArt frame={approved} name={name} tier={rank}/><span className="badge-tier-ornament" aria-hidden="true"><i/><i/><i/></span></span>:frame?<span className={'original-badge-stage'+(frame.character?' is-character':'')} role="img" aria-label={name+' · '+rank+' artwork'+(locked?' (preview)':'')}><SheetArt frame={frame} id={id}/>{frame.mount&&<SheetArt frame={frame.mount} id={id+'-mount'} mount/>}</span>:<span className="original-badge-stage" role="status">{loading?'Artwork loading…':'Artwork unavailable'}</span>}
  <figcaption>{rank}{locked?' · Preview':''}</figcaption>
 </figure>;
}
