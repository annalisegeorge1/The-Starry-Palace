import PalaceEmblem from './PalaceEmblem';
import React,{useEffect,useState} from 'react';
import{Link,useSearchParams}from'react-router-dom';
import GrandPalaceExpansion from './GrandPalaceExpansion';
import GrandPalaceAtlas from './GrandPalaceAtlas';
import GrandPalaceCeremony from './GrandPalaceCeremony';
import GrandPalaceGatherings from './GrandPalaceGatherings';
import PalaceArtsDiscovery from './PalaceArtsDiscovery';
import GrandPalaceWelcome from './GrandPalaceWelcome';
import './grand-palace-ux.css';
import{useAuth}from'./auth';
import{getGrandPalaceHall,purchaseGrandPalaceHonour,sendGrandPalaceHonour,selectGrandPalaceTheme}from'./grandPalaceData';
import{HONOUR_SHOP,QUARTERLY_BOXES,daysUntilSeasonEnd}from'./grandPalaceModel';

export default function GrandPalaceHall({Frame}){
 const{session}=useAuth();
 const [params,setParams]=useSearchParams();
 const views=['overview','courts','arts','commons','treasury'];
 const tab=views.includes(params.get('tab'))?params.get('tab'):'overview';
 const goTab=(next)=>{setParams(prev=>{const copy=new URLSearchParams(prev);copy.set('tab',next);return copy},{replace:true});};
 const[data,setData]=useState(null),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const[busy,setBusy]=useState(''),[recipient,setRecipient]=useState(''),[honour,setHonour]=useState('heart'),[note,setNote]=useState('');
 const[profiles,setProfiles]=useState([]);
 async function load(){try{setData(await getGrandPalaceHall());setError('')}catch(e){setError(e.message)}}
 useEffect(()=>{load()},[session?.user?.id]);
 async function act(label,fn){if(busy)return;setBusy(label);setNotice('');setError('');try{await fn();await load();setNotice(label+' complete.')}catch(e){setError(e.message)}finally{setBusy('')}}
 const mine=(data?.palaces||[]).find(x=>Number(x.id)===Number(data?.my_palace_id));
 const rank=(data?.palaces||[]).map(x=>({...x,average_points:Number(x.average_points||0)}));
 const token=(data?.honours||[]).find(x=>x.honour===honour);
 const ends=data?.ends_at?new Date(data.ends_at).toLocaleString(undefined,{dateStyle:'long',timeStyle:'short'}):'';
 return <Frame privateArea><section className="grand-palace-hall">
 <header className="grand-palace-hero"><p className="eyebrow">THE GRAND PALACE CONSTELLATION · TEN GREAT COURTS</p><h1>Ten Palaces. One sky.</h1><p>Belong to your Grand Palace for life. Every verified creative contribution brightens your court, and a new season begins with each calendar quarter.</p>
 <div className="grand-hero-stats"><span><small>YOUR COURT</small><strong>{mine?.name||'Gathering your Palace…'}</strong></span><span><small>SEASON CLOSES</small><strong>{data?daysUntilSeasonEnd(data.ends_at)+' days remaining':'—'}</strong></span><span><small>SPENDABLE POINTS</small><strong>{Number(data?.balance||0).toLocaleString()}</strong></span></div>
 {ends&&<p className="grand-season-date">This season ends {ends} · next season starts immediately · competition hours follow UTC</p>}</header>
 {error&&<p role="alert" className="grand-notice error">{error}</p>}{notice&&<p role="status" className="grand-notice">{notice}</p>}
 {data&&<>
 <section className="grand-your-court"><div className="grand-my-crest"><PalaceEmblem palace={mine} size={67} decorative/></div><div><p className="eyebrow">YOUR PERMANENT GRAND PALACE</p><h2>{mine?.name}</h2><p>{mine?.motto}</p><small>Your contribution this quarter: <b>{Number(data.my_contribution||0)} verified points</b>. A maximum of 30 points per member per UTC day counts toward the race.</small></div><Link to="/chamber" className="button-moonstone">Your chamber →</Link></section>
 
 <nav className="grand-palace-tabs" aria-label="Explore Grand Palace rooms">
 <button type="button" key="overview" aria-current={tab==='overview'?'page':undefined} className={'grand-palace-tab '+(tab==='overview'?'active':'')} onClick={()=>goTab('overview')}><span className="grand-palace-tab-icon" aria-hidden="true">✧</span><span className="grand-palace-tab-copy"><strong>Palace Home</strong><small>Your welcome hall</small></span></button>
<button type="button" key="courts" aria-current={tab==='courts'?'page':undefined} className={'grand-palace-tab '+(tab==='courts'?'active':'')} onClick={()=>goTab('courts')}><span className="grand-palace-tab-icon" aria-hidden="true">☾</span><span className="grand-palace-tab-copy"><strong>The Courts</strong><small>Lore & regalia</small></span></button>
<button type="button" key="arts" aria-current={tab==='arts'?'page':undefined} className={'grand-palace-tab '+(tab==='arts'?'active':'')} onClick={()=>goTab('arts')}><span className="grand-palace-tab-icon" aria-hidden="true">✦</span><span className="grand-palace-tab-copy"><strong>Palace Arts</strong><small>Create & explore</small></span></button>
<button type="button" key="commons" aria-current={tab==='commons'?'page':undefined} className={'grand-palace-tab '+(tab==='commons'?'active':'')} onClick={()=>goTab('commons')}><span className="grand-palace-tab-icon" aria-hidden="true">♧</span><span className="grand-palace-tab-copy"><strong>Common Room</strong><small>Friends & tidings</small></span></button>
<button type="button" key="treasury" aria-current={tab==='treasury'?'page':undefined} className={'grand-palace-tab '+(tab==='treasury'?'active':'')} onClick={()=>goTab('treasury')}><span className="grand-palace-tab-icon" aria-hidden="true">♛</span><span className="grand-palace-tab-copy"><strong>Royal Treasury</strong><small>Honours & prizes</small></span></button>
 </nav>
 <div className="grand-palace-room" key={tab}>
 {tab==='overview'&&<>
 <GrandPalaceWelcome palace={mine} leaderboard={rank} contribution={data.my_contribution||0} daysLeft={daysUntilSeasonEnd(data.ends_at)} onNavigate={goTab}/>
 <section className="grand-leaderboard" id="grand-rankings"><div className="section-heading"><div><p className="eyebrow">THE TEN GRAND PALACES</p><h2>The quarterly constellation race</h2><p>Ranked by verified points per member. This gives small courts a fair chance to win.</p></div></div>
 <div className="grand-ranked-courts">{rank.map(p=><article key={p.id} className={Number(p.id)===Number(data.my_palace_id)?'mine':''}><b className="grand-place">{String(p.place).padStart(2,'0')}</b><i style={{color:p.accent}}><PalaceEmblem palace={p} size={40} decorative/></i><div><strong>{p.name}</strong><small>{p.members} members · {p.contributors} contributors</small></div><span><b>{p.average_points.toLocaleString(undefined,{maximumFractionDigits:2})}</b><small>points / member</small></span></article>)}</div></section>
 
 </>}
 {tab==='courts'&&<>
 <GrandPalaceAtlas palaces={data.palaces||[]} myPalaceId={data.my_palace_id} quarterStart={data.quarter_start} onRitualSuccess={load}/>
 <GrandPalaceCeremony myPalaceId={data.my_palace_id}/>
 </>}
 {tab==='arts'&&<>
 <GrandPalaceGatherings/>
 <PalaceArtsDiscovery/>
 </>}
 {tab==='commons'&&<GrandPalaceExpansion view="commons"/>}
 {tab==='treasury'&&<>
 <GrandPalaceExpansion view="vault"/>
 <section className="grand-box-room"><div className="section-heading"><div><p className="eyebrow">THE VICTORY VAULT</p><h2>Mystery boxes worth fighting for.</h2><p>Every member of the winning court gets one Bronze treasure. Its ten highest contributing members also earn these ranked boxes.</p></div></div><div className="grand-box-grid">{QUARTERLY_BOXES.map(box=><article key={box.tier} className={'grand-box '+box.tier}><span className="grand-box-mark">♛</span><small>RANK {box.rank} · {box.tier.toUpperCase()}</small><h3>{box.label}</h3><p>{box.details}</p></article>)}</div><p className="grand-fairness">A qualifying contribution is required for a top-ten box. Gift identities are picked from the existing finished Palace Treasury; duplicate rewards are prevented.</p></section>
 
 <section className="grand-shop"><div className="section-heading"><div><p className="eyebrow">THE HONOUR EXCHANGE</p><h2>Buy to give. Never buy to wear.</h2><p>Your lifetime Celestial Points remain intact. Spend your separate wallet on tokens for other members—received tokens may be displayed on their profiles.</p></div></div><div className="grand-token-grid">{HONOUR_SHOP.map(item=>{const owned=(data.honours||[]).find(h=>h.honour===item.key);return <article key={item.key} className={'grand-token '+item.key}><span>{item.glyph}</span><div><h3>{item.name}</h3><small>{item.rarity}</small><p>{item.price.toLocaleString()} points · giftable stock: {owned?.gift_stock||0}</p></div><button type="button" disabled={!!busy||Number(data.balance||0)<item.price} onClick={()=>act('Purchase',()=>purchaseGrandPalaceHonour(item.key,1))}>Buy to give</button></article>})}</div>
 <div className="grand-send"><h3>Send an honour</h3><p>Choose a member from the Palace and send a token from your giftable stock.</p><label>Member handle <input value={recipient} onChange={e=>setRecipient(e.target.value)} placeholder="Search exact handle or display name"/></label><button type="button" className="button-moonstone" onClick={async()=>{try{const {searchMembers}=await import('./palaceData');setProfiles(await searchMembers(recipient))}catch(e){setError(e.message)}}} disabled={!recipient.trim()}>Find member</button>
 {profiles.length>0&&<div className="grand-recipients">{profiles.filter(p=>p.id!==session.user.id).map(p=><button type="button" key={p.id} onClick={()=>{setRecipient(p.id);setProfiles([])}}><strong>{p.display_name||p.username}</strong><small>@{p.username}</small></button>)}</div>}
 <label>Honour <select value={honour} onChange={e=>setHonour(e.target.value)}>{HONOUR_SHOP.map(h=><option key={h.key} value={h.key}>{h.glyph} {h.name}</option>)}</select></label>
 <label>Gift note (optional)<input maxLength={180} value={note} onChange={e=>setNote(e.target.value)} placeholder="A little note from your court…"/></label>
 <button type="button" disabled={!!busy||!recipient.trim()||!token?.gift_stock||!/^[0-9a-f-]{36}$/i.test(recipient)} onClick={()=>act('Gift',()=>sendGrandPalaceHonour(recipient,honour,note))}>Send {honour} ✦</button>
 </div></section>
 
 <section className="grand-dressing-room"><div className="section-heading"><div><p className="eyebrow">CHAMBER REGALIA</p><h2>Dress your room in starlight.</h2><p>Earned themes are yours to equip, without replacing your artworks or achievements.</p></div></div><div className="grand-theme-grid"><button className={!data.selected_theme?'active':''} onClick={()=>act('Theme',()=>selectGrandPalaceTheme(null))}>Original Palace theme</button>{(data.unlocked_themes||[]).map(t=><button key={t.slug} className={data.selected_theme===t.slug?'active':''} disabled={!!busy} onClick={()=>act('Theme',()=>selectGrandPalaceTheme(t.slug))}><strong>{t.name}</strong><small>{t.description}</small></button>)}</div></section>
 
 {(data.my_boxes||[]).length>0&&<section className="grand-awards"><h2>My Royal Deliveries</h2>{data.my_boxes.map((b,i)=><article key={i}><strong>{b.award_kind==='top_ten_box'?'✦ '+b.tier.toUpperCase()+' Mystery Box':'☾ Victory Palace Gift'}</strong><span>{b.season} · {b.individual_rank?'Rank '+b.individual_rank:'Winning Palace'}</span></article>)}</section>}
 </>}
 </div>
 </>}
 </section></Frame>;
}
