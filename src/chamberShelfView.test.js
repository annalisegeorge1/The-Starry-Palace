import {describe,it,expect} from 'vitest';
import {matchesChamberPreview,chamberPreviewCount} from './chamberShelfView';

describe('Honest Chamber creative previews',()=>{
 it('finds visible titles and descriptions without accent or casing surprises',()=>{
  const item={title:'Étoile at Midnight',summary:'A painted moonlit voyage',completion_status:'in_progress'};
  expect(matchesChamberPreview(item,'etoile')).toBe(true);
  expect(matchesChamberPreview(item,' MIDNIGHT ')).toBe(true);
  expect(matchesChamberPreview(item,'moonlit')).toBe(true);
  expect(matchesChamberPreview(item,'in_progress')).toBe(true);
  expect(matchesChamberPreview(item,'sunrise')).toBe(false);
  expect(matchesChamberPreview(null,'anything')).toBe(false);
  expect(matchesChamberPreview(null,'  ')).toBe(true);
 });
 it('clearly distinguishes matches within a preview from total published count',()=>{
  expect(chamberPreviewCount({shown:3,loaded:12,total:45,search:false})).toBe('12 of 45 visible');
  expect(chamberPreviewCount({shown:1,loaded:12,total:45,search:true})).toBe('1 match in preview');
  expect(chamberPreviewCount({shown:0,loaded:12,total:45,search:true})).toBe('0 matches in preview');
  expect(chamberPreviewCount({shown:0,loaded:0,total:0})).toBe('0 of 0 visible');
 });
});
