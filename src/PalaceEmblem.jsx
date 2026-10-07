import React from 'react';
import{loreForPalace}from'./grandPalaceLore';
/* Dedicated scalable pictorial crests, not a generic glyph repeated across courts. */
export default function PalaceEmblem({palace,size=88,className='',decorative=false}){
 const lore=loreForPalace(palace),slug=typeof palace==='string'?palace:palace?.slug;
 const c=lore.colour,d=lore.secondary,id='emblem-'+(slug||'moon');
 const common={fill:'none',stroke:'url(#'+id+'-stroke)',strokeWidth:2.4,strokeLinecap:'round',strokeLinejoin:'round'};
 let drawing=null;
 switch(slug){
 case 'winter-phoenix':
 drawing=<><path d="M50 69Q29 63 23 37q16 4 24 17-3-22 3-37 6 15 3 37 8-13 24-17Q71 63 50 69Z" fill={'url(#'+id+'-fill)'} stroke={c} strokeWidth="2"/><path d="M50 68Q36 65 29 51M50 68Q64 65 71 51M50 62Q51 42 50 23" {...common}/><path d="M43 73q7 10 14 0m-7 0v15M44 26l6-13 6 13" {...common}/><circle cx="52" cy="33" r="1.5" fill="#fff"/></>;
 break;
 case 'whispering-comet':
 drawing=<><path d="M20 80Q43 67 68 39" stroke={d} strokeWidth="11" strokeLinecap="round" opacity=".25"/><path d="M16 85Q47 61 69 37M28 83Q50 60 72 39M16 66Q41 54 66 35" {...common}/><circle cx="72" cy="32" r="15" fill={'url(#'+id+'-fill)'} stroke={c} strokeWidth="2"/><path d="m72 18 3.5 10.5L86 32l-10.5 3.5L72 46l-3.5-10.5L58 32l10.5-3.5Z" fill={c}/><circle cx="20" cy="33" r="2" fill={c}/><path d="m36 17v10m-5-5h10" {...common}/></>;
 break;
 case 'silver-crane':
 drawing=<><path d="M56 74Q34 65 27 43q16 1 25 15 8-20 30-23-7 22-26 26l7 13Z" fill={'url(#'+id+'-fill)'} stroke={c} strokeWidth="2"/><path d="M56 65Q60 43 54 25q-5-8-13-7m13 7 13-5M54 63q-12-6-20-15M64 72l4 14m-13-12-3 12m-6 1h11m8-1h11" {...common}/><circle cx="48" cy="22" r="1.7" fill="#fff"/><path d="M12 81q10-7 20 0t20 0t20 0t20 0" {...common}/></>;
 break;
 case 'azure-moon':
 drawing=<><path d="M59 15A33 33 0 1 0 78 73 29 29 0 0 1 59 15Z" fill={'url(#'+id+'-fill)'} stroke={c} strokeWidth="2.5"/><path d="m72 17 3 8 8 3-8 3-3 8-3-8-8-3 8-3Zm6 46 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" fill={c}/><path d="M17 76q12-7 25-1" {...common}/></>;
 break;
 case 'violet-star':
 drawing=<><path d="M50 10 59 38 89 50 59 61 50 90 40 61 11 50 40 38Z" fill={'url(#'+id+'-fill)'} stroke={c} strokeWidth="2.5"/><path d="m50 28 6 15 16 7-16 7-6 16-7-16-15-7 15-7Z" fill="none" stroke="#f2ecff" strokeWidth="1.5"/><circle cx="50" cy="50" r="5" fill="#f2ecff"/></>;
 break;
 case 'sapphire-tide':
 drawing=<><path d="M12 65q12-27 26 0t26 0t24 0v14H12Z" fill={'url(#'+id+'-fill)'} stroke={c} strokeWidth="2"/><path d="M12 53q11-18 22 0t22 0t22 0M12 41q11-18 22 0t22 0t22 0M20 80q13-7 26 0t26 0" {...common}/><path d="m51 16 4 12 12 4-12 4-4 12-4-12-12-4 12-4Z" fill={c}/></>;
 break;
 case 'obsidian-rose':
 drawing=<><path d="M49 73Q27 66 28 47q-3-22 21-27 26 4 23 27Q72 66 49 73Z" fill={'url(#'+id+'-fill)'} stroke={c} strokeWidth="2"/><path d="M50 70q-14-23 2-38 16 18-2 38Zm0-38q-13-9-21 6M52 32q12-10 20 6M50 73v17m0-8q-19-14-29-6m29 5q20-15 30-5" {...common}/><path d="m34 18 2 6 6 2-6 2-2 6-2-6-6-2 6-2Z" fill={c}/></>;
 break;
 case 'celestial-lotus':
 drawing=<><path d="M50 76Q25 61 35 33q17 7 15 30 1-23 16-30 10 28-16 43ZM50 76Q20 77 17 52q18-1 33 24 15-25 33-24-3 25-33 24Z" fill={'url(#'+id+'-fill)'} stroke={c} strokeWidth="2.1"/><path d="M50 72q-2-29 0-48m-32 60q32-12 64 0" {...common}/><circle cx="50" cy="24" r="3" fill="#e9ffff"/></>;
 break;
 case 'midnight-lantern':
 drawing=<><path d="M40 29h20l6 12v34H34V41Zm-1 0Q40 18 50 18t11 11" fill={'url(#'+id+'-fill)'} stroke={c} strokeWidth="2.5"/><path d="M50 13v5M34 42h32m-32 32h32M50 37l9 15-9 15-9-15Z" {...common}/><path d="M50 42l5 10-5 10-5-10Z" fill="#e9f4ff"/><path d="M41 81h18m-9-6v6" {...common}/></>;
 break;
 case 'amethyst-sky':
 drawing=<><path d="M23 74V32l27-17 27 17v42L50 89Z" fill={'url(#'+id+'-fill)'} stroke={c} strokeWidth="2"/><path d="m31 35 19 10 19-10M50 45v36m-20-6 19-10 20 10" {...common}/><path d="M50 25 56 43 75 50 56 57 50 75 43 57 25 50 43 43Z" fill="none" stroke="#e2daff" strokeWidth="1.2"/><circle cx="50" cy="50" r="4" fill="#fff"/></>;
 break;
 default:drawing=<circle cx="50" cy="50" r="27" fill={c}/>;
 }
 return <svg viewBox="0 0 100 100" width={size} height={size} className={'palace-emblem '+className} role={decorative?undefined:'img'} aria-label={decorative?undefined:(palace?.name||lore.emblem)+' crest'} aria-hidden={decorative||undefined}>
 <defs><linearGradient id={id+'-fill'} x1="15%" y1="0%" x2="90%" y2="100%"><stop stopColor={c}/><stop offset="1" stopColor={d}/></linearGradient><linearGradient id={id+'-stroke'} x1="0%" y1="0%" x2="100%" y2="100%"><stop stopColor="#e7f4ff"/><stop offset="1" stopColor={c}/></linearGradient></defs>
 <path d="M50 5 82 16 94 50 82 84 50 95 18 84 6 50 18 16Z" fill="none" stroke={c} strokeWidth="1" opacity=".28"/>
 {drawing}
 </svg>;
}
