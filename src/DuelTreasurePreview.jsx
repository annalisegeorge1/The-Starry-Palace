import React from 'react';
import PalaceInfoMark from './PalaceInfoMark';
import {duelPrizeProgress} from './inkDuelExperience';
import './ink-duel-next-move.css';

const TIER_NAMES=['bronze','silver','gold'];
const LABELS={entries:'sealed entries',ballots:'ballots',outside:'outside ballots'};
export function duelMissingLine(missing=[]){
 return missing.length?missing.map(row=>row.remaining+' more '+LABELS[row.key]).join(' · '):'Participation threshold met; a distinct eligible winner is still required.';
}
export default function DuelTreasurePreview({duel}){
 const {readiness}=duelPrizeProgress(duel);
 return <div className="duel-prize-progress palace-duel-treasure-preview">
  <div className="palace-duel-treasure-head">
   <small>PATH TO BRONZE</small>
   <PalaceInfoMark title="Treasure qualification by tier">
    <p>These numbers show participation requirements, not an award. The server verifies votes, eligibility and a unique winner when the duel ends. Ties, cancelled duels and low-participation contests never guarantee a treasure.</p>
    <div className="palace-duel-tier-list">
     {TIER_NAMES.map(tier=>{
      const info=readiness[tier];
      return <article key={tier}>
       <strong>{tier.charAt(0).toUpperCase()+tier.slice(1)} <span>{info.ready?'Participation met':'In progress'}</span></strong>
       <small>{Object.entries(info.criteria).map(([key,need])=>LABELS[key]+': '+Math.min(Number(duel?.[key==='entries'?'entry_count':key==='ballots'?'vote_count':'external_vote_count']||0),need)+'/'+need).join(' · ')}</small>
      </article>;
     })}
    </div>
   </PalaceInfoMark>
  </div>
  <span>{duelMissingLine(readiness.bronze.missing)}</span>
 </div>;
}
