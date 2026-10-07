import{supabase}from'./supabase';
export async function getMemberCreativeShowcase(id){if(!supabase||!id)return null;const{data,error}=await supabase.rpc('get_member_creative_showcase',{p_member:id});if(error)throw error;return data}
export async function setMemberReadingShowcase(show){const{data,error}=await supabase.rpc('set_member_reading_showcase',{p_show:show});if(error)throw error;return data}
