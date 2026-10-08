import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {
 palaceRecentDoorKey,readPalaceRecentDoors,addPalaceRecentDoor,isSafeRecentPalacePath
} from './palaceRecentDoors';

const page=(label,path)=>({label,path,icon:'✦',detail:'Recently visited'});
const m1='11111111-1111-4111-8111-111111111111';
const m2='22222222-2222-4222-8222-222222222222';

describe('member-private Palace recent navigation',()=>{
 it('stores recent rooms separately for each signed-in member, never in a guest key',()=>{
  const first=palaceRecentDoorKey(m1),second=palaceRecentDoorKey(m2);
  expect(first).not.toBe(second);
  expect(palaceRecentDoorKey()).toBeNull();
  expect(palaceRecentDoorKey('')).toBeNull();
  const store=new Map([
   ['palace-recent-routes',JSON.stringify([page('Private draft','/writing/someone-elses-draft')])],
   [first,JSON.stringify([page('My chapter','/writing/my-chapter')])],
   [second,JSON.stringify([page('My shelf','/library')])]
  ]);
  const read=key=>store.get(key);
  expect(readPalaceRecentDoors(read,first).map(x=>x.path)).toEqual(['/writing/my-chapter']);
  expect(readPalaceRecentDoors(read,second).map(x=>x.path)).toEqual(['/library']);
  expect(readPalaceRecentDoors(read,null)).toEqual([]);
 });
 it('drops malformed, dangerous, duplicate and oversized saved links',()=>{
  const key=palaceRecentDoorKey(m1);
  const store=new Map([[key,JSON.stringify([
   page('Reading','/reading'),page('Reading again','/reading'),
   page('External','//evil.example.com'),
   page('Script','javascript:alert(1)'),
   page('Traversal','/writing/../settings'),
   page('Broken','/writing\\draft'),
   {path:'/settings'},null,
   page('Another','/palace-life?room=commons')
  ])]]);
  expect(readPalaceRecentDoors(k=>store.get(k),key).map(x=>x.path)).toEqual(['/reading','/palace-life?room=commons']);
  expect(isSafeRecentPalacePath('/reading?q=tag%20search')).toBe(true);
  expect(isSafeRecentPalacePath('/work/story-id/chapter/chapter-id')).toBe(true);
  expect(isSafeRecentPalacePath('/reading\n')).toBe(false);
  expect(isSafeRecentPalacePath('/writing/'+'a'.repeat(600))).toBe(false);
 });
 it('retains only the five latest valid doors, keeping revisits at the front',()=>{
  let state=[];
  for(let i=0;i<8;i++)state=addPalaceRecentDoor(state,page('Room '+i,'/member/member-'+i));
  expect(state).toHaveLength(5);
  expect(state[0].path).toBe('/member/member-7');
  state=addPalaceRecentDoor(state,page('Revisited','/member/member-5'));
  expect(state[0].label).toBe('Revisited');
  expect(state.filter(x=>x.path==='/member/member-5')).toHaveLength(1);
  expect(addPalaceRecentDoor(state,page('Unsafe','//outside.example'))).toHaveLength(5);
 });
 it('keeps malformed browser storage from crashing member navigation',()=>{
  const key=palaceRecentDoorKey(m1);
  expect(readPalaceRecentDoors(()=>'{bad-json',key)).toEqual([]);
  expect(readPalaceRecentDoors(()=>{throw Error('Storage is blocked')},key)).toEqual([]);
  expect(readPalaceRecentDoors(()=>'{}',key)).toEqual([]);
 });
 it('gates visible shortcuts on the current member and never reads legacy shared history',()=>{
  const main=readFileSync('src/main.jsx','utf8');
  expect(main).toContain('recentPalaceRoutes.key===recentDoorsKey');
  expect(main).toContain('if(!activeRoom||!recentDoorsKey)return');
  expect(main).toContain('readPalaceRecentDoors(safeLocalGet,recentDoorsKey)');
  expect(main).not.toContain("safeLocalGet('palace-recent-routes')");
  expect(main).not.toContain("safeLocalSet('palace-recent-routes'");
 });
});
