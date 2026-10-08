import { supabase } from './supabase';
function client(){if(!supabase)throw new Error('Palace account service is unavailable.');return supabase}
async function rpc(name,args){const {data,error}=await client().rpc(name,args);if(error)throw error;return data}
export const getPalaceGovernance=()=>rpc('get_palace_governance');
export const togglePalaceBallot=(ballotId,optionId)=>rpc('cast_palace_ballot_vote',{p_ballot:ballotId,p_option:optionId});
export const createPalaceBallot=(title,description,choices,hours,visibility)=>rpc('create_palace_council_ballot',{p_title:title,p_description:description,p_choices:choices,p_hours:hours,p_results_visibility:visibility});
export const publishPalaceNotice=(title,body,category)=>rpc('publish_palace_council_notice',{p_title:title,p_body:body,p_category:category});