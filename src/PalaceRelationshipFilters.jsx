import React from 'react';
import {RELATIONSHIP_TYPES} from './readingFacetModel';
import './palace-relationship-filters.css';

/** Explicit category tags only; never infer relationship types from pairing names. */
export default function PalaceRelationshipFilters({included=[],excluded=[],onToggle,disabled=false,mode='both'}){
 const single=mode==='include'||mode==='exclude';
 return <fieldset className={'palace-relationship-types'+(single?' palace-relationship-single':' palace-relationship-dual')} disabled={disabled}>
  <legend className="visually-hidden">Relationship categories</legend>
  <details className="palace-relationship-help"><summary>ⓘ About relationship categories</summary><p>Based on explicit author tags only. Not tagged means no declared category.</p></details>
  <div className="palace-relationship-options">
   {RELATIONSHIP_TYPES.map(([key,name])=><div className="palace-relationship-option" key={key}>
    {single?<label className="palace-relationship-include">
      <input type="checkbox" checked={mode==='include'?included.includes(key):excluded.includes(key)}
       onChange={()=>onToggle(key,mode)} aria-label={(mode==='include'?'Include ':'Exclude ')+name+' relationships'}/>
      <span>{name}</span>
     </label>:<>
      <span className="palace-relationship-choice-name">{name}</span>
      <div className="palace-relationship-both">
       <label><input type="checkbox" checked={included.includes(key)} onChange={()=>onToggle(key,'include')} aria-label={'Include '+name+' relationships'}/><span>Include</span></label>
       <label><input type="checkbox" checked={excluded.includes(key)} onChange={()=>onToggle(key,'exclude')} aria-label={'Exclude '+name+' relationships'}/><span>Exclude</span></label>
      </div>
     </>}
   </div>)}
  </div>
 </fieldset>;
}
