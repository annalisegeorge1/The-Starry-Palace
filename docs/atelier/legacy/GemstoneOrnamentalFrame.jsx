import React,{useId} from 'react';

/* Original, scalable gemstone jewellery. The centre stays transparent so a
 * member's avatar remains readable, including when the frame is only 72px. */
export const GEMSTONE_FRAME_DESIGNS=Object.freeze({
 'crown-jewel':{stone:'#d91e64',light:'#ffd6e7',deep:'#600b30',metal:'#ebc16c',shadow:'#66401b',motif:'crown'},
 'midnight-sapphire':{stone:'#175ddf',light:'#b6e4ff',deep:'#081e64',metal:'#b3c9f5',shadow:'#435379',motif:'stars'},
 'starlit-amethyst':{stone:'#8b37e6',light:'#f4caff',deep:'#3c126f',metal:'#e4c3f0',shadow:'#614072',motif:'stars'},
 'black-diamond':{stone:'#384158',light:'#f2faff',deep:'#070b15',metal:'#e1e4f0',shadow:'#4e5668',motif:'diamonds'},
 'emerald-garden':{stone:'#00ae78',light:'#b8ffe0',deep:'#07533e',metal:'#e9c876',shadow:'#62501d',motif:'leaves'},
 'ruby-coronation':{stone:'#ec2855',light:'#ffc8ca',deep:'#7d0923',metal:'#ffce70',shadow:'#7f441a',motif:'crown'},
 'rose-palace':{stone:'#ef64a4',light:'#fff0f3',deep:'#8b275c',metal:'#f2c9bf',shadow:'#8e5a6e',motif:'petals'},
 'opal-dream':{stone:'#86bfed',light:'#fff1ff',deep:'#50709a',metal:'#eddbef',shadow:'#7b6489',motif:'petals'},
 'treasury-relic':{stone:'#f5a72a',light:'#fff8ba',deep:'#845018',metal:'#ffe59b',shadow:'#7a4b25',motif:'crown'},
 'celestial-aquamarine':{stone:'#06b6d7',light:'#ccfff7',deep:'#08677b',metal:'#d5ecfa',shadow:'#55738c',motif:'stars'},
 'golden-topaz':{stone:'#ffa72b',light:'#fff4b4',deep:'#ad5214',metal:'#ffe5a1',shadow:'#7d5026',motif:'diamonds'},
 'violet-empress':{stone:'#bd37c7',light:'#ffe2fa',deep:'#5e146e',metal:'#e3c2f2',shadow:'#604078',motif:'crown'}
});

