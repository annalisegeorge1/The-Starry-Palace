import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {shouldShowPalacePassage} from './palacePassagePolicy';

describe('Palace passage respects creative focus',()=>{
 it('preserves nearby doors on social and discovery landings',()=>{
  for(const path of ['/','/reading','/work/example','/comic/example','/comics']){
   expect(shouldShowPalacePassage(path),path).toBe(true);
  }
 });
 it('avoids a second route rail on rooms that already offer tabs',()=>{
  for(const path of ['/writing','/palace-life','/library','/settings','/treasury'])expect(shouldShowPalacePassage(path),path).toBe(false);
 });
 it('leaves long-form reading, chapter editing and comic pages undistracted',()=>{
  for(const path of ['/writing/moonlight','/writing/moonlight?chapter=one','/work/moonlight/chapter/one','/classic/frankenstein','/comic/moon/episode/1','/comics/studio']){
   expect(shouldShowPalacePassage(path),path).toBe(false);
  }
  expect(shouldShowPalacePassage('/write')).toBe(true);
  expect(shouldShowPalacePassage('/work/moonlight')).toBe(true);
  expect(shouldShowPalacePassage('/writingroom')).toBe(true);
 });
 it('is implemented in the shared shell rather than hiding content with CSS',()=>{
  const code=readFileSync('src/main.jsx','utf8');
  expect(code).toContain("import {shouldShowPalacePassage} from './palacePassagePolicy';");
  expect(code).toContain('shouldShowPalacePassage(location.pathname)&&<nav className="palace-passage"');
 });
});
