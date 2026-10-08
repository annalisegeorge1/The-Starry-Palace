/**
 * A newer chapter-selection intent supersedes an older selection even when
 * both were waiting on a serialized cloud save. No background response should
 * decide which chapter the writer is looking at.
 */
export function createChapterSwitchGate(){
 let latest=0;
 return {
  begin(){return ++latest},
  isCurrent(ticket){return ticket===latest},
  cancel(){++latest}
 };
}

/**
 * Recalculate manuscript statistics after short typing pauses instead of
 * rebuilding the entire section outline on every keystroke.
 */
export function createEditorMetricsScheduler(recalculate,delay=260){
 if(typeof recalculate!=='function')throw new TypeError('Metrics callback required');
 let timer=null;
 function flush(){
  if(timer!==null){clearTimeout(timer);timer=null}
  recalculate();
 }
 function schedule(){
  if(timer!==null)clearTimeout(timer);
  timer=setTimeout(()=>{timer=null;recalculate()},delay);
 }
 function cancel(){
  if(timer!==null)clearTimeout(timer);
  timer=null;
 }
 return{schedule,flush,cancel};
}
