import{supabase}from'./supabase';
async function call(name,args){if(!supabase)throw Error('Palace connection is unavailable.');const{data,error}=await supabase.rpc(name,args);if(error)throw error;return data}
export const getGrandPalaceCelebrations=()=>call('get_grand_palace_celebrations');
export const acknowledgeGrandPalaceCelebration=(id)=>call('acknowledge_grand_palace_celebration',{p_event_id:id});
