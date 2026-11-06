import React,{useId} from 'react';

/* Statement portrait jewellery: six broad settings and six lighter artisanal
 * designs. The centre is always transparent; no artwork or member image is
 * embedded in these frames. Stones are deliberate accents, not compulsory. */
export const REGALIA_FRAME_DESIGNS=Object.freeze({
 'grand-coronation':{metal:'#f2c86b',shadow:'#684219',highlight:'#fff0bf',stone:'#de3155',stoneLight:'#ffbad0',motif:'crown',thickness:'grand',gems:8},
 'sapphire-cathedral':{metal:'#b4d4ed',shadow:'#29466e',highlight:'#ffffff',stone:'#2961dd',stoneLight:'#b4ddff',motif:'arch',thickness:'grand',gems:6},
 'emerald-fortress':{metal:'#d6bd80',shadow:'#375e44',highlight:'#fcffd7',stone:'#159b71',stoneLight:'#c5ffda',motif:'shield',thickness:'grand',gems:4},
 'black-diamond-throne':{metal:'#a6aabd',shadow:'#262734',highlight:'#f5f4fa',stone:'#39435d',stoneLight:'#e5f7ff',motif:'diamond',thickness:'grand',gems:4},
 'amethyst-empress':{metal:'#d5a5e9',shadow:'#4d2866',highlight:'#fef0ff',stone:'#9337cf',stoneLight:'#f7cbff',motif:'crown',thickness:'grand',gems:6},
 'treasury-vault':{metal:'#f7c662',shadow:'#72400d',highlight:'#fff9c3',stone:'#eea42d',stoneLight:'#fff2b0',motif:'sun',thickness:'grand',gems:8},
 'rose-palace-deluxe':{metal:'#ecc0ac',shadow:'#7d445e',highlight:'#fff7f2',stone:'#dc569c',stoneLight:'#ffe2f0',motif:'flower',thickness:'medium',gems:3},
 'moonstone-halo':{metal:'#c4d3e6',shadow:'#54667c',highlight:'#ffffff',stone:'#9cb8e9',stoneLight:'#faffff',motif:'moon',thickness:'medium',gems:1},
 'opal-bloom':{metal:'#e4cadd',shadow:'#72778f',highlight:'#fffdfa',stone:'#9dc6db',stoneLight:'#fff6ff',motif:'flower',thickness:'medium',gems:2},
 'star-garland':{metal:'#b9b4ef',shadow:'#515078',highlight:'#f6f1ff',stone:'#8f83e5',stoneLight:'#e1d9ff',motif:'star',thickness:'delicate',gems:0},
 'golden-ivy':{metal:'#ddbf73',shadow:'#755926',highlight:'#fff8be',stone:'#5ca77c',stoneLight:'#c8f5d4',motif:'vine',thickness:'delicate',gems:0},
 'twilight-pearl':{metal:'#c8a8c6',shadow:'#5c496e',highlight:'#f9ebfa',stone:'#9ba9de',stoneLight:'#f7f5ff',motif:'pearl',thickness:'medium',gems:0}
});

