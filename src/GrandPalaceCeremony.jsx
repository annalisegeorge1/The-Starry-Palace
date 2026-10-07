import React,{useEffect,useState} from 'react';
import{Link}from'react-router-dom';
import{getGrandPalaceCeremonyHall}from'./ceremonyApi';
import{loreForPalace}from'./grandPalaceLore';
import{ceremonyStage}from'./grandPalaceCeremony';
export default function GrandPalaceCeremony(){
 const[data,setData]=useState(null),[error,setError]=useState('');
 useEffect(()=>{getGrandPalaceCeremonyHall().then(setData).catch(e=>setError(e.message))},[]);
 return <section className="grand-ceremony"><header><p className="eyebrow">PALACE STANDARDS & CHAMPIONS</p><h2>Every court writes its own history.</h2><p>Banners grow through verified activity, while historic victories are preserved.</p></header>
 {error&&<p role="alert">{error}</p>}
 <div className="grand-standard-grid">{(data?.courts||[]).map(p=><article key={p.id} style={{'--court-colour':loreForPalace(p).colour}}><div className="grand-standard-crest">✧<strong>{loreForPalace(p).crest}</strong>☾</div><h3>{p.name}</h3><strong>{ceremonyStage(p.average_points).name}</strong><p>{p.average_points} points per member · {p.victories} historic victories</p></article>)}</div>
 <section className="grand-champions-history"><h2>Hall of Champions</h2>{(data?.chronicle||[]).length?(data.chronicle||[]).map(s=><article key={s.quarter_start}><h3>{s.winner_sigil} {s.winner_name}</h3><p>{s.quarter_start} · {s.verified_points} verified points</p><div>{(s.champions||[]).map(c=><Link key={c.username} to={'/member/'+encodeURIComponent(c.username)}>#{c.rank} {c.display_name||c.username} · {c.box_tier}</Link>)}</div></article>):<p>The first quarter is still underway. Its winners and champions will appear after settlement.</p>}</section>
 {(data?.new_laurels||[]).length>0&&<section><h2>New Laurels</h2>{data.new_laurels.map((a,i)=><p key={i}>{a.display_name}: {a.achievement_name} · {a.tier}</p>)}</section>}
 </section>;
}
