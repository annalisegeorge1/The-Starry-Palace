import { supabase } from './supabase';
export async function getGrandPalaceCeremonyHall(){const { data, error } = await supabase.rpc('get_grand_palace_ceremony_hall'); if(error) throw error; return data; }
