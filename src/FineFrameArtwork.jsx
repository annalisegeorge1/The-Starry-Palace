import React from 'react';
import './illustrated-frames.css';

/** Individual painted assets. IDs, eligibility and persisted selections live in
 * paintedCollection and are intentionally independent of this presentation. */
export default function FineFrameArtwork({frame,style,size='100%',className=''}) {
 const gemstone=style.gemstone===true;
 return <svg className={'painted-art painted-chamber-frame ornamental-avatar-frame illustrated-avatar-frame '+(gemstone?'gemstone-avatar-frame ':'regalia-avatar-frame ')+className}
   width={size} height={size} viewBox="0 0 200 200" role="img" focusable="false"
   aria-label={frame.name+' illustrated chamber frame'} data-tier={frame.tier}
   data-style={gemstone?'gemstone':style.thickness==='grand'?'grand':'artisan'}
   data-gemstone={gemstone?'true':undefined} data-regalia={gemstone?undefined:'true'}
   data-thickness={gemstone?undefined:style.thickness} data-art-quality="illustrated" data-frame-slug={frame.slug}>
   <image href={'/assets/atelier-illustrated/v1/'+frame.slug+'.webp'} width="200" height="200" preserveAspectRatio="xMidYMid meet"/>
 </svg>;
}
