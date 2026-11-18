import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';

const live=readFileSync('src/liveRooms.jsx','utf8');
const reading=live.split('export function ReadingLive({Frame})')[1].split('export function WritingLive({Frame})')[0];
const sidebar=readFileSync('src/ReadingFacetSidebar.jsx','utf8');
const prefs=readFileSync('src/useReadingDiscoveryState.js','utf8');

describe('honest Reading Rooms precision scope',()=>{
 it('applies all loaded-shelf predicates before sorting and never filters only an archive result page',()=>{
  expect(reading).toContain('matchesReadingPrecision(w,readingChoices.precision)');
  expect(reading).toContain("!hasReadingPrecision(readingChoices.precision)&&isArchiveReadingSort(catalogueSort)");
  expect(reading).toContain("setReadingChoice('catalogueScope','loaded')");
  expect(reading).toContain('precision={readingChoices.precision}');
  expect(reading).toContain("setReadingChoice('precision',READING_PRECISION_DEFAULTS)");
 });
 it('does not bypass precision in a linked fanfiction gallery',()=>{
  expect(reading).toContain('archiveWorks.filter(w=>matchesReadingPrecision(w,readingChoices.precision))');
  expect(reading).toContain('externalWorks={hasReadingPrecision(readingChoices.precision)?[]:MODERN_FANFICTION_LINKS}');
  expect(reading).toContain('Source-linked recommendations without compatible metadata are hidden');
 });
 it('tells readers which filters are loaded-only and preserves per-reader choices',()=>{
  expect(sidebar).toContain('currently loaded stories only');
  expect(sidebar).toContain('Include word counts');
  expect(sidebar).toContain('Exclude word counts');
  expect(sidebar).toContain('Include dates');
  expect(sidebar).toContain('Exclude dates');
  expect(sidebar).toContain('Crossovers');
  expect(prefs).toContain('clean.precision=cleanReadingPrecision(value.precision)');
 });
});
