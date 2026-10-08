import{supabase}from'./supabase';
async function call(name,args){if(!supabase)throw Error('Palace connection unavailable.');const {data,error}=await supabase.rpc(name,args);if(error)throw error;return data}
export const getMemberChamberDecor=id=>call('get_member_chamber_decor',{p_member:id});
export const saveMemberChamberDecor=(backdrop,ornament,layout)=>call('set_member_chamber_decor',{p_backdrop:backdrop,p_ornament:ornament,p_gallery_layout:layout});
export const arrangeMemberChamberArt=(collection,id,action)=>call('rearrange_member_chamber_art',{p_collection:collection,p_item:id,p_action:action});
