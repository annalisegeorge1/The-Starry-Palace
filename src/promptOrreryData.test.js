import {describe,it,expect} from 'vitest';
import {PROMPT_ORRERY_RECIPES,ORRERY_EXPANSION_FAMILIES,randomOrreryRecipe} from './promptOrreryData';

describe('Prompt Orrery expansion',()=>{
 it('ships exactly 4,012 constellations with unique ids',()=>{
  expect(PROMPT_ORRERY_RECIPES).toHaveLength(4012);
  expect(new Set(PROMPT_ORRERY_RECIPES.map(prompt=>prompt.id)).size).toBe(4012);
 });
 it('adds exactly 2,000 themed constellations across the seven new story families',()=>{
  const families=Object.keys(ORRERY_EXPANSION_FAMILIES);
  expect(families).toEqual([
   'Dark','Mystical','Romantic','Cerebral / Smart','Timeline / Time-bending','Genre Mix','Drama'
  ]);
  const expanded=PROMPT_ORRERY_RECIPES.filter(prompt=>prompt.flavour!=='Classic Orbit');
  expect(expanded).toHaveLength(2000);
  for(const family of families){
   const count=expanded.filter(prompt=>prompt.flavour===family).length;
   expect(count).toBeGreaterThanOrEqual(285);
   expect(count).toBeLessThanOrEqual(286);
  }
 });
 it('keeps the family filter compatible with random pulls',()=>{
  for(const flavour of Object.keys(ORRERY_EXPANSION_FAMILIES)){
   const prompt=randomOrreryRecipe('',{flavour});
   expect(prompt).toBeTruthy();
   expect(prompt.flavour).toBe(flavour);
  }
 });
});
