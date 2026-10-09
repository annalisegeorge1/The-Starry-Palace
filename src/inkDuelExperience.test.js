import{describe,it,expect}from'vitest';
import{filterInkDuels,duelPrizeProgress,drawDuelTwist,drawDuelBasis,duelBasisPrompt,suggestedDuelBasis,DUEL_RANDOM_TOPICS,DUEL_RANDOM_WORDS}from'./inkDuelExperience';

describe('Ink Duel discovery',()=>{
 const duels=[
  {id:'1',phase:'writing',content_type:'haiku',title:'Winter Moon',prompt:'The snow',is_host:true},
  {id:'2',phase:'voting',content_type:'art',title:'Blue Lantern',prompt:'A distant city',my_entry:{id:'e'}},
  {id:'3',phase:'voting',content_type:'poetry',title:'Broken Promise',prompt:'One key',my_vote:null,match_type:'open'},
  {id:'4',phase:'results',content_type:'fiction',title:'Revealed',prompt:'The door'}
 ];
 it('can filter by format and searchable prompt',()=>{
  expect(filterInkDuels(duels,{format:'haiku',search:'snow'}).map(d=>d.id)).toEqual(['1']);
  expect(filterInkDuels(duels,{search:'lantern'}).map(d=>d.id)).toEqual(['2']);
 });
 it('can filter active, mine, and eligible blind ballots',()=>{
  expect(filterInkDuels(duels,{view:'active'})).toHaveLength(3);
  expect(filterInkDuels(duels,{view:'all',scope:'mine'}).map(d=>d.id)).toEqual(['1','2']);
  expect(filterInkDuels(duels,{scope:'judge'}).map(d=>d.id)).toEqual(['3']);
 });
 it('allows group creators to judge other entries, but not their own',()=>{
  expect(filterInkDuels([{id:'g',phase:'voting',match_type:'group',my_entry:{id:'own'},entry_count:3}],{scope:'judge'})).toHaveLength(1);
  expect(filterInkDuels([{id:'g',phase:'voting',match_type:'group',my_entry:{id:'own'},entry_count:1}],{scope:'judge'})).toHaveLength(0);
 });
 it('prevents 1-v-1 competitors from appearing as eligible judges',()=>{
  expect(filterInkDuels([{id:'x',phase:'voting',match_type:'one_v_one',my_participation:'accepted'}],{scope:'judge'})).toEqual([]);
 });
});
describe('Ink Duel reward preview',()=>{
 it('requires valid participation before Bronze in open duels',()=>{
  const initial=duelPrizeProgress({match_type:'open',entry_count:2,vote_count:4,external_vote_count:2});
  expect(initial.earned).toBe(null);
  expect(initial.missing).toEqual([{key:'entries',need:3,have:2,remaining:1}]);
  expect(duelPrizeProgress({match_type:'open',entry_count:3,vote_count:4,external_vote_count:2}).earned).toBe('bronze');
 });
 it('uses outside ballots as the 1-v-1 threshold',()=>{
  expect(duelPrizeProgress({match_type:'one_v_one',entry_count:2,vote_count:15,external_vote_count:6}).earned).toBe('bronze');
  expect(duelPrizeProgress({match_type:'one_v_one',entry_count:2,vote_count:15,external_vote_count:15}).earned).toBe('gold');
 });
 it('shows independent Bronze, Silver and Gold thresholds without awarding a prize',()=>{
  const initial=duelPrizeProgress({match_type:'group',entry_count:5,vote_count:8,external_vote_count:3});
  expect(initial.readiness.bronze.ready).toBe(true);
  expect(initial.readiness.silver.ready).toBe(false);
  expect(initial.readiness.silver.missing).toEqual([{key:'outside',need:4,have:3,remaining:1}]);
  expect(initial.readiness.gold.ready).toBe(false);
  expect(initial.readiness.gold.criteria).toEqual({entries:7,ballots:12,outside:6});
  const ready=duelPrizeProgress({match_type:'group',entry_count:7,vote_count:12,external_vote_count:6});
  expect(ready.readiness.gold.ready).toBe(true);
  expect(ready.readiness.gold.missing).toEqual([]);
 });
 it('draws creative, bounded twists for every format',()=>{
  for(const type of ['fiction','poetry','haiku','drabble','dialogue','art','comic','wildcard']){
   expect(drawDuelTwist(type,1).length).toBeGreaterThan(12);
   expect(drawDuelTwist(type,1000)).toBeTruthy();
  }
 });
});


describe('Shared random Ink Duel basis',()=>{
 it('supplies strong word and topic pools that draw consistently',()=>{
  expect(DUEL_RANDOM_WORDS.length).toBeGreaterThanOrEqual(50);
  expect(DUEL_RANDOM_TOPICS.length).toBeGreaterThanOrEqual(35);
  expect(drawDuelBasis('word',0).value).toBe('harbour');
  expect(drawDuelBasis('topic',0).value).toBe('The price of keeping a promise');
  expect(drawDuelBasis('word',-1).value).toBe('moonrise');
 });
 it('saves one common prompt for every competitor, including artwork',()=>{
  expect(duelBasisPrompt(drawDuelBasis('word',2),'haiku')).toContain('Random word: ember.');
  expect(duelBasisPrompt(drawDuelBasis('topic',2),'art')).toContain('original artwork');
  expect(duelBasisPrompt(drawDuelBasis('word',2),'haiku')).toContain('Every duelist receives the same basis.');
 });
 it('suggests a constraint for poetry, haiku, drabble, dialogue and wildcard formats',()=>{
  expect(suggestedDuelBasis('poetry',0).kind).toBe('topic');
  expect(suggestedDuelBasis('dialogue',0).kind).toBe('topic');
  expect(suggestedDuelBasis('haiku',0).kind).toBe('word');
  expect(suggestedDuelBasis('drabble',0).kind).toBe('word');
  expect(suggestedDuelBasis('wildcard',0).kind).toBe('topic');
  expect(suggestedDuelBasis('fiction',0)).toBeNull();
 });
});

describe('Shared random duel basis',()=>{
 it('offers topic and word prompts while leaving fiction hosts free to choose',async()=>{
  const {drawDuelBasis,duelBasisPrompt,suggestedDuelBasis}=await import('./inkDuelExperience');
  expect(drawDuelBasis('word',0).value).toBe('harbour');
  expect(drawDuelBasis('topic',0).value).toBe('The price of keeping a promise');
  expect(duelBasisPrompt(drawDuelBasis('word',0),'haiku')).toContain('harbour');
  expect(suggestedDuelBasis('fiction',0)).toBeNull();
  expect(suggestedDuelBasis('haiku',0).kind).toBe('word');
  expect(suggestedDuelBasis('poetry',0).kind).toBe('topic');
 });
});
