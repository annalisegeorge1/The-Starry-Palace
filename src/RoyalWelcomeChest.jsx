import React, {useState} from 'react';
import {invitationFrames, invitationPalettes, welcomeGifts} from './royalWelcomeGifts';

export default function RoyalWelcomeChest({busy, onChoose}) {
  const [selection, setSelection] = useState(null);
  return <fieldset disabled={busy}>
    <legend>Choose one welcome gift</legend>
    <p>Your admission seal is already yours. Select one permanent gift for your Chamber.</p>
    <div style={{display:'flex', flexWrap:'wrap', gap:'0.75rem'}}>
      {Object.entries(welcomeGifts).map(([slug, name]) =>
        <button key={slug} type="button" aria-pressed={selection===slug} onClick={() => setSelection(slug)}>
          {invitationFrames[slug]
            ? <img src={'/assets/royal-invitations/'+slug+'.webp'} alt="" width="64" height="64" />
            : <span aria-hidden="true" style={{display:'inline-flex'}}>{invitationPalettes[slug].map(color =>
                <span key={color} style={{background:color,width:18,height:18}} />)}</span>}
          <strong>{name}</strong> · {invitationFrames[slug] ? 'Avatar frame' : 'Chamber palette'}
        </button>)}
    </div>
    {selection && <p>
      <button type="button" onClick={() => onChoose(selection)}>Confirm {welcomeGifts[selection]}</button>
    </p>}
  </fieldset>;
}
