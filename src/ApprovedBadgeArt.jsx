import sheets from './approvedBadgeSheets.json';

const tiers=['bronze','silver','gold','platinum','emerald'];
const normalize=value=>String(value||'').toLowerCase().replace(/[^a-z0-9]/g,'');
const names=new Map(Object.entries(sheets).map(([id,entry])=>[normalize(entry.name),id]));
export function approvedBadgeFrame(family,tier='bronze'){
 const entry=sheets[family?.id]||sheets[names.get(normalize(family?.name))];
 if(!entry)return null;
 const column=Math.max(0,tiers.indexOf(tier));
 return {...entry,box:[column*entry.width/5,entry.row*entry.height/10,entry.width/5,entry.height/10]};
}
export default function ApprovedBadgeArt({frame,name,tier}){
 return <svg className="approved-badge-art" viewBox={frame.box.join(' ')} preserveAspectRatio="xMidYMid meet" role="img" aria-label={`${name} · ${tier} watercolour`} focusable="false" style={{display:'block',width:'100%',height:'100%',overflow:'hidden'}}>
  <image href={'/assets/palace-courts/'+frame.asset+'?v=complete-2'} width={frame.width} height={frame.height}/>
 </svg>;
}
