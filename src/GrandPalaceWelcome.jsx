import React from 'react';
import {dailyPalaceRitual,loreForPalace} from './grandPalaceLore';
const PATHS=[
 {key:'courts',sigil:'☾',name:'Explore the Courts',eyebrow:'YOUR WORLD',copy:'Discover your Palace legend, its traditions, crest and living banner.',hint:'Lore · Legacy · Daily ritual'},
 {key:'arts',sigil:'✧',name:'Make Something',eyebrow:'CREATIVE PALACE',copy:'Write a poem, contribute to an exhibition, or pass the quill.',hint:'Exhibitions · Festivals · Discovery'},
 {key:'commons',sigil:'♧',name:'Find Your People',eyebrow:'PALACE LIFE',copy:'Meet your court, share a thought and celebrate its milestones.',hint:'Common room · Court tidings'},
 {key:'treasury',sigil:'♛',name:'Visit the Treasury',eyebrow:'THE ROYAL VAULT',copy:'Explore winning boxes, your earned regalia and the Celestial Vault.',hint:'Prizes · Honours · Themes'}
];
export default function GrandPalaceWelcome({palace,leaderboard=[],onNavigate,contribution=0,daysLeft=0}){
 const lore=loreForPalace(palace),rank=leaderboard.find(p=>Number(p.id)===Number(palace?.id));
 return <section className="grand-welcome" aria-label="Your Grand Palace dashboard">
   <div className="grand-welcome-heading"><div><p className="eyebrow">YOUR PALACE · YOUR STORY</p><h2>Where shall the stars take you?</h2><p>Everything your court offers, gathered in one beautiful place. Pick a room to begin.</p></div><div className="grand-welcome-stamp" aria-hidden="true">{lore.crest}</div></div>
   <div className="grand-paths">{PATHS.map((item,i)=><button key={item.key} type="button" className={'grand-path grand-path-'+item.key} onClick={()=>onNavigate(item.key)}><span className="grand-path-orbit" aria-hidden="true">{item.sigil}</span><small>{item.eyebrow}</small><strong>{item.name}</strong><span className="grand-path-description">{item.copy}</span><span className="grand-path-foot">{item.hint} <b aria-hidden="true">↗</b></span></button>)}</div>
   <div className="grand-today-dash"><article><span aria-hidden="true">✦</span><div><small>YOUR COURT'S PLACEMENT</small><strong>{rank?.place?'#'+rank.place:'—'} <small>of 10 Grand Palaces</small></strong></div></article>
   <article><span aria-hidden="true">☾</span><div><small>YOUR QUARTERLY CONTRIBUTION</small><strong>{Number(contribution).toLocaleString()} <small>verified points</small></strong></div></article>
   <article><span aria-hidden="true">✧</span><div><small>TIME TO WRITE HISTORY</small><strong>{daysLeft} <small>days until the season ends</small></strong></div></article></div>
   <div className="grand-daily-whisper"><span aria-hidden="true">✧</span><div><p className="eyebrow">TODAY'S SPARK · {lore.tradition.toUpperCase()}</p><p>{dailyPalaceRitual(palace?.slug)}</p></div><button type="button" onClick={()=>onNavigate('courts')}>Answer in the Court Atlas →</button></div>
 </section>;
}
