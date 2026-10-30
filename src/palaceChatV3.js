import {supabase} from './supabase';

/* OFF until staging migration + RLS tests pass and the flag is deliberately set
 * in a separate preview environment. Never silently probe production tables. */
export const PALACE_CHAT_V3_ENABLED=import.meta.env.VITE_PALACE_MESSENGER_V3==='enabled';
export const PALACE_REACTIONS=Object.freeze([
 {key:'heart',emoji:'❤️',label:'Heart'},
 {key:'star',emoji:'⭐',label:'Star'},
 {key:'moon',emoji:'🌙',label:'Moon'},
 {key:'crown',emoji:'👑',label:'Crown'},
 {key:'sparkle',emoji:'✨',label:'Sparkle'},
 {key:'laugh',emoji:'😄',label:'Laugh'}
]);
const kinds={direct:'direct_message_id',groups:'group_message_id'};
function requireV3(){
 if(!PALACE_CHAT_V3_ENABLED)throw new Error('New reactions are not enabled for this environment.');
 if(!supabase)throw new Error('Palace Chat is not connected.');
}
export function reactionSummary(rows=[],messageId='',userId=''){
 const counts=Object.fromEntries(PALACE_REACTIONS.map(x=>[x.key,0]));
 let mine=null;
 for(const row of rows||[]){
  if(!row||!(row.direct_message_id===messageId||row.group_message_id===messageId))continue;
  if(Object.hasOwn(counts,row.reaction))counts[row.reaction]++;
  if(row.user_id===userId)mine=row.reaction;
 }
 return {counts,mine};
}
export async function getPalaceReactions(kind,ids=[]){
 requireV3();
 const column=kinds[kind];if(!column)throw new Error('Unrecognized chat type.');
 const selected=[...new Set(ids)].filter(Boolean).slice(0,120);
 if(!selected.length)return [];
 const {data,error}=await supabase.from('palace_message_reactions')
  .select('id,user_id,reaction,direct_message_id,group_message_id').in(column,selected);
 if(error)throw error;return data||[];
}
/* One reaction per member per message; the table's unique constraint and RLS
 * enforce this regardless of any client-side or network race. */
export async function changePalaceReaction(kind,messageId,userId,key,current){
 requireV3();
 const column=kinds[kind];if(!column||!messageId||!userId)throw new Error('Choose a valid private message.');
 if(!PALACE_REACTIONS.some(x=>x.key===key))throw new Error('That reaction is not supported.');
 if(current){
  const {error}=await supabase.from('palace_message_reactions').delete()
   .eq(column,messageId).eq('user_id',userId);
  if(error)throw error;
 }
 if(current===key)return;
 const {error}=await supabase.from('palace_message_reactions')
  .insert({[column]:messageId,user_id:userId,reaction:key});
 if(error)throw error;
}
