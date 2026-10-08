/* Reader position recovery is private to a member and a chapter.
 * Cloud progress wins unless this tab has a more recently recorded position. */
const PREFIX='palace-reader-position-v2';
const MAX_AGE_MS=14*24*60*60*1000;
export function readerPositionKey(userId,chapterId){
 if(!userId||!chapterId)return null;
 return PREFIX+':'+encodeURIComponent(String(userId))+':'+encodeURIComponent(String(chapterId));
}
export function clampReaderPercent(value){
 const n=Number(value);
 return Number.isFinite(n)?Math.max(0,Math.min(100,n)):0;
}
export function rememberReaderPosition(storage,userId,chapterId,percent,now=Date.now()){
 const key=readerPositionKey(userId,chapterId);
 if(!key||!storage||!Number.isFinite(Number(now)))return false;
 try{
  storage.setItem(key,JSON.stringify({percent:clampReaderPercent(percent),updatedAt:now}));
  return true;
 }catch{return false}
}
export function readReaderPosition(storage,userId,chapterId,now=Date.now()){
 const key=readerPositionKey(userId,chapterId);
 if(!key||!storage)return null;
 try{
  const raw=storage.getItem(key);
  if(!raw)return null;
  const parsed=JSON.parse(raw);
  if(!Number.isFinite(Number(parsed?.updatedAt))||Number(parsed.updatedAt)>now||now-Number(parsed.updatedAt)>MAX_AGE_MS||!Number.isFinite(Number(parsed?.percent))){
   storage.removeItem(key);return null;
  }
  return {percent:clampReaderPercent(parsed.percent),updatedAt:Number(parsed.updatedAt)};
 }catch{return null}
}
export function chooseReaderResumePosition(cloudProgress,localPosition,chapterId){
 const hasCloud=cloudProgress?.chapter_id===chapterId;
 const cloudValue=hasCloud?clampReaderPercent(cloudProgress.chapter_progress_percent):0;
 if(!localPosition)return cloudValue;
 const localValue=clampReaderPercent(localPosition.percent);
 if(!hasCloud)return localValue;
 const cloudTime=Date.parse(cloudProgress.updated_at||'');
 // Keep cloud authoritative when its timestamp is missing or local is stale.
 if(!Number.isFinite(cloudTime)||localPosition.updatedAt<=cloudTime+1000)return cloudValue;
 return localValue;
}
