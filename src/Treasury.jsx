import { useEffect, useMemo, useState } from 'react';
import { useAuth } from './auth';
import badges from './badges.json';
import originals from './originalBadges.json';
import PalaceBadge from './PalaceBadge';
import PalaceGift, { giftCourt, giftCourts, giftEdition, giftEditions } from './PalaceGift';
import { getGiftCatalogue, getTreasury } from './palaceData';
import './treasury.css';
import {buildInventory} from './treasuryCollection';

const tiers=['bronze','silver','gold','platinum','emerald'];
const PAGE_SIZE=48;

export default function Treasury({Frame}) {
 const {session}=useAuth();
 const [collection,setCollection]=useState('originals');
 const [query,setQuery]=useState('');
 const [category,setCategory]=useState('all');
 const [tier,setTier]=useState('bronze');
 const [selected,setSelected]=useState(null);
 const [giftData,setGiftData]=useState({items:[],count:0});
 const [ownedData,setOwnedData]=useState({gifts:[]});
 const [selectedCourt,setGiftCourt]=useState('all');
 const [giftEditionFilter,setGiftEditionFilter]=useState('all');
 const [giftOwnership,setGiftOwnership]=useState('all');
 const [giftPage,setGiftPage]=useState(1);
 const [giftError,setGiftError]=useState('');
 const [giftLoading,setGiftLoading]=useState(true);

 useEffect(()=>{
  let live=true;
  setGiftLoading(true);setGiftError('');
  Promise.all([getGiftCatalogue(),getTreasury(session.user.id)]).then(([catalogue,owned])=>{
   if(!live)return;setGiftData(catalogue);setOwnedData(owned);
  }).catch(error=>{if(live)setGiftError(error.message)}).finally(()=>{if(live)setGiftLoading(false)});
  return()=>{live=false};
 },[session.user.id]);

 useEffect(()=>setGiftPage(1),[query,selectedCourt,giftEditionFilter,giftOwnership,collection]);

 const source=collection==='originals'?originals:badges;
 const visibleBadges=source.filter(b=>(category==='all'||b.category===category)&&`${b.name} ${b.description} ${b.category}`.toLowerCase().includes(query.toLowerCase()));
 const courts=useMemo(()=>[...new Set(giftData.items.map(g=>g.court_name).filter(Boolean))].sort((a,b)=>a.localeCompare(b)),[giftData.items]);
 const inventory=useMemo(()=>buildInventory(ownedData.gifts),[ownedData.gifts]);
 const ownedDistinct=inventory.size;
 const totalCopies=[...inventory.values()].reduce((n,x)=>n+x.copies,0);
 const duplicateDistinct=[...inventory.values()].filter(x=>x.hasDuplicates).length;
 const ascendableDistinct=[...inventory.values()].filter(x=>x.ascendable).length;
 const courtProgress=useMemo(()=>{
  const map=new Map(giftCourts.map(c=>[c.name,{owned:0,total:0}]));
  for(const gift of giftData.items){
   const row=map.get(gift.court_name)||{owned:0,total:0};row.total+=1;if(inventory.has(gift.id))row.owned+=1;map.set(gift.court_name,row);
  }
  return map;
 },[giftData.items,inventory]);
 const visibleGifts=useMemo(()=>{
  const term=query.trim().toLowerCase();
  return giftData.items.filter(g=>{
   const owned=inventory.get(g.id);
   const ownershipMatch=giftOwnership==='all'||(giftOwnership==='owned'&&owned)||(giftOwnership==='missing'&&!owned)||(giftOwnership==='duplicates'&&owned?.hasDuplicates)||(giftOwnership==='ascendable'&&owned?.ascendable);
   return (selectedCourt==='all'||g.court_name===selectedCourt)&&(giftEditionFilter==='all'||giftEdition(g)===giftEditionFilter)&&ownershipMatch&&(!term||`${g.name} ${g.description} ${g.court_name} ${g.catalogue_number} ${giftEdition(g)}`.toLowerCase().includes(term));
  });
 },[giftData.items,selectedCourt,giftEditionFilter,giftOwnership,inventory,query]);
 const giftPages=Math.max(1,Math.ceil(visibleGifts.length/PAGE_SIZE));
 const pagedGifts=visibleGifts.slice((giftPage-1)*PAGE_SIZE,giftPage*PAGE_SIZE);

 function choose(next){
  setCollection(next);setCategory('all');setGiftCourt('all');setGiftEditionFilter('all');setGiftOwnership('all');setSelected(null);
 }

 return <Frame privateArea>
  <section className="room-title treasury-catalogue-head">
   <p className="eyebrow">COLLECT · ACHIEVE · CELEBRATE</p>
   <h1>Royal Treasury Catalogue</h1>
   <p className="lede">The original 175 Palace badges, the expanded achievement paths, and the full 520-piece gift collection live together here.</p>
   <p>Catalogue views are previews only. Earned badges, owned gifts, duplicate counts and showcase choices remain tied to verified Palace activity.</p>
  </section>

  <div className="badge-collection-switch treasury-collection-switch" role="group" aria-label="Treasury collection">
   <button aria-pressed={collection==='originals'} onClick={()=>choose('originals')}>Palace originals · 175 badges</button>
   <button aria-pressed={collection==='expanded'} onClick={()=>choose('expanded')}>Expanded paths · 100 families</button>
   <button aria-pressed={collection==='gifts'} onClick={()=>choose('gifts')}>Gift collection · {giftData.count||520} prizes</button>
  </div>

  {collection==='gifts'?<>
   <div className="badge-controls gift-catalogue-controls">
    <label>Search gifts<input value={query} onChange={e=>setQuery(e.target.value)} type="search" placeholder="Name, court or catalogue number"/></label>
    <label>Court<select value={selectedCourt} onChange={e=>setGiftCourt(e.target.value)}><option value="all">All Palace courts</option>{courts.map(c=><option key={c} value={c}>{c}</option>)}</select></label>
    <label>Painted edition<select value={giftEditionFilter} onChange={e=>setGiftEditionFilter(e.target.value)}><option value="all">All nine editions</option>{giftEditions.map(e=><option key={e} value={e}>{e.split('-').map(w=>w[0].toUpperCase()+w.slice(1)).join(' ')}</option>)}</select></label>
    <label>My collection<select value={giftOwnership} onChange={e=>setGiftOwnership(e.target.value)}><option value="all">All prizes</option><option value="owned">Owned</option><option value="missing">Not yet owned</option><option value="duplicates">Duplicates</option><option value="ascendable">Ready to ascend</option></select></label>
    <label>Preview tier<select value={tier} onChange={e=>setTier(e.target.value)}>{tiers.map(t=><option key={t} value={t}>{t[0].toUpperCase()+t.slice(1)}</option>)}</select></label>
   </div>
   <div className="gift-edition-ribbon" aria-label="Painted gift editions">{giftEditions.map(e=><button key={e} className={giftEditionFilter===e?'active':''} onClick={()=>setGiftEditionFilter(giftEditionFilter===e?'all':e)}>{e.split('-').map(w=>w[0].toUpperCase()+w.slice(1)).join(' ')}</button>)}</div>
   <section className="gift-collection-summary" aria-label="My gift collection progress">
    <article><strong>{ownedDistinct}</strong><span>of {giftData.count||520} collected</span></article>
    <article><strong>{totalCopies}</strong><span>total copies</span></article>
    <article><strong>{duplicateDistinct}</strong><span>duplicate gifts</span></article>
    <article><strong>{ascendableDistinct}</strong><span>ready to ascend</span></article>
   </section>
   <div className="gift-court-atlas" aria-label="Palace court atlas">
    {giftCourts.map(c=>{const progress=courtProgress.get(c.name)||{owned:0,total:0};return <button key={c.slug} className={selectedCourt===c.name?'active':''} style={{'--court-accent':c.accent,'--court-glow':c.glow}} onClick={()=>setGiftCourt(selectedCourt===c.name?'all':c.name)}>
     <span className="court-atlas-sigil">{c.sigil}</span><span><strong>{c.name}</strong><small>{c.motto}</small><em>{progress.owned}/{progress.total} collected</em></span>
    </button>})}
   </div>
      <div className="gift-catalogue-status"><p role="status">{visibleGifts.length} prizes found</p><span>Nine ink-wash editions · twenty Palace courts · Bronze through Emerald ascension.</span></div>
   {giftLoading&&<p className="catalogue-message">Gathering the collection beneath the stars…</p>}
   {giftError&&<p className="catalogue-message error-state">{giftError}</p>}
   {!giftLoading&&!giftError&&<>
    <div className="gift-catalogue-grid">{pagedGifts.map(g=>{const owned=inventory.get(g.id);return <article className={"gift-catalogue-card"+(owned?' is-owned':' is-missing')} key={g.id}>
     <PalaceGift gift={g} tier={owned?.tiers?.at(-1)||tier} locked={!owned}/>
     <div className="gift-catalogue-copy">
      <div className="gift-owned-line">{owned?<><b>In your cabinet</b><span>{owned.copies} cop{owned.copies===1?'y':'ies'} · {owned.tiers.join(' / ')}</span></>:<><b>Not yet collected</b><span>Catalogue preview</span></>}</div>
      <small>CATALOGUE {String(g.catalogue_number).padStart(3,'0')} · {giftCourt(g).sigil} {g.court_name} · {giftEdition(g).replace('-',' ')}</small>
      <h2>{g.name}</h2>
      <p>{g.description}</p>
      <footer><span>{g.collection_type||'Palace collectible'}</span><b>{g.upgrade_copies||3} copies to ascend</b></footer>
     </div>
    </article>})}</div>
    {!pagedGifts.length&&<p className="catalogue-message">No Palace gifts match these filters.</p>}
    {giftPages>1&&<nav className="catalogue-pagination" aria-label="Gift catalogue pages">
     <button disabled={giftPage===1} onClick={()=>setGiftPage(p=>Math.max(1,p-1))}>← Previous</button>
     <span>Page {giftPage} of {giftPages}</span>
     <button disabled={giftPage===giftPages} onClick={()=>setGiftPage(p=>Math.min(giftPages,p+1))}>Next →</button>
    </nav>}
   </>}
  </>:<>
   <div className="badge-controls">
    <label>Search badges<input value={query} onChange={e=>setQuery(e.target.value)} type="search" placeholder="Name, category or goal"/></label>
    <label>Category<select value={category} onChange={e=>setCategory(e.target.value)}><option value="all">All categories</option>{[...new Set(source.map(b=>b.category))].map(c=><option key={c}>{c}</option>)}</select></label>
    <label>Preview tier<select value={tier} onChange={e=>setTier(e.target.value)}>{tiers.map(t=><option key={t} value={t}>{t[0].toUpperCase()+t.slice(1)}</option>)}</select></label>
   </div>
   <p role="status">{visibleBadges.length} badge families</p>
   <div className="badge-grid">{visibleBadges.map(b=><article className="badge-card" key={b.id}>
    <PalaceBadge family={b} tier={tier}/>
    <small>{b.category} · {b.difficulty}</small><h2>{b.name}</h2><p>{b.description}</p>
    <p className="badge-goal">{b.tiers.find(t=>t.slug===tier)?.threshold.toLocaleString()} · {b.unit||b.metric.replaceAll('_',' ')}</p>
    <button onClick={()=>setSelected(selected===b.id?null:b.id)} aria-expanded={selected===b.id}>{selected===b.id?'Hide requirements':'View all tiers'}</button>
    {selected===b.id&&<ul className="badge-requirements">{b.tiers.map(t=><li key={t.slug}><strong>{t.name}</strong><span>{t.threshold.toLocaleString()}</span></li>)}</ul>}
   </article>)}</div>
   {!visibleBadges.length&&<p>No badges match these filters. Try another name or category.</p>}
  </>}
 </Frame>;
}
