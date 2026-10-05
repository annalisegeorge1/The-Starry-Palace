import {useState} from 'react';
export const teaTiers=['bronze','silver','gold','platinum','emerald'];
export const paintedFamilies=[{"id":"tea","name":"Moonlit Tea","kind":"teacup","asset":"moonlit-tea","details":["A simple blue bowl with an aged bronze rim.","A silver-handled cup with moonflowers and a pearl.","A lidded porcelain cup with pale gold accents and violet irises.","A platinum tea pairing with delicate cloud ornament.","An elaborate tea service with jade lotus and emerald details."]},{"id":"lantern","name":"Moonflower Lanterns","kind":"lantern","asset":"moonlit-lantern","details":["A quiet blue lantern with simple bronze ribs.","Silver moonflowers and a pearl tassel.","A domed lantern with pale gold and sapphire accents.","Platinum cloudwork with crystal drops and violet blossoms.","An emerald garden lantern with jade lotus ornament."]},{"id":"crown","name":"Crescent Crowns","kind":"crown","asset":"moonlit-crown","details":["A humble circlet with a single blue stone.","A silver crescent diadem with three moonstones.","A leaf-point diadem with sapphire and violet jewels.","A platinum coronet with fine branches and lunar openwork.","A jade-lotus crown with emeralds and a pearl fringe."]},{"id":"inkwell","name":"Poet’s Inkwells","kind":"inkwell","asset":"moonlit-inkwell","details":["A plain blue inkpot and a small indigo feather.","A silver-mounted inkpot with a slender blue feather.","An iris-painted inkwell with pale gold and a sapphire finial.","A double inkwell on a platinum tray with cloud-shaped feet.","A jade lotus writing set with emeralds and a blue-violet plume."]},{"id":"book","name":"Celestial Folios","kind":"book","asset":"moonlit-book","details":["A slim indigo book with a small crescent.","Silver corners, a moonstone clasp and a blue ribbon.","A sapphire-clasped folio with violet iris ornament.","An illuminated book on a platinum stand with botanical ink drawings.","A grand celestial folio with jade hinges and emerald details."]}];
export function paintedFamilyForKind(kind){return paintedFamilies.find(f=>f.kind===kind)||null}
export function PaintedGiftArtwork({family='tea',tier='bronze',compact=false}){
 const rank=teaTiers.includes(tier)?tier:'bronze';
 const found=paintedFamilies.find(f=>f.id===family);
 const [failedSource,setFailedSource]=useState(null);
 if(!found)return <span role="status">Artwork unavailable</span>;
 const src='/assets/palace-collectibles/'+found.asset+'-'+rank+'.png';
 return failedSource===src?<span role="status">Artwork unavailable</span>:<img className={'moonlit-tea-image'+(compact?' compact':'')} src={src} alt={found.name+' · '+rank+' watercolour'} width="1254" height="1254" loading="lazy" decoding="async" onError={()=>setFailedSource(src)}/>;
}
export function TeaArtwork(props){return <PaintedGiftArtwork {...props} family="tea"/>}
export default function MoonlitTea(){
 const [family,setFamily]=useState(()=>{const requested=new URLSearchParams(window.location.search).get('family');return paintedFamilies.some(f=>f.id===requested)?requested:'tea'});
 const selected=paintedFamilies.find(f=>f.id===family);
 return <section className="moonlit-tea-collection" aria-label="Palace watercolour gallery">
  <header className="painted-collection-intro"><p className="eyebrow">THE PAINTED TREASURY</p><h2>Little treasures of the night</h2><p>25 individual watercolours across five collections, painted in blue, lilac and silver. Bronze begins simply; each higher tier adds its own shape, material and ornament. These paintings also appear on matching gifts in your collection.</p></header>
  <div className="painted-family-filters" role="group" aria-label="Watercolour family">{paintedFamilies.map(f=><button key={f.id} aria-pressed={family===f.id} onClick={()=>setFamily(f.id)}>{f.name}</button>)}</div>
  <h3 className="painted-family-title">{selected.name}</h3><p role="status">5 tier paintings</p>
  <div className="original-collectible-grid">{teaTiers.map((tier,index)=><article key={family+'-'+tier}><PaintedGiftArtwork family={family} tier={tier}/><div className="original-collectible-copy"><small>{tier}</small><h3>{selected.name} · {tier[0].toUpperCase()+tier.slice(1)}</h3><p>{selected.details[index]}</p></div></article>)}</div>
 </section>;
}
