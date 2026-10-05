import {useId} from 'react';
import art from './badgeArt.json';
import originals from './originalBadges.json';
import frames from './originalBadgeArt.json';
const ranks=['bronze','silver','gold','platinum','emerald'];
const normal=value=>String(value||'').toLowerCase().replace(/[^a-z0-9]/g,'');
const catalogue=new Map(originals.map(b=>[normal(b.name),b.id]));
const aliases={'chaptervoyager':'read','chapterarchitect':'chapter','quietshelf':'bookmark','thoughtfulvoice':'comment','artistsseal':'art','communityhost':'event','eventsteward':'eventhostupdates','writingcirclehost':'eventwriting','readingcirclehost':'eventreading','clubfounder':'club','forumconstellation':'clubpost','heritagevisitor':'festival','sprintmoon':'eventwriting'};
function SheetArt({frame,id,mount=false}){
 return <svg className={mount?'original-badge-mount':'original-badge-picture'} viewBox={frame.box.join(' ')} preserveAspectRatio={mount?'none':'xMidYMid meet'} focusable="false" aria-hidden="true"><defs><clipPath id={id} clipPathUnits="userSpaceOnUse"><path d={frame.clip} transform={`translate(${frame.box[0]} ${frame.box[1]})`} fillRule={mount?'evenodd':undefined} clipRule={mount?'evenodd':undefined}/></clipPath></defs><image href={'/assets/palace-originals/'+frame.asset} width={frame.width} height={frame.height} clipPath={`url(#${id})`}/></svg>;
}
// Art never grants achievements: unlock records remain authoritative.
export default function PalaceBadge({family,tier='bronze',locked=false}){
 const id=useId();const rank=ranks.includes(tier)?tier:'bronze';const index=ranks.indexOf(rank);
 const key=normal(family?.name);const original=frames[family?.id]?family.id:catalogue.get(key)||aliases[key];
 const frame=original?frames[original]?.[index]:null;
 const name=family?.name||'Palace achievement';
 return <figure className={'palace-watercolour-badge tier-'+rank+(locked?' is-locked':'')}>
  {frame?<span className={'original-badge-stage'+(frame.character?' is-character':'')} role="img" aria-label={name+' · '+rank+' artwork'+(locked?' (preview)':'')}><SheetArt frame={frame} id={id}/>{frame.mount&&<SheetArt frame={frame.mount} id={id+'-mount'} mount/>}</span>:<img src={art['/assets/badge_art/court_readers_'+rank+'.png']} alt={name+' · '+rank+' artwork'+(locked?' (preview)':'')} loading="lazy" decoding="async"/>}
  <figcaption>{rank}{locked?' · Preview':''}</figcaption>
 </figure>;
}
