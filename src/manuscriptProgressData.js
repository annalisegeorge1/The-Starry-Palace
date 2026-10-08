import{supabase}from'./supabase';
async function rpc(name,args){if(!supabase)throw Error('Palace connection unavailable');const{data,error}=await supabase.rpc(name,args);if(error)throw error;return data}
export const getManuscriptProgress=work=>rpc('get_manuscript_progress',{p_work:work});
export const saveManuscriptStoryGoal=(work,goal)=>rpc('save_manuscript_story_goal',{p_work:work,p_words:Number(goal.target_words)||0,p_chapters:Number(goal.target_chapters)||0,p_date:goal.target_date||null,p_intention:goal.intention||''});
export const saveManuscriptChapterPlan=(chapter,plan)=>rpc('save_manuscript_chapter_plan',{p_chapter:chapter,p_stage:plan.stage,p_words:Number(plan.target_words)||0,p_date:plan.target_date||null,p_revision_goal:plan.revision_goal||''});
