import {describe,it,expect} from 'vitest';
import {rankPalaceConversationReactions} from './palaceChatReactionRanking';
describe('recent conversation reaction ranking',()=>{
 it('counts only the six supported, already-loaded reactions and prioritizes frequency',()=>{
  const result=rankPalaceConversationReactions([
   {reaction:'star'},{reaction:'moon'},{reaction:'star'},{reaction:'laugh'},
   {reaction:'moon'},{reaction:'star'},{reaction:'💥'},{reaction:''},null
  ]);
  expect(result.counts.star).toBe(3);
  expect(result.counts.moon).toBe(2);
  expect(result.choices.slice(0,3).map(r=>r.key)).toEqual(['star','moon','laugh']);
  expect(result.quick.key).toBe('star');
 });
 it('preserves established order for ties and empty chats',()=>{
  expect(rankPalaceConversationReactions([]).choices.map(r=>r.key)).toEqual(['heart','star','moon','crown','sparkle','laugh']);
  expect(rankPalaceConversationReactions([]).quick).toBeNull();
  expect(rankPalaceConversationReactions([{reaction:'moon'},{reaction:'star'}]).choices.slice(0,2).map(r=>r.key)).toEqual(['star','moon']);
 });
 it('does not persist user or room preferences and tolerates unloaded rows',()=>{
  expect(rankPalaceConversationReactions(null).quick).toBeNull();
  const roomA=rankPalaceConversationReactions([{reaction:'heart'},{reaction:'heart'}]);
  const roomB=rankPalaceConversationReactions([{reaction:'crown'}]);
  expect(roomA.quick.key).toBe('heart');
  expect(roomB.quick.key).toBe('crown');
  expect(rankPalaceConversationReactions([]).quick).toBeNull();
 });
});
