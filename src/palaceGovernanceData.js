import { supabase } from './supabase';

function palaceClient(){
  if(!supabase) throw new Error('The Palace account service is not configured.');
  return supabase;
}
async function callPalace(name, args = {}){
  const {data,error} = await palaceClient().rpc(name,args);
  if(error) throw error;
  return data;
}

/** Results and vote identities are filtered by the server, not the browser. */
export const getPalaceGovernance = () => callPalace('get_palace_governance');
export const castPalaceVote = (ballotId, optionId) =>
  callPalace('cast_palace_ballot_vote',{p_ballot:ballotId,p_option:optionId});
export const createCouncilBallot = ({title,description,choices,hours,visibility}) =>
  callPalace('create_palace_council_ballot',{
    p_title:title,p_description:description,p_choices:choices,
    p_hours:hours,p_results_visibility:visibility
  });
export const publishCouncilNotice = ({title,body,category}) =>
  callPalace('publish_palace_council_notice',{
    p_title:title,p_body:body,p_category:category
  });

export function canVoteOnBallot(ballot, clock = Date.now()){
  return !!ballot && ballot.status === 'open' &&
    new Date(ballot.opens_at).getTime() <= clock &&
    clock < new Date(ballot.closes_at).getTime();
}
export function ballotResultsLabel(ballot){
  if(ballot?.results_revealed) return 'Results available';
  if(ballot?.results_visibility === 'after_vote') return 'Results unlock after your vote';
  if(ballot?.results_visibility === 'after_close') return 'Results unlock when voting closes';
  return 'Results are not yet available';
}
export function ballotResultPercent(votes,total){
  return total > 0 ? Math.round(100 * Number(votes || 0) / total) : 0;
}
