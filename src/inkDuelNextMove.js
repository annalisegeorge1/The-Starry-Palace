/*
 * A reader-first, non-monetary route back into live Ink Duels.
 * This is only a recommendation: actual entry and judging permissions
 * continue to come from the existing server and duel buttons.
 */
export function canReviewBlindDuel(duel={}){
 return duel.phase==='voting' && !duel.my_vote
  && (!duel.my_entry || Number(duel.entry_count||0)>1)
  && !(duel.match_type==='one_v_one' && duel.my_participation==='accepted');
}

export function chooseInkDuelNextMove(duels=[]){
 if(!Array.isArray(duels)||duels.length===0)return null;
 const find=predicate=>duels.find(duel=>duel?.id&&predicate(duel));
 const pending=find(duel=>duel.phase==='waiting'&&duel.my_participation==='pending');
 if(pending)return {kind:'invitation',duelId:pending.id,
  title:'A challenge is waiting for you.',
  detail:'Review the invitation before its writing clock begins.',
  action:'Review challenge'};
 const readyCourt=find(duel=>duel.phase==='waiting'&&duel.is_host
  &&duel.match_type==='group'&&Number(duel.participant_count||0)>=3);
 if(readyCourt)return {kind:'court',duelId:readyCourt.id,
  title:'Your court is ready.',
  detail:'At least three creators have gathered. You can ring the bell when ready.',
  action:'Open my court'};
 const unfinished=find(duel=>duel.phase==='writing'&&!duel.my_entry
  &&(duel.is_host||duel.my_participation==='accepted'));
 if(unfinished)return {kind:'write',duelId:unfinished.id,
  title:'Your ink is needed.',
  detail:'Return to your active writing window and seal an entry before the bell.',
  action:'Continue my entry'};
 const canJudge=find(canReviewBlindDuel);
 if(canJudge)return {kind:'vote',duelId:canJudge.id,
  title:'A blind gallery awaits your vote.',
  detail:'Read the entries and choose your favourite without seeing the writers.',
  action:'Judge a duel'};
 const open=find(duel=>duel.phase==='writing'&&duel.match_type==='open'&&!duel.my_entry);
 if(open)return {kind:'join',duelId:open.id,
  title:'A new arena is open.',
  detail:'Choose whether its prompt inspires an entry before the writing window closes.',
  action:'Explore this duel'};
 const revealed=find(duel=>duel.phase==='results'&&(duel.is_host||duel.my_entry||duel.my_participation==='accepted'));
 if(revealed)return {kind:'reveal',duelId:revealed.id,
  title:'Your duel has been revealed.',
  detail:'See the entries, judging results and any qualifying victory treasure.',
  action:'See the reveal'};
 return null;
}
