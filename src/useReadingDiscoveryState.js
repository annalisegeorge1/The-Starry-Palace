import {useState,useEffect} from 'react';
export const readingDefaults={query:'',rating:'all',status:'all',origin:'all',shelf:'first',vibeDoor:'all',readerLens:'all',catalogueSort:'updated',layout:'comfortable',discoveryMode:'browse',catalogueScope:'archive',visibleCount:24,includeTags:[],excludeTags:[],tagLabels:{}};
const options={rating:['all','general','teen','mature','explicit','not_rated'],status:['all','in_progress','complete','hiatus','abandoned'],origin:['all','original','fandom'],shelf:['first','quiet','updated','following','continue','nightstand'],vibeDoor:['all','yearn','unsettle','soft','chaos','epic','strange'],readerLens:['all','unread','reading','new','saved','following','finished'],catalogueSort:['updated','published','oldest','title','words','chapters','comments','bookmarks'],layout:['comfortable','compact','gallery'],discoveryMode:['browse','discover'],catalogueScope:['archive','loaded']};
export function cleanReadingDiscovery(value){
 const clean={...readingDefaults};
 if(!value||typeof value!=='object')return clean;
 if(typeof value.query==='string')clean.query=value.query.slice(0,500);
 for(const [key,values] of Object.entries(options))if(values.includes(value[key]))clean[key]=value[key];
 if(Number.isSafeInteger(value.visibleCount)&&value.visibleCount>=24)clean.visibleCount=Math.min(value.visibleCount,10000);
 for(const key of ['includeTags','excludeTags'])if(Array.isArray(value[key]))clean[key]=[...new Set(value[key].filter(id=>typeof id==='string'&&id.length>0&&id.length<=128))].slice(0,24);
 clean.excludeTags=clean.excludeTags.filter(id=>!clean.includeTags.includes(id));
 if(value.tagLabels&&typeof value.tagLabels==='object'&&!Array.isArray(value.tagLabels)){
  const chosen=new Set([...clean.includeTags,...clean.excludeTags]);
  clean.tagLabels=Object.fromEntries(Object.entries(value.tagLabels)
   .filter(([id,name])=>chosen.has(id)&&typeof name==='string'&&name.length<=140)
   .slice(0,48));
 }
 return clean;
}
function read(key){try{return cleanReadingDiscovery(JSON.parse(sessionStorage.getItem(key)||'null'))}catch{return {...readingDefaults}}}
/** Tab-scoped, identity-separated browsing choices; no reading records are copied. */
export default function useReadingDiscoveryState(memberId){
 const key='palace-reading-discovery:v1:'+encodeURIComponent(memberId||'guest');
 const [stored,setStored]=useState(()=>({key,value:read(key)}));
 const value=stored.key===key?stored.value:read(key);
 useEffect(()=>{if(stored.key===key)try{sessionStorage.setItem(key,JSON.stringify(stored.value))}catch{}},[stored,key]);
 function setField(field,next){
  setStored(previous=>{
   const current=previous.key===key?previous.value:read(key);
   const resetsShelf=['query','rating','status','origin','vibeDoor','readerLens','catalogueSort','includeTags','excludeTags'].includes(field);
   const value=cleanReadingDiscovery({...current,...(resetsShelf?{visibleCount:24}:{}),[field]:typeof next==='function'?next(current[field]):next});
   return {key,value};
  });
 }
 return [value,setField];
}
