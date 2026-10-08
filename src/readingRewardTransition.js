/**
 * Keep chapter-completion rewards independent from the page's React lifetime.
 * The caller captures its reward-session ID before any asynchronous progress save.
 * Server-side reading time, eligibility, daily cap and one-chapter dedupe
 * remain authoritative in complete_palace_reading.
 */
export function isShortReadingSession(error){
 return /read for at least 90 seconds/i.test(String(error?.message||''));
}
export async function settleReadingChapterTransition({
 sessionId,recordProgress,completeReading,onAward,onTooSoon,onError
}){
 try{await recordProgress()}catch(error){onError?.(error)}
 if(!sessionId)return {completed:false,awarded:0,reason:'no-eligible-session'};
 try{
  const result=await completeReading(sessionId);
  const awarded=Math.max(0,Number(result?.awarded)||0);
  if(awarded>0)onAward?.(awarded);
  return {completed:true,awarded,alreadyCompleted:result?.already_completed===true};
 }catch(error){
  if(isShortReadingSession(error)){
   onTooSoon?.();
   return {completed:false,awarded:0,reason:'too-soon'};
  }
  onError?.(error);
  return {completed:false,awarded:0,reason:'error'};
 }
}
