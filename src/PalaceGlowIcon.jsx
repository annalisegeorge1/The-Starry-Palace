import React from 'react';
import PalaceIcon from './PalaceIcon';
import './palace-heritage-glow.css';

/** Page-content icons only. Never use for the sidebar or top navigation.
 *  Keeps the existing category's hue on the rim and glow while all symbols
 *  share the same bright pearl stroke and midnight-glass face. */
export default function PalaceGlowIcon({name='sparkles',tone='lilac',size='normal',className=''}) {
 return <span className={'palace-heritage-icon palace-heritage-icon--'+size+(className?' '+className:'')} data-tone={tone} aria-hidden="true">
   <PalaceIcon name={name} size={24}/>
 </span>;
}
