import{supabase}from'./supabase';
export async function beginPalaceReading(chapterId){const{data,error}=await supabase.rpc('begin_palace_reading',{p_chapter:chapterId});if(error)throw error;return data;}
export async function completePalaceReading(sessionId){const{data,error}=await supabase.rpc('complete_palace_reading',{p_session:sessionId});if(error)throw error;return data;}
