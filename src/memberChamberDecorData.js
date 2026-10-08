import{supabase}from'./supabase';
async function call(name,args){if(!supabase)throw Error('Palace connection unavailable.');const {data,error}=await supabase.rpc(name,args);if(error)throw error;return data}
export const getMemberChamberDecor=id=>call('get_member_chamber_decor',{p_member:id});
export const saveMemberChamberDecor=(backdrop,ornament,layout)=>call('set_member_chamber_decor',{p_backdrop:backdrop,p_ornament:ornament,p_gallery_layout:layout});
export const arrangeMemberChamberArt=(collection,id,action)=>call('rearrange_member_chamber_art',{p_collection:collection,p_item:id,p_action:action});

export const getPrismState=async id=>{const data=await call('get_chamber_prism_state',{p_member:id});return data?{...data,user_id:id}:null};
export const purchasePrismPalette=slug=>call('purchase_chamber_prism_palette',{p_slug:slug});
export const selectPrismPalette=(slug,finish='soft',accent='harmony')=>call('select_chamber_prism_palette',{p_slug:slug,p_finish:finish,p_accent:accent});
export const savePrismLook=(slot,name,slug,finish,accent)=>call('save_chamber_prism_look',{p_slot:slot,p_name:name,p_slug:slug,p_finish:finish,p_accent:accent});
