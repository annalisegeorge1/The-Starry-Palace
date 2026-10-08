/**
 * Recent Palace doors belong to the signed-in member, not to the shared browser.
 * Never load the legacy 'palace-recent-routes' key: it could contain another
 * member's private writing rooms on a household or library device.
 */
export function palaceRecentDoorKey(memberId){
 if(typeof memberId!=='string'||!/^[a-zA-Z0-9_-]{6,128}$/.test(memberId))return null;
 return 'palace-recent-routes:v2:'+memberId;
}

export function isSafeRecentPalacePath(candidate){
 if(typeof candidate!=='string'||candidate.length>500||!candidate.startsWith('/')||candidate.startsWith('//')||candidate.includes('\\')||/[\x00-\x20\x7f]/.test(candidate))return false;
 const pathname=candidate.split(/[?#]/,1)[0];
 if(!/^\/(?:[a-zA-Z0-9_.@%-]+(?:\/[a-zA-Z0-9_.@%-]+)*)?$/.test(pathname))return false;
 return !pathname.split('/').some(segment=>segment==='.'||segment==='..');
}
function cleanDoor(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||!isSafeRecentPalacePath(value.path))return null;
 if(typeof value.label!=='string'||!value.label.trim())return null;
 return {
  label:value.label.trim().slice(0,80),
  path:value.path,
  icon:typeof value.icon==='string'?value.icon.slice(0,8):'☾',
  detail:typeof value.detail==='string'?value.detail.trim().slice(0,100):'Recently visited',
  kind:'recent'
 };
}

export function readPalaceRecentDoors(read,key){
 if(!key||typeof read!=='function')return [];
 try {
  const values=JSON.parse(read(key)||'[]');
  if(!Array.isArray(values))return [];
  const known=new Set();
  return values.map(cleanDoor).filter(door=>{
   if(!door||known.has(door.path))return false;
   known.add(door.path);
   return true;
  }).slice(0,5);
 }catch{return []}
}

export function addPalaceRecentDoor(previous,door){
 const fresh=cleanDoor(door);
 if(!fresh)return Array.isArray(previous)?previous.slice(0,5):[];
 const safe=Array.isArray(previous)?previous.map(cleanDoor).filter(Boolean):[];
 return [fresh,...safe.filter(x=>x.path!==fresh.path)].slice(0,5);
}
