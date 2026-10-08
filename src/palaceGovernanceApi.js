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

export const getCouncilOutcomes=()=>rpc('get_palace_council_outcomes');
export const certifyCouncilElection=id=>rpc('finalize_palace_council_election',{p_election:id});
export const castRunoffVote=(id,candidate)=>rpc('cast_palace_council_runoff_vote',{p_runoff:id,p_candidate:candidate});
export const certifyRunoff=id=>rpc('finalize_palace_council_runoff',{p_runoff:id});
export const openTieBreak=id=>rpc('open_palace_council_tiebreak',{p_runoff:id});
export const submitCouncilMotion=(category,title,description)=>rpc('submit_palace_council_motion',{p_category:category,p_title:title,p_description:description});
export const reviewCouncilMotion=(id,status,note)=>rpc('review_palace_council_motion',{p_motion:id,p_status:status,p_note:note});
export const getMyCouncilAppeals=()=>rpc('get_my_palace_appeals');

export const getCouncilService=()=>rpc('get_palace_council_service_registry');
export const updateCouncilService=(priorities,availability)=>rpc('update_my_council_service_profile',{p_priorities:priorities,p_availability:availability});
export const logCouncilService=(kind,title,summary)=>rpc('log_my_council_service',{p_kind:kind,p_title:title,p_summary:summary});
export const getMyRestoration=()=>rpc('get_my_palace_restoration');
export const respondRestoration=(id,response,accept)=>rpc('respond_palace_restoration',{p_report:id,p_response:response,p_accept:accept});
export const getCouncilRestorationQueue=()=>rpc('get_council_restoration_queue');
export const openRestorationCase=(report,subject,severity,notice,recommendation,restoration)=>rpc('open_palace_restoration_case',{p_report:report,p_subject:subject,p_severity:severity,p_notice:notice,p_recommendation:recommendation,p_restoration:restoration});
export const reviewRestoration=(id,note)=>rpc('second_review_palace_restoration',{p_report:id,p_note:note});

export const checkCouncilDeadlines=()=>rpc('check_my_palace_council_deadlines');
export const getCouncilAppealQueue=()=>rpc('get_council_appeal_queue');

export const getCouncilAppealPage=(page=0,size=30)=>rpc('get_council_appeal_page',{p_page:page,p_page_size:size});
export const extendCouncilAppeal=(id,days,reason)=>rpc('extend_palace_appeal_deadline',{p_appeal:id,p_days:days,p_reason:reason});
export const escalateCouncilAppeal=(id,reason)=>rpc('escalate_overdue_palace_appeal',{p_appeal:id,p_reason:reason});
export const extendCouncilResponse=(id,days,reason)=>rpc('extend_palace_member_response',{p_report:id,p_days:days,p_reason:reason});
