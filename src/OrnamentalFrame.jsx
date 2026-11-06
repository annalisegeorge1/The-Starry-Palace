import React,{useId} from 'react';
import GemstoneOrnamentalFrame from './GemstoneOrnamentalFrame';

const metals={
 bronze:['#643a25','#bd8150','#f4c99b','#885334'],
 silver:['#586572','#b8c4cf','#f6fbff','#8595a5'],
 gold:['#856020','#d6aa4f','#fff0b3','#ad792d'],
 platinum:['#687787','#dae4ef','#ffffff','#9fadc0'],
 emerald:['#826022','#d8b263','#fff1b6','#ac7b31']
};
/** Original vector jewellery: a clear circular opening shared by every frame. */
export default function OrnamentalFrame({frame,size='100%',className=''}){
 const stableId=useId();
 if(frame?.gemstone)return <GemstoneOrnamentalFrame frame={frame} size={size} className={className}/>;
 const id='ornament-'+stableId.replace(/[^a-zA-Z0-9_-]/g,''),palette=metals[frame.tier]||metals.bronze;
 const style=Math.floor(frame.index/5),rank=['bronze','silver','gold','platinum','emerald'].indexOf(frame.tier);
 const metal=`url(#${id}-metal)`,gem=`url(#${id}-gem)`;
 const count=[24,32,20,16,12,12,10][style];
 return <svg className={'painted-art painted-chamber-frame ornamental-avatar-frame '+className} width={size} height={size} viewBox="0 0 200 200" role="img" aria-label={frame.name+' chamber frame'} focusable="false" data-tier={frame.tier} data-style={style}>
  <defs>
   <linearGradient id={id+'-metal'} x1="0" y1="0" x2="1" y2="1"><stop stopColor={palette[2]}/><stop offset=".26" stopColor={palette[1]}/><stop offset=".48" stopColor={palette[0]}/><stop offset=".7" stopColor={palette[2]}/><stop offset="1" stopColor={palette[3]}/></linearGradient>
   <radialGradient id={id+'-gem'} cx=".3" cy=".23"><stop stopColor={rank===4?'#c4ffdf':'#ffffff'}/><stop offset=".32" stopColor={rank===4?'#39c897':palette[2]}/><stop offset=".72" stopColor={rank===4?'#087552':palette[1]}/><stop offset="1" stopColor={rank===4?'#033e32':palette[0]}/></radialGradient>
  </defs>
  <g fill="none" stroke={metal} strokeLinecap="round" strokeLinejoin="round">
   <circle cx="100" cy="100" r="83" strokeWidth={style===1?2.8:1.8}/>
   {rank>=3&&<g data-ornament="prestige-detail"><circle cx="100" cy="100" r="86.5" strokeWidth=".75"/><circle cx="100" cy="100" r="88.5" strokeWidth="1.8" strokeDasharray=".2 4"/>
    {Array.from({length:8},(_,i)=><g key={i} transform={`rotate(${i*45+22.5} 100 100)`}><path d="M96 14 C88 8 91 2 95 5 C98 7 94 10 93 7 M104 14 C112 8 109 2 105 5 C102 7 106 10 107 7" strokeWidth=".85"/><path d="M100 14 L97 9 L100 3 L103 9Z" fill={gem} strokeWidth=".8"/></g>)}
   </g>}
   {style===1&&<circle cx="100" cy="100" r="86.5" strokeWidth=".7"/>}
   {Array.from({length:count},(_,i)=><g key={i} transform={`rotate(${i*360/count} 100 100)`}>
    {style===0&&<path d="M100 17 C87 11 91 4 97 9 C104 15 107 9 104 6" strokeWidth="1.5"/>}
    {style===1&&<path d="M98 16 L103 10 M100 16 L105 10" strokeWidth="1.3"/>}
    {style===2&&<><path d="M100 17 Q94 10 100 5 Q107 11 100 17Z" fill={metal} strokeWidth=".6"/><path d="M100 16 L100 8" stroke={palette[2]} strokeWidth=".6"/></>}
    {style===3&&<><path d="M100 17 C88 14 89 5 95 7 C101 9 96 13 94 10 M100 17 C112 14 111 5 105 7 C99 9 104 13 106 10" strokeWidth="1.2"/><circle cx="100" cy="8" r="1.5" fill={metal}/></>}
    {style===5&&<><path d="M100 17 L93 10 L100 2 L107 10Z" strokeWidth="1.2"/><path d="M100 14 L97 10 L100 6 L103 10Z" fill={gem} strokeWidth=".6"/><path d="M107 10 Q115 5 120 10" strokeWidth=".8"/></>}
    {style===6&&<><path d="M96 16 Q86 11 90 5 Q98 6 99 13 M104 16 Q114 11 110 5 Q102 6 101 13" strokeWidth="1" fill={metal}/>{Array.from({length:5},(_,j)=><ellipse key={j} cx="100" cy="6.8" rx="2.5" ry="4.5" transform={`rotate(${j*72} 100 10)`} fill={rank===4?gem:metal} strokeWidth=".65"/>)}<circle cx="100" cy="10" r="2.3" fill={rank>=3?gem:metal} strokeWidth=".65"/></>}
    {style===4&&<><path d="M100 17 Q89 12 92 5 Q102 5 100 17 M100 17 Q111 12 108 5 Q98 5 100 17" strokeWidth="1.1"/>{rank>1&&<path d="M100 13 Q94 5 100 2 Q106 5 100 13Z" fill={gem} strokeWidth=".9"/>}</>}
   </g>)}
   {rank>=3&&<g data-ornament="crown-setting"><path d="M89 13 Q88 6 84 3 Q94 3 96 8 L100 0 L104 8 Q106 3 116 3 Q112 6 111 13" fill={metal} strokeWidth=".8"/><path d="M100 1 Q91 7 100 15 Q109 7 100 1Z" fill={gem} strokeWidth="1.2"/><path d="M97 7 L100 3 L103 7 L100 12Z" stroke={rank===4?'#91f4c8':'#fff'} strokeWidth=".65"/></g>}
   {rank>0&&Array.from({length:rank===4?8:4},(_,i)=><g key={'j'+i} transform={`rotate(${i*360/(rank===4?8:4)} 100 100)`}><circle cx="100" cy="16.5" r={rank===4?4:2.2+rank*.35} fill={gem} strokeWidth="1.2"/><path d="M98 15 L100 13.5 L102 15" stroke={rank===4?'#b4f9d7':'#fff'} strokeWidth=".65"/></g>)}
  </g>
 </svg>;
}
