import React,{useState} from 'react';
import {RELATIONSHIP_TYPES} from './readingFacetModel';
import './palace-relationship-filters.css';

/** Explicit author/tag classification; no gender assumptions from pairing names. */
export default function PalaceRelationshipFilters({included=[],excluded=[],onToggle,disabled=false,mode='both'}){
 const [more,setMore]=useState(null);
 function toggle(key,mode){onToggle(key,mode);setMore(null)}
 return <fieldset className="palace-relationship-types" disabled={disabled}>
  <legend className="visually-hidden">Relationship categories</legend>
  <details className="palace-relationship-help"><summary>ⓘ About relationship categories</summary>
   <p>Include one or more relationship types, or exclude types you don't want. Only explicit tags count; unclassified stories appear under Not tagged.</p>
  </details>
  <div className="palace-relationship-options">
   {RELATIONSHIP_TYPES.map(([key,name])=>{
    const selectedIn=included.includes(key),selectedOut=excluded.includes(key),menuOpen=more===key;
    const categoryMode=mode==='exclude'?'exclude':'include';
    const checked=categoryMode==='exclude'?selectedOut:selectedIn;
    return <div className={"palace-relationship-option"+(selectedIn?' is-included':'')+(selectedOut?' is-excluded':'')} key={key}>
     <label className="palace-relationship-include">
      <input type="checkbox" checked={checked} onChange={()=>toggle(key,categoryMode)} aria-label={(categoryMode==='include'?'Include ':'Exclude ')+name+' relationships'}/>
      <strong>{name}</strong>{mode==='include'&&selectedOut&&<small>Excluded</small>}{mode==='exclude'&&selectedIn&&<small>Included</small>}
     </label>
     <button type="button" className="palace-relationship-more" aria-label={'More options for '+name+' relationships'} aria-expanded={menuOpen} aria-controls={'palace-relationship-more-'+key}
      onClick={()=>setMore(menuOpen?null:key)}>···</button>
     {menuOpen&&<div className="palace-relationship-actions" id={'palace-relationship-more-'+key}>
      <button type="button" onClick={()=>toggle(key,categoryMode==='include'?'exclude':'include')} aria-label={(categoryMode==='include'?'Exclude ':'Include ')+name+' relationships'}>{categoryMode==='include'?(selectedOut?'Remove exclusion':'Exclude '+name):(selectedIn?'Remove inclusion':'Include '+name)}</button>
     </div>}
    </div>;
   })}
  </div>
 </fieldset>;
}
