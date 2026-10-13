import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {storyHistoryDetails,storyHistoryLabel} from './storyHistoryModel';

const live=readFileSync('src/liveRooms.jsx','utf8');
const library=live.split('export function LibraryLive({Frame})')[1]?.split('export function PalaceLifeLive({Frame})')[0]||'';

describe('My Library reading history runtime safety',()=>{
 it('imports every history helper referenced by the Library shelf',()=>{
  // This guard is necessary because Vite successfully bundles names that throw
  // ReferenceError only when this particular conditional History tab renders.
  expect(library).toContain("tab==='history'");
  expect(library).toContain('storyHistoryLabel(');
  expect(library).toContain('storyHistoryDetails(');
  expect(live).toMatch(/import\s*\{[^}]*\bstoryHistoryDetails\b[^}]*\bstoryHistoryLabel\b[^}]*\}\s*from\s*['"]\.\/storyHistoryModel['"]/);
 });
 it('resolves both label and details for a populated story without crashing',()=>{
  const work={title:'A Court of Moons',last_published_at:'2026-10-11T10:00:00Z'};
  const chapters=[{status:'published',title:'The First Tide',published_at:'2026-10-11T10:00:00Z',word_count:1964}];
  const result=storyHistoryDetails(work,chapters);
  expect(storyHistoryLabel(result)).toBe('New chapter published');
  expect(result.chapterCount).toBe(1);
  expect(result.wordCount).toBe(1964);
 });
});
