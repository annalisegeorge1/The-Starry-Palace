import React,{useId} from 'react';

/**
 * Crafted frame artwork shared by the 24 newer Atelier pieces.
 * Each has an inset metal rim, engraved relief, an individual crest and
 * selectively set, faceted gemstones. The portrait opening remains clear.
 * The first 35 established frames are intentionally left untouched.
 */
function CrownCrest({metal,edge,shine,gem}) {
 return <g>
  <path d="M73 22 L76 3 L87 12 L94 0 L100 8 L106 0 L113 12 L124 3 L127 22 Q100 31 73 22Z" fill={metal} stroke={edge} strokeWidth="2"/>
  <path d="M78 19 Q100 25 122 19 M82 9 L88 17 L94 5 L100 16 L106 5 L112 17 L118 9" fill="none" stroke={shine} strokeWidth="1.3"/>
  <path d="M100 4 L108 13 L100 24 L92 13Z" fill={gem} stroke={shine} strokeWidth="1.2"/>
  <circle cx="79" cy="7" r="2" fill={shine}/><circle cx="121" cy="7" r="2" fill={shine}/>
 </g>;
}
function FocalCrest({motif,metal,edge,shine,gem,light}) {
 if(motif==='crown')return <CrownCrest metal={metal} edge={edge} shine={shine} gem={gem}/>;
 if(motif==='arch')return <g>
  <path d="M71 27 V16 Q86 -2 100 -1 Q114 -2 129 16 V27 L120 23 V16 Q112 6 100 11 Q88 6 80 16 V23Z" fill={metal} stroke={edge} strokeWidth="2"/>
  <path d="M78 20 Q88 8 100 6 Q112 8 122 20 M87 24 Q100 10 113 24 M100 4 V26" fill="none" stroke={shine} strokeWidth="1.4"/>
  <path d="M100 8 L107 15 L100 26 L93 15Z" fill={gem} stroke={light} strokeWidth="1.2"/>
 </g>;
 if(motif==='shield')return <g>
  <path d="M78 7 L91 10 L100 1 L109 10 L122 7 L118 23 Q100 35 82 23Z" fill={metal} stroke={edge} strokeWidth="2"/>
  <path d="M84 12 L93 14 L100 7 L107 14 L116 12 L112 22 Q100 30 88 22Z" fill="none" stroke={shine} strokeWidth="1.2"/>
  <path d="M100 8 L106 15 L100 24 L94 15Z" fill={gem} stroke={light} strokeWidth="1"/>
 </g>;
 if(motif==='diamond'||motif==='diamonds')return <g>
  <path d="M84 12 L95 1 L105 1 L116 12 L110 23 L90 23Z" fill={metal} stroke={edge} strokeWidth="2"/>
  <path d="M100 2 L113 12 L100 27 L87 12Z" fill={gem} stroke={shine} strokeWidth="1.3"/>
  <path d="M100 2 V27 M87 12 H113 M92 7 L100 12 L108 7" stroke={light} fill="none" strokeWidth=".9"/>
 </g>;
 if(motif==='sun')return <g>
  {Array.from({length:9},(_,i)=><path key={i} d="M98 6 L100 -1 L102 6Z" transform={'rotate('+(i*24-96)+' 100 20)'} fill={metal} stroke={edge} strokeWidth=".6"/>)}
  <circle cx="100" cy="17" r="11" fill={metal} stroke={edge} strokeWidth="2"/>
  <circle cx="100" cy="17" r="7" fill={gem} stroke={shine} strokeWidth="1.1"/>
  <path d="M100 10 V24 M93 17 H107 M95 12 L105 22 M95 22 L105 12" stroke={light} strokeWidth=".7"/>
 </g>;
 if(motif==='flower'||motif==='petals')return <g>
  {Array.from({length:7},(_,i)=><path key={i} transform={'rotate('+(i*360/7)+' 100 16)'} d="M100 4 C90 0 87 12 100 16 C113 12 110 0 100 4Z" fill={metal} stroke={edge} strokeWidth=".8"/>)}
  <circle cx="100" cy="16" r="6" fill={gem} stroke={shine} strokeWidth="1.3"/>
  <path d="M98 13 Q100 10 103 14 Q105 18 99 20" fill="none" stroke={light} strokeWidth="1"/>
 </g>;
 if(motif==='moon')return <g>
  <path d="M108 0 A16 16 0 1 0 116 25 A13 13 0 1 1 108 0Z" fill={metal} stroke={edge} strokeWidth="1.7"/>
  <path d="M83 10 L86 15 L92 17 L86 19 L83 25 L81 19 L76 17 L81 15Z" fill={shine}/>
  <circle cx="110" cy="15" r="4.5" fill={gem} stroke={light} strokeWidth="1.1"/>
 </g>;
 if(motif==='vine'||motif==='leaves')return <g>
  <path d="M72 25 Q81 4 101 10 Q117 4 128 25" fill="none" stroke={metal} strokeWidth="4"/>
  <path d="M74 25 Q82 12 94 11 M106 11 Q118 13 126 25" fill="none" stroke={shine} strokeWidth="1.3"/>
  <path d="M82 15 Q76 4 86 5 Q93 8 82 15 M116 15 Q123 4 113 5 Q106 8 116 15" fill={metal} stroke={edge} strokeWidth="1"/>
  <path d="M100 4 L105 11 L100 20 L95 11Z" fill={gem} stroke={light} strokeWidth="1"/>
 </g>;
 if(motif==='star'||motif==='stars')return <g>
  <path d="M100 0 L105 11 L118 15 L105 19 L100 30 L95 19 L82 15 L95 11Z" fill={metal} stroke={shine} strokeWidth="1.2"/>
  <path d="M100 7 L103 13 L110 15 L103 17 L100 23 L97 17 L90 15 L97 13Z" fill={gem} stroke={light} strokeWidth=".8"/>
  <circle cx="78" cy="16" r="2" fill={shine}/><circle cx="122" cy="16" r="2" fill={shine}/>
 </g>;
 if(motif==='pearl')return <g>
  <path d="M77 22 Q100 0 123 22" stroke={metal} strokeWidth="4" fill="none"/>
  {[-18,-9,0,9,18].map((x,i)=><g key={i}><circle cx={100+x} cy={i===2?7:i===1||i===3?12:20} r={i===2?7:5} fill={light} stroke={edge} strokeWidth="1.2"/><circle cx={98+x} cy={i===2?4:i===1||i===3?10:18} r="1.5" fill="#ffffff"/></g>)}
 </g>;
 return null;
}
function FacetedStone({metal,edge,light,gem,kind='brilliant'}) {
 return <g>
  <path d={kind==='marquise'?'M100 2 Q112 13 100 26 Q88 13 100 2Z':'M100 2 L111 11 L107 23 L100 27 L93 23 L89 11Z'} fill={metal} stroke={edge} strokeWidth="1.8"/>
  <path d={kind==='marquise'?'M100 5 Q108 14 100 23 Q92 14 100 5Z':'M100 5 L108 12 L105 21 L100 24 L95 21 L92 12Z'} fill={gem} stroke={light} strokeWidth=".7"/>
  <path d="M100 6 L100 23 M93 13 H107 M94 12 L100 17 L106 12 M95 21 L100 17 L105 21" stroke={light} strokeWidth=".75" opacity=".92"/>
  <circle cx="95.8" cy="10.8" r="1" fill="#fff"/>
 </g>;
}
function RepeatingDetail({motif,metal,edge,shine,gem,light}) {
 if(motif==='arch')return <g><path d="M91 24 V14 Q100 3 109 14 V24 M95 24 V15 Q100 10 105 15 V24" fill="none" stroke={shine} strokeWidth="1.3"/><path d="M100 10 V27" stroke={metal} strokeWidth="1.1"/><circle cx="100" cy="11" r="1.4" fill={light}/></g>;
 if(motif==='shield')return <g><path d="M93 13 L100 9 L107 13 L106 23 L100 27 L94 23Z" fill={metal} stroke={edge} strokeWidth="1"/><path d="M100 12 V24 M96 18 H104" stroke={shine} strokeWidth="1"/></g>;
 if(motif==='diamond'||motif==='diamonds')return <g><path d="M100 8 L108 17 L100 27 L92 17Z" fill={metal} stroke={edge} strokeWidth="1"/><path d="M100 8 V27 M92 17 H108" stroke={shine} strokeWidth=".9"/></g>;
 if(motif==='flower'||motif==='petals')return <g><path d="M100 24 Q86 14 92 9 Q100 10 100 19 Q100 10 108 9 Q114 14 100 24Z" fill={metal} stroke={edge} strokeWidth=".6"/><path d="M100 24 Q98 15 100 9" stroke={shine} strokeWidth=".8"/></g>;
 if(motif==='vine'||motif==='leaves')return <g><path d="M100 25 Q91 16 92 11 Q99 12 100 19 Q101 12 108 11 Q109 16 100 25Z" fill={metal} stroke={edge} strokeWidth=".7"/><path d="M100 24 V12" stroke={shine} strokeWidth=".8"/></g>;
 if(motif==='star'||motif==='stars')return <g><path d="M100 8 L103 16 L110 18 L103 20 L100 27 L97 20 L90 18 L97 16Z" fill={metal} stroke={shine} strokeWidth=".8"/></g>;
 if(motif==='moon')return <g><path d="M103 9 A9 9 0 1 0 108 25 A7.5 7.5 0 1 1 103 9Z" fill={metal} stroke={shine} strokeWidth=".8"/></g>;
 if(motif==='pearl')return <g><circle cx="100" cy="17" r="5.2" fill={light} stroke={edge} strokeWidth=".7"/><circle cx="98" cy="15" r="1.4" fill="#ffffff"/></g>;
 if(motif==='sun')return <g><path d="M100 7 L104 16 L100 27 L96 16Z" fill={metal} stroke={shine} strokeWidth=".8"/><circle cx="100" cy="17" r="2.5" fill={gem}/></g>;
 return <g><path d="M100 9 L108 18 L100 26 L92 18Z" fill={metal} stroke={edge} strokeWidth=".8"/><path d="M100 12 V23 M94 18 H106" stroke={shine} strokeWidth=".75"/></g>;
}

