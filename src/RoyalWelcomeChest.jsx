import React, {useState} from 'react';
import {invitationFrames, invitationPalettes, welcomeGifts} from './royalWelcomeGifts';

export default function RoyalWelcomeChest({busy = false, onChoose}) {
  const [selection, setSelection] = useState(null);
  const selectedName = selection ? welcomeGifts[selection] : null;

  return <fieldset className="royal-welcome-chest" disabled={busy} aria-busy={busy}>
    <legend>Choose your Royal Welcome Gift</legend>
    <p>Your admission seal is already yours. You may select <strong>one permanent gift</strong> for your Chamber. You can change your selection before confirming, but not after it is claimed.</p>
    <div className="royal-welcome-options" role="group" aria-label="Exclusive welcome gift choices">
      {Object.entries(welcomeGifts).map(([slug, name]) => {
        const frame = Boolean(invitationFrames[slug]);
        return <button
          className={'royal-welcome-option' + (selection === slug ? ' is-selected' : '')}
          key={slug}
          type="button"
          aria-pressed={selection === slug}
          onClick={() => setSelection(slug)}
        >
          {frame
            ? <img className="royal-welcome-option-frame" src={'/assets/royal-invitations/' + slug + '.webp'} alt="" width="86" height="86" loading="lazy" decoding="async"/>
            : <span className="royal-welcome-option-palette" aria-hidden="true">
                {invitationPalettes[slug].map(color => <span key={color} style={{backgroundColor: color}}/>)}
              </span>}
          <strong>{name}</strong>
          <small>{frame ? 'Exclusive portrait frame' : 'Exclusive Chamber palette'}</small>
          <span className="royal-welcome-selected-mark" aria-hidden="true">{selection === slug ? '✓ Selected' : 'Select gift'}</span>
        </button>;
      })}
    </div>
    <div className="royal-welcome-confirm">
      <p role="status">{selectedName ? selectedName + ' is selected. Confirm to permanently claim it.' : 'Choose one of the five gifts to continue.'}</p>
      <button
        type="button"
        className="palace-invite-primary"
        disabled={!selection || busy}
        onClick={() => onChoose(selection)}
      >
        {selectedName ? 'Confirm ' + selectedName + ' as my permanent gift' : 'Choose a gift first'}
      </button>
    </div>
  </fieldset>;
}
