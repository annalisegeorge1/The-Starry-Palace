import React from 'react';
import {Link} from 'react-router-dom';
import PalaceInfoMark from './PalaceInfoMark';
import {CELESTIAL_ECONOMY_LAYERS,CELESTIAL_FAIRNESS_NOTES} from './creativePointGuide';
import './palace-progress-wayfinder.css';

/* Navigation only: this component neither awards points nor assumes a badge
 * or title has been unlocked. All progress is authoritative elsewhere. */
const DOORS=[
 {id:'duels',icon:'✒',eyebrow:'CREATE & COMPETE',title:'Ink Duels',detail:'Write, draw or challenge another creator.',to:'/writing?tab=duels',action:'Enter the arena'},
 {id:'achievements',icon:'✦',eyebrow:'GROW AT YOUR PACE',title:'Achievement paths',detail:'Follow the milestones you have actually earned.',to:'/treasury?tab=achievements',action:'See my badges'},
 {id:'titles',icon:'♕',eyebrow:'WEAR YOUR HONOUR',title:'Celestial titles',detail:'See your next court or wear an unlocked name.',to:'/treasury?tab=titles',action:'Visit my titles'}
];
export default function PalaceProgressWayfinder(){
 return <section className="grand-progress-wayfinder" aria-labelledby="grand-progress-wayfinder-title">
  <header className="grand-progress-wayfinder-head">
   <div>
    <p className="eyebrow">ONE PALACE · MANY WAYS TO SHINE</p>
    <h2 id="grand-progress-wayfinder-title">From spark to honour.</h2>
    <p>Find your next creative door. Your stories, victories and titles can shine together without becoming the same score.</p>
   </div>
   <PalaceInfoMark title="How Palace recognition connects">
    <p>There are three different kinds of progress. Spending from your wallet never lowers your lifetime title progress.</p>
    <ul>{CELESTIAL_ECONOMY_LAYERS.map(layer=><li key={layer.id}><strong>{layer.name}:</strong> {layer.detail}</li>)}</ul>
    <p>Only verified eligible actions count; empty or repeated activity cannot manufacture rewards.</p>
    <details><summary>Read the fairness essentials</summary>
     <ul>{CELESTIAL_FAIRNESS_NOTES.map(rule=><li key={rule}>{rule}</li>)}</ul>
    </details>
   </PalaceInfoMark>
  </header>
  <div className="grand-progress-wayfinder-doors">
   {DOORS.map(door=><Link key={door.id} className={'grand-progress-wayfinder-door door-'+door.id} to={door.to}>
    <span className="grand-progress-wayfinder-icon" aria-hidden="true">{door.icon}</span>
    <span className="grand-progress-wayfinder-copy">
     <small>{door.eyebrow}</small>
     <strong>{door.title}</strong>
     <span>{door.detail}</span>
     <em>{door.action} <span aria-hidden="true">→</span></em>
    </span>
   </Link>)}
  </div>
 </section>;
}
