import React from 'react';
import GemstoneOrnamentalFrame from './GemstoneOrnamentalFrame';
import RegaliaOrnamentalFrame from './RegaliaOrnamentalFrame';

import './classic-circular-frames.css';

/** Stable collection identity and unlocks are independent of the artwork. */
export default function OrnamentalFrame({frame,size='100%',className=''}){
 if(frame?.regalia)return <RegaliaOrnamentalFrame frame={frame} size={size} className={className}/>;
 if(frame?.gemstone)return <GemstoneOrnamentalFrame frame={frame} size={size} className={className}/>;
 return <svg className={'painted-art painted-chamber-frame ornamental-avatar-frame classic-circular-frame '+className}
  width={size} height={size} viewBox="0 0 200 200" role="img" aria-label={frame.name+' chamber frame'}
  focusable="false" data-tier={frame.tier} data-style={Math.floor(frame.index/5)} data-frame-slug={frame.slug} data-art-quality="illustrated">
  <image href={'/assets/atelier-illustrated/classic-v2/'+frame.slug+'.webp'} width="200" height="200" preserveAspectRatio="xMidYMid meet"/>
 </svg>;
}
