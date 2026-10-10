export const PALACE_TIDINGS_KINDS=Object.freeze({
current_leader:{label:'CURRENTLY FIRST',href:'/grand-palaces'},
season_winner:{label:'QUARTERLY CHAMPION',href:'/grand-palaces?tab=courts'},
first_place:{label:'FIRST PLACE',href:'/grand-palaces?tab=courts'},
lottery_winner:{label:'LOTTERY WINNER',href:'/grand-palaces?tab=treasury'},
celestial_award:{label:'CELESTIAL GIFT BOX',href:'/grand-palaces?tab=treasury'}
});
const FOCUS_PREFIXES=['/reading','/classic','/work','/writing','/comic','/comics','/series','/lost-works','/library','/chamber','/settings','/login','/auth/callback','/welcome','/ink-duels','/ink-duel','/duels','/prompt-orrery'];
export function shouldShowPalaceTidings(pathname){const path=String(pathname||'/').split('?')[0];return !FOCUS_PREFIXES.some(prefix=>path===prefix||path.startsWith(prefix+'/'));}
export function normalizePalaceTidings(payload){
 if(!Array.isArray(payload))return [];
 const ids=new Set();
 return payload.filter(event=>{
  if(!event||!PALACE_TIDINGS_KINDS[event.kind]||typeof event.headline!=='string'||!event.headline.trim())return false;
  const id=String(event.id||'');if(!id||ids.has(id))return false;ids.add(id);return true;
 }).slice(0,12).map(event=>({id:String(event.id),label:PALACE_TIDINGS_KINDS[event.kind].label,href:PALACE_TIDINGS_KINDS[event.kind].href,text:event.headline.trim().slice(0,180)}));
}
