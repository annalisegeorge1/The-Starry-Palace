import React from 'react';
import {RELATIONSHIP_TYPES} from './readingFacetModel';
import './palace-relationship-filters.css';

/** Include is OR across selected relationship categories; exclude rejects any.
 * Unspecified means no explicit category tags, not a guessed relationship. */
export default function PalaceRelationshipFilters({included=[],excluded=[],onToggle,disabled=false}){
 return <fieldset className="palace-relationship-types" disabled={disabled}>
  <legend>Relationship categories</legend>
  <p>Include any selected category; exclude categories you don't want. Based on explicit tags only.</p>
  <div className="palace-relationship-head" aria-hidden="true"><span>Category</span><span>Include</span><span>Exclude</span></div>
  <div className="palace-relationship-options">
   {RELATIONSHIP_TYPES.map(([key,name])=><div className="palace-relationship-option" key={key}>
    <strong>{name}</strong>
    <button type="button" aria-label={'Include '+name+' relationships'} aria-pressed={included.includes(key)} className={included.includes(key)?'selected include':''} onClick={()=>onToggle(key,'include')}>＋ <span>Include</span></button>
    <button type="button" aria-label={'Exclude '+name+' relationships'} aria-pressed={excluded.includes(key)} className={excluded.includes(key)?'selected exclude':''} onClick={()=>onToggle(key,'exclude')}>− <span>Exclude</span></button>
   </div>)}
  </div>
 </fieldset>;
}
