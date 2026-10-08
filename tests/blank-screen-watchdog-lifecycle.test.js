import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const main=readFileSync(resolve(process.cwd(),'src/main.jsx'),'utf8');
const watchdog=main.slice(main.indexOf('function BlankScreenWatchdog()'),main.indexOf('function RouteLoading()'));

describe('blank screen watchdog lifecycle safety',()=>{
 it('stops page-visibility checks from a room after leaving it',()=>{
  expect(watchdog).toContain('const followupTimers=new Set()');
  expect(watchdog).toContain('followupTimers.add(timer)');
  expect(watchdog).toContain('followupTimers.delete(timer)');
  expect(watchdog).toContain('followupTimers.forEach(timer=>window.clearTimeout(timer))');
  expect(watchdog).toContain('followupTimers.clear()');
  expect(watchdog).not.toContain('onPageShow=event=>window.setTimeout(inspect');
 });
 it('retains original first and second blank checks, recovery and listeners',()=>{
  expect(watchdog).toContain('firstTimer=window.setTimeout(inspect,1800)');
  expect(watchdog).toContain('secondTimer=window.setTimeout(inspect,5200)');
  expect(watchdog).toContain("schedulePalaceReload('palace-blank-screen-reload:'");
  expect(watchdog).toContain("window.addEventListener('pageshow',onPageShow)");
  expect(watchdog).toContain("document.addEventListener('visibilitychange',onVisible)");
  expect(watchdog).toContain("window.removeEventListener('pageshow',onPageShow)");
 });
});
