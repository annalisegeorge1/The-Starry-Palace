import React from 'react';
import {chooseInkDuelNextMove} from './inkDuelNextMove';
import './ink-duel-next-move.css';

/** One useful path into an existing duel; never duplicates the whole arena. */
export default function InkDuelSpotlight({duels=[],onGoToDuel}){
 const move=chooseInkDuelNextMove(duels);
 if(!move)return null;
 return <section className={'palace-duel-spotlight kind-'+move.kind} aria-label="Your next Ink Duel move">
  <span className="palace-duel-spotlight-sigil" aria-hidden="true">✧</span>
  <div className="palace-duel-spotlight-copy">
   <small>YOUR NEXT MOVE</small>
   <strong>{move.title}</strong>
   <p>{move.detail}</p>
  </div>
  <button type="button" className="palace-duel-spotlight-action"
   onClick={()=>onGoToDuel?.(move.duelId)}>{move.action} <span aria-hidden="true">→</span></button>
 </section>;
}
