import {PALACE_REACTIONS} from './palaceChatV3';

/**
 * Rank the six reactions already supported by the database using only the
 * reaction rows fetched for the currently open conversation (recent messages).
 * No extra query, tracking, profile storage, or cross-conversation learning.
 */
export function rankPalaceConversationReactions(rows=[]){
 const counts=Object.fromEntries(PALACE_REACTIONS.map(reaction=>[reaction.key,0]));
 for(const row of Array.isArray(rows)?rows:[]){
  if(row&&Object.hasOwn(counts,row.reaction))counts[row.reaction]+=1;
 }
 const choices=PALACE_REACTIONS.map((reaction,index)=>({reaction,index}))
  .sort((left,right)=>counts[right.reaction.key]-counts[left.reaction.key]||left.index-right.index)
  .map(({reaction})=>reaction);
 const quick=counts[choices[0].key]>0?choices[0]:null;
 return {choices,quick,counts};
}
