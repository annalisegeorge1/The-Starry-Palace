/**
 * Keep tabbed Palace rooms aligned with React Router, deep links, Back/Forward,
 * and unknown or outdated ?tab= values.
 * A room's own tab state and its URL should never disagree.
 */
export const WRITING_TABS=['drafts','collab','relay','duels','comments','permissions'];
export const LIBRARY_TABS=['overview','continue','saved','comics','collections','lists','notes','following','writers','history','finished'];
export const SETTINGS_TABS=['privacy','notifications','quiet','storage','account','system','guide','testing'];
export const EVENTS_PUBLIC_TABS=['writing','events','heritage'];
export const EVENTS_MEMBER_TABS=[...EVENTS_PUBLIC_TABS,'calendar','proposals','ballots'];
export function palaceTabFromSearch(search,allowed,fallback){
 const list=Array.isArray(allowed)?allowed:[];
 const defaultTab=list.includes(fallback)?fallback:list[0]||'';
 const raw=new URLSearchParams(String(search||'').replace(/^\?/, '')).get('tab');
 return list.includes(raw)?raw:defaultTab;
}
export function palaceTabUrl(room,tab,allowed,fallback){
 const selected=allowed.includes(tab)?tab:fallback;
 return room+'?tab='+encodeURIComponent(selected);
}
