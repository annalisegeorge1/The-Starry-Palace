import{supabase}from'./supabase';
async function rpc(name,args){if(!supabase)throw Error('Palace connection unavailable.');const{data,error}=await supabase.rpc(name,args);if(error)throw error;return data}
export const getManuscriptFolders=workId=>rpc('get_manuscript_folders',{p_work:workId});
export const editManuscriptFolder=(workId,action,folder=null,name=null,tint='violet')=>rpc('edit_manuscript_folder',{p_work:workId,p_action:action,p_folder:folder,p_name:name,p_tint:tint});
export const fileManuscriptChapter=(chapterId,folderId=null)=>rpc('file_manuscript_chapter',{p_chapter:chapterId,p_folder:folderId});
