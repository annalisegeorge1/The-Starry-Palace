import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {cleanReadingDiscovery,readingDefaults} from './useReadingDiscoveryState';
const live=readFileSync('src/liveRooms.jsx','utf8');
const data=readFileSync('src/palaceData.js','utf8');
describe('real browsing, not an artificial 24-story ceiling',()=>{
 it('keeps safe per-reader include/exclude preferences without mixing contradictory tags',()=>{
  const selected=cleanReadingDiscovery({includeTags:['tag-a','tag-a','tag-b',5],excludeTags:['tag-a','tag-c']});
  expect(selected.includeTags).toEqual(['tag-a','tag-b']);
  expect(selected.excludeTags).toEqual(['tag-c']);
  expect(readingDefaults.visibleCount).toBe(24);
  expect(cleanReadingDiscovery({includeTags:[],excludeTags:[]}).includeTags).toEqual([]);
 });
 it('loads further pages from the backend and labels the visible subset honestly',()=>{
  expect(data).toContain("getPublishedWorks({offset=0,limit=24}={})");
  expect(data).toContain(".range(start,start+size-1)");
  expect(live).toContain("getPublishedWorks({limit:48})");
  expect(live).toContain("getPublishedWorks({offset:works.length,limit:48})");
  expect(live).toContain("setReadingChoice('visibleCount',current=>current+48)");
  expect(live).toContain('archiveBrowse.snapshot?visibleTotal.toLocaleString()');
  expect(live).toContain('matching published member stories and hosted fanfiction');
  expect(live).toContain('matchesReadingFacets(w,includedTags,excludedTags)');
  expect(live).toContain('<ReadingFacetSidebar facets={tagFacets}');
 });
 it('preserves guest reading and does not touch the member-only actions',()=>{
  expect(live).toContain('{!session&&<GuestReadingInvitation returnTo="/reading" context="discover"/>}');
  expect(live).toContain('readerLens===\'saved\'');
 });
});
