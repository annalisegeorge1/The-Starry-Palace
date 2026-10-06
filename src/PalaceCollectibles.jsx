import {useEffect,useId,useState} from 'react';
import catalogue from './originalCollectibles.json';
const loaders={
 0:()=>import('./collectibleFrames.0.json'),
 1:()=>import('./collectibleFrames.1.json'),
 2:()=>import('./collectibleFrames.2.json'),
 3:()=>import('./collectibleFrames.3.json'),
 4:()=>import('./collectibleFrames.4.json'),
 5:()=>import('./collectibleFrames.5.json'),
 6:()=>import('./collectibleFrames.6.json')
};
const repainted={'palace-prize-majapahit-3':'prize-majapahit-3','palace-prize-majapahit-8':'prize-majapahit-8','palace-prize-majapahit-9':'prize-majapahit-9','palace-prize-achaemenid-17':'prize-achaemenid-17'};
const repaintedScale={'palace-prize-majapahit-3':.72,'palace-prize-majapahit-8':.70,'palace-prize-majapahit-9':.72};
const cache=new Map();
function loadSheet(sheet){
 if(!cache.has(sheet))cache.set(sheet,loaders[sheet]().then(m=>m.default||m).catch(error=>{cache.delete(sheet);throw error}));
 return cache.get(sheet);
}
export function CollectibleArt({item}){
 const id=useId();
 const [frame,setFrame]=useState(null),[failed,setFailed]=useState(false);
 useEffect(()=>{
  let active=true;setFrame(null);setFailed(false);
  loadSheet(item.artSheet).then(frames=>{if(active){setFrame(frames[item.id]||null);setFailed(!frames[item.id])}}).catch(()=>{if(active)setFailed(true)});
  return()=>{active=false};
 },[item.id,item.artSheet]);
 if(repainted[item.id]){const scale=repaintedScale[item.id]||.9;return <span className={'original-collectible-stage repainted-collectible-stage '+(repaintedScale[item.id]?'majapahit-repainted-fix':'')} style={{'--repaint-scale':scale}}><img src={'/assets/palace-courts/'+repainted[item.id]+'.png'} alt={item.name} loading="lazy" decoding="async" style={{objectFit:'contain'}}/></span>};
 if(!frame)return <span className="original-collectible-stage" role="status">{failed?'Artwork unavailable':'Loading watercolour…'}</span>;
 const [x,y,w,h]=frame.box,pad=Math.max(w,h)*.08;
 return <span className="original-collectible-stage"><svg className="original-collectible-art" role="img" aria-label={item.name} viewBox={[x-pad,y-pad,w+pad*2,h+pad*2].join(' ')} preserveAspectRatio="xMidYMid meet" focusable="false"><defs><clipPath id={id} clipPathUnits="userSpaceOnUse"><path d={frame.clip} transform={`translate(${x} ${y})`}/></clipPath></defs><image href={'/assets/palace-collectibles/'+frame.asset} width={frame.width} height={frame.height} clipPath={`url(#${id})`}/></svg></span>;
}
export default function PalaceCollectibles(){
 const [kind,setKind]=useState('prizes'),[query,setQuery]=useState(''),[court,setCourt]=useState('all'),[tier,setTier]=useState('all'),[page,setPage]=useState(1),[selected,setSelected]=useState(null);
 const source=catalogue[kind],ranks=kind==='prizes'?catalogue.prizeTiers:catalogue.giftTiers;
 const visible=source.filter(item=>(court==='all'||item.court===court)&&(tier==='all'||item.tier===Number(tier))&&`${item.name} ${item.description||''} ${item.court||''} ${item.edition||''}`.toLowerCase().includes(query.trim().toLowerCase()));
 const pages=Math.max(1,Math.ceil(visible.length/24));
 function change(setter,value){setter(value);setPage(1);setSelected(null)}
 function reset(){setQuery('');setCourt('all');setTier('all');setPage(1);setSelected(null)}
 return <section className="original-collections" aria-label="Original painted collections">
  <header className="painted-collection-intro"><p className="eyebrow">FROM THE ORIGINAL PALACE</p><h2>Twenty courts, five hundred treasures</h2><p>The original watercolour prizes and 100 tiered gifts, restored with their names and painted details. This gallery previews the artwork; your owned gifts are in Gift collection.</p></header>
  <div className="badge-collection-switch" role="group" aria-label="Original artwork collection"><button aria-pressed={kind==='prizes'} onClick={()=>{setKind('prizes');reset()}}>500 court treasures</button><button aria-pressed={kind==='gifts'} onClick={()=>{setKind('gifts');reset()}}>100 tiered gifts</button></div>
  <div className="badge-controls"><label>Search original artwork<input type="search" value={query} onChange={e=>change(setQuery,e.target.value)} placeholder="Name, court or catalogue number"/></label>{kind==='prizes'&&<label>Original court<select value={court} onChange={e=>change(setCourt,e.target.value)}><option value="all">All 20 courts</option>{[...new Set(source.map(i=>i.court))].map(c=><option key={c}>{c}</option>)}</select></label>}<label>Original tier<select value={tier} onChange={e=>change(setTier,e.target.value)}><option value="all">All tiers</option>{ranks.map((t,i)=><option value={i} key={t}>{t}</option>)}</select></label></div>
  <div className="gift-catalogue-status"><p role="status">{visible.length} artworks found</p><button onClick={reset}>Clear artwork filters</button></div>
  <div className="original-collectible-grid">{visible.slice((page-1)*24,page*24).map(item=><article key={item.id}><CollectibleArt item={item}/><div className="original-collectible-copy"><small>{ranks[item.tier]}{item.edition?' · #'+String(item.edition).padStart(3,'0'):''}</small><h3>{item.name}</h3><button type="button" aria-expanded={selected===item.id} onClick={()=>setSelected(selected===item.id?null:item.id)}>{selected===item.id?'Close details':'View details'}</button>{selected===item.id&&<p>{item.description||'An original Palace gift in the '+ranks[item.tier]+' tier.'}</p>}</div></article>)}</div>
  {!visible.length&&<p className="catalogue-message">No artworks match. Try another court or clear your filters.</p>}
  {pages>1&&<nav className="catalogue-pagination" aria-label="Original artwork pages"><button disabled={page===1} onClick={()=>{setPage(p=>p-1);setSelected(null)}}>← Previous</button><span>Page {page} of {pages}</span><button disabled={page===pages} onClick={()=>{setPage(p=>p+1);setSelected(null)}}>Next →</button></nav>}
 </section>;
}


