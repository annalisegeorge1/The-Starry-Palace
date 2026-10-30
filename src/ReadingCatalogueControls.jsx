import React from 'react';
import PalaceIcon from './PalaceIcon';

/** Browsing is public: avoid calling this shared archive a personal shelf. */
export function ReadingCatalogueControls({layout,onLayout,shown,total}){
 const safeTotal=Math.max(0,Number(total)||0);
 const safeShown=Math.min(safeTotal,Math.max(0,Number(shown)||0));
 const views=[['comfortable','Comfortable','Roomy story descriptions','book-open'],['compact','Compact','More stories at a glance','grid'],['gallery','Gallery','Cover-forward browsing','image']];
 return <div className="reading-catalogue-controls">
  <div><span className="eyebrow">PUBLIC STORY ARCHIVE</span><p role="status" aria-live="polite" aria-atomic="true">Showing <strong>{safeShown}</strong> of <strong>{safeTotal}</strong> stories in this selection</p></div>
  <div role="group" aria-label="Choose story catalogue layout">{views.map(([key,label,description,icon])=><button type="button" key={key} title={description} aria-label={label+' layout: '+description} aria-pressed={layout===key} onClick={()=>{if(layout!==key)onLayout(key)}} className="palace-reading-layout-button"><PalaceIcon name={icon}/>{label}</button>)}</div>
 </div>;
}
export function ReadingCatalogueMore({shown,total,onMore}){
 const remaining=Math.max(0,(Number(total)||0)-(Number(shown)||0));
 if(!remaining)return null;
 const batch=Math.min(24,remaining);
 return <div className="reading-catalogue-more"><p>{remaining} more {remaining===1?'story':'stories'} in this selection</p><button type="button" onClick={onMore} aria-label={'Show '+batch+' more stories'}>Show {batch} more {batch===1?'story':'stories'} <span aria-hidden="true"><PalaceIcon name="arrow-right"/></span></button></div>;
}
