import {describe,it,expect} from 'vitest';
import {celestialTitleWearState,availableTitleChoices} from './celestialTitleWardrobeModel';
describe('Celestial wardrobe eligibility states',()=>{
 const title={title:'Golden Maiden',celestial_points_required:250};
 it('never treats point totals alone as a confirmed entitlement',()=>{
  expect(celestialTitleWearState(title,250)).toBe('pending');
  expect(celestialTitleWearState(title,249)).toBe('locked');
  expect(celestialTitleWearState({...title,entitled:true},249)).toBe('available');
 });
 it('recognizes a worn title without consuming points',()=>{
  expect(celestialTitleWearState(title,0,'Golden Maiden')).toBe('worn');
  expect(celestialTitleWearState({...title,entitled:true},500,'Other')).toBe('available');
 });
 it('excludes locked, malformed, and duplicate title choices',()=>{
  expect(availableTitleChoices([
   {title:'Palace Member',public_selectable:true},
   {title:'Palace Member',public_selectable:true},
   {title:'Secret Crown',public_selectable:false,entitled:false},
   {title:'Moon Princess',public_selectable:false,entitled:true},
   {title:'',public_selectable:true}
  ]).map(x=>x.title)).toEqual(['Palace Member','Moon Princess']);
 });
});
