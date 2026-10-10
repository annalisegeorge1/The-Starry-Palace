import {supabase} from './supabase';
export async function getMyGrandPalaceVictory(){
 if(!supabase)return null;
 const {data,error}=await supabase.rpc('get_my_grand_palace_victory');
 if(error)throw error;
 return data||null;
}
