import {describe,it,expect} from 'vitest';
import {ORRERY_DARK_ORBITS,ORRERY_DARK_RECIPES} from './promptOrreryDarkOrbits';
import {ORRERY_NEW_ORBITS,ORRERY_NEW_ORBIT_RECIPES} from './promptOrreryNewOrbits';
import {PROMPT_ORRERY_RECIPES,ORRERY_EXPANSION_FAMILIES,randomOrreryRecipe} from './promptOrreryData';

describe('Prompt Orrery expansion',()=>{
 it('ships exactly 7,012 constellations with unique ids',()=>{
  expect(PROMPT_ORRERY_RECIPES).toHaveLength(7012);
  expect(new Set(PROMPT_ORRERY_RECIPES.map(prompt=>prompt.id)).size).toBe(7012);
 });
 it('adds exactly 2,000 themed constellations across the seven new story families',()=>{
  const families=Object.keys(ORRERY_EXPANSION_FAMILIES);
  expect(families).toEqual([
   'Dark','Mystical','Romantic','Cerebral / Smart','Timeline / Time-bending','Genre Mix','Drama'
  ]);
  const expanded=PROMPT_ORRERY_RECIPES.filter(prompt=>Object.keys(ORRERY_EXPANSION_FAMILIES).includes(prompt.flavour));
  expect(expanded).toHaveLength(2000);
  for(const family of families){
   const count=expanded.filter(prompt=>prompt.flavour===family).length;
   expect(count).toBeGreaterThanOrEqual(285);
   expect(count).toBeLessThanOrEqual(286);
  }
 });
 it('adds 2,000 new fully formed recipes without affecting the original 4,012',()=>{
  expect(Object.keys(ORRERY_NEW_ORBITS)).toHaveLength(8);
  expect(ORRERY_NEW_ORBIT_RECIPES).toHaveLength(2000);
  const unique=new Set();
  for(const recipe of ORRERY_NEW_ORBIT_RECIPES){
   expect(recipe.id).toMatch(/^orrery-(4\d{3}|5\d{3}|60(?:0\d|1[012]))$/);
   for(const key of ['genre','object','twist','mood','character','relationship','setting','conflict','difficulty']){
    expect(typeof recipe[key]).toBe('string');
    expect(recipe[key].length).toBeGreaterThan(2);
   }
   unique.add([recipe.genre,recipe.object,recipe.twist,recipe.setting,recipe.conflict].join('|'));
  }
  expect(unique.size).toBe(2000);
  expect(ORRERY_NEW_ORBIT_RECIPES.at(-1).id).toBe('orrery-6012');
 });
 it('adds exactly 1,000 mature, violent fictional constellations with unique stable IDs',()=>{
  expect(Object.keys(ORRERY_DARK_ORBITS)).toHaveLength(5);
  expect(ORRERY_DARK_RECIPES).toHaveLength(1000);
  const descriptions=new Set();
  for(const recipe of ORRERY_DARK_RECIPES){
   expect(recipe.intensity).toBe('Mature / Violent');
   expect(recipe.id).toMatch(/^orrery-(6\d{3}|70(?:0\d|1[012]))$/);
   for(const field of ['genre','object','twist','mood','character','relationship','setting','conflict']){
    expect(typeof recipe[field]).toBe('string');
    expect(recipe[field].length).toBeGreaterThan(5);
   }
   descriptions.add([recipe.genre,recipe.object,recipe.twist,recipe.setting,recipe.conflict].join('|'));
  }
  expect(descriptions.size).toBe(1000);
  expect(PROMPT_ORRERY_RECIPES.at(-1).id).toBe('orrery-7012');
 });
 it('avoids recent constellations until narrow filters exhaust the pool',()=>{
  const pool=PROMPT_ORRERY_RECIPES.filter(recipe=>recipe.flavour==='Slasher & Survival');
  expect(pool.length).toBeGreaterThan(10);
  const last=pool.at(-1);
  const earlier=pool.slice(0,-1).map(recipe=>recipe.id);
  expect(randomOrreryRecipe('',{flavour:'Slasher & Survival'},earlier).id).toBe(last.id);
  expect(randomOrreryRecipe(last.id,{flavour:'Slasher & Survival'},[...earlier]).id).not.toBe(last.id);
  expect(randomOrreryRecipe('',{flavour:'Not a real family'})).toBeNull();
 });
 it('keeps the family filter compatible with random pulls',()=>{
  for(const flavour of [...Object.keys(ORRERY_EXPANSION_FAMILIES),...Object.keys(ORRERY_NEW_ORBITS),...Object.keys(ORRERY_DARK_ORBITS)]){
   const prompt=randomOrreryRecipe('',{flavour});
   expect(prompt).toBeTruthy();
   expect(prompt.flavour).toBe(flavour);
  }
 });
});
