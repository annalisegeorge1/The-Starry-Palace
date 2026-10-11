import {useEffect,useState} from 'react';
import {CHAMBER_FRAMES,FRAME_REQUIREMENTS,chamberFrameUnlocked} from './paintedCollection';
import {ChamberFrameArt} from './PaintedPalaceArt';
import {savePaintedChamberFrame,getPrismState} from './memberChamberDecorData';
export default function ChamberFramePicker({decor,onSaved}){
 const [selected,setSelected]=useState(decor?.chamber_frame||''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 useEffect(()=>setSelected(decor?.chamber_frame||''),[decor?.chamber_frame]);
 const frame=CHAMBER_FRAMES.find(x=>x.slug===selected),allowed=!selected||chamberFrameUnlocked(frame,decor?.unlocks);
 async function save(){setBusy(true);setError('');setNotice('');try{await savePaintedChamberFrame(selected||null);const next=await getPrismState(decor.user_id);onSaved(next);window.dispatchEvent(new CustomEvent('palace:frame-changed',{detail:{user_id:decor.user_id,chamber_frame:next?.chamber_frame||''}}));setNotice('Chamber frame saved.')}catch(e){setError(e.message)}finally{setBusy(false)}}
 return <section className="painted-frame-picker" aria-label="Chamber frames"><h3>Twenty-five painted frames</h3><p>Preview a frame, then wear it outside your portrait throughout the Palace, including chats.</p><div className="painted-frame-preview" aria-hidden="true"><ChamberFrameArt slug={selected}/></div>
 <div className="painted-frame-grid"><button type="button" className="painted-frame-choice" aria-pressed={!selected} onClick={()=>setSelected('')}>No frame</button>{CHAMBER_FRAMES.map(f=><button type="button" className="painted-frame-choice" key={f.slug} aria-pressed={selected===f.slug} onClick={()=>{setSelected(f.slug);setNotice('')}}><ChamberFrameArt slug={f.slug} size={84}/><strong>{f.name}</strong><small>{f.tier} · {chamberFrameUnlocked(f,decor?.unlocks)?'Available':'Locked'}</small></button>)}</div>
 <p>{frame?`${frame.name} · ${FRAME_REQUIREMENTS[frame.tier]}`:'Your portrait without a frame.'}</p><button type="button" disabled={busy||!allowed} onClick={save}>{busy?'Saving…':allowed?'Wear this frame':'Keep creating to unlock'}</button>{error&&<p role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}</section>;
}
