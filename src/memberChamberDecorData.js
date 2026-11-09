import{supabase}from'./supabase';
async function call(name,args){if(!supabase)throw Error('Palace connection unavailable.');const {data,error}=await supabase.rpc(name,args);if(error)throw error;return data}
export const getMemberChamberDecor=id=>call('get_member_chamber_decor',{p_member:id});
export const saveMemberChamberDecor=(backdrop,ornament,layout)=>call('set_member_chamber_decor',{p_backdrop:backdrop,p_ornament:ornament,p_gallery_layout:layout});
export const arrangeMemberChamberArt=(collection,id,action)=>call('rearrange_member_chamber_art',{p_collection:collection,p_item:id,p_action:action});

export const getPrismState=async id=>{const [data,painted,skin]=await Promise.all([call('get_chamber_prism_state',{p_member:id}),call('get_painted_chamber_state',{p_member:id}),getMemberPageSkin(id).catch(()=>null)]);return data?{...data,...painted,personal_skin:skin,user_id:id}:null};
export async function getMemberAppearance(id){
 const [prism,skin]=await Promise.all([
  call('get_chamber_prism_state',{p_member:id}),
  getMemberPageSkin(id).catch(()=>null)
 ]);
 return {...prism,personal_skin:skin};
}
export const purchasePrismPalette=slug=>call('purchase_chamber_prism_palette',{p_slug:slug});
export const selectPrismPalette=(slug,finish='soft',accent='harmony')=>call('select_chamber_prism_palette',{p_slug:slug,p_finish:finish,p_accent:accent});
export const savePrismLook=(slot,name,slug,finish,accent)=>call('save_chamber_prism_look',{p_slot:slot,p_name:name,p_slug:slug,p_finish:finish,p_accent:accent});

export const savePaintedChamberFrame=slug=>call('set_painted_chamber_frame',{p_slug:slug});

export const getPaintedMemberFrame=id=>call('get_painted_chamber_state',{p_member:id});

/** Public only on visible member chambers; all writes are owner-only via RLS. */
export async function getMemberPageSkin(memberId){
 if(!supabase||!memberId)return null;
 const {data,error}=await supabase.from('member_page_skins')
  .select('name,colors').eq('user_id',memberId).maybeSingle();
 if(error)throw error;
 return data?{name:data.name,colors:data.colors}:null;
}
export async function saveMemberPageSkin(memberId,skin){
 if(!supabase||!memberId)throw Error('Sign in to import a chamber skin.');
 const {data,error}=await supabase.from('member_page_skins')
  .upsert({user_id:memberId,name:skin.name,colors:skin.colors,updated_at:new Date().toISOString()},{onConflict:'user_id'})
  .select('name,colors').single();
 if(error)throw error;
 return data;
}
export async function removeMemberPageSkin(memberId){
 if(!supabase||!memberId)throw Error('Sign in to edit your chamber skin.');
 const {error}=await supabase.from('member_page_skins').delete().eq('user_id',memberId);
 if(error)throw error;
 return true;
}
