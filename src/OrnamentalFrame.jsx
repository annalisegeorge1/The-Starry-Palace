import React,{useId} from 'react';
import GemstoneOrnamentalFrame from './GemstoneOrnamentalFrame';
import RegaliaOrnamentalFrame from './RegaliaOrnamentalFrame';

import './classic-circular-frames.css';

function MetalBand({frame,size,className}){
 const reflection=useId();
 const {shadow,body,light}=frame.metal;
 return <svg className={'painted-art painted-chamber-frame metal-band-frame '+className}
  width={size} height={size} viewBox="0 0 200 200" role="img" aria-label={frame.name+' metal band'}>
  <defs><linearGradient id={reflection} x1="0%" y1="0%" x2="100%" y2="90%">
   <stop stopColor={shadow}/><stop offset=".17" stopColor={body}/>
   <stop offset=".29" stopColor={light}/><stop offset=".42" stopColor={body}/>
   <stop offset=".62" stopColor={shadow}/><stop offset=".79" stopColor={light}/>
   <stop offset="1" stopColor={body}/>
  </linearGradient></defs>
  <g fill="none">
   <circle cx="100" cy="100" r="83" stroke={shadow} strokeWidth="20"/>
   <circle cx="100" cy="100" r="83" stroke={'url(#'+reflection+')'} strokeWidth="17"/>
   <circle cx="100" cy="100" r="90.5" stroke={light} strokeWidth=".75" opacity=".72"/>
   <circle cx="100" cy="100" r="75.5" stroke={light} strokeWidth="1" opacity=".8"/>
  </g>
 </svg>;
}

/** Stable collection identity and unlocks are independent of the artwork. */
export default function OrnamentalFrame({frame,size='100%',className=''}){
 if(frame?.metal)return <MetalBand frame={frame} size={size} className={className}/>;
 if(frame?.solidColor){
  return <svg className={'painted-art painted-chamber-frame solid-circle-frame '+className}
   width={size} height={size} viewBox="0 0 200 200" role="img" aria-label={frame.name+' circle frame'}>
   <circle cx="100" cy="100" r="83" fill="none" stroke={frame.solidColor} strokeWidth="8"/>
  </svg>;
 }
 if(frame?.regalia)return <RegaliaOrnamentalFrame frame={frame} size={size} className={className}/>;
 if(frame?.gemstone)return <GemstoneOrnamentalFrame frame={frame} size={size} className={className}/>;
 return <svg className={'painted-art painted-chamber-frame ornamental-avatar-frame classic-circular-frame '+className}
  width={size} height={size} viewBox="0 0 200 200" role="img" aria-label={frame.name+' chamber frame'}
  focusable="false" data-tier={frame.tier} data-style={Math.floor(frame.index/5)} data-frame-slug={frame.slug} data-art-quality="illustrated">
  <image href={'/assets/atelier-illustrated/classic-v2/'+frame.slug+'.webp'} width="200" height="200" preserveAspectRatio="xMidYMid meet"/>
 </svg>;
}
