import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import {isHistoricalFanfiction,readingArchiveWorkType,MODERN_FANFICTION_LINKS} from '../src/palaceFanfictionDiscovery.js';

const reading=readFileSync('src/liveRooms.jsx','utf8');
const shelf=readFileSync('src/PalaceFanfictionShelf.jsx','utf8');
const css=readFileSync('src/palace-fanfiction-shelf.css','utf8');

describe('Fanfiction section contains rights-aware historical and modern discoveries',()=>{
 it('classifies only historic archive fanfics as fanworks, preserving other Classics',()=>{
  expect(isHistoricalFanfiction({category:'historical_fanfiction'})).toBe(true);
  expect(isHistoricalFanfiction({archive_category:'historical_fanfiction'})).toBe(true);
  expect(isHistoricalFanfiction({category:'modern_fanfiction'})).toBe(false);
  expect(readingArchiveWorkType({category:'historical_fanfiction'})).toBe('fanwork');
  expect(readingArchiveWorkType({category:'classic_novel'})).toBe('archive');
 });
 it('places archived historical fanfic in the existing Fanfiction origin and uses the correct hosted reader',()=>{
  expect(reading).toContain("summary:r.summary,archive_category:r.category,work_type:readingArchiveWorkType(r)");
  expect(reading).toContain("origin==='fandom'&&!advancedView&&<PalaceFanfictionShelf archiveWorks={archiveWorks}/>");
  expect(reading).toContain('>Fanfiction</button>');
  expect(shelf).toContain("directClassicHref(work)");
  expect(shelf).toContain("PUBLIC DOMAIN · HOSTED ON THE PALACE");
 });
 it('links to actual writers and their permission evidence without mirroring modern text',()=>{
  expect(MODERN_FANFICTION_LINKS).toHaveLength(4);
  expect(new Set(MODERN_FANFICTION_LINKS.map(w=>w.id)).size).toBe(4);
  expect(new Set(MODERN_FANFICTION_LINKS.map(w=>w.creator)).size).toBeGreaterThan(1);
  for(const w of MODERN_FANFICTION_LINKS){
   expect(w.title).toBeTruthy();
   expect(w.creator).toBeTruthy();
   expect(w.fandom).toBeTruthy();
   expect(w.sourceUrl).toMatch(/^https:\/\//);
   expect(w.permissionUrl).toMatch(/^https:\/\//);
   expect(w.permissionLabel).toMatch(/^CC BY-NC-SA/);
  }
  expect(shelf).toContain('target="_blank" rel="noopener noreferrer"');
  expect(shelf).toContain("Read on author's site");
  expect(shelf).toContain('not reposted stories');
  expect(shelf).not.toContain('body_text');
  expect(shelf).not.toContain('dangerouslySetInnerHTML');
 });
 it('uses the existing theme and avoids new mobile dock or navigation geometry',()=>{
  expect(css).toContain('var(--ui-surface)');
  expect(css).toContain('var(--ui-text)');
  expect(css).toContain('@media(max-width:620px)');
  expect(css).not.toContain('.mobile-palace-dock');
  expect(css).not.toContain('.full-topbar');
 });
});
