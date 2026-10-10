import {supabase} from './supabase';
export async function getPalaceTidings(){if(!supabase)return [];const{data,error}=await supabase.rpc('get_palace_tidings');if(error)throw error;return Array.isArray(data)?data:[]}
