import React from 'react';
import {availableTitleChoices} from './celestialTitleWardrobeModel';
import './celestial-title-wardrobe.css';

/** The Treasury's small ceremonial changing room. All choices stay server-verified. */
export default function CelestialTitleWardrobe({options=[],currentTitle='',selectedTitle='',onSelect,onWear,busy=false,notice='',error=''}) {
 const titles=availableTitleChoices(options);
 const selected=selectedTitle||currentTitle;
 const selectedRow=titles.find(row=>row.title===selected);
 const canWear=!!selectedRow&&selected!==currentTitle&&!busy;
 return <section className="celestial-title-changing-room" aria-label="Choose a Palace title">
  <span className="celestial-title-changing-sigil" aria-hidden="true">♕</span>
  <div className="celestial-title-changing-copy">
   <small>YOUR PALACE SIGNATURE</small>
   <strong>{currentTitle||'Palace Member'}</strong>
   <p>Wear any title available to your account. Changing your ceremonial name does not spend points.</p>
  </div>
  <div className="celestial-title-changing-actions">
   <label htmlFor="celestial-title-choice">Choose a title</label>
   <select id="celestial-title-choice" value={selectedRow?.title||''} disabled={busy||!titles.length}
    onChange={event=>onSelect?.(event.target.value)}>
    {!titles.length&&<option value="">Gathering your titles…</option>}
    {titles.filter(t=>t.public_selectable===true).length>0&&<optgroup label="Palace titles">
     {titles.filter(t=>t.public_selectable===true).map(t=><option key={t.title} value={t.title}>{t.title}</option>)}
    </optgroup>}
    {titles.filter(t=>t.entitled===true&&t.public_selectable!==true).length>0&&<optgroup label="Earned Celestial honours">
     {titles.filter(t=>t.entitled===true&&t.public_selectable!==true).map(t=><option key={t.title} value={t.title}>{t.title} ✦</option>)}
    </optgroup>}
   </select>
   <button type="button" onClick={()=>onWear?.(selected)} disabled={!canWear}>
    {busy?'Placing your title…':selected===currentTitle?'Currently worn':'✦ Wear this title'}
   </button>
  </div>
  {(notice||error)&&<p className={'celestial-title-changing-feedback'+(error?' is-error':'')} role={error?'alert':'status'}>{error||notice}</p>}
 </section>;
}
