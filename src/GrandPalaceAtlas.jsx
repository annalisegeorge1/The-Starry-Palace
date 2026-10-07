import PalaceEmblem from './PalaceEmblem';
import React,{useEffect,useState} from 'react';
import{Link}from'react-router-dom';
import{GRAND_PALACE_LORE,loreForPalace,rivalForPalace,seasonFestival,dailyPalaceRitual}from'./grandPalaceLore';
import{getGrandPalaceCourtStatus,submitGrandPalaceDailyRitual}from'./grandPalaceData';
import './grand-palace-atlas.css';
export default function GrandPalaceAtlas({palaces=[],myPalaceId,quarterStart,onRitualSuccess}){
 const[chosen,setChosen]=useState(null),[court,setCourt]=useState(null),[draft,setDraft]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 useEffect(()=>{getGrandPalaceCourtStatus().then(setCourt).catch(e=>setError(e.message))},[myPalaceId]);
 const mine=palaces.find(p=>Number(p.id)===Number(myPalaceId));
 const viewed=palaces.find(p=>Number(p.id)===Number(chosen||myPalaceId))||mine;
 const lore=loreForPalace(viewed),mineLore=loreForPalace(mine);
 const rivalry=palaces.find(p=>Number(p.id)===rivalForPalace(myPalaceId,quarterStart));
 const festival=seasonFestival(quarterStart||'2026-10-01');
 async function submit(e){e.preventDefault();if(busy)return;setBusy(true);setError('');setNotice('');
  try{const result=await submitGrandPalaceDailyRitual(draft);setCourt(await getGrandPalaceCourtStatus());setDraft('');setNotice('Your ritual has joined the Palace archives. '+result.earned_points+' earned Celestial Points!');onRitualSuccess?.()}
  catch(e){setError(e.message)}finally{setBusy(false)}
 }
 return <section className="grand-atlas" id="grand-atlas">
 <header className="grand-atlas-heading"><div><p className="eyebrow">THE TEN COURTS · THE LIVING CONSTELLATION</p><h2>Every Palace has a soul.</h2><p>Explore each court's founding story, traditions, relics and ceremonies. Your Palace stays yours throughout the seasons.</p></div><span>EST. BENEATH THE SAME SKY ✧</span></header>
 <div className="grand-atlas-grid" role="group" aria-label="Explore Grand Palace identities">{palaces.map(p=>{const l=loreForPalace(p);return <button type="button" key={p.id} className={'grand-atlas-choice '+(p.id===(chosen||myPalaceId)?'selected':'')} style={{'--court-glow':l.colour,'--court-deep':l.secondary}} onClick={()=>setChosen(p.id)} aria-pressed={p.id===(chosen||myPalaceId)}><span className="grand-atlas-crest"><PalaceEmblem palace={p} size={51} decorative/></span><strong>{p.name}</strong><small>{l.virtue}</small>{Number(p.id)===Number(myPalaceId)&&<em>YOUR COURT</em>}</button>})}</div>
 {viewed&&<article className="grand-atlas-chamber" style={{'--court-glow':lore.colour,'--court-deep':lore.secondary}}>
 <header><span className="grand-atlas-large-crest"><PalaceEmblem palace={viewed} size={82} decorative/></span><div><small>{lore.emblem}</small><p className="eyebrow">{lore.epithet}</p><h3>{viewed.name}</h3><p>{lore.chamber} · {lore.virtue}</p></div></header>
 <blockquote>{lore.legend}</blockquote>
 <div className="grand-atlas-virtues"><div><small>PALACE OATH</small><p>“{lore.oath}”</p></div><div><small>SACRED RELIC</small><p>{lore.relic}</p></div><div><small>THE COURT'S LOOK</small><p>{lore.signature}</p></div></div>
 <div className="grand-atlas-traditions"><article><span>✧</span><small>BELOVED TRADITION</small><h4>{lore.tradition}</h4><p>{lore.traditionNote}</p></article><article><span>☾</span><small>PALACE FESTIVAL</small><h4>{lore.festival}</h4><p>{lore.festivalNote}</p></article></div>
 <footer>“{lore.greetings}”</footer></article>}
 <div className="grand-court-season">
 <article><small>THIS SEASON'S FRIENDLY RIVALRY</small><h3>{mine?.name||'Your court'} <span>✧</span> {rivalry?.name||'The constellations'}</h3><p>An invitation to create more boldly together—not to harass another Palace. The same season-wide rankings and rules apply to every court.</p></article>
 <article><small>SEASONAL CHAPTER {festival.chapter} / 3</small><h3>{festival.title}</h3><p>{festival.description}</p><span>Runs {new Date(festival.startsAt).toLocaleDateString(undefined,{month:'long',day:'numeric'})}–{new Date(Date.parse(festival.endsAt)-86400000).toLocaleDateString(undefined,{month:'long',day:'numeric'})} (UTC)</span></article>
 </div>
 <section className="grand-court-ritual"><div><p className="eyebrow">{mineLore.tradition.toUpperCase()} · DAILY CREATIVE RITUAL</p><h3>{dailyPalaceRitual(mine?.slug)}</h3><p>Offer an original response to your court. One verified contribution each UTC day earns 5 Celestial Points, counting toward your existing daily Palace competition limit.</p><small>{court?.ritual_completed_today?'RITUAL COMPLETE TODAY ✓':Number(court?.my_rituals_this_quarter||0)+' rituals completed this season'}</small></div>
 <form onSubmit={submit}><label htmlFor="grand-ritual-draft">Your creative offering</label><textarea id="grand-ritual-draft" rows={4} maxLength={1000} value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Your original verse, scene, sketch described in words, or imaginative response…"/><div><small>{draft.length}/1000 · at least 75 characters and 8 words</small><button disabled={busy||!court||court.ritual_completed_today||draft.trim().length<75}>{court?.ritual_completed_today?'Completed today ✓':busy?'Sealing your offering…':'Share ritual · Earn 5 points ✦'}</button></div></form>
 {error&&<p role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}
 </section>
 <section className="grand-court-roll"><div><p className="eyebrow">PEOPLE OF YOUR PALACE</p><h3>The court roll</h3><p>Meet fellow writers and readers who have chosen to be publicly discoverable.</p><small>{court?.court_rituals_this_quarter||0} rituals completed by your Palace this season</small></div><div className="grand-court-members">{(court?.court_members||[]).map(m=><Link to={'/member/'+encodeURIComponent(m.username)} key={m.username}><span>{m.avatar_url?<img src={m.avatar_url} alt=""/>:'☾'}</span><strong>{m.display_name||m.username}</strong><small>{m.season_points} seasonal points</small></Link>)}</div></section>
 </section>;
}
