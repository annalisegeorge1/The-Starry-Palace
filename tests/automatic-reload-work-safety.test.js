import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {shouldOfferManualPalaceRefresh} from '../src/palaceUpdateSafety';

const main=readFileSync('src/main.jsx','utf8');
const start=main.indexOf('function schedulePalaceReload(');
const finish=main.indexOf('function reloadForStaleChunk(',start);
if(start<0||finish<0)throw Error('Palace reload guard not found');
const schedulerSource=main.slice(start,finish);

function testScheduler(pathname){
 const storage=new Map(),timers=[];
 const fakeWindow={
  location:{pathname,reload:()=>{throw Error('Unexpected automatic reload')}},
  setTimeout:(callback,delay)=>{timers.push({callback,delay});return timers.length}
 };
 const schedule=runInNewContext(schedulerSource+';schedulePalaceReload;',{
  window:fakeWindow,
  safeSessionGet:key=>storage.get(key)||null,
  safeSessionSet:(key,value)=>{storage.set(key,value);return true},
  shouldOfferManualPalaceRefresh
 });
 return{schedule,storage,timers};
}

describe('one work-safe guard for every automatic refresh path',()=>{
 it('never schedules a full-page reload while a member may be editing',()=>{
  const protectedRooms=[
   '/writing','/writing/first-draft','/comics/studio','/palace-life',
   '/club/moonlight','/member/thebluemoonjune','/settings',
   '/events','/letters','/council/governance','/grand-palaces','/treasury'
  ];
  for(const pathname of protectedRooms){
   const {schedule,storage,timers}=testScheduler(pathname);
   expect(schedule('palace-blank-screen-reload',180)).toBe(false);
   expect(schedule('palace-chunk-auto-reload',40)).toBe(false);
   expect(storage.size).toBe(0);
   expect(timers).toHaveLength(0);
  }
 });
 it('retains controlled recovery on public reading pages and limits repeat refreshes',()=>{
  const {schedule,storage,timers}=testScheduler('/reading');
  expect(schedule('palace-chunk-auto-reload',40)).toBe(true);
  expect(timers).toHaveLength(1);
  expect(storage.has('palace-chunk-auto-reload')).toBe(true);
  expect(schedule('palace-chunk-auto-reload',40)).toBe(false);
  expect(timers).toHaveLength(1);
 });
 it('covers each automatic trigger and leaves deliberate manual reload buttons available',()=>{
  for(const key of [
   'palace-chunk-auto-reload','palace-preload-reload',
   'palace-rejected-chunk-reload','palace-script-error-reload',
   'palace-new-build-reload','palace-blank-screen-reload'
  ])expect(main).toContain(key);
  expect(schedulerSource).toContain('shouldOfferManualPalaceRefresh(window.location.pathname)');
  expect(main).toContain('Reload after saving');
  expect(main).toContain('Restore this room');
  expect(main).toContain('Save or export your text before choosing to reload.');
  expect(main).toContain('window.location.reload()');
 });
});
