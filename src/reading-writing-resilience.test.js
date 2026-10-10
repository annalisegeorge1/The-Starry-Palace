import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {formatDuelCountdown} from './DuelCountdown';
const live=readFileSync('src/liveRooms.jsx','utf8');
const duel=live.slice(live.indexOf('export function WritingLive({Frame})'),live.indexOf('export function ',live.indexOf('export function WritingLive({Frame})')+30));
const css=readFileSync('src/writer-toolbar-flow.css','utf8');
describe('Reading Rooms tolerate partially available services',()=>{
 it('keeps public stories separate from optional personal shelf requests',()=>{
  const reading=live.split('export function ReadingLive({Frame})')[1].split('export function WritingLive({Frame})')[0];
  expect(reading).toContain('Promise.allSettled([getPublishedWorks(),getArchive(id)])');
  expect(reading).toContain('getWorkShelfState(id).then');
  expect(reading).toContain('getOnboardingState(id).then');
  expect(reading).toContain('if(!memberOK&&!archiveOK)');
  expect(reading).toContain('reading-partial-notice');
  expect(reading).toContain('return()=>{active=false}');
 });
});
describe('Quiet and robust Writing Chamber',()=>{
 it('can show drafts even if relay rooms or duels temporarily fail',()=>{
  expect(duel).toContain('Promise.allSettled([getMyWorks(session.user.id),getWritingExtras(session.user.id),getMyRelayRooms(),getMicroDuels(),getMicroDuelRecord()])');
  expect(duel).toContain("if(worksResult.status==='fulfilled')setWorks(worksResult.value||[])");
  expect(duel).toContain("if(relayResult.status==='fulfilled')setRelayRooms(relayResult.value||[])");
 });
 it('does not refetch the writing desk every fifteen seconds',()=>{
  expect(duel).toContain('const refreshDuelActivity=()=>Promise.allSettled([getMicroDuels(),getMicroDuelRecord()])');
  expect(duel).toContain('window.setInterval(()=>{if(document.visibilityState===\'visible\')refreshDuelActivity()},15000)');
  expect(duel).not.toContain('window.setInterval(()=>load(),15000)');
  expect(duel).not.toContain('setDuelNow');
 });
 it('isolates an accessible one-second countdown from the entire writing view',()=>{
  expect(duel).toContain('<DuelCountdown target={duel.closes_at}/>');
  expect(duel).toContain('<DuelCountdown target={duel.voting_closes_at}/>');
  expect(formatDuelCountdown(new Date(70000).toISOString(),0)).toBe('01:10');
  expect(formatDuelCountdown(new Date(3661000).toISOString(),0)).toBe('1h 01m');
  expect(formatDuelCountdown('invalid',0)).toBe('—');
  expect(formatDuelCountdown(new Date(0).toISOString(),4000)).toBe('00:00');
 });
 it('keeps narrow-screen tools scrollable and reachable',()=>{
  expect(css).toContain('@media(max-width:600px)');
  expect(css).toContain('overscroll-behavior-x:contain');
  expect(css).toContain('scrollbar-width:thin');
 });
});
