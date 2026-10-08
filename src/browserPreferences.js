/**
 * Browser-only display settings are optional. They must never stop the reader
 * or writing desk from opening if a browser blocks storage or data is corrupt.
 */
export function readPalacePreference(key,fallback,storage){
 try{
  const store=storage===undefined?(typeof window!=='undefined'?window.localStorage:null):storage;
  const value=store?.getItem(key);
  return typeof value==='string'&&value!==''?value:fallback;
 }catch{return fallback}
}
export function writePalacePreference(key,value,storage){
 try{
  const store=storage===undefined?(typeof window!=='undefined'?window.localStorage:null):storage;
  if(!store)return false;
  store.setItem(key,String(value));return true;
 }catch{return false}
}
export function removePalacePreference(key,storage){
 try{
  const store=storage===undefined?(typeof window!=='undefined'?window.localStorage:null):storage;
  if(!store)return false;
  store.removeItem(key);return true;
 }catch{return false}
}
export function readPalaceChoice(key,allowed,fallback,storage){
 const value=readPalacePreference(key,fallback,storage);
 return allowed.includes(value)?value:fallback;
}
export function readPalaceNumber(key,fallback,min,max,storage){
 const raw=readPalacePreference(key,fallback,storage);
 const value=Number(raw);
 return Number.isFinite(value)?Math.max(min,Math.min(max,value)):fallback;
}
