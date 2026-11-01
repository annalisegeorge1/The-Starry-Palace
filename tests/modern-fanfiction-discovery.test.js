import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import {isHistoricalFanfiction,readingArchiveWorkType,MODERN_FANFICTION_LINKS} from '../src/palaceFanfictionDiscovery.js';
import {MODERN_FANFICTION_GUIDES,HISTORICAL_FANFICTION_GUIDES,modernFanfictionGuide,historicFanfictionGuide,fanfictionRatingLabel,filterModernFanfiction,archiveFanfictionTags} from '../src/fanfictionMetadata.js';

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
  expect(MODERN_FANFICTION_LINKS).toHaveLength(22);
  expect(new Set(MODERN_FANFICTION_LINKS.map(w=>w.id)).size).toBe(22);
  expect(new Set(MODERN_FANFICTION_LINKS.map(w=>w.creator)).size).toBeGreaterThanOrEqual(7);
  for(const w of MODERN_FANFICTION_LINKS){
   expect(w.title).toBeTruthy();
   expect(w.creator).toBeTruthy();
   expect(w.fandom).toBeTruthy();
   expect(w.sourceUrl).toMatch(/^https:\/\//);
   expect(w.permissionUrl).toMatch(/^https:\/\//);
   expect(w.permissionLabel).toMatch(/^(?:CC BY-(?:NC-(?:SA|ND)|SA)|Creative Commons noncommercial)/);
  }
  expect(shelf).toContain('target="_blank" rel="noopener noreferrer"');
  expect(shelf).toContain('Read original');
  expect(shelf).toContain('not reposted stories');
  expect(shelf).not.toContain('body_text');
  expect(shelf).not.toContain('dangerouslySetInnerHTML');
  expect(MODERN_FANFICTION_LINKS.filter(w=>w.creator==='MorganAW')).toHaveLength(4);
  expect(MODERN_FANFICTION_LINKS.some(w=>w.creator==='Alixe'&&w.fandom.includes('French'))).toBe(true);
  expect(shelf).toContain('allowedModern.slice(0,visibleModernCount)');
  expect(shelf).toContain('Show more fanfiction');
  expect(shelf).toContain('I am 18+ · Show mature links');
  expect(shelf).toContain('fanfiction-filters');
 });
 it('assigns explicit ratings or not-rated status, readable tag families and warnings to every linked fanfic',()=>{
  expect(Object.keys(MODERN_FANFICTION_GUIDES).length).toBe(MODERN_FANFICTION_LINKS.length);
  expect(Object.keys(HISTORICAL_FANFICTION_GUIDES).length).toBe(2);
  for(const work of MODERN_FANFICTION_LINKS){
   const guide=modernFanfictionGuide(work);
   expect(guide).toBe(MODERN_FANFICTION_GUIDES[work.id]);
   expect(['general','teen','mature','explicit','not_rated']).toContain(guide.rating);
   expect(guide.tags.length).toBeGreaterThanOrEqual(2);
   expect(guide.tags.some(t=>t.category==='fandom')).toBe(true);
   expect(guide.tags.every(t=>typeof t.name==='string'&&t.name.length>0)).toBe(true);
   if(guide.ratingBasis==='source')expect(guide.sourceRating).toBeTruthy();
   if(guide.rating==='not_rated')expect(guide.sourceRating).toBeNull();
  }
  expect(modernFanfictionGuide({id:'morganaw-cunning-and-compromise'}).rating).toBe('teen');
  expect(modernFanfictionGuide({id:'squibstress-sweep'}).rating).toBe('teen');
  expect(modernFanfictionGuide({id:'ken1245632-naruto-dragon-chronicles'}).rating).toBe('mature');
  expect(modernFanfictionGuide({id:'dawn-yule-lights'}).rating).toBe('not_rated');
  expect(fanfictionRatingLabel(historicFanfictionGuide({slug:'the-adventure-of-the-two-collaborators-j-m-barrie'}))).toContain('Palace guide');
  expect(historicFanfictionGuide({slug:'old-friends-and-new-fancies-sybil-g-brinton'}).rating).toBe('not_rated');
  expect(archiveFanfictionTags({slug:'old-friends-and-new-fancies-sybil-g-brinton'}).some(t=>t.tags.category==='fandom')).toBe(true);
 });
 it('allows searching fanfiction by author, trope, character and rating without altering the originals',()=>{
  expect(filterModernFanfiction(MODERN_FANFICTION_LINKS,{query:'Percy Jackson'}).map(w=>w.id)).toContain('cateliot-inner-demons');
  expect(filterModernFanfiction(MODERN_FANFICTION_LINKS,{query:'Post-War'}).some(w=>w.id==='squibstress-sweep')).toBe(true);
  expect(filterModernFanfiction(MODERN_FANFICTION_LINKS,{query:'Bonnie Bennett',rating:'teen'}).map(w=>w.id)).toEqual(['simplynia-irresistible']);
  expect(filterModernFanfiction(MODERN_FANFICTION_LINKS,{rating:'mature'}).map(w=>w.id)).toEqual(['ken1245632-naruto-dragon-chronicles']);
  expect(filterModernFanfiction(MODERN_FANFICTION_LINKS,{rating:'not_rated'}).some(w=>w.id==='dawn-home-alone')).toBe(true);
  expect(shelf).toContain('<FanfictionGuide guide={historicFanfictionGuide(work)}/>');
  expect(shelf).toContain('modernFanfictionGuide(work)');
  expect(reading).toContain('...archiveFanfictionTags(r)');
 });
 it('uses the existing theme and avoids new mobile dock or navigation geometry',()=>{
  expect(css).toContain('var(--ui-surface)');
  expect(css).toContain('var(--ui-text)');
  expect(css).toContain('@media(max-width:620px)');
  expect(css).not.toContain('.mobile-palace-dock');
  expect(css).not.toContain('.full-topbar');
 });
});
