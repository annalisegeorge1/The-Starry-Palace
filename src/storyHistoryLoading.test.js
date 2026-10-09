import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {shouldFetchStoryHistory,canShowHistoryChapterDetails} from './storyHistoryLoading';
const live=readFileSync(resolve(process.cwd(),'src/liveRooms.jsx'),'utf8');

describe('Palace Life history fetch isolation',()=>{
 it('never loads history in other Palace Life rooms and caches successful loads',()=>{
  for(const room of ['commons','chat','circles','stars','forum','council'])expect(shouldFetchStoryHistory(room,'idle')).toBe(false);
  expect(shouldFetchStoryHistory('history','idle')).toBe(true);
  expect(shouldFetchStoryHistory('history','loading')).toBe(true);
  expect(shouldFetchStoryHistory('history','partial')).toBe(true);
  expect(shouldFetchStoryHistory('history','ready')).toBe(false);
 });
 it('does not publish fabricated chapter totals if metadata is missing',()=>{
  expect(canShowHistoryChapterDetails('partial')).toBe(false);
  expect(canShowHistoryChapterDetails('loading')).toBe(false);
  expect(canShowHistoryChapterDetails('ready')).toBe(true);
 });
 it('loads published metadata only on History and permits manual retry',()=>{
  expect(live).toContain('shouldFetchStoryHistory(room,historyLoadState)');
  expect(live).toContain('getStoryHistoryMetadata(works.map(x=>x.id))');
  expect(live).toContain("setHistoryLoadState('partial')");
  expect(live).toContain('setHistoryLoadVersion(v=>v+1)');
  expect(live).toContain('canShowHistoryChapterDetails(historyLoadState)');
 });
});