/* Repetition establishes the jeweller's setting; individual silhouettes,
 * silhouettes, focal mounts and stone clusters distinguish each design. */
export default function FineFrameArtwork({frame,style,size='100%',className=''}) {
 const seed=useId().replace(/[^a-zA-Z0-9_-]/g,'');
 const id='fine-art-'+seed;
 const isGemstone=style==='gemstone';
 const grand=style.thickness==='grand';
 const slender=style.thickness==='delicate';
 const motif=style.motif;
 const metal='url(#'+id+'-metal)',gem='url(#'+id+'-gem)',enamel='url(#'+id+'-enamel)';
 const highlight=style.highlight||style.light||'#fff7db';
 const mainMetal=style.metal;
 const edge=style.shadow||style.deep||'#493054';
 const stone=style.stone||'#9c8fce';
 const stoneLight=style.stoneLight||style.light||'#ffedff';
 const band=grand?23:slender?5:isGemstone?10:13;
 const inner=82-band/2;
 const segments=isGemstone?32:grand?24:slender?18:20;
 const stoneCount=isGemstone?(motif==='stars'||motif==='diamonds'?8:6):style.gems||0;
 const notable=['black-diamond','black-diamond-throne','treasury-vault','golden-topaz'].includes(frame.slug);
 const squared=['black-diamond-throne','black-diamond','emerald-fortress'].includes(frame.slug);
 const octagon=Array.from({length:8},(_,i)=>{
  const a=(i*45-112.5)*Math.PI/180;
  return (100+82*Math.cos(a)).toFixed(2)+','+(100+82*Math.sin(a)).toFixed(2);
 }).join(' ');
 const outerStroke=grand?27:slender?7:isGemstone?13:16;
 const baseRadius=82;
 return <svg className={'painted-art painted-chamber-frame ornamental-avatar-frame '+(isGemstone?'gemstone-avatar-frame ':'regalia-avatar-frame ')+className}
   width={size} height={size} viewBox="0 0 200 200" role="img" focusable="false"
   aria-label={frame.name+' '+(isGemstone?'gemstone':grand?'grand':'artisan')+' chamber frame'}
   data-tier={frame.tier} data-style={isGemstone?'gemstone':grand?'grand':'artisan'}
   data-gemstone={isGemstone?'true':undefined} data-regalia={isGemstone?undefined:'true'}
   data-thickness={isGemstone?undefined:style.thickness} data-art-quality="hand-finished">
  <defs>
   <linearGradient id={id+'-metal'} x1="0" y1="0" x2="1" y2="1">
    <stop stopColor={edge}/><stop offset=".13" stopColor={mainMetal}/>
    <stop offset=".3" stopColor={highlight}/><stop offset=".43" stopColor={mainMetal}/>
    <stop offset=".6" stopColor={edge}/><stop offset=".81" stopColor={mainMetal}/>
    <stop offset=".95" stopColor={highlight}/><stop offset="1" stopColor={edge}/>
   </linearGradient>
   <radialGradient id={id+'-gem'} cx=".29" cy=".18" r=".85">
    <stop stopColor="#ffffff"/><stop offset=".17" stopColor={stoneLight}/><stop offset=".48" stopColor={stone}/>
    <stop offset=".83" stopColor={style.deep||edge}/><stop offset="1" stopColor="#0d1028"/>
   </radialGradient>
   <linearGradient id={id+'-enamel'} x1="0" y1="0" x2=".8" y2="1">
    <stop stopColor={edge}/><stop offset=".42" stopColor={stone}/><stop offset=".65" stopColor={edge}/><stop offset="1" stopColor={mainMetal}/>
   </linearGradient>
   <filter id={id+'-lift'} x="-30%" y="-30%" width="160%" height="160%">
    <feDropShadow dx="0" dy="1.5" stdDeviation="1.6" floodColor={edge} floodOpacity=".58"/>
   </filter>
  </defs>
  <g fill="none" strokeLinecap="round" strokeLinejoin="round">
   {/* Forged metal body: separate material, cast relief, and polished rims. */}
   {squared?
    <><polygon points={octagon} fill="none" stroke={edge} strokeWidth={outerStroke+3} strokeLinejoin="round"/>
     <polygon points={octagon} fill="none" stroke={metal} strokeWidth={outerStroke} strokeLinejoin="round"/>
    </>:
    <><circle cx="100" cy="100" r={baseRadius} stroke={edge} strokeWidth={outerStroke+3}/>
     <circle cx="100" cy="100" r={baseRadius} stroke={metal} strokeWidth={outerStroke}/>
    </>}
   <circle cx="100" cy="100" r={grand?69:slender?78:isGemstone?75:74} stroke={highlight} strokeWidth="1.5" opacity=".9"/>
   <circle cx="100" cy="100" r={grand?72:slender?80:isGemstone?77:77} stroke={edge} strokeWidth=".9" opacity=".85"/>
   <circle cx="100" cy="100" r="92.8" stroke={edge} strokeWidth="2.4" opacity=".95"/>
   <circle cx="100" cy="100" r="92.1" stroke={highlight} strokeWidth=".9" opacity=".92"/>
   {grand&&<circle cx="100" cy="100" r="86.2" stroke={enamel} strokeWidth="3.4" opacity=".78"/>}
   {grand&&<circle cx="100" cy="100" r="87" stroke={highlight} strokeWidth=".65" strokeDasharray="5 3"/>}
   {isGemstone&&<circle cx="100" cy="100" r="88" stroke={enamel} strokeWidth="2.3" opacity=".8"/>}
   {/* Engraved beads are intentionally pin-sized, so they read as texture and
       do not turn the frame into a string of large circular stones. */}
   {Array.from({length:isGemstone?40:segments},(_,i)=><g key={'grain'+i}
     transform={'rotate('+(i*360/(isGemstone?40:segments))+' 100 100)'}>
    <circle cx="100" cy="9.7" r={isGemstone?1.05:grand?1.45:.8} fill={highlight} stroke={edge} strokeWidth=".28"/>
    {grand&&<path d="M97 22 Q100 26 103 22" stroke={highlight} strokeWidth=".8" opacity=".7"/>}
   </g>)}
   {Array.from({length:grand?12:isGemstone?16:slender?10:12},(_,i)=><g key={'relief'+i}
     transform={'rotate('+(i*360/(grand?12:isGemstone?16:slender?10:12))+' 100 100)'}>
    <RepeatingDetail motif={motif} metal={metal} edge={edge} shine={highlight} gem={gem} light={stoneLight}/>
   </g>)}
   {/* Every item receives a specially shaped focal finial, not just a recolour. */}
   <g filter={'url(#'+id+'-lift)'}>
    <FocalCrest motif={motif} metal={metal} edge={edge} shine={highlight} gem={gem} light={stoneLight}/>
   </g>
   {!slender&&<g transform="rotate(180 100 100)" opacity=".93">
    <FocalCrest motif={motif} metal={metal} edge={edge} shine={highlight} gem={gem} light={stoneLight}/>
   </g>}
   {motif==='arch'&&[90,270].map(a=><g key={a} transform={'rotate('+a+' 100 100)'} opacity=".92">
     <FocalCrest motif="arch" metal={metal} edge={edge} shine={highlight} gem={gem} light={stoneLight}/></g>)}
   {motif==='vine'&&<g transform="rotate(90 100 100)"><FocalCrest motif="vine" metal={metal} edge={edge} shine={highlight} gem={gem} light={stoneLight}/></g>}
   {motif==='moon'&&<path d="M49 38 Q100 -7 151 38" stroke={highlight} strokeWidth="1" opacity=".62"/>}
   {/* Bright stones are an accent on artisan pieces, and the focus on gemstone frames. */}
   {Array.from({length:stoneCount},(_,i)=><g key={'stone'+i}
     transform={'rotate('+(i*360/stoneCount)+' 100 100)'}>
    <FacetedStone metal={metal} edge={edge} light={stoneLight} gem={gem} kind={notable?'brilliant':'marquise'}/>
   </g>)}
   {motif==='pearl'&&Array.from({length:16},(_,i)=><g key={'pearl'+i} transform={'rotate('+(i*22.5)+' 100 100)'}>
    <circle cx="100" cy="16" r="3" stroke={edge} strokeWidth=".85" fill={stoneLight}/>
    <circle cx="99" cy="14.5" r=".9" fill="#fff"/>
   </g>)}
   {['crown','stars','sun','arch','diamonds'].includes(motif)&&[48,137,221,310].map((a,i)=><g key={'spark'+i} transform={'rotate('+a+' 100 100)'}>
    <path d="M100 3 L101.4 7.4 L106 9 L101.4 10.6 L100 15 L98.6 10.6 L94 9 L98.6 7.4Z" fill={i%2===0?highlight:stoneLight} opacity=".86"/>
   </g>)}
  </g>
 </svg>;
}
