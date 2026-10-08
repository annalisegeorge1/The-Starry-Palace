import {describe,it,expect} from 'vitest';
import {palaceSignInDoor,palaceDoorDestinationMessage} from './palaceDoorway';
import {safePalaceReturnPath} from './palaceReturnPath';

describe('Palace doorways keep the room a visitor chose',()=>{
 it('remembers the Writing Chamber after sign-in',()=>{
  const door=palaceSignInDoor('/writing');
  expect(door).toBe('/login?next=%2Fwriting');
  expect(safePalaceReturnPath(new URLSearchParams(door.split('?')[1]).get('next'))).toBe('/writing');
  expect(palaceDoorDestinationMessage('/writing')).toMatch(/Writing Chamber/);
 });
 it('keeps deeper community intentions and their query strings',()=>{
  const target='/palace-life?room=commons';
  const door=palaceSignInDoor(target);
  expect(door).toBe('/login?next=%2Fpalace-life%3Froom%3Dcommons');
  expect(new URLSearchParams(door.split('?')[1]).get('next')).toBe(target);
  expect(palaceDoorDestinationMessage(target)).toMatch(/Palace Life/);
  expect(palaceDoorDestinationMessage('/library')).toMatch(/Library/);
  expect(palaceDoorDestinationMessage('/grand-palaces')).toMatch(/Grand Palace/);
 });
 it('rejects untrusted external or unsupported destinations',()=>{
  for(const invalid of ['https://evil.example','//evil.example','/auth/callback','/login','/private-admin','/writing\\oops','/writing\n']){
   expect(palaceSignInDoor(invalid)).toBe('/login');
   expect(palaceDoorDestinationMessage(invalid)).toBe('');
  }
 });
 it('does not turn public destinations into a barrier by itself',()=>{
  expect(safePalaceReturnPath('/reading')).toBe('/reading');
  expect(palaceSignInDoor('/library')).not.toBe(palaceSignInDoor('/writing'));
 });
});
