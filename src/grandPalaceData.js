import {supabase} from './supabase';
function client(){if(!supabase)throw new Error('The Palace account service is not configured.');return supabase}
async function call(name,args){const {data,error}=await client().rpc(name,args);if(error)throw error;return data}
export const getGrandPalaceHall=()=>call('get_grand_palace_hall');
export const getGrandPalaceIdentity=(id)=>call('get_grand_palace_identity',{p_member:id});
export const purchaseGrandPalaceHonour=(honour,quantity=1)=>call('purchase_grand_palace_honour',{p_honour:honour,p_quantity:quantity});
export const sendGrandPalaceHonour=(recipient,honour,note='')=>call('send_grand_palace_honour',{p_recipient:recipient,p_honour:honour,p_note:note});
export const selectGrandPalaceTheme=(slug)=>call('set_grand_palace_theme',{p_theme:slug||null});
