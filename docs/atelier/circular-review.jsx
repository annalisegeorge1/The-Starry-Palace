import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {CHAMBER_FRAMES,PAINTED_TIERS} from '../../src/paintedCollection';
import MemberAvatar from '../../src/MemberAvatar';
import PalaceBadge from '../../src/PalaceBadge';
import LegacyFrame from './legacy/OrnamentalFrame-before-circular-refresh';
import '../../src/treasury-badge-composition-fix.css';
import './review.css';
const profile={display_name:'Atelier example',avatar_url:'/assets/palace-courts/prize-majapahit-3.png'};
const subjects=[['infinite-inkwell','Infinite Inkwell'],['cross-court-visitor','Cross-Court Visitor'],['chapter-voyager','Chapter Voyager'],['first-light','First Light'],['royalreader','Sapphire Storykeeper']];
function Review(){const [light,setLight]=useState(false), [show,setShow]=useState(new URLSearchParams(location.search).has('badges')?'badges':'frames');
return <main className={light?'daylight':''}><h1>Circular artwork review</h1><p>Public Palace art stands in for the profile picture.</p><nav><button onClick={()=>setLight(!light)}>Toggle light / dark</button> <button onClick={()=>setShow(show==='frames'?'badges':'frames')}>Show {show==='frames'?'badges':'frames'}</button></nav>{show==='frames'?<div className="review-grid">{CHAMBER_FRAMES.slice(0,35).map(f=><article key={f.slug} id={f.slug}><h2>{f.name} · {f.tier}</h2><div className="sizes">{[40,84,132].map(size=><div key={size}><MemberAvatar profile={profile} frame={f.slug} style={{width:size,height:size}}/><small>{size}px</small></div>)}</div><details><summary>Original design</summary><LegacyFrame frame={f} size={84}/></details></article>)}</div>:<div>{subjects.map(([id,name])=><section key={id}><h2>{name}</h2><div style={{display:'flex',flexWrap:'wrap',gap:8}}>{PAINTED_TIERS.map(tier=><PalaceBadge key={tier} family={{id,name}} tier={tier}/>)}</div></section>)}</div>}</main>}
createRoot(document.getElementById('root')).render(<Review/>);
