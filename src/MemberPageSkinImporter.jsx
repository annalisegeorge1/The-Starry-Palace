import React,{useState} from 'react';
import {parsePageSkin,pageSkinStyle,PAGE_SKIN_SAMPLE} from './profileSkinModel';
import {getPrismState,saveMemberPageSkin,removeMemberPageSkin} from './memberChamberDecorData';

export default function MemberPageSkinImporter({decor,onSaved}){
 const [candidate,setCandidate]=useState(null),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [busy,setBusy]=useState(false),[removeArmed,setRemoveArmed]=useState(false);
 const ownerId=decor?.user_id;
 async function readFile(e){
  setError('');setNotice('');setCandidate(null);
  const file=e.target.files?.[0];
  e.target.value='';
  if(!file)return;
  if(!/\.(json|css)$/i.test(file.name)){setError('Choose a .json Palace skin or a variables-only .css skin.');return}
  if(file.size>32000){setError('A skin file must be smaller than 32 KB.');return}
  try{setCandidate(parsePageSkin(await file.text(),file.name))}
  catch(e){setError(e.message||'The skin file could not be read.')}
 }
 async function save(remove=false){
  if(!ownerId||busy||(!remove&&!candidate))return;
  setBusy(true);setError('');setNotice('');
  try{
   if(remove)await removeMemberPageSkin(ownerId);
   else await saveMemberPageSkin(ownerId,candidate);
   onSaved(await getPrismState(ownerId));
   setCandidate(null);setRemoveArmed(false);
   setNotice(remove?'Your Palace and chamber now use your Prism palette.':'Your skin is active across your Palace and on your public chamber.');
  }catch(e){setError(e.message||'Could not save this skin.')}finally{setBusy(false)}
 }
 function sample(){
  const url=URL.createObjectURL(new Blob([PAGE_SKIN_SAMPLE],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download='starry-palace-skin.json';a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
 }
 return <section className="chamber-skin-importer" aria-label="Import a personal chamber skin">
  <header><div><small>PERSONAL APPEARANCE</small><h3>Import a skin</h3></div></header>
  <p>Set the colours of your Palace navigation, backgrounds and panels. Visitors see the same skin on your chamber, creative shelves and gallery. Import a Palace JSON skin or a CSS file with the six colour variables in the example.</p>
  <div className="chamber-skin-actions">
   <label>Choose a skin <input type="file" accept=".json,.css,application/json,text/css" onChange={readFile}/></label>
   <button type="button" className="quiet-button" onClick={sample}>Download example .json</button>
  </div>
  <p className="chamber-skin-info">For safety, full stylesheets with selectors, animations, URLs, scripts or external fonts cannot be imported. Bright text needs readable contrast.</p>
  {candidate&&<div className="chamber-skin-staged" aria-label="Imported skin preview" style={pageSkinStyle(candidate)}>
   <div className="chamber-skin-preview"><strong>{candidate.name}</strong><span>Private preview</span><div>Example text and colour accents ✦</div></div>
   <button type="button" disabled={busy} onClick={()=>save(false)}>{busy?'Saving…':'Apply to my Palace and chamber'}</button>
   <button type="button" className="quiet-button" onClick={()=>setCandidate(null)}>Cancel</button>
  </div>}
  {decor?.personal_skin?.name&&<div className="chamber-skin-current">
   <span>{['none','palette'].includes(decor.personal_skin.appearance_mode)?'Saved skin':'Active skin'} · <strong>{decor.personal_skin.name}</strong></span>
   {['none','palette'].includes(decor.personal_skin.appearance_mode)&&<button type="button" disabled={busy} onClick={()=>{setCandidate(decor.personal_skin);setRemoveArmed(false)}}>Preview saved skin</button>}
   <button type="button" className="quiet-button" disabled={busy} onClick={()=>removeArmed?save(true):setRemoveArmed(true)}>
    {removeArmed?'Confirm remove skin':'Restore Prism colours'}
   </button>
   {removeArmed&&<button type="button" className="quiet-button" onClick={()=>setRemoveArmed(false)}>Keep my skin</button>}
  </div>}
  {notice&&<p role="status" className="chamber-skin-success">{notice}</p>}
  {error&&<p role="alert" className="chamber-skin-error">{error}</p>}
 </section>;
}
