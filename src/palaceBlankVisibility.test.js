import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {isPalaceRoomVisuallyBlank} from './palaceBlankVisibility';

function room(...visibility){
 const root=document.createElement('main');
 for(const invisible of visibility){
  const child=document.createElement('section');
  if(invisible)child.dataset.invisible='true';
  root.appendChild(child);
 }
 return root;
}
const invisible=node=>node?.dataset?.invisible==='true';

describe('blank-screen visibility before emergency recovery',()=>{
 it('never mistakes an intentionally hidden first panel for an entirely empty room',()=>{
  expect(isPalaceRoomVisuallyBlank(room(true,false),invisible)).toBe(false);
  expect(isPalaceRoomVisuallyBlank(room(true,true,false),invisible)).toBe(false);
  expect(isPalaceRoomVisuallyBlank(room(false,true),invisible)).toBe(false);
 });
 it('detects genuinely invisible rooms and all-hidden top-level room panels',()=>{
  const collapsed=room(false);
  collapsed.dataset.invisible='true';
  expect(isPalaceRoomVisuallyBlank(collapsed,invisible)).toBe(true);
  expect(isPalaceRoomVisuallyBlank(room(true,true),invisible)).toBe(true);
 });
 it('ignores non-rendering style elements and avoids false alarms on empty or missing wrappers',()=>{
  const entry=room(false);
  const style=document.createElement('style');
  style.dataset.invisible='true';
  entry.insertBefore(style,entry.firstChild);
  expect(isPalaceRoomVisuallyBlank(entry,invisible)).toBe(false);
  expect(isPalaceRoomVisuallyBlank(room(),invisible)).toBe(false);
  expect(isPalaceRoomVisuallyBlank(null,invisible)).toBe(false);
  expect(isPalaceRoomVisuallyBlank(entry,null)).toBe(false);
 });
 it('wires the shared rule into both checks and clears rescue classes after recovery or navigation',()=>{
  const main=readFileSync('src/main.jsx','utf8');
  const watchdog=main.slice(main.indexOf('function BlankScreenWatchdog()'),main.indexOf('function RouteLoading()'));
  expect(watchdog).toContain('isPalaceRoomVisuallyBlank(content,looksInvisible)');
  expect(watchdog).not.toContain('looksInvisible(content.firstElementChild)');
  expect(watchdog).toContain("content.classList.remove('palace-visibility-rescue')");
  expect(watchdog).toContain("document.getElementById('palace-content')?.classList.remove('palace-visibility-rescue')");
  expect(watchdog).toContain("schedulePalaceReload('palace-blank-screen-reload:'");
 });
});
