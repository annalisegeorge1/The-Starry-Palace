import {describe,it,expect,beforeEach} from 'vitest';
import {readPalacePreference,writePalacePreference,removePalacePreference,readPalaceChoice,readPalaceNumber} from './browserPreferences';
beforeEach(()=>localStorage.clear());
describe('safe optional reader and writing settings',()=>{
 it('preserves valid saved settings',()=>{
  expect(writePalacePreference('palace-reader-face','sans',localStorage)).toBe(true);
  expect(readPalaceChoice('palace-reader-face',['serif','sans'],'serif',localStorage)).toBe('sans');
  expect(removePalacePreference('palace-reader-face',localStorage)).toBe(true);
  expect(readPalacePreference('palace-reader-face','serif',localStorage)).toBe('serif');
 });
 it('ignores obsolete and invalid appearances',()=>{
  localStorage.setItem('palace-writer-font','gibberish');
  expect(readPalaceChoice('palace-writer-font',['serif','sans','mono','accessible'],'serif',localStorage)).toBe('serif');
 });
 it('clamps oversized type and invalid writing sprint lengths',()=>{
  localStorage.setItem('palace-reader-font','999999');
  expect(readPalaceNumber('palace-reader-font',20,16,28,localStorage)).toBe(28);
  localStorage.setItem('palace-reader-font','nope');
  expect(readPalaceNumber('palace-reader-font',20,16,28,localStorage)).toBe(20);
  localStorage.setItem('palace-writer-font-size','0');
  expect(readPalaceNumber('palace-writer-font-size',20,16,30,localStorage)).toBe(16);
 });
 it('keeps writing and reading available when storage is blocked',()=>{
  const denied={getItem(){throw new Error('security')},setItem(){throw new Error('security')},removeItem(){throw new Error('security')}};
  expect(readPalacePreference('x','default',denied)).toBe('default');
  expect(readPalaceChoice('x',['a'],'a',denied)).toBe('a');
  expect(readPalaceNumber('x',20,16,28,denied)).toBe(20);
  expect(writePalacePreference('x','value',denied)).toBe(false);
  expect(removePalacePreference('x',denied)).toBe(false);
 });
});
