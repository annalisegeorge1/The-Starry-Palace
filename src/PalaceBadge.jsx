import art from './badgeArt.json';
import badges from './badges.json';

const ranks=['bronze','silver','gold','platinum','emerald'];
const normal=value=>String(value||'').toLowerCase().replace(/[^a-z0-9]/g,'');
const catalogue=new Map(badges.map(b=>[normal(b.name),b]));

// Keep artwork separate from progress: only server-recorded unlocks earn a badge.
export default function PalaceBadge({family,tier='bronze',locked=false}){
 const rank=ranks.includes(tier)?tier:'bronze';
 const badge=catalogue.get(normal(family?.name));
 const name=family?.name||badge?.name||'Palace achievement';
 return <figure className={'palace-watercolour-badge tier-'+rank+(locked?' is-locked':'')}>
  <img src={art['/assets/badge_art/court_readers_'+rank+'.png']} alt={name+' · '+rank+' artwork'+(locked?' (preview)':'')} loading="lazy" decoding="async"/>
  <figcaption>{rank}{locked?' · Preview':''}</figcaption>
 </figure>;
}
