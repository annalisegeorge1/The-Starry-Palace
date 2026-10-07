import{supabase}from'./supabase';
async function call(name,args){if(!supabase)throw Error('Palace account service is not configured.');const{data,error}=await supabase.rpc(name,args);if(error)throw error;return data}
export const getPalaceGatherings=()=>call('get_grand_palace_gatherings');
export const submitPalaceExhibit=(kind,title,body)=>call('submit_grand_palace_exhibit',{p_kind:kind,p_title:title,p_body:body});
export const openPalaceCollaboration=(title,prompt)=>call('open_grand_palace_collaboration',{p_title:title,p_prompt:prompt});
export const addPalaceCollaborationLine=(id,content)=>call('add_grand_palace_collaboration_line',{p_collaboration:id,p_content:content});
export const closePalaceCollaboration=(id)=>call('close_grand_palace_collaboration',{p_collaboration:id});
