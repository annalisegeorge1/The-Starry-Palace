import React,{useEffect,useState}from'react';
import{Link}from'react-router-dom';
import PalaceEmblem from './PalaceEmblem';
import{loreForPalace}from'./grandPalaceLore';
import{getMemberCreativeShowcase,setMemberReadingShowcase}from'./memberCreativeShowcaseData';
import './member-palace-showcase.css';
const honourTypes=[['heart','♥','Hearts','A little kindness','#ed9dbb'],['star','✦','Stars','Bright appreciation','#a4d8ff'],['moon','☾','Moons','Rare recognition','#c9b5fc'],['crown','♛','Crowns','The rarest honours','#decef9']];
export default function MemberPalaceShowcase({profile,identity,own=false}){
 const[stats,setStats]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{let active=true;setStats(null);getMemberCreativeShowcase(profile.id).then(x=>{if(active)setStats(x)}).catch(e=>{if(active)setError(e.message)});return()=>{active=false}},[profile.id]);
 const lore=loreForPalace(identity?.palace_slug);
 const palace=identity?.palace_slug?{slug:identity.palace_slug,name:identity.palace_name}:null;
 async function toggle(){if(busy||!stats)return;setBusy(true);setError('');try{await setMemberReadingShowcase(!stats.reading_opted_in);setStats(await getMemberCreativeShowcase(profile.id))}catch(e){setError(e.message)}finally{setBusy(false)}}
 return <section className="member-palace-showcase" style={{'--member-court-accent':lore.colour,'--member-court-deep':lore.secondary}} aria-label="Palace membership and achievements">
 {palace&&<Link className="member-palace-heraldry" to="/grand-palaces?tab=courts"><div className="member-palace-heraldry-emblem"><PalaceEmblem palace={palace} size={91} decorative/></div><div><small>GRAND PALACE · YOUR PERMANENT COURT</small><strong>{identity.palace_name}</strong><p>{lore.epithet}</p><span>Enter your court <b aria-hidden="true">↗</b></span></div></Link>}
 <div className="member-palace-honour-room"><header><div><p className="eyebrow">THE CELESTIAL REGALIA</p><h3>Honours received</h3><p>A constellation of appreciation and accomplishment. Purchased tokens waiting to be gifted never count here.</p></div></header>
 <div className="member-palace-honour-grid">{honourTypes.map(([key,glyph,label,explain,color])=><article className={'member-palace-honour '+key} key={key} style={{'--honour-colour':color}}><span aria-hidden="true">{glyph}</span><strong>{Number(identity?.honours?.[key]||0).toLocaleString()}</strong><small>{label}</small><em>{explain}</em></article>)}</div></div>
 <div className="member-palace-creative-room"><header><div><p className="eyebrow">MY LIVING LIBRARY</p><h3>Words written. Worlds explored.</h3></div><span aria-hidden="true">✎ · ◈</span></header>
 <div className="member-palace-creative-grid"><article><span aria-hidden="true">✎</span><small>PUBLISHED WORDS</small><strong>{stats?Number(stats.published_words||0).toLocaleString():'—'}</strong><p>Across {stats?.published_chapters??'—'} published chapters</p></article>
 <article><span aria-hidden="true">▤</span><small>PUBLISHED WORLDS</small><strong>{stats?.published_worlds??'—'}</strong><p>Stories shared with readers</p></article>
 {stats?.reading_visible&&<article className="member-palace-reading-stat"><span aria-hidden="true">◈</span><small>CHAPTERS READ FOR POINTS</small><strong>{stats?.finished_chapters??0}</strong><p>{stats?.reading_points??0} personal reading points earned</p></article>}
 {own&&<article className="member-palace-points-stat"><span aria-hidden="true">✦</span><small>PERSONAL CELESTIAL POINTS</small><strong>{Number(stats?.lifetime_points||0).toLocaleString()}</strong><p>{Number(stats?.spendable_points||0).toLocaleString()} points available to spend</p></article>}</div>
 {own&&<div className="member-palace-reading-privacy"><div><strong>Display my reading achievements</strong><p>Off by default. When enabled, others can see only your aggregate completed chapter count and reading points, never reading titles or history.</p></div><label className="member-palace-privacy-switch"><input type="checkbox" checked={!!stats?.reading_opted_in} disabled={!stats||busy} onChange={toggle}/><span>{stats?.reading_opted_in?'Visible':'Private'}</span></label></div>}
 {!own&&!stats?.reading_visible&&<p className="member-palace-privacy-note">Reading activity is private in this chamber.</p>}
 {error&&<p role="alert" className="grand-notice error">{error}</p>}
 </div>
 </section>
}
