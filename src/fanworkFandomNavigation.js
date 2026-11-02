/** One stable route from any fanwork's fandom tag into Fandom Atlas.
 * The name parameter is an exact fandom filter, not free-text search.
 */
export function fanworkFandomHref(name){
 const fandom=String(name||'').trim();
 return fandom?'/fandoms?section=fanfiction&fandom='+encodeURIComponent(fandom):'/fandoms?section=fanfiction';
}
export function fanworkFandomFromSearch(search){
 const raw=new URLSearchParams(String(search||'').replace(/^\?/,'')).get('fandom');
 return String(raw||'').trim().slice(0,120);
}
export function intakeFandomNames(value){
 return [...new Set(String(value||'').split(' · ').map(name=>name.trim())
  .filter(name=>name&&name!=='Misc. Anime/Manga'))];
}
