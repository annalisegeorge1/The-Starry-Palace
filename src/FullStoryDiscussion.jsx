import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useAuth} from './auth';
import {getWorkCommunity} from './palaceData';
import {WorkCommunity} from './liveRooms';

function Discussion({work,session}) {
 const [community,setCommunity]=useState(null);
 const [error,setError]=useState('');
 const request=useRef(0);
 const reload=useCallback(async()=>{
  const current=++request.current;
  setError('');
  try {
   const result=await getWorkCommunity(work.id);
   if(current===request.current)setCommunity(result);
  } catch {
   if(current===request.current)setError('Reader responses could not be loaded.');
  }
 },[work.id]);
 useEffect(()=>{
  void reload();
  return ()=>{request.current++};
 },[reload]);
 return <section className="reader-comments-after-chapter" aria-labelledby="full-discussion-heading">
  <h2 id="full-discussion-heading" tabIndex={-1}>Full story discussion</h2>
  {error&&<div role="alert">{error} <button type="button" onClick={reload}>Try again</button></div>}
  {!community&&!error&&<p role="status">Gathering reader responses…</p>}
  {community&&<WorkCommunity work={work} session={session} community={community} showTags={false}
   reload={reload} setError={setError}/>}
  <a className="discussion-return" href="#full-reader-heading">Return to reading</a>
 </section>;
}

export default function FullStoryDiscussion({work}) {
 const {session}=useAuth();
 return <Discussion key={JSON.stringify([work.id,session?.user?.id])} work={work} session={session}/>;
}
