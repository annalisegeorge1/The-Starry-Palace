import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './auth';
import badges from './badges.json';
import originals from './originalBadges.json';
import PalaceBadge from './PalaceBadge';
import PalaceGift, { giftCourt, giftCourts, giftEdition, giftEditions } from './PalaceGift';
import { ascendPalaceGift, createGiftTradeOffer, getGiftCatalogue, getGiftTrades, getTreasury, removeProfileGiftShowcase, respondGiftTradeOffer, searchMembers, setProfileGiftShowcase } from './palaceData';
import './treasury.css';
import {buildInventory} from './treasuryCollection';

const MoonlitTea=lazy(()=>import('./MoonlitTea'));
const CourtsOfMoonlight=lazy(()=>import('./CourtsOfMoonlight'));
const tiers=['bronze','silver','gold','platinum','emerald'];
const PAGE_SIZE=48;

export default function Treasury({Frame}) {
 const {session}=useAuth();
 const [collection,setCollection]=useState(()=>{const requested=new URLSearchParams(window.location.search).get('collection');if(requested==='original-treasures')return 'gifts';return ['original-treasures','moonlit-tea','courts-of-moonlight','expanded','gifts','originals'].includes(requested)?requested:'originals'});
 const [query,setQuery]=useState('');
 const [badgePage,setBadgePage]=useState(1);
 const [artPreview,setArtPreview]=useState(null);

 const [category,setCategory]=useState('all');
 useEffect(()=>setBadgePage(1),[query,category,collection]);
 const [tier,setTier]=useState('bronze');
 const [selected,setSelected]=useState(null);
 const [giftData,setGiftData]=useState({items:[],count:0});
 const [ownedData,setOwnedData]=useState({gifts:[]});
 const [selectedCourt,setGiftCourt]=useState('all');
 const [giftEditionFilter,setGiftEditionFilter]=useState('all');
 const [giftOwnership,setGiftOwnership]=useState('all');
 const [giftPage,setGiftPage]=useState(1);
 const [giftPreviewTier,setGiftPreviewTier]=useState('owned');
 const [giftError,setGiftError]=useState('');
 const [giftLoading,setGiftLoading]=useState(true);
 const [giftAction,setGiftAction]=useState('');
 const [showcaseGift,setShowcaseGift]=useState(null);
 const [showcaseTier,setShowcaseTier]=useState('bronze');
 const [showcasePosition,setShowcasePosition]=useState(1);
 const [trades,setTrades]=useState([]);
 const [tradeOpen,setTradeOpen]=useState(false);
 const [tradeMemberQuery,setTradeMemberQuery]=useState('');
 const [tradeMembers,setTradeMembers]=useState([]);
 const [tradeForm,setTradeForm]=useState({recipientId:'',offeredKey:'',requestedGiftId:'',requestedTier:'bronze',note:''});
 const [tradeBusy,setTradeBusy]=useState('');

 useEffect(()=>{
  let live=true;
  setGiftLoading(true);setGiftError('');
  Promise.all([getGiftCatalogue(),getTreasury(session.user.id),getGiftTrades(session.user.id)]).then(([catalogue,owned,tradeRows])=>{
   if(!live)return;setGiftData(catalogue);setOwnedData(owned);setTrades(tradeRows);
  }).catch(error=>{if(live)setGiftError(error.message)}).finally(()=>{if(live)setGiftLoading(false)});
  return()=>{live=false};
 },[session.user.id]);

 useEffect(()=>setGiftPage(1),[query,selectedCourt,giftEditionFilter,giftOwnership,collection]);

 const source=collection==='originals'?originals:badges;
 const visibleBadges=source.filter(b=>(category==='all'||b.category===category)&&`${b.name} ${b.description} ${b.category}`.toLowerCase().includes(query.toLowerCase()));
 const courts=useMemo(()=>[...new Set(giftData.items.map(g=>g.court_name).filter(Boolean))].sort((a,b)=>a.localeCompare(b)),[giftData.items]);
 const inventory=useMemo(()=>buildInventory(ownedData.gifts),[ownedData.gifts]);
 const showcaseMap=useMemo(()=>new Map((ownedData.giftShowcase||[]).map(x=>[x.gift_id,x])),[ownedData.giftShowcase]);
 const ownedDistinct=giftData.items.filter(g=>inventory.has(g.id)).length;
 const totalCopies=[...inventory.values()].reduce((n,x)=>n+x.copies,0);
 const duplicateDistinct=[...inventory.values()].filter(x=>x.hasDuplicates).length;
 const ascendableDistinct=[...inventory.values()].filter(x=>x.ascendable).length;
 const duplicateRows=(ownedData.gifts||[]).filter(x=>Number(x.copies)>=2);
 const pendingIncoming=trades.filter(x=>x.recipient_id===session.user.id&&x.status==='pending');
 const pendingOutgoing=trades.filter(x=>x.offerer_id===session.user.id&&x.status==='pending');
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
  setCollection(next);const url=new URL(window.location.href);url.searchParams.set('collection',next);window.history.replaceState(null,'',url);setCategory('all');setGiftCourt('all');setGiftEditionFilter('all');setGiftOwnership('all');setSelected(null);
 }
 async function reloadTreasury(){
  const owned=await getTreasury(session.user.id);setOwnedData(owned);
 }
 function openShowcase(gift,owned){
  const current=showcaseMap.get(gift.id);setShowcaseGift(gift);setShowcaseTier(current?.display_tier||owned?.tiers?.at(-1)||'bronze');setShowcasePosition(current?.position||Math.min(12,(ownedData.giftShowcase?.length||0)+1));
 }
 async function saveShowcase(){
  if(!showcaseGift)return;
  try{setGiftAction('showcase:'+showcaseGift.id);setGiftError('');await setProfileGiftShowcase(showcaseGift.id,showcaseTier,Number(showcasePosition));await reloadTreasury();setShowcaseGift(null)}catch(e){setGiftError(e.message)}finally{setGiftAction('')}
 }
 async function removeShowcase(giftId){
  try{setGiftAction('remove:'+giftId);setGiftError('');await removeProfileGiftShowcase(giftId);await reloadTreasury()}catch(e){setGiftError(e.message)}finally{setGiftAction('')}
 }
 async function ascend(gift,owned){
  const sourceTier=tiers.find(t=>t!=='emerald'&&Number(owned?.counts?.[t]||0)>=(gift.upgrade_copies||3));
  if(!sourceTier)return;
  try{setGiftAction('ascend:'+gift.id);setGiftError('');await ascendPalaceGift(gift.id,sourceTier);await reloadTreasury()}catch(e){setGiftError(e.message)}finally{setGiftAction('')}
 }
 async function reloadTrades(){setTrades(await getGiftTrades(session.user.id))}
 async function findTradeMembers(){
  try{setGiftError('');setTradeMembers(await searchMembers(tradeMemberQuery))}catch(e){setGiftError(e.message)}
 }
 function openTrade(){
  const first=duplicateRows[0];setTradeForm({recipientId:'',offeredKey:first?first.virtual_gifts.id+':'+first.tier:'',requestedGiftId:'',requestedTier:'bronze',note:''});setTradeMemberQuery('');setTradeMembers([]);setTradeOpen(true)
 }
 async function submitTrade(){
  const[offeredGiftId,offeredTier]=String(tradeForm.offeredKey||'').split(':');
  if(!tradeForm.recipientId||!offeredGiftId||!tradeForm.requestedGiftId)return;
  try{setTradeBusy('create');setGiftError('');await createGiftTradeOffer({recipientId:tradeForm.recipientId,offeredGiftId,offeredTier,requestedGiftId:tradeForm.requestedGiftId,requestedTier:tradeForm.requestedTier,note:tradeForm.note});await reloadTrades();setTradeOpen(false)}catch(e){setGiftError(e.message)}finally{setTradeBusy('')}
 }
 async function respondTrade(id,action){
  try{setTradeBusy(action+':'+id);setGiftError('');await respondGiftTradeOffer(id,action);await Promise.all([reloadTreasury(),reloadTrades()])}catch(e){setGiftError(e.message)}finally{setTradeBusy('')}
 }

 return <Frame privateArea>
  <section className="room-title treasury-catalogue-head">
   <p className="eyebrow">COLLECT · ACHIEVE · CELEBRATE</p>
   <h1>Royal Treasury Catalogue</h1>
   <p className="lede">The original 175 Palace badges, the expanded achievement paths, and 600 painted treasures in the live gift collection live together here.</p>
   <p>Catalogue views are previews only. Earned badges, owned gifts, duplicate counts and showcase choices remain tied to verified Palace activity.</p>
  </section>

  <div className="badge-collection-switch treasury-collection-switch" role="group" aria-label="Treasury collection">
   <button aria-pressed={collection==='originals'} onClick={()=>choose('originals')}>Palace originals · 175 badges</button>
   <button aria-pressed={collection==='expanded'} onClick={()=>choose('expanded')}>Expanded paths · 100 families</button>
   <button aria-pressed={collection==='moonlit-tea'} onClick={()=>choose('moonlit-tea')}>New watercolours · 25 paintings</button>
   <button aria-pressed={collection==='courts-of-moonlight'} onClick={()=>choose('courts-of-moonlight')}>Courts of Moonlight · 60 portraits</button>
   <button aria-pressed={collection==='gifts'} onClick={()=>choose('gifts')}>Gift collection · {giftData.count||600} treasures</button>
  </div>

  {collection==='courts-of-moonlight'?<Suspense fallback={<p role="status">Opening the moonlit courts…</p>}><CourtsOfMoonlight/></Suspense>:collection==='moonlit-tea'?<Suspense fallback={<p role="status">Preparing Moonlit Tea…</p>}><MoonlitTea/></Suspense>:collection==='gifts'?<>
   <div className="badge-controls gift-catalogue-controls">
    <label>Search gifts<input value={query} onChange={e=>setQuery(e.target.value)} type="search" placeholder="Name, court or catalogue number"/></label>
    <label>Court<select value={selectedCourt} onChange={e=>setGiftCourt(e.target.value)}><option value="all">All Palace courts</option>{courts.map(c=><option key={c} value={c}>{c}</option>)}</select></label>
    <label>Collection<select value={giftEditionFilter} onChange={e=>setGiftEditionFilter(e.target.value)}><option value="all">Both collections</option>{giftEditions.map(e=><option key={e} value={e}>{e.split('-').map(w=>w[0].toUpperCase()+w.slice(1)).join(' ')}</option>)}</select></label>
    <label>My collection<select value={giftOwnership} onChange={e=>setGiftOwnership(e.target.value)}><option value="all">All prizes</option><option value="owned">Owned</option><option value="missing">Not yet owned</option><option value="duplicates">Duplicates</option><option value="ascendable">Ready to ascend</option></select></label>
    <label>Collection rank<select value={giftPreviewTier} onChange={e=>setGiftPreviewTier(e.target.value)}><option value="owned">Highest owned tier · Bronze for previews</option>{tiers.map(t=><option key={t} value={t}>{t[0].toUpperCase()+t.slice(1)}</option>)}</select></label>
   </div>
   <p className="treasure-rank-note">Your earlier gifts remain in your cabinet and history. New rewards come from these 600 treasures. A collection rank records upgrades; it does not repaint an artwork’s original edition.</p>
   <div className="gift-edition-ribbon" aria-label="Painted gift editions">{giftEditions.map(e=><button key={e} aria-pressed={giftEditionFilter===e} className={giftEditionFilter===e?'active':''} onClick={()=>setGiftEditionFilter(giftEditionFilter===e?'all':e)}>{e.split('-').map(w=>w[0].toUpperCase()+w.slice(1)).join(' ')}</button>)}</div>
   <section className="gift-collection-summary" aria-label="My gift collection progress">
    <article><strong>{ownedDistinct}</strong><span>of {giftData.count||600} collected</span></article>
    <article><strong>{totalCopies}</strong><span>copies, including legacy gifts</span></article>
    <article><strong>{duplicateDistinct}</strong><span>duplicate gifts</span></article>
    <article><strong>{ascendableDistinct}</strong><span>ready to ascend</span></article>
   </section>
   <section className="gift-exchange-desk"><div><p className="eyebrow">DUPLICATE EXCHANGE</p><h2>Trade without giving up your only copy.</h2><p>Trades exchange one duplicate tier for one duplicate tier. Ownership is checked again when the recipient accepts.</p></div><div className="gift-exchange-stats"><span><strong>{pendingIncoming.length}</strong> incoming</span><span><strong>{pendingOutgoing.length}</strong> outgoing</span><button disabled={!duplicateRows.length} onClick={openTrade}>{duplicateRows.length?'Propose a trade':'No duplicates to trade'}</button></div></section>
   {(pendingIncoming.length>0||pendingOutgoing.length>0)&&<section className="gift-trade-list">{[...pendingIncoming,...pendingOutgoing].map(t=>{const incoming=t.recipient_id===session.user.id;return <article key={t.id}><div><small>{incoming?'INCOMING':'OUTGOING'} · {t.status}</small><h3>{incoming?(t.offerer?.display_name||t.offerer?.username||'Palace member'):(t.recipient?.display_name||t.recipient?.username||'Palace member')}</h3><p><strong>{t.offeredGift?.name||'Treasure'} · {t.offered_tier}</strong><span> ⇄ </span><strong>{t.requestedGift?.name||'Treasure'} · {t.requested_tier}</strong></p>{t.note&&<blockquote>{t.note}</blockquote>}</div><div>{incoming?<><button disabled={!!tradeBusy} onClick={()=>respondTrade(t.id,'accept')}>Accept trade</button><button className="quiet-button" disabled={!!tradeBusy} onClick={()=>respondTrade(t.id,'decline')}>Decline</button></>:<button className="quiet-button" disabled={!!tradeBusy} onClick={()=>respondTrade(t.id,'cancel')}>Cancel offer</button>}</div></article>})}</section>}
   <div className="gift-court-atlas" aria-label="Palace court atlas">
    {giftCourts.map(c=>{const progress=courtProgress.get(c.name)||{owned:0,total:0};return <button key={c.slug} aria-pressed={selectedCourt===c.name} className={selectedCourt===c.name?'active':''} style={{'--court-accent':c.accent,'--court-glow':c.glow}} onClick={()=>setGiftCourt(selectedCourt===c.name?'all':c.name)}>
     <span className="court-atlas-sigil">{c.sigil}</span><span><strong>{c.name}</strong><small>{c.motto}</small><em>{progress.owned}/{progress.total} collected</em></span>
    </button>})}
   </div>
      <div className="gift-catalogue-status"><p role="status">{visibleGifts.length} prizes found</p><span>500 court treasures + 100 keepsakes. Artwork editions stay original; collection ranks ascend from Bronze to Emerald.</span></div>
   {giftLoading&&<p className="catalogue-message">Gathering the collection beneath the stars…</p>}
   {giftError&&<p className="catalogue-message error-state">{giftError}</p>}
   {!giftLoading&&!giftError&&<>
    <div className="gift-catalogue-grid">{pagedGifts.map(g=>{const owned=inventory.get(g.id);const showcased=showcaseMap.get(g.id);const ascendTier=owned?tiers.find(t=>t!=='emerald'&&Number(owned.counts?.[t]||0)>=(g.upgrade_copies||3)):null;return <article className={"gift-catalogue-card"+(owned?' is-owned':' is-missing')+(showcased?' is-showcased':'')} key={g.id}>
     <PalaceGift gift={g} tier={giftPreviewTier==='owned'?(owned?.tiers?.at(-1)||'bronze'):giftPreviewTier} locked={!owned}/>
     <div className="gift-catalogue-copy">
      <div className="gift-owned-line">{owned?<><b>In your cabinet</b><span>{owned.copies} cop{owned.copies===1?'y':'ies'} · {owned.tiers.join(' / ')}</span></>:<><b>Not yet collected</b><span>Catalogue preview</span></>}</div>
      <small>CATALOGUE {String(g.catalogue_number).padStart(3,'0')} · {giftCourt(g).sigil} {g.court_name} · {giftEdition(g).replace('-',' ')}</small>
      <h2>{g.name}</h2>
      <p>{g.description}</p>
      <footer><span>{g.collection_type||'Palace collectible'}</span><b>{owned?.tiers?.at(-1)==='emerald'?'Emerald tier collected':(g.upgrade_copies||3)+' copies of the same tier to ascend'}</b></footer>
      {owned&&<div className="gift-card-actions">{ascendTier&&<button disabled={giftAction==='ascend:'+g.id} onClick={()=>ascend(g,owned)}>{giftAction==='ascend:'+g.id?'Ascending…':'Ascend '+ascendTier+' → '+tiers[tiers.indexOf(ascendTier)+1]}</button>}<button className={showcased?'active':''} onClick={()=>openShowcase(g,owned)}>{showcased?'Showcased · slot '+showcased.position:'Add to chamber showcase'}</button>{showcased&&<button className="quiet-button" disabled={giftAction==='remove:'+g.id} onClick={()=>removeShowcase(g.id)}>{giftAction==='remove:'+g.id?'Removing…':'Remove showcase'}</button>}</div>}
     </div>
    </article>})}</div>
    {!pagedGifts.length&&<div className="catalogue-message"><p>No Palace gifts match these filters.</p><button onClick={()=>{setQuery('');setGiftCourt('all');setGiftEditionFilter('all');setGiftOwnership('all');setGiftPage(1)}}>Clear gift filters</button></div>}
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
   <div className="badge-grid">{visibleBadges.slice((badgePage-1)*24,badgePage*24).map(b=><article className="badge-card" key={b.id}>
    <button className="badge-art-preview-button" aria-label={"Enlarge "+b.name+" artwork"} onClick={()=>setArtPreview(b)}><PalaceBadge family={b} tier={tier}/></button>
    <small>{b.category} · {b.difficulty}</small><h2>{b.name}</h2><p>{b.description}</p>
    <p className="badge-goal">{b.tiers.find(t=>t.slug===tier)?.threshold.toLocaleString()} · {b.unit||b.metric.replaceAll('_',' ')}</p>
    <button onClick={()=>setSelected(selected===b.id?null:b.id)} aria-expanded={selected===b.id}>{selected===b.id?'Hide requirements':'View all tiers'}</button>
    {selected===b.id&&<ul className="badge-requirements">{b.tiers.map(t=><li key={t.slug}><strong>{t.name}</strong><span>{t.threshold.toLocaleString()}</span></li>)}</ul>}
   </article>)}</div>
   {visibleBadges.length>24&&<nav className="catalogue-pagination" aria-label="Badge catalogue pages"><button disabled={badgePage===1} onClick={()=>setBadgePage(p=>p-1)}>← Previous</button><span>Page {badgePage} of {Math.ceil(visibleBadges.length/24)}</span><button disabled={badgePage*24>=visibleBadges.length} onClick={()=>setBadgePage(p=>p+1)}>Next →</button></nav>}
   {!visibleBadges.length&&<p>No badges match these filters. Try another name or category.</p>}
  </>}
 {artPreview&&<BadgePreview family={artPreview} tier={tier} close={()=>setArtPreview(null)}/>}
 {tradeOpen&&<div className="treasury-showcase-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setTradeOpen(false)}}><section className="treasury-showcase-dialog gift-trade-dialog" role="dialog" aria-modal="true" aria-label="Propose duplicate trade"><header><div><p className="eyebrow">DUPLICATE EXCHANGE</p><h2>Propose a treasure trade</h2></div><button aria-label="Close trade editor" onClick={()=>setTradeOpen(false)}>×</button></header><div className="gift-trade-form"><label>Find a member<div className="trade-member-search"><input value={tradeMemberQuery} onChange={e=>setTradeMemberQuery(e.target.value)} placeholder="Search display name or handle"/><button onClick={findTradeMembers}>Search</button></div></label>{tradeMembers.length>0&&<div className="trade-member-results">{tradeMembers.filter(m=>m.id!==session.user.id).map(m=><button key={m.id} className={tradeForm.recipientId===m.id?'active':''} onClick={()=>setTradeForm(v=>({...v,recipientId:m.id}))}><strong>{m.display_name||m.username}</strong><small>@{m.username}</small></button>)}</div>}<label>You offer<select value={tradeForm.offeredKey} onChange={e=>setTradeForm(v=>({...v,offeredKey:e.target.value}))}>{duplicateRows.map(x=><option key={x.virtual_gifts.id+':'+x.tier} value={x.virtual_gifts.id+':'+x.tier}>{x.virtual_gifts.name} · {x.tier} · {x.copies} copies</option>)}</select></label><label>You request<select value={tradeForm.requestedGiftId} onChange={e=>setTradeForm(v=>({...v,requestedGiftId:e.target.value}))}><option value="">Choose a treasure</option>{giftData.items.map(g=><option key={g.id} value={g.id}>{String(g.catalogue_number).padStart(3,'0')} · {g.name}</option>)}</select></label><label>Requested tier<select value={tradeForm.requestedTier} onChange={e=>setTradeForm(v=>({...v,requestedTier:e.target.value}))}>{tiers.map(t=><option key={t} value={t}>{t[0].toUpperCase()+t.slice(1)}</option>)}</select></label><label>Note <small>optional</small><textarea maxLength="500" rows="3" value={tradeForm.note} onChange={e=>setTradeForm(v=>({...v,note:e.target.value}))} placeholder="Why this exchange might suit both collections."/></label><p>The recipient must also have at least two copies of the requested tier when accepting. Both members keep one copy after the exchange.</p></div><footer><button className="quiet-button" onClick={()=>setTradeOpen(false)}>Cancel</button><button disabled={tradeBusy==='create'||!tradeForm.recipientId||!tradeForm.offeredKey||!tradeForm.requestedGiftId} onClick={submitTrade}>{tradeBusy==='create'?'Sending…':'Send trade offer'}</button></footer></section></div>}
 {showcaseGift&&<div className="treasury-showcase-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setShowcaseGift(null)}}><section className="treasury-showcase-dialog" role="dialog" aria-modal="true" aria-label="Choose showcase slot"><header><div><p className="eyebrow">CHAMBER SHOWCASE</p><h2>{showcaseGift.name}</h2></div><button aria-label="Close showcase editor" onClick={()=>setShowcaseGift(null)}>×</button></header><div className="treasury-showcase-preview"><PalaceGift gift={showcaseGift} tier={showcaseTier}/></div><div className="treasury-showcase-controls"><label>Displayed tier<select value={showcaseTier} onChange={e=>setShowcaseTier(e.target.value)}>{(inventory.get(showcaseGift.id)?.tiers||[]).map(t=><option key={t} value={t}>{t[0].toUpperCase()+t.slice(1)}</option>)}</select></label><label>Showcase slot<select value={showcasePosition} onChange={e=>setShowcasePosition(Number(e.target.value))}>{Array.from({length:12},(_,i)=>i+1).map(pos=><option key={pos} value={pos}>Slot {pos}{ownedData.giftShowcase?.some(x=>x.position===pos&&x.gift_id!==showcaseGift.id)?' · replaces current':''}</option>)}</select></label></div><p>Changing a slot replaces the treasure currently displayed there. Your underlying collection is never deleted.</p><footer><button className="quiet-button" onClick={()=>setShowcaseGift(null)}>Cancel</button><button disabled={giftAction==='showcase:'+showcaseGift.id} onClick={saveShowcase}>{giftAction==='showcase:'+showcaseGift.id?'Saving…':'Save to chamber'}</button></footer></section></div>}
 </Frame>;
}


function BadgePreview({family,tier,close}){
 const [rank,setRank]=useState(tier);
 const dialogRef=useRef(null);
 useEffect(()=>{dialogRef.current?.showModal();},[]);
 return <dialog ref={dialogRef} className="badge-art-dialog" onCancel={close} onClose={close}>
  <button autoFocus className="badge-dialog-close" onClick={close} aria-label="Close artwork preview">Close ×</button>
  <h2>{family.name}</h2><p>{family.description}</p>
  <PalaceBadge family={family} tier={rank}/>
  <label>Collection rank<select value={rank} onChange={e=>setRank(e.target.value)}>{tiers.map(t=><option key={t} value={t}>{t}</option>)}</select></label>
  <p>{family.tiers.find(t=>t.slug===rank)?.threshold.toLocaleString()} · {family.unit||family.metric.replaceAll('_',' ')}</p>
 </dialog>;
}
