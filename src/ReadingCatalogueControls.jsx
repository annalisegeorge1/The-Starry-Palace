import React from 'react';
export function ReadingCatalogueControls({layout,onLayout,shown,total}){
 return <div className="reading-catalogue-controls">
  <div><span className="eyebrow">YOUR STORY SHELF</span><p role="status">Showing <strong>{shown}</strong> of <strong>{total}</strong> stories</p></div>
  <div role="group" aria-label="Story catalogue layout">{[['comfortable','Comfortable'],['compact','Compact'],['gallery','Gallery']].map(([key,label])=><button type="button" key={key} aria-pressed={layout===key} onClick={()=>onLayout(key)}>{label}</button>)}</div>
 </div>;
}
export function ReadingCatalogueMore({shown,total,onMore}){
 if(shown>=total)return null;
 return <div className="reading-catalogue-more"><p>{total-shown} more {total-shown===1?'story':'stories'} in this view</p><button type="button" onClick={onMore}>Show {Math.min(24,total-shown)} more stories <span aria-hidden="true">↓</span></button></div>;
}
