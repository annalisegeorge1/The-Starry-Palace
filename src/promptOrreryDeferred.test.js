import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {PROMPT_ORRERY_RECIPES,randomOrreryRecipe} from './promptOrreryData';
const code=readFileSync('src/liveRooms.jsx','utf8');
const styles=readFileSync('src/palace-orrery-star-jar.css','utf8');
const writing=code.slice(code.indexOf('export function WritingLive({Frame})'),code.indexOf('export function ',code.indexOf('export function WritingLive({Frame})')+30));
describe('On-demand, complete Prompt Orrery',()=>{
 it('keeps the large catalogue out of the initial eager Palace module',()=>{
  expect(code).not.toContain("from'./promptOrreryData';");
  expect(writing).toContain("import('./promptOrreryData')");
  expect(writing).toContain("tab!=='drafts'&&tab!=='duels'");
  expect(writing).toContain('const PROMPT_ORRERY_RECIPES=orreryModule?.PROMPT_ORRERY_RECIPES||EMPTY_ORRERY_RECIPES');
 });
 it('preserves all 7012 recipes and the random generator without modifying content',()=>{
  expect(PROMPT_ORRERY_RECIPES).toHaveLength(7012);
  expect(randomOrreryRecipe('',{flavour:'Slasher & Survival'})?.intensity).toBe('Mature / Violent');
  expect(writing).toContain('randomOrreryRecipe(prompt.id,promptFilters,promptHistory.map(item=>item.id))');
  expect(writing).toContain('setPrompt(current=>current?.id');
 });
 it('keeps drafts usable if the optional collection fails to load',()=>{
  expect(writing).toContain('orreryFailed&&<button');
  expect(writing).toContain('setOrreryRetry(n=>n+1)');
  expect(writing).toContain('<form className="new-work chic-new-work world-aware"');
  expect(styles).toContain('.prompt-orrery-deferred');
 });
 it('refreshes filter and duel families when the catalogue arrives',()=>{
  expect(writing).toContain('],[PROMPT_ORRERY_RECIPES]);');
  expect(writing).toContain('[promptFilters,PROMPT_ORRERY_RECIPES]');
  expect(writing).toContain('disabled={!orreryModule}');
  expect(writing).toContain('readStarJar(window.localStorage)');
 });
});
