import { supabase } from './supabase';
function client(){if(!supabase)throw new Error('Palace account service is unavailable.');return supabase}
async function rpc(name,args){const {data,error}=await client().rpc(name,args);if(error)throw error;return data}
export const getPalaceGovernance=()=>rpc('get_palace_governance');
export const togglePalaceBallot=(ballotId,optionId)=>rpc('cast_palace_ballot_vote',{p_ballot:ballotId,p_option:optionId});
export const createPalaceBallot=(title,description,choices,hours,visibility)=>rpc('create_palace_council_ballot',{p_title:title,p_description:description,p_choices:choices,p_hours:hours,p_results_visibility:visibility});
export const publishPalaceNotice=(title,body,category)=>rpc('publish_palace_council_notice',{p_title:title,p_body:body,p_category:category});
export const recordPalaceVisit=()=>rpc('record_palace_visit');
export const getPalaceVisitProgress=()=>rpc('get_palace_login_progress');
export const getCouncilElections=()=>rpc('get_palace_council_elections');
export const startCouncilElection=(title)=>rpc('start_palace_council_election',{p_title:title});
export const nominateCouncilCandidate=(id,statement)=>rpc('nominate_palace_council_candidate',{p_election:id,p_statement:statement});
export const castCouncilElectionVote=(id,candidate)=>rpc('cast_palace_council_election_vote',{p_election:id,p_candidate:candidate});
export const getCaseChecklists=()=>rpc('get_palace_case_checklists');
export const saveCaseChecklist=(v)=>rpc('save_palace_case_checklist',{p_report:v.report_id,p_categories:v.categories,p_evidence:v.evidence_checked,p_context:v.context_checked,p_heard:v.member_heard,p_conflict:v.conflict_checked,p_proportionality:v.proportionality_checked,p_appeal:v.appeal_explained,p_finding:v.finding,p_action:v.action_label,p_note:v.reviewer_note});
export const submitCaseAppeal=(report,text)=>rpc('submit_palace_case_appeal',{p_report:report,p_text:text});
export const reviewCaseAppeal=(id,status,note)=>rpc('review_palace_case_appeal',{p_appeal:id,p_status:status,p_note:note});
