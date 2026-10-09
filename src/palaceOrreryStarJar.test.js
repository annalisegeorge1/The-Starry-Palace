import {describe,it,expect} from 'vitest';
import {ORRERY_STAR_JAR_LIMIT,ORRERY_STAR_JAR_STORAGE_KEY,starJarKey,addStarJarPrompt,removeStarJarPrompt,readStarJar} from './palaceOrreryStarJar';
const orbit={id:'orrery-0123',flavour:'Classic Orbit',genre:'Gothic',object:'a key',twist:'the lock moves',mood:'quiet',character:'an archivist'};
describe('Orrery Star Jar',()=>{
 it('saves entire constellations and does not duplicate a repeated star',()=>{
  const one=addStarJarPrompt([],orbit);
  expect(one[0]).toEqual(orbit);
  expect(addStarJarPrompt(one,orbit)).toHaveLength(1);
 });
 it('keeps different locked-reel combinations independently',()=>{
  const two=addStarJarPrompt(addStarJarPrompt([],orbit),{...orbit,object:'a violin'});
  expect(two).toHaveLength(2);
  expect(starJarKey(two[0])).not.toBe(starJarKey(two[1]));
  expect(removeStarJarPrompt(two,starJarKey(orbit))).toHaveLength(1);
 });
 it('limits local storage without changing story drafts or any point ledger',()=>{
  let saved=[];
  for(let n=0;n<16;n++)saved=addStarJarPrompt(saved,{...orbit,id:'orrery-'+n});
  expect(saved).toHaveLength(ORRERY_STAR_JAR_LIMIT);
  expect(saved[0].id).toBe('orrery-15');
  expect(saved.at(-1).id).toBe('orrery-4');
 });
 it('handles corrupt or unexpected on-device records',()=>{
  expect(readStarJar({getItem:()=>'{not json'})).toEqual([]);
  expect(readStarJar({getItem:()=>JSON.stringify([null,{},orbit,orbit])})).toEqual([orbit]);
  expect(readStarJar({getItem:key=>key===ORRERY_STAR_JAR_STORAGE_KEY?JSON.stringify([orbit]):'[]'})).toEqual([orbit]);
 });
});
