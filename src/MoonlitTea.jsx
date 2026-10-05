import {useState} from 'react';
export const teaTiers=['bronze','silver','gold','platinum','emerald'];
export function TeaArtwork({tier='bronze',compact=false}){
 const rank=teaTiers.includes(tier)?tier:'bronze';
 const [failed,setFailed]=useState(false);
 return failed?<span role="status">Artwork unavailable</span>:<img className={'moonlit-tea-image'+(compact?' compact':'')} src={'/assets/palace-collectibles/moonlit-tea-'+rank+'.png'} alt={'Moonlit Tea · '+rank+' watercolour'} width="1024" height="1024" loading="lazy" decoding="async" onError={()=>setFailed(true)}/>;
}
const details={
 bronze:'A simple blue bowl, a quiet crescent and an aged bronze rim.',
 silver:'A silver-handled cup with moonflowers and a single pearl.',
 gold:'A lidded porcelain cup with pale gold accents and violet irises.',
 platinum:'A tea pairing in platinum, with delicate cloud-shaped ornament.',
 emerald:'An elaborate tea service with jade lotus details and emerald stones.'
};
export default function MoonlitTea(){
 return <section className="moonlit-tea-collection" aria-label="Moonlit Tea watercolours"><header className="painted-collection-intro"><p className="eyebrow">A NEW PALACE WATERCOLOUR SERIES</p><h2>Moonlit Tea</h2><p>Five individual paintings in blue, lilac and silver. Each tier grows in detail, from a simple bowl to an emerald tea service. These paintings also appear on teacup gifts in your collection.</p></header><div className="original-collectible-grid">{teaTiers.map(tier=><article key={tier}><TeaArtwork key={tier} tier={tier}/><div className="original-collectible-copy"><small>{tier}</small><h3>Moonlit Tea · {tier[0].toUpperCase()+tier.slice(1)}</h3><p>{details[tier]}</p></div></article>)}</div></section>;
}

