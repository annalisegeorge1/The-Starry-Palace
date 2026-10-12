import {useState,useEffect} from 'react';
export const readingDefaults={query:'',rating:'all',status:'all',origin:'all',shelf:'first',vibeDoor:'all',readerLens:'all',catalogueSort:'updated'};
const options={rating:['all','general','teen','mature','explicit','not_rated'],status:['all','in_progress','complete','hiatus','abandoned'],origin:['all','original','fandom'],shelf:['first','quiet','updated','following','continue','nightstand'],vibeDoor:['all','yearn','unsettle','soft','chaos','epic','strange'],readerLens:['all','unread','reading','new','saved','following','finished'],catalogueSort:['updated','oldest','title']};
export function cleanReadingDiscovery(value){
 const clean={...readingDefaults};
 if(!value||typeof value!=='object')return clean;
 if(typeof value.query==='string')clean.query=value.query.slice(0,500);
 for(const [key,values] of Object.entries(options))if(values.includes(value[key]))clean[key]=value[key];
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
   const value=cleanReadingDiscovery({...current,[field]:typeof next==='function'?next(current[field]):next});
   return {key,value};
  });
 }
 return [value,setField];
}
