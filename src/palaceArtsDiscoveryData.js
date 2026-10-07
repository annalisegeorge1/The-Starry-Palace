import {supabase} from './supabase';
async function rpc(name,args){const {data,error}=await supabase.rpc(name,args);if(error)throw error;return data}
export const getPalaceArtsDiscovery=()=>rpc('get_palace_arts_discovery');
export const setPalaceQuestInvitesEnabled=enabled=>rpc('set_palace_quest_invites_enabled',{p_enabled:enabled});
export const sendPalaceQuestInvite=(quest,recipient)=>rpc('send_palace_quest_invite',{p_collaboration:quest,p_recipient:recipient});
export const respondPalaceQuestInvite=(invite,accept)=>rpc('respond_palace_quest_invite',{p_invitation:invite,p_accept:accept});
