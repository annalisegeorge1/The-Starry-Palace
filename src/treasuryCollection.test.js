import {describe,it,expect} from 'vitest';
import {buildInventory} from './treasuryCollection';
import {resolveBadgeFrame} from './badgeArtwork';
const row=(tier,copies)=>({tier,copies,virtual_gifts:{id:'gift',upgrade_copies:3}});
describe('gift collection ownership',()=>{
 it('does not call different tiers duplicates',()=>{
  const value=buildInventory([row('silver',1),row('bronze',1)]).get('gift');
  expect(value).toEqual({copies:2,tiers:['bronze','silver'],hasDuplicates:false,ascendable:false,counts:{silver:1,bronze:1},upgradeCopies:3});
 });
 it('combines copies of the same tier for duplicate and upgrade eligibility',()=>{
  expect(buildInventory([row('bronze',1),row('bronze',2)]).get('gift')).toMatchObject({hasDuplicates:true,ascendable:true});
 });
 it('does not upgrade emerald copies',()=>{
  expect(buildInventory([row('emerald',3)]).get('gift')).toMatchObject({hasDuplicates:true,ascendable:false});
 });
 it('ignores invalid or empty holdings',()=>{
  expect(buildInventory([row('bronze',0),row('gold',NaN),row('unknown',4)])).toHaveProperty('size',0);
 });
});
describe('badge artwork matching',()=>{
 it('uses a named artwork when the database ID is a UUID',()=>{
  const ink={asset:'inkwell.png'};
  expect(resolveBadgeFrame({word:ink},'database-uuid','word')).toBe(ink);
 });
 it('preserves an exact catalogue ID over an alias',()=>{
  expect(resolveBadgeFrame({word:'ink',read:'reader'},'word','read')).toBe('ink');
 });
 it('does not substitute an unrelated character for missing artwork',()=>{
  expect(resolveBadgeFrame({membership:'character'},'unknown','missing')).toBeNull();
 });
});