export default function GemstoneOrnamentalFrame({frame,size='100%',className=''}) {
 const id='gem-frame-'+useId().replace(/[^a-zA-Z0-9_-]/g,'');
 const d=GEMSTONE_FRAME_DESIGNS[frame.slug];
 if(!d)return null;
 const metal='url(#'+id+'-metal)',gem='url(#'+id+'-gem)';
 return <svg className={'painted-art painted-chamber-frame ornamental-avatar-frame gemstone-avatar-frame '+className}
  width={size} height={size} viewBox="0 0 200 200" focusable="false" role="img"
  aria-label={frame.name+' gemstone chamber frame'} data-tier={frame.tier} data-style="gemstone" data-gemstone="true">
  <defs>
   <linearGradient id={id+'-metal'} x1="0" y1="0" x2="1" y2="1">
    <stop stopColor={d.shadow}/><stop offset=".18" stopColor={d.metal}/>
    <stop offset=".32" stopColor="#ffffff"/><stop offset=".52" stopColor={d.metal}/>
    <stop offset=".73" stopColor={d.shadow}/><stop offset=".9" stopColor={d.metal}/>
   </linearGradient>
   <radialGradient id={id+'-gem'} cx=".3" cy=".22" r=".8">
    <stop stopColor="#ffffff"/><stop offset=".17" stopColor={d.light}/>
    <stop offset=".48" stopColor={d.stone}/><stop offset=".83" stopColor={d.deep}/><stop offset="1" stopColor="#050712"/>
   </radialGradient>
  </defs>
  <g fill="none" strokeLinecap="round" strokeLinejoin="round">
   <circle cx="100" cy="100" r="81" stroke={d.shadow} strokeWidth="8"/>
   <circle cx="100" cy="100" r="82" stroke={metal} strokeWidth="5"/>
   <circle cx="100" cy="100" r="76" stroke={d.metal} strokeWidth="1.5"/>
   <circle cx="100" cy="100" r="87" stroke={d.metal} strokeWidth="1.4" opacity=".85"/>
   <circle cx="100" cy="100" r="90" stroke={d.metal} strokeWidth=".75" strokeDasharray="1.5 5.5" opacity=".8"/>
   {Array.from({length:36},(_,i)=><g key={'p'+i} transform={'rotate('+(i*10)+' 100 100)'}>
    <path d="M100 15 L98 19 L100 22 L102 19Z" fill={i%3===0?gem:metal} stroke={d.shadow} strokeWidth=".8"/>
    <circle cx="100" cy="11.5" r={i%3===0?2.6:1.4} fill={i%3===0?gem:d.metal} stroke={d.shadow} strokeWidth=".55"/>
   </g>)}
   {Array.from({length:12},(_,i)=><g key={'v'+i} transform={'rotate('+(i*30)+' 100 100)'}>
    <path d="M100 23 Q92 11 100 4 Q108 11 100 23Z" fill={metal} stroke={d.shadow} strokeWidth="1.3"/>
    <path d="M100 20 Q96 12 100 8 Q104 12 100 20Z" fill={gem} stroke={d.light} strokeWidth=".55"/>
    <path d="M100 10 L100 17" stroke={d.light} strokeWidth=".6" opacity=".7"/>
   </g>)}
   {Array.from({length:8},(_,i)=><g key={'gem'+i} transform={'rotate('+(i*45)+' 100 100)'}>
    <path d="M92 19 L91 12 L100 5 L109 12 L108 19" fill={metal} stroke={d.shadow} strokeWidth="1.1"/>
    <ellipse cx="100" cy="13" rx={i%2===0?6.3:5} ry={i%2===0?9:7} fill={gem} stroke={d.light} strokeWidth=".9"/>
    <path d="M97 9 L100 6 L103 9 L100 14 L97 9 L100 19 L103 9" stroke={d.light} strokeWidth=".65" opacity=".9"/>
    <circle cx="94" cy="12" r="1" fill="#fff"/>
   </g>)}
   {d.motif==='crown'&&Array.from({length:4},(_,i)=><g key={'c'+i} transform={'rotate('+(i*90)+' 100 100)'}>
    <path d="M85 13 L88 1 L96 8 L100 -1 L104 8 L112 1 L115 13Z" fill={metal} stroke={d.shadow} strokeWidth="1"/>
    <path d="M100 3 L94 10 L100 16 L106 10Z" fill={gem} stroke={d.light} strokeWidth=".8"/>
   </g>)}
   {d.motif==='petals'&&Array.from({length:8},(_,i)=><g key={'fl'+i} transform={'rotate('+(i*45+22.5)+' 100 100)'}>
    <path d="M100 20 C85 10 89 1 100 8 C111 1 115 10 100 20Z" fill={metal} stroke={d.shadow} strokeWidth="1"/>
    <path d="M100 15 Q94 9 100 5 Q106 9 100 15Z" fill={gem}/>
   </g>)}
   {d.motif==='leaves'&&Array.from({length:12},(_,i)=><g key={'l'+i} transform={'rotate('+(i*30+15)+' 100 100)'}>
    <path d="M101 21 Q88 15 92 6 Q99 9 101 21 M99 21 Q112 15 108 6 Q101 9 99 21" fill={gem} stroke={d.metal} strokeWidth=".8"/>
   </g>)}
   {d.motif==='diamonds'&&Array.from({length:8},(_,i)=><g key={'di'+i} transform={'rotate('+(i*45+22.5)+' 100 100)'}>
    <path d="M100 1 L108 11 L100 24 L92 11Z" fill={gem} stroke={metal} strokeWidth="2"/>
    <path d="M100 1 V24 M92 11 H108" stroke={d.light} strokeWidth=".8"/>
   </g>)}
   {d.motif==='stars'&&Array.from({length:8},(_,i)=><g key={'st'+i} transform={'rotate('+(i*45+22.5)+' 100 100)'}>
    <path d="M100 1 L103 9 L110 11 L103 14 L100 22 L97 14 L90 11 L97 9Z" fill={gem} stroke={d.metal} strokeWidth="1"/>
   </g>)}
  </g>
 </svg>;
}
