import {supabase} from './supabase';
function client(){if(!supabase)throw new Error('The Palace account service is not configured.');return supabase}
async function call(name,args){const {data,error}=await client().rpc(name,args);if(error)throw error;return data}
export const getGrandPalaceHall=()=>call('get_grand_palace_hall');
export const getGrandPalaceIdentity=(id)=>call('get_grand_palace_identity',{p_member:id});
export const purchaseGrandPalaceHonour=(honour,quantity=1)=>call('purchase_grand_palace_honour',{p_honour:honour,p_quantity:quantity});
export const sendGrandPalaceHonour=(recipient,honour,note='')=>call('send_grand_palace_honour',{p_recipient:recipient,p_honour:honour,p_note:note});
export const selectGrandPalaceTheme=(slug)=>call('set_grand_palace_theme',{p_theme:slug||null});

export const getCelestialVaultStatus=()=>call('get_celestial_vault_status');
export const enterCelestialVault=(requestKey)=>call('enter_celestial_vault',{p_request_key:requestKey});
export const claimCelestialBadgeGrandmaster=()=>call('claim_celestial_badge_grandmaster');
export const getGrandPalaceCommonRoom=()=>call('get_grand_palace_common_room');
export const postGrandPalaceCommonMessage=(body,kind='message')=>call('post_grand_palace_common_message',{p_body:body,p_kind:kind});
export const removeGrandPalaceCommonMessage=(id)=>call('remove_grand_palace_common_message',{p_post_id:id});

export const getGrandPalaceCourtStatus=()=>call('get_grand_palace_court_status');
export const submitGrandPalaceDailyRitual=(body)=>call('submit_grand_palace_daily_ritual',{p_body:body});
