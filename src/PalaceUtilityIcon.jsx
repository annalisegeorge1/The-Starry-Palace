import React from 'react';

/** Quiet Palace jewel linework: visual only; parent controls own their accessible names. */
export default function PalaceUtilityIcon({name,className=''}) {
 const common={className:('palace-utility-icon '+className).trim(),viewBox:'0 0 24 24',width:20,height:20,fill:'none',stroke:'currentColor',strokeWidth:1.85,strokeLinecap:'round',strokeLinejoin:'round','aria-hidden':true,focusable:false};
 switch(name){
  case 'menu':return <svg {...common}><path d="M4.5 6.5h15M4.5 12h15M4.5 17.5h15"/></svg>;
  case 'search':return <svg {...common}><circle cx="10.8" cy="10.8" r="6.1"/><path d="m15.4 15.4 4.9 4.9"/></svg>;
  case 'profile':return <svg {...common}><circle cx="12" cy="8" r="3.3"/><path d="M5 20c.6-4 3.1-6 7-6s6.4 2 7 6"/></svg>;
  case 'chat':return <svg {...common}><path d="M20 11.6a7.6 7.6 0 0 1-7.9 7.5 9.5 9.5 0 0 1-3.4-.7L4 20l1.4-4.2a7.5 7.5 0 0 1-1.4-4.2A7.7 7.7 0 0 1 12 4a7.7 7.7 0 0 1 8 7.6Z"/><path d="M8.6 11.8h.1m3.2 0h.1m3.2 0h.1" strokeWidth="3"/></svg>;
  case 'activity':return <svg {...common}><path d="M12 2.8 14.6 9l6.2 2.6-6.2 2.6-2.6 6.2-2.6-6.2-6.2-2.6L9.4 9Z"/><path d="M19.1 3.4v3.4m-1.7-1.7h3.4"/></svg>;
  case 'write':return <svg {...common}><path d="M19.1 4.7c-5.8.7-10.3 4.4-11.6 10.1l2.8 2.8c5.6-1.4 9.3-5.8 10-11.7Z"/><path d="m7.5 14.8-3.6 5.3 6.4-2.5M11.1 13.6l3-3"/></svg>;
  case 'help':return <svg {...common}><path d="M9 9.1a3.3 3.3 0 0 1 6.4 1c0 2.1-3.4 2.4-3.4 4.6"/><path d="M12 18.1h.01" strokeWidth="2.6"/></svg>;
  default:return null;
 }
}