export default function RegaliaOrnamentalFrame({frame,size='100%',className=''}) {
 const uid='regalia-'+useId().replace(/[^a-zA-Z0-9_-]/g,'');
 const design=REGALIA_FRAME_DESIGNS[frame?.slug];
 if(!design)return null;
 const grand=design.thickness==='grand';
 const metal='url(#'+uid+'-metal)',gem='url(#'+uid+'-gem)';
 const ringWidth=grand?24:design.thickness==='medium'?13:7;
 const beadCount=grand?24:design.thickness==='medium'?16:20;
 const pearl=design.motif==='pearl';
 return <svg className={'painted-art painted-chamber-frame ornamental-avatar-frame regalia-avatar-frame '+className}
   width={size} height={size} viewBox="0 0 200 200" role="img"
   aria-label={frame.name+' '+design.thickness+' chamber frame'}
   data-tier={frame.tier} data-style={grand?'grand':'artisan'}
   data-thickness={design.thickness} data-regalia="true" focusable="false">
  <defs>
   <linearGradient id={uid+'-metal'} x1="0" y1="0" x2="1" y2="1">
    <stop stopColor={design.shadow}/><stop offset=".16" stopColor={design.metal}/>
    <stop offset=".32" stopColor={design.highlight}/><stop offset=".5" stopColor={design.metal}/>
    <stop offset=".72" stopColor={design.shadow}/><stop offset=".91" stopColor={design.highlight}/>
   </linearGradient>
   <radialGradient id={uid+'-gem'} cx=".26" cy=".2" r=".85">
    <stop stopColor="#ffffff"/><stop offset=".22" stopColor={design.stoneLight}/>
    <stop offset=".59" stopColor={design.stone}/><stop offset="1" stopColor={design.shadow}/>
   </radialGradient>
  </defs>
  <g fill="none" strokeLinecap="round" strokeLinejoin="round">
   <circle cx="100" cy="100" r="82" stroke={design.shadow} strokeWidth={ringWidth+3}/>
   <circle cx="100" cy="100" r="82" stroke={metal} strokeWidth={ringWidth}/>
   <circle cx="100" cy="100" r={grand?70:design.thickness==='medium'?75:79}
    stroke={design.highlight} strokeWidth="1.4" opacity=".8"/>
   <circle cx="100" cy="100" r="91" stroke={design.metal} strokeWidth={grand?2.4:1.5}/>
   {grand&&<circle cx="100" cy="100" r="88" stroke={design.highlight} strokeWidth="1" strokeDasharray="3 5"/>}
   {Array.from({length:beadCount},(_,i)=><g key={'bead'+i} transform={'rotate('+(i*360/beadCount)+' 100 100)'}>
    <path d={grand?'M96 12 Q100 20 104 12 M98 27 Q100 23 102 27':'M99 14 L100 18 L101 14'}
     stroke={design.highlight} strokeWidth={grand?1.6:.85} opacity=".87"/>
    <circle cx="100" cy={grand?10:12} r={grand?1.9:1.2} fill={design.highlight}/>
   </g>)}
   {design.motif==='crown'&&Array.from({length:4},(_,i)=><g key={'c'+i} transform={'rotate('+(i*90)+' 100 100)'}>
    <path d="M83 17 L83 6 L92 11 L100 1 L108 11 L117 6 L117 17Z"
     fill={metal} stroke={design.shadow} strokeWidth="1.4"/>
    <path d="M91 15 L100 7 L109 15" stroke={design.highlight} strokeWidth="1.3"/>
   </g>)}
   {design.motif==='arch'&&Array.from({length:8},(_,i)=><g key={'a'+i} transform={'rotate('+(i*45)+' 100 100)'}>
    <path d="M91 27 V16 Q100 2 109 16 V27 M96 28 V17 Q100 9 104 17 V28"
      stroke={design.highlight} strokeWidth="1.7"/>
    <path d="M94 15 L100 9 L106 15" stroke={design.metal} strokeWidth="1"/>
   </g>)}
   {design.motif==='shield'&&Array.from({length:8},(_,i)=><g key={'shield'+i} transform={'rotate('+(i*45)+' 100 100)'}>
    <path d="M92 13 L100 6 L108 13 L106 26 L100 29 L94 26Z"
     stroke={design.shadow} strokeWidth="2" fill={metal}/>
    <path d="M100 12 V25 M95 17 L105 17" stroke={design.highlight} strokeWidth="1.2"/>
   </g>)}
   {design.motif==='diamond'&&Array.from({length:8},(_,i)=><g key={'diamond'+i} transform={'rotate('+(i*45)+' 100 100)'}>
    <path d="M100 3 L109 14 L100 29 L91 14Z" fill={metal}
     stroke={design.shadow} strokeWidth="1.5"/>
    <path d="M100 6 L100 27 M91 14 H109" stroke={design.highlight} strokeWidth="1"/>
   </g>)}
   {design.motif==='sun'&&Array.from({length:12},(_,i)=><g key={'sun'+i} transform={'rotate('+(i*30)+' 100 100)'}>
    <path d="M100 2 L104 12 L100 25 L96 12Z" fill={metal} stroke={design.shadow} strokeWidth=".8"/>
   </g>)}
   {(design.motif==='flower'||design.motif==='vine')&&Array.from({length:12},(_,i)=><g key={'petal'+i} transform={'rotate('+(i*30)+' 100 100)'}>
    <path d="M100 18 Q89 10 95 6 Q101 8 100 18 M100 18 Q111 10 105 6 Q99 8 100 18"
      fill={design.motif==='vine'?design.metal:metal} stroke={design.highlight} strokeWidth=".8"/>
    {design.motif==='flower'&&<circle cx="100" cy="11" r="2" fill={design.highlight}/>}
   </g>)}
   {(design.motif==='star'||design.motif==='moon')&&Array.from({length:12},(_,i)=><g key={'star'+i} transform={'rotate('+(i*30)+' 100 100)'}>
    {design.motif==='star'?<path d="M100 5 L102 12 L108 14 L102 16 L100 23 L98 16 L92 14 L98 12Z"
      fill={metal} stroke={design.highlight} strokeWidth=".7"/>:
     <path d="M105 5 A8 8 0 1 0 105 21 A6 6 0 1 1 105 5Z" fill={metal} stroke={design.highlight} strokeWidth=".7"/>}
   </g>)}
   {pearl&&Array.from({length:16},(_,i)=><g key={'pearl'+i} transform={'rotate('+(i*22.5)+' 100 100)'}>
    <circle cx="100" cy="15" r="3.2" fill={design.highlight} stroke={design.shadow} strokeWidth=".6"/>
    <circle cx="99" cy="13.9" r="1" fill="#ffffff"/>
   </g>)}
   {design.gems>0&&Array.from({length:design.gems},(_,i)=><g key={'jewel'+i}
     transform={'rotate('+(i*360/design.gems)+' 100 100)'}>
    <path d="M94 14 Q100 6 106 14 L106 22 L94 22Z" fill={metal} stroke={design.shadow} strokeWidth="1.5"/>
    <path d="M100 8 L107 16 L100 26 L93 16Z" fill={gem} stroke={design.highlight} strokeWidth=".8"/>
    <path d="M100 10 L100 24 M93 16 H107" stroke={design.stoneLight} strokeWidth=".55"/>
    <circle cx="96" cy="13" r="1.1" fill="#fff"/>
   </g>)}
  </g>
 </svg>;
}
