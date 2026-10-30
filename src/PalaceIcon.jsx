import React from 'react';
import './palace-icons.css';

/**
 * Consistent, lightweight Palace line icons for content, cards, and actions.
 * Intentionally not used by the permanent sidebar or top navigation.
 * Each icon uses one 24px viewBox and the same rounded 1.85px stroke.
 */
const shapes={
 'book-open':<><path d="M12 6.5c-2.8-2.2-6-2.7-9-2v14c3-.7 6.2-.2 9 2 2.8-2.2 6-2.7 9-2v-14c-3-.7-6.2-.2-9 2Z"/><path d="M12 6.5v14"/></>,
 'library':<><path d="M4 4.5v15M9 4.5v15M14 5.5v14M19 3.5l2 16"/><path d="M2 20.5h20M3.2 8h7M14 10h7"/></>,
 'pen-line':<><path d="m4 20 4.5-1 10.6-10.6-3.5-3.5L5 15.5 4 20Z"/><path d="m13.8 6.7 3.5 3.5M4 20h16"/></>,
 'panels':<><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 4v16M3 12h9M12 9h9"/></>,
 'calendar':<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18M7 14h3M14 14h3M7 18h3"/></>,
 'crown':<><path d="m3 8 4.5 4L12 5l4.5 7L21 8l-2 11H5L3 8Z"/><path d="M5 19h14M8 15h8"/></>,
 'history':<><path d="M3.5 10a9 9 0 1 1 1 7"/><path d="M3.5 4v6h6M12 7.5V13l3.5 2.5"/></>,
 'moon':<path d="M20.5 14.8A8.5 8.5 0 0 1 9.2 3.5 8.5 8.5 0 1 0 20.5 14.8Z"/>,
 'sparkles':<><path d="m12 2 1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9L12 2ZM20 18l.7 1.3L22 20l-1.3.7L20 22l-.7-1.3L18 20l1.3-.7L20 18Z"/></>,
 'shuffle':<><path d="M3 7h3c4 0 5 10 10 10h5"/><path d="m17.5 13.5 3.5 3.5-3.5 3.5M3 17h3c2.2 0 3.5-2.3 4.7-4.4M13.2 9.1C14 7.8 14.8 7 16 7h5M17.5 3.5 21 7l-3.5 3.5"/></>,
 'arrow-right':<><path d="M4 12h16M13 5l7 7-7 7"/></>,
 'arrow-left':<><path d="M20 12H4M11 5l-7 7 7 7"/></>,
 'arrow-up-right':<><path d="M5 19 19 5M8 5h11v11"/></>,
 'chevron-left':<path d="m15 18-6-6 6-6"/>,
 'chevron-right':<path d="m9 18 6-6-6-6"/>,
 'search':<><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></>,
 'tags':<><path d="M11.5 3H4v7.5L14.5 21 21 14.5 11.5 3Z"/><circle cx="7.5" cy="7.5" r="1.2"/></>,
 'users':<><circle cx="9" cy="8" r="3"/><path d="M3.5 20v-2a5.5 5.5 0 0 1 11 0v2H3.5ZM16 5a3 3 0 0 1 0 6M16.8 14a5 5 0 0 1 3.7 5v1"/></>,
 'messages':<><path d="M20 12a8 8 0 0 1-8 8 8.2 8.2 0 0 1-3-.6L4 21l1.6-5A8 8 0 1 1 20 12Z"/><path d="M8 12h8M8 9h5"/></>,
 'gift':<><rect x="3" y="10" width="18" height="11" rx="1"/><path d="M12 10v11M2.5 7.5h19v3h-19zM12 7.5c-5-1-6.4-2.2-5.2-4 1.7-2 5 .1 5.2 4ZM12 7.5c5-1 6.4-2.2 5.2-4-1.7-2-5 .1-5.2 4Z"/></>,
 'trophy':<><path d="M7 4h10v8c0 4-2 6-5 6s-5-2-5-6V4ZM7 6H4v3c0 3 2 4 4 4M17 6h3v3c0 3-2 4-4 4M12 18v3M8 21h8"/></>,
 'shield':<><path d="m12 2 8 3v6c0 5-3 8.5-8 11-5-2.5-8-6-8-11V5l8-3Z"/><path d="m8 12 2.5 2.5L16 9"/></>,
 'bookmark':<path d="M6 3h12v18l-6-4-6 4V3Z"/>,
 'compass':<><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z"/></>,
 'home':<><path d="m3 10 9-7 9 7v10H3V10Z"/><path d="M9 20v-6h6v6"/></>,
 'scroll':<><path d="M7 4h12a2 2 0 0 1 2 2v13a3 3 0 0 1-3 3H7"/><path d="M7 4a3 3 0 0 0-3 3v13a2 2 0 0 0 2 2 3 3 0 0 0 3-3V7a3 3 0 0 0-3-3ZM12 9h6M12 13h6"/></>,
 'image':<><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8" cy="9" r="1.5"/><path d="m4 18 5.5-5 3.3 3.2L16 12l5 6"/></>,
 'grid':<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
 'archive':<><rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v11h14V9M10 13h4"/></>,
 'folder':<path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10H3V7Z"/>,
 'refresh':<><path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.4 9a7.5 7.5 0 0 1 12.8-2L20 12M4 12l1.8 5a7.5 7.5 0 0 0 12.8-2"/></>,
 'heart':<path d="M20.5 5.5a5 5 0 0 0-7.1 0L12 6.9l-1.4-1.4a5 5 0 1 0-7.1 7.1L12 21l8.5-8.4a5 5 0 0 0 0-7.1Z"/>,
 'bell':<><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 20h4"/></>,
 'settings':<><circle cx="12" cy="12" r="3"/><path d="m10 2-.5 2.5-2 1.2L5 4.8 2.8 8.4l2 1.8v3.6l-2 1.8L5 19.2l2.5-.9 2 1.2L10 22h4l.5-2.5 2-1.2 2.5.9 2.2-3.6-2-1.8v-3.6l2-1.8L19 4.8l-2.5.9-2-1.2L14 2h-4Z"/></>,
 'x':<path d="M5 5 19 19M19 5 5 19"/>,
 'plus':<path d="M12 5v14M5 12h14"/>,
 'check':<path d="m4 12 5 5L20 6"/>,
 'filter':<><path d="M3 5h18M6 12h12M9 19h6"/><circle cx="8" cy="5" r="1.3"/><circle cx="15" cy="12" r="1.3"/></>,
 'clock':<><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/></>,
 'file-text':<><path d="M5 2h9l5 5v15H5V2Z"/><path d="M14 2v5h5M8 12h8M8 16h8"/></>,
 'feather':<><path d="M3 21 18.5 5.5a4 4 0 0 1 0 6L12 18H6Z"/><path d="M3 21c6-5 10-8 15-10"/></>,
 'palette':<><path d="M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 1.5-3.5A2 2 0 0 1 16 14h2a3 3 0 0 0 3-3 9 9 0 0 0-9-8Z"/><circle cx="7" cy="10" r="1"/><circle cx="10" cy="6.5" r="1"/><circle cx="16" cy="7" r="1"/></>,
 'map':<><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6ZM9 3v15M15 6v15"/></>,
 'sun':<><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/></>
};
const routeNames=[
 [/^\/writing/, 'pen-line'], [/^\/reading|^\/work\/|^\/fandoms/,'book-open'],
 [/^\/comics\/studio/,'panels'], [/^\/comics/,'image'],
 [/^\/library\?tab=history/,'history'], [/^\/library/,'library'],
 [/^\/events|^\/calendar/,'calendar'], [/^\/treasury/,'crown'],
 [/^\/tags/,'tags'], [/^\/search/,'search'],
 [/^\/palace-life|^\/clubs|^\/forum/,'users'], [/^\/letters|^\/chat/,'messages'],
 [/^\/grand-palaces/,'crown'], [/^\/honour/,'trophy'],
 [/^\/lost-works/,'archive'], [/^\/member\/|^\/chamber/,'home'],
 [/^\/writers/,'feather'], [/^\/settings/,'settings']
];
export function palaceIconForRoute(route){
  const path=String(route||'');
  return routeNames.find(([pattern])=>pattern.test(path))?.[1]||'sparkles';
}
export default function PalaceIcon({name='sparkles',size=22,className='',strokeWidth=1.85}){
  return <svg xmlns="http://www.w3.org/2000/svg" className={'palace-icon'+(className?' '+className:'')} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{shapes[name]||shapes.sparkles}</svg>;
}
