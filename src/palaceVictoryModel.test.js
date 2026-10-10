import {describe,it,expect} from 'vitest';
import {shouldCelebratePalaceVictory,validatedPalaceVictory,palaceVictorySeenKey,isPalaceTextInputActive} from './palaceVictoryModel';
import {readFileSync} from 'node:fs';
describe('Finalized Palace victory celebrations',()=>{
 it('only permits unobtrusive community surfaces',()=>{
  for(const path of ['/','/grand-palaces','/palace-life','/events'])expect(shouldCelebratePalaceVictory(path)).toBe(true);
  for(const path of ['/reading','/reading?query=fiction','/work/story/chapter/chapter-1',
  '/writing','/writing/story','/comics','/comic/story/episode/1','/comics/studio',
  '/library','/settings','/login','/chamber','/search','/treasury']){
   expect(shouldCelebratePalaceVictory(path),path).toBe(false);
  }
 });
 it('rejects incomplete, unconfirmed or fabricated victory payloads',()=>{
  expect(validatedPalaceVictory(null)).toBeNull();
  expect(validatedPalaceVictory({quarter_start:'2026-10-01',palace_name:'Palace of the Azure Moon'})).toBeNull();
  expect(validatedPalaceVictory({quarter_start:'2026-10-01',palace_name:'Fake winner',finalized_at:'2027-01-01T10:00:00Z'})).toBeNull();
 });
 it('accepts finalized verified payload and limits accent to CSS colours',()=>{
  const victory=validatedPalaceVictory({quarter_start:'2026-10-01',palace_name:'Palace of the Silver Crane',palace_accent:'expression(alert())',finalized_at:'2027-01-01T10:00:00Z'});
  expect(victory).toEqual({season:'2026-10-01',name:'Palace of the Silver Crane',accent:'#a9a3f5'});
 });
 it('tracks acknowledgement separately for each member and season',()=>{
  expect(palaceVictorySeenKey('member1','2026-10-01')).not.toBe(palaceVictorySeenKey('member2','2026-10-01'));
  expect(palaceVictorySeenKey('member1','2026-10-01')).not.toBe(palaceVictorySeenKey('member1','2027-01-01'));
 });
 it('avoids interrupting active text fields',()=>{
  expect(isPalaceTextInputActive({closest:()=>({tagName:'TEXTAREA'})})).toBe(true);
  expect(isPalaceTextInputActive(null)).toBe(false);
 });
 it('never awards points or replaces banners, and respects reduced motion',()=>{
  const src=readFileSync('src/PalaceVictoryCelebration.jsx','utf8');
  const css=readFileSync('src/palace-victory.css','utf8');
  expect(src).toContain('getMyGrandPalaceVictory()');
  expect(src).toContain('palaceVictorySeenKey(userId,candidate.season)');
  expect(src).not.toContain('if(!reducedMotion');
  expect(src).toContain('!reducedMotion&&');
  expect(css).toContain('prefers-reduced-motion:reduce');
  expect(src).not.toContain('awardPalacePoints');
 });
});
