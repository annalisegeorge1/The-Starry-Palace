import React from 'react';
import {CHAMBER_FRAMES} from './paintedCollection';
import {ChamberFrameArt} from './PaintedPalaceArt';

/** Temporary preview-only artwork proof: no accounts, member data or writes. */
export default function FrameArtQAPreview(){
 const frames=[...CHAMBER_FRAMES.slice(25,30),...CHAMBER_FRAMES.slice(35,41),...CHAMBER_FRAMES.slice(47,59)];
 return <main style={{minHeight:'100vh',padding:'25px',background:'#111427',color:'#f6f0ff',fontFamily:'system-ui,sans-serif'}}>
  <h1 style={{fontSize:'28px',fontFamily:'Georgia,serif',margin:'0 0 6px'}}>Atelier frame quality comparison</h1>
  <p style={{opacity:.78,margin:'0 0 25px'}}>Established frames first, then gemstone and thick/artisan candidates · artwork-only preview</p>
  <div style={{display:'grid',gridTemplateColumns:'repeat(5,minmax(0,1fr))',gap:'15px'}}>
   {frames.map((f,i)=><figure key={f.slug} style={{margin:0,padding:'12px',border:'1px solid #74638c',borderRadius:'12px',background:'#22233d'}}>
    <div style={{margin:'0 auto',width:'170px',height:'170px',position:'relative'}}>
     <div style={{position:'absolute',inset:'14%',borderRadius:'50%',background:'linear-gradient(145deg,#6a548d,#1f345f)',display:'grid',placeItems:'center',fontSize:'42px'}}>☾</div>
     <div style={{position:'absolute',inset:0}}><ChamberFrameArt slug={f.slug}/></div>
    </div>
    <figcaption style={{textAlign:'center',fontSize:'14px',lineHeight:1.4,marginTop:'6px'}}>{f.name}<small style={{display:'block',opacity:.65}}>{i<5?'Established':f.regalia?f.thickness:'Gemstone'}</small></figcaption>
   </figure>)}
  </div>
 </main>;
}
