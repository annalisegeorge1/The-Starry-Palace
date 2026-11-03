import React from 'react';

export const PALACE_THEMES=[
 {id:'nightfall',label:'Nightfall',description:'Deep blue and indigo',symbol:'☾'},
 {id:'midnight',label:'Midnight',description:'Near-black and charcoal',symbol:'✦'},
 {id:'daylight',label:'Daybreak',description:'Soft lilac and blue',symbol:'☼'}
];

/** Keep compatibility with older stored "night" preferences. */
export function normalizePalaceTheme(value){
 if(value==='daylight'||value==='midnight')return value;
 return 'nightfall';
}

export default function PalaceThemePicker({value='nightfall',onChange,compact=false}){
 return <div className={'palace-theme-picker'+(compact?' is-compact':'')} role="group" aria-label="Palace appearance">
  {!compact&&<span className="palace-theme-caption">Appearance</span>}
  <div className="palace-theme-options">
   {PALACE_THEMES.map(({id,label,description,symbol})=><button
    key={id} type="button" className={'palace-theme-option theme-'+id}
    aria-pressed={value===id} aria-label={label+' theme'}
    title={description} onClick={()=>onChange(id)}>
    <span className="palace-theme-swatch" aria-hidden="true">{symbol}</span>
    <span className="palace-theme-name">{label}</span>
   </button>)}
  </div>
 </div>;
}
