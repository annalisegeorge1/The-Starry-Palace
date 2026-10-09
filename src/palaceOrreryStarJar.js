/*
 * On-device favorites for complete Prompt Orrery constellations.
 * The saved snapshot keeps reel locks intact when a writer returns to an orbit.
 * Nothing is transmitted, published, or charged to the points wallet.
 */
export const ORRERY_STAR_JAR_LIMIT=12;
export const ORRERY_STAR_JAR_STORAGE_KEY='palace-orrery-star-jar';
export function starJarKey(prompt){
 if(!prompt?.id)return '';
 return [prompt.id,prompt.genre,prompt.object,prompt.twist].map(value=>String(value||'')).join('|');
}
export function addStarJarPrompt(items=[],prompt){
 const key=starJarKey(prompt);
 if(!key)return items;
 const others=(Array.isArray(items)?items:[]).filter(item=>starJarKey(item)!==key);
 return [{...prompt},...others].slice(0,ORRERY_STAR_JAR_LIMIT);
}
export function removeStarJarPrompt(items=[],key){
 return (Array.isArray(items)?items:[]).filter(item=>starJarKey(item)!==key);
}
export function readStarJar(storage){
 try{
  const data=JSON.parse(storage?.getItem(ORRERY_STAR_JAR_STORAGE_KEY)||'[]');
  if(!Array.isArray(data))return [];
  const safe=data.filter(item=>item&&typeof item==='object'
   &&typeof item.id==='string'&&typeof item.genre==='string'
   &&typeof item.object==='string'&&typeof item.twist==='string');
  return safe.reduceRight((items,item)=>addStarJarPrompt(items,item),[]);
 }catch{return []}
}
