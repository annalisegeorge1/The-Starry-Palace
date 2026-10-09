import {describe,it,expect} from 'vitest';
import {chooseInkDuelNextMove,canReviewBlindDuel} from './inkDuelNextMove';

describe('Ink Duel next move',()=>{
 it('is quiet when the arena is empty and never invents a competition',()=>{
  expect(chooseInkDuelNextMove([])).toBeNull();
  expect(chooseInkDuelNextMove(null)).toBeNull();
 });
 it('puts a personal invitation ahead of other opportunities',()=>{
  const result=chooseInkDuelNextMove([
   {id:'vote',phase:'voting',entry_count:3},
   {id:'invite',phase:'waiting',my_participation:'pending'},
   {id:'writing',phase:'writing',is_host:true}
  ]);
  expect(result.kind).toBe('invitation');
  expect(result.duelId).toBe('invite');
 });
 it('shows a ready court only after enough participants have accepted',()=>{
  const nearly={id:'court',phase:'waiting',match_type:'group',is_host:true,participant_count:2};
  expect(chooseInkDuelNextMove([nearly])).toBeNull();
  expect(chooseInkDuelNextMove([{...nearly,participant_count:3}]).kind).toBe('court');
 });
 it('prioritises the current writing window before optional voting',()=>{
  expect(chooseInkDuelNextMove([
   {id:'v',phase:'voting',entry_count:3},
   {id:'w',phase:'writing',my_participation:'accepted'}
  ])).toMatchObject({duelId:'w',kind:'write'});
  expect(chooseInkDuelNextMove([
   {id:'v',phase:'voting',entry_count:3},
   {id:'w',phase:'writing',my_participation:'accepted',my_entry:{id:'done'}}
  ])).toMatchObject({duelId:'v',kind:'vote'});
 });
 it('never tells 1 vs 1 duelists to judge their own contest',()=>{
  const contest={id:'x',phase:'voting',match_type:'one_v_one',my_participation:'accepted',entry_count:2};
  expect(canReviewBlindDuel(contest)).toBe(false);
  expect(chooseInkDuelNextMove([contest])).toBeNull();
 });
 it('does not suggest judging a gallery with only the writer’s own entry',()=>{
  expect(canReviewBlindDuel({phase:'voting',my_entry:{id:'self'},entry_count:1})).toBe(false);
  expect(canReviewBlindDuel({phase:'voting',my_entry:{id:'self'},entry_count:3,match_type:'group'})).toBe(true);
  expect(canReviewBlindDuel({phase:'voting',my_vote:'existing',entry_count:3})).toBe(false);
 });
 it('offers open writing arenas then personal reveals without new reward promises',()=>{
  expect(chooseInkDuelNextMove([{id:'open',phase:'writing',match_type:'open'}]).kind).toBe('join');
  const result=chooseInkDuelNextMove([{id:'done',phase:'results',my_entry:{id:'e'}}]);
  expect(result).toMatchObject({kind:'reveal',duelId:'done'});
  expect(result.detail).toContain('qualifying');
 });
});
