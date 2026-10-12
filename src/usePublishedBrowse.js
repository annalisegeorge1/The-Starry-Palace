import {useEffect,useState} from 'react';
import {searchPublishedArchive} from './palaceData';

/** Isolated server browse state; old pages never masquerade as current results. */
export default function usePublishedBrowse({
 enabled=false,identity='guest',text='',include=[],exclude=[],
 rating='all',status='all',origin='all',sort='updated'
}={}){
 const key=JSON.stringify([identity,text,include,exclude,rating,status,origin,sort]);
 const [pageChoice,setPageChoice]=useState({key:'',page:0});
 const page=pageChoice.key===key?pageChoice.page:0;
 const [response,setResponse]=useState(null);
 const [pending,setPending]=useState(false);
 const [failure,setFailure]=useState(null);
 const [refresh,setRefresh]=useState(0);
 const snapshot=enabled&&response?.key===key&&response?.page===page?response:null;
 const error=enabled&&failure?.key===key&&failure?.page===page?failure.message:null;
 useEffect(()=>{
  if(!enabled)return;
  let active=true;
  setPending(true);
  setFailure(null);
  const delay=String(text).trim()?230:20;
  const timer=setTimeout(async()=>{
   try{
    const data=await searchPublishedArchive({
     text,include,exclude,rating,status,origin,sort,limit:20,offset:page*20
    });
    if(active){setResponse({key,page,results:data.results,total:data.total});setFailure(null)}
   }catch(e){
    if(active){setResponse(null);setFailure({key,page,message:e?.message||'Archive search is temporarily unavailable.'})}
   }finally{if(active)setPending(false)}
  },delay);
  return()=>{active=false;clearTimeout(timer)};
 // key contains the exact search inputs. Recreated arrays never retrigger fetches.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[enabled,key,page,refresh]);
 return {
  page,snapshot,
  loading:enabled&&!snapshot&&!error,
  pending:enabled&&pending,
  error,
  goPage(next){setPageChoice({key,page:Math.max(0,Math.floor(Number(next)||0))})},
  retry(){setRefresh(n=>n+1)}
 };
}
