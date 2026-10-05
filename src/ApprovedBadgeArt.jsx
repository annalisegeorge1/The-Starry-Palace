import {useId} from 'react';
import sheets from './approvedBadgeSheets.json';
const tiers=['bronze','silver','gold','platinum','emerald'];
const normalize=value=>String(value||'').toLowerCase().replace(/[^a-z0-9]/g,'');
const names=new Map(Object.entries(sheets).map(([id,entry])=>[normalize(entry.name),id]));
export function approvedBadgeFrame(family,tier='bronze'){
 const entry=sheets[family?.id]||sheets[names.get(normalize(family?.name))];
 if(!entry)return null;
 const column=Math.max(0,tiers.indexOf(tier));
 return {...entry,box:entry.frames[column]};
}
export default function ApprovedBadgeArt({frame,name,tier}){
 const id=useId();const [x,y,w,h]=frame.box,pad=Math.max(w,h)*.09;
 return <svg className="approved-badge-art" viewBox={[x-pad,y-pad,w+pad*2,h+pad*2].join(' ')} preserveAspectRatio="xMidYMid meet" role="img" aria-label={`${name} · ${tier} watercolour`} focusable="false" style={{display:'block',width:'100%',height:'100%',overflow:'hidden'}}>
  <defs><clipPath id={id} clipPathUnits="userSpaceOnUse"><rect x={x} y={y} width={w} height={h}/></clipPath></defs>
  <image href={'/assets/palace-courts/'+frame.asset+'?v=complete-3'} width={frame.width} height={frame.height} clipPath={`url(#${id})`}/>
 </svg>;
}
