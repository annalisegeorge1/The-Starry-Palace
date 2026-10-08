import {describe,it,expect} from 'vitest';
import {safePalaceReturnPath,palaceCallbackUrl} from './palaceReturnPath';

describe('safe return after Palace sign-in',()=>{
 it('retains a requested writing destination and local chapter link',()=>{
  expect(safePalaceReturnPath('/writing')).toBe('/writing');
  expect(safePalaceReturnPath('/writing/first-draft?chapter=abc-123')).toBe('/writing/first-draft?chapter=abc-123');
  expect(safePalaceReturnPath('/work/poem/chapter/aa-12')).toBe('/work/poem/chapter/aa-12');
 });
 it('rejects unapproved, malformed or external destinations',()=>{
  for(const bad of ['https://example.com','//example.com','/\\example.com','/auth/callback','/login','/admin','/%2f%2fexample.com','javascript:alert(1)','/writing\n'])expect(safePalaceReturnPath(bad)).toBe('/chamber');
 });
 it('keeps email-confirmation redirects inside the Palace',()=>{
  expect(palaceCallbackUrl('https://the-starry-palace.onrender.com','/writing')).toBe('https://the-starry-palace.onrender.com/auth/callback?next=%2Fwriting');
  expect(palaceCallbackUrl('https://the-starry-palace.onrender.com','//evil.com')).toBe('https://the-starry-palace.onrender.com/auth/callback?next=%2Fchamber');
 });
});
