import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {storyHistoryDetails,storyHistoryLabel} from './storyHistoryModel';

const live=readFileSync('src/liveRooms.jsx','utf8');
const library=live.split('export function LibraryLive({Frame})')[1]?.split('export function PalaceLifeLive({Frame})')[0]||'';
const history=readFileSync('src/LibraryHistoryChronicle.jsx','utf8');

describe('My Library reading history runtime safety',()=>{
 it('mounts the combined History component without leaving removed helpers in the old conditional',()=>{
  expect(live).toContain("import LibraryHistoryChronicle from './LibraryHistoryChronicle'");
  expect(library).toContain("tab==='history'&&<LibraryHistoryChronicle");
  expect(library).not.toContain('storyHistoryLabel(');
  expect(library).not.toContain('storyHistoryDetails(');
  expect(history).toContain('buildLibraryHistoryEntries(');
  expect(history).toContain('getPalaceHistoryMoments(userId)');
 });
 it('preserves verifiable chapter labels and stats in the shared history model',()=>{
  const work={title:'A Court of Moons',last_published_at:'2026-10-11T10:00:00Z'};
  const chapters=[{status:'published',title:'The First Tide',published_at:'2026-10-11T10:00:00Z',word_count:1964}];
  const result=storyHistoryDetails(work,chapters);
  expect(storyHistoryLabel(result)).toBe('New chapter published');
  expect(result.chapterCount).toBe(1);
  expect(result.wordCount).toBe(1964);
 });
});
