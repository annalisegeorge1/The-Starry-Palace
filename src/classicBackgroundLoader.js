import {prepareClassicReading,CLASSIC_BACKGROUND_PARSE_THRESHOLD} from './classicReadingPreparation';

/**
 * Parse big editions in a module worker when supported by the browser.
 * A timer-based synchronous fallback covers restrictive browsers/worker CSP.
 * The returned cancellation function prevents stale results reaching an
 * edition that the reader has already closed or replaced.
 */
export function loadClassicReading(source,onReady,onError=()=>{},workerFactory=null){
 let stopped=false,worker=null,timer=null;
 const content=String(source||'');
 const finish=value=>{if(!stopped)onReady(value)};
 const failed=error=>{if(!stopped)onError(error)};
 const stopWorker=()=>{if(worker){worker.onmessage=null;worker.onerror=null;worker.terminate();worker=null}};
 const fallback=()=>{
  stopWorker();
  timer=setTimeout(()=>{
   if(stopped)return;
   try{finish(prepareClassicReading(content))}
   catch(e){failed(e)}
  },0);
 };
 if(content.length>=CLASSIC_BACKGROUND_PARSE_THRESHOLD){
  try{
   worker=workerFactory?workerFactory():new Worker(new URL('./classicParsingWorker.js',import.meta.url),{type:'module'});
   worker.onmessage=event=>{
    if(event?.data?.ok){const result=event.data.result;stopWorker();finish(result)}
    else fallback();
   };
   worker.onerror=()=>fallback();
   worker.postMessage(content);
  }catch{fallback()}
 }else fallback();
 return ()=>{stopped=true;if(timer!==null)clearTimeout(timer);stopWorker()};
}
