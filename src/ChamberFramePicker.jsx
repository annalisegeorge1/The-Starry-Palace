import {useEffect,useState} from 'react';
import {CHAMBER_FRAMES,SOLID_CIRCLE_FRAMES,METAL_BAND_FRAMES,FRAME_REQUIREMENTS,chamberFrameUnlocked} from './paintedCollection';
import {ChamberFrameArt} from './PaintedPalaceArt';
import {savePaintedChamberFrame,getPrismState} from './memberChamberDecorData';
// The grid shares one small atlas; only the selected preview requests full-size art.
function FrameThumbnail({frame}){
 if(frame.solidColor||frame.metal)return <ChamberFrameArt slug={frame.slug} size={84}/>;
 const cell=192,x=frame.index%8*cell,y=Math.floor(frame.index/8)*cell;
 return <svg className="painted-art painted-chamber-frame" width="84" height="84" viewBox={[x,y,cell,cell].join(' ')} aria-hidden="true" focusable="false"><image href="/assets/atelier-illustrated/picker-v2.webp" width="1536" height="1536"/></svg>;
}
export default function ChamberFramePicker({decor,onSaved}){
 const [selected,setSelected]=useState(decor?.chamber_frame||''),[collection,setCollection]=useState('all'),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 useEffect(()=>setSelected(decor?.chamber_frame||''),[decor?.chamber_frame]);
 const frame=CHAMBER_FRAMES.find(x=>x.slug===selected),allowed=!selected||chamberFrameUnlocked(frame,decor?.unlocks);
 const visibleFrames=CHAMBER_FRAMES.filter(frame=>{
  switch(collection){
   case 'metal': return Boolean(frame.metal);
   case 'solid': return Boolean(frame.solidColor);
   case 'gemstone': return frame.gemstone;
   case 'grand': return frame.regalia&&frame.thickness==='grand';
   case 'artisan': return frame.regalia&&frame.thickness!=='grand';
   case 'classic': return !frame.metal&&!frame.solidColor&&!frame.gemstone&&!frame.regalia;
   default: return true;
  }
 });
 async function save(){setBusy(true);setError('');setNotice('');try{await savePaintedChamberFrame(selected||null);const next=await getPrismState(decor.user_id);onSaved(next);window.dispatchEvent(new CustomEvent('palace:frame-changed',{detail:{user_id:decor.user_id,chamber_frame:next?.chamber_frame||''}}));setNotice('Chamber frame saved.')}catch(e){setError(e.message)}finally{setBusy(false)}}
 return <section className="painted-frame-picker" aria-label="Chamber frames"><h3>{CHAMBER_FRAMES.length} profile frames</h3><p>Classic, gemstone, thick royal and delicate artisan frames. Some have jewels; others celebrate metalwork, pearls, stars and leaves. Preview freely before choosing what to wear.</p>
 <div className="painted-frame-collections" role="group" aria-label="Frame collections">
 {[
 ['all','All frames · '+CHAMBER_FRAMES.length],['solid','Solid circles · '+SOLID_CIRCLE_FRAMES.length],['metal','Thick metals · '+METAL_BAND_FRAMES.length],['grand','Thick & royal · 6'],['artisan','Artisan & delicate · 6'],['gemstone','Gemstone jewels · 12'],['classic','Classic frames · 35']
 ].map(([key,label])=><button key={key} type="button" aria-pressed={collection===key} onClick={()=>setCollection(key)}>{label}</button>)}
 </div>
 <div className="painted-frame-preview" aria-hidden="true"><ChamberFrameArt slug={selected}/></div><p className="painted-frame-preview-label" role="status">{frame?`Previewing ${frame.name}${frame.thickness?` · ${frame.thickness} setting`:frame.gemstone?" · gemstone setting":""}`:"Previewing your portrait without a frame"}</p>
 <div className="painted-frame-grid"><button type="button" className="painted-frame-choice painted-frame-none" aria-pressed={!selected} onClick={()=>setSelected('')}><span className="painted-frame-none-ring" aria-hidden="true">◌</span><strong>No frame</strong></button>{visibleFrames.map(f=><button type="button" className="painted-frame-choice" key={f.slug} aria-pressed={selected===f.slug} onClick={()=>{setSelected(f.slug);setNotice('')}}><FrameThumbnail frame={f}/><strong>{f.name}</strong><small>{f.gemstone?'Gemstone · ':f.regalia?(f.thickness==='grand'?'Thick · ':f.thickness==='delicate'?'Delicate · ':'Artisan · '):''}{f.metal?'Included':f.tier+' · '+(chamberFrameUnlocked(f,decor?.unlocks)?'Available':'Locked')}</small></button>)}</div>
 <div className="painted-frame-action"><p>{frame?`${frame.name} · ${FRAME_REQUIREMENTS[frame.tier]}`:'Your portrait without a frame.'}</p><button type="button" disabled={busy||!allowed} onClick={save}>{busy?'Saving…':allowed?'Wear this frame':'Keep creating to unlock'}</button></div>{error&&<p role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}</section>;
}
