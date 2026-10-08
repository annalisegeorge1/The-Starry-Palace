import {describe,expect,it} from 'vitest';
import {shouldOfferManualPalaceRefresh} from './palaceUpdateSafety';

describe('Palace deployment refresh safety',()=>{
 it('never silently refreshes a writing or community compose surface',()=>{
  for(const path of ['/writing','/writing/moon-book','/comics/studio','/palace-life','/palace-life/','/club/story-circle','/member/moon-princess','/letters','/events','/council/governance','/grand-palaces','/treasury/catalogue','/settings'])
   expect(shouldOfferManualPalaceRefresh(path)).toBe(true);
 });
 it('keeps ordinary reading and entry pages eligible for automatic updates',()=>{
  for(const path of ['/','/reading','/search','/comics','/comic/sun','/work/mystery/chapter/1','/code','/beta','/writers'])
   expect(shouldOfferManualPalaceRefresh(path)).toBe(false);
 });
 it('does not treat lookalike paths or malformed values as editing rooms',()=>{
  for(const path of ['/writer','/writing-room','/memberish','/events-now','/councillor','/treasury-bag','/comics/studio-old',undefined,{},null])
   expect(shouldOfferManualPalaceRefresh(path)).toBe(false);
 });
});
