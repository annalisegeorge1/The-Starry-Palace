import {afterEach,describe,expect,it,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {loadPalaceRoomModule} from './loadPalaceRoomModule';
afterEach(()=>vi.useRealTimers());
describe('lazy room module contract',()=>{
 it('passes a valid room module through unchanged',async()=>{
  const module={default:()=>null};
  expect(await loadPalaceRoomModule(()=>module)).toBe(module);
 });
 it.each([undefined,null,{}, {default:null}])('rejects a suppressed or incomplete import before React reads default: %s',async module=>{
  await expect(loadPalaceRoomModule(()=>module)).rejects.toThrow('failed to fetch a valid module');
 });
 it('preserves the original import failure for stale-chunk recovery',async()=>{
  const error=new Error('Failed to fetch dynamically imported module');
  await expect(loadPalaceRoomModule(()=>Promise.reject(error))).rejects.toBe(error);
 });
 it('bounds stalled imports and releases its timer',async()=>{
  vi.useFakeTimers();
  const pending=expect(loadPalaceRoomModule(()=>new Promise(()=>{}),30)).rejects.toThrow('Palace room load timeout');
  await vi.advanceTimersByTimeAsync(30);await pending;
  expect(vi.getTimerCount()).toBe(0);
 });
 it('does not suppress preload rejection and keeps the writer reload guard',()=>{
  const main=readFileSync('src/main.jsx','utf8');
  const handler=main.slice(main.indexOf("window.addEventListener('vite:preloadError'"),main.indexOf("window.addEventListener('unhandledrejection'"));
  expect(handler).not.toContain('preventDefault');
  expect(handler).toContain('schedulePalaceReload');
  expect(main).toContain('if(shouldOfferManualPalaceRefresh(window.location.pathname))return false;');
 });
});
