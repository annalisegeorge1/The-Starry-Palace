import {describe,it,expect,vi} from 'vitest';
import {PALACE_CHAT_V3_ENABLED,PALACE_MESSAGE_REACTIONS_ENABLED,PALACE_REACTIONS,reactionSummary,getPalaceReactions,changePalaceReaction} from './palaceChatV3';
describe('Independent private reactions with linked replies still disabled',()=>{
 it('enables verified reactions without enabling linked replies',()=>{
  expect(PALACE_CHAT_V3_ENABLED).toBe(false);
  expect(PALACE_MESSAGE_REACTIONS_ENABLED).toBe(true);
  expect(PALACE_REACTIONS.map(r=>r.key)).toEqual(['heart','star','moon','crown','sparkle','laugh']);
 });
 it('counts only reactions attached to this private message and identifies own reaction',()=>{
  const rows=[
   {direct_message_id:'m1',user_id:'a',reaction:'moon'},
   {direct_message_id:'m1',user_id:'b',reaction:'heart'},
   {direct_message_id:'m1',user_id:'c',reaction:'heart'},
   {direct_message_id:'m2',user_id:'a',reaction:'crown'},
   {group_message_id:'g1',user_id:'a',reaction:'star'}
  ];
  const result=reactionSummary(rows,'m1','a');
  expect(result.mine).toBe('moon');expect(result.counts.heart).toBe(2);
  expect(result.counts.star).toBe(0);expect(result.counts.crown).toBe(0);
  expect(reactionSummary(rows,'g1','a').mine).toBe('star');
 });
 it('refuses network operations without a configured client',async()=>{
  await expect(getPalaceReactions('direct',['one'])).rejects.toThrow('not connected');
  await expect(changePalaceReaction('groups','one','member','moon',null)).rejects.toThrow('not connected');
 });
});
