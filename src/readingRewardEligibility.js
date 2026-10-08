/**
 * The server is authoritative for whether reading rewards are granted.
 * Explain obvious eligibility requirements before a member starts reading
 * instead of silently ignoring a failed begin_palace_reading request.
 */
export function readingRewardEligibility(data,session){
 if(!data?.chapter?.id||!data?.work?.id)return {eligible:false,message:''};
 if(!session?.user?.id)return {eligible:false,message:'Sign in to earn Celestial Points for reading eligible stories.'};
 if(data.work.author_id===session.user.id)return {eligible:false,message:'This is your own story. You earn writing points for eligible publications; reading points are for discovering other writers.'};
 if(data.chapter.status!=='published'||data.work.publication_status!=='published'||data.work.visibility!=='public')
  return {eligible:false,message:'Only published public chapters can earn reading points.'};
 if(Number(data.chapter.word_count)<200)
  return {eligible:false,message:'This chapter is shorter than 200 words, so it does not qualify for reading points.'};
 return {eligible:true,message:'Checking your reading reward session…'};
}
export function readingSessionStartFeedback(value,error){
 if(error)return {status:'failed',message:'Could not start reading-point tracking. Your reading is unaffected, but this visit cannot earn reading points. Try refreshing the chapter.'};
 if(typeof value!=='string'||!/^[-\da-f]{36}$/i.test(value))
  return {status:'failed',message:'Reading-point tracking did not start. Try refreshing the chapter before reading for points.'};
 return {status:'active',message:'Reading-point tracking is active. Read for at least 90 seconds, then finish this chapter to collect an eligible +2 reward.'};
}
export function readingRewardResultFeedback(result){
 if(!result?.completed)return result?.reason==='too-soon'
  ? 'No reading points yet. You need at least 90 seconds of eligible reading before finishing this chapter.'
  : 'Reading-point completion could not be confirmed. Your reading progress may still be saved.';
 if(result.awarded>0)return '✦ +'+result.awarded+' Celestial Points earned for reading!';
 return 'This chapter earned no new points; it may have been rewarded previously or your daily reading limit has been reached.';
}
