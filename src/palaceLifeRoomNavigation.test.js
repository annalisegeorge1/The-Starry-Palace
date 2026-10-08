import {describe,it,expect} from 'vitest';
import {PALACE_LIFE_ROOMS,palaceLifeRoom,palaceLifeRoomFromSearch,palaceLifeRoomUrl} from './palaceLifeRoomNavigation';

describe('Palace Life room navigation',()=>{
 it('permits exactly the six real Palace Life rooms',()=>{
  expect(PALACE_LIFE_ROOMS).toEqual(['commons','clubs','forum','moonlight','stars','highlights']);
  for(const room of PALACE_LIFE_ROOMS){
   expect(palaceLifeRoom(room)).toBe(room);
   expect(palaceLifeRoomFromSearch('?room='+room)).toBe(room);
   expect(palaceLifeRoomUrl(room)).toBe('/palace-life?room='+room);
  }
 });
 it('opens the Commons for missing or unknown room names',()=>{
  expect(palaceLifeRoom(null)).toBe('commons');
  expect(palaceLifeRoom('unknown')).toBe('commons');
  expect(palaceLifeRoom('__proto__')).toBe('commons');
  expect(palaceLifeRoomFromSearch('?room=missing')).toBe('commons');
  expect(palaceLifeRoomFromSearch('?room=')).toBe('commons');
  expect(palaceLifeRoomFromSearch('?tab=writing')).toBe('commons');
  expect(palaceLifeRoomUrl('/other')).toBe('/palace-life?room=commons');
 });
 it('allows shared links with other params without changing their room selection',()=>{
  expect(palaceLifeRoomFromSearch('?room=commons&talk=stars')).toBe('commons');
  expect(palaceLifeRoomFromSearch('?room=clubs&sort=latest')).toBe('clubs');
 });
});
