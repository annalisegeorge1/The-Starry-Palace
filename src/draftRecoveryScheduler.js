/**
 * Recovery snapshots can be expensive for long contentEditable chapters.
 * Defer full HTML serialization until a brief typing pause, with a maximum
 * interval so even continuous writing keeps a recent on-device recovery copy.
 *
 * This schedules only the copy: the existing cloud save coordinator still
 * owns network writes and revision ordering.
 */
export function createDraftRecoveryScheduler(write,delay=320,maxWait=1800){
 if(typeof write!=='function')throw new TypeError('A recovery writer is required');
 let idle=null,limit=null,pending=false;
 const clear=()=>{
  if(idle!==null){clearTimeout(idle);idle=null}
  if(limit!==null){clearTimeout(limit);limit=null}
 };
 const flush=()=>{
  if(!pending){clear();return false}
  pending=false;clear();write();return true;
 };
 const schedule=()=>{
  pending=true;
  if(idle!==null)clearTimeout(idle);
  idle=setTimeout(flush,delay);
  if(limit===null)limit=setTimeout(flush,maxWait);
 };
 const cancel=()=>{pending=false;clear()};
 return{schedule,flush,cancel,hasPending:()=>pending};
}
