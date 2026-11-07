import React from 'react';import{createRoot}from'react-dom/client';
import{CHAMBER_FRAMES}from'../../src/paintedCollection';
import{ChamberFrameArt}from'../../src/PaintedPalaceArt';
import ChamberFramePicker from '../../src/ChamberFramePicker';
import '../../src/member-avatar.css';
import '../../src/painted-palace-art.css';
import './review.css';
function App(){const[light,L]=React.useState(false);return <main className={(light?'daylight':'')+(new URLSearchParams(location.search).has('picker')?' picker-only':'')}><button onClick={()=>L(!light)}>Toggle light / dark</button><h1>Prism Atelier • artwork review</h1><p>Real components • 40, 84 and 132px avatar footprints</p><div className="review-grid">{CHAMBER_FRAMES.filter(f=>new URLSearchParams(location.search).has('classic')?f.index<35:f.index>=35).map(f=><article key={f.slug} id={f.slug}><h2>{f.name}</h2><div className="sizes">{[40,84,132].map(size=><div key={size}><span className="member-avatar member-avatar-framed" style={{width:size,height:size}}><span className="member-avatar-photo"><span>A</span></span><ChamberFrameArt slug={f.slug}/></span><small>{size}px</small></div>)}</div></article>)}</div><ChamberFramePicker decor={{chamber_frame:'grand-coronation',unlocks:{published_chapters:0,reading_chapters:0}}} onSaved={()=>{}}/></main>};createRoot(document.getElementById('root')).render(<App/>);
