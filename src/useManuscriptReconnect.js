import {useEffect,useRef} from 'react';
/** Retry only an edited chapter, through the existing serialized save path. */
export default function useManuscriptReconnect(options){
 const current=useRef(options);
 current.current=options;
 useEffect(()=>{
  const onOnline=()=>{
   const {chapterId,coordinator,retry}=current.current;
   if(chapterId&&coordinator?.isDirty(chapterId)&&!coordinator.isSaving(chapterId))retry();
  };
  window.addEventListener('online',onOnline);
  return()=>window.removeEventListener('online',onOnline);
 },[]);
}
