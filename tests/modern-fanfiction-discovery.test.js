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
  expect(MODERN_FANFICTION_LINKS).toHaveLength(44);
  expect(new Set(MODERN_FANFICTION_LINKS.map(w=>w.id)).size).toBe(44);
  expect(new Set(MODERN_FANFICTION_LINKS.map(w=>w.creator)).size).toBeGreaterThanOrEqual(7);
  for(const w of MODERN_FANFICTION_LINKS){
   expect(w.title).toBeTruthy();
   expect(w.creator).toBeTruthy();
   expect(w.fandom).toBeTruthy();
   expect(w.sourceUrl).toMatch(/^https:\/\//);
   expect(w.permissionUrl).toMatch(/^https:\/\//);
   expect(w.permissionLabel).toMatch(/^(?:CC BY-(?:NC-(?:SA|ND)|SA)|Creative Commons (?:noncommercial|derivative, noncommercial))/);
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
  expect(filterModernFanfiction(MODERN_FANFICTION_LINKS,{rating:'mature'}).map(w=>w.id)).toContain('ken1245632-naruto-dragon-chronicles');
  expect(filterModernFanfiction(MODERN_FANFICTION_LINKS,{rating:'not_rated'}).some(w=>w.id==='dawn-home-alone')).toBe(true);
  expect(shelf).toContain('<FanfictionGuide guide={historicFanfictionGuide(work)}/>');
  expect(shelf).toContain('modernFanfictionGuide(work)');
  expect(reading).toContain('...archiveFanfictionTags(r)');
 });
 it('documents new modern fanworks, their source ratings and authors stated licences',()=>{
  const ids=['watchword-summer-for-saya','watchword-only-man','sittscho-rwbynov-volume-one',
   'svensons-vikings-thing','lancer47-what-happened-here','squibstress-one-to-keep-an-eye-on',
   'squibstress-natural-law','squibstress-bonnie-wee-thing','squibstress-de-aegypto',
   'merlintirianius-obligations'];
  expect(ids).toHaveLength(10);
  for(const id of ids){
   const item=MODERN_FANFICTION_LINKS.find(work=>work.id===id);
   expect(item).toBeTruthy();
   expect(item.permissionUrl).toBe(item.sourceUrl);
   expect(item.permissionLabel).toMatch(/(?:Creative Commons|CC BY-NC-SA)/);
   const guide=modernFanfictionGuide(item);
   expect(guide.tags.some(tag=>tag.category==='fandom')).toBe(true);
   expect(guide.sourceRating).toBeTruthy();
  }
  expect(modernFanfictionGuide({id:'squibstress-bonnie-wee-thing'}).rating).toBe('general');
  expect(modernFanfictionGuide({id:'sittscho-rwbynov-volume-one'}).rating).toBe('teen');
  expect(modernFanfictionGuide({id:'watchword-summer-for-saya'}).rating).toBe('mature');
  const bioshock=modernFanfictionGuide({id:'watchword-only-man'});
  expect(bioshock.rating).toBe('mature');
  expect(bioshock.ratingBasis).toBe('editorial');
  expect(bioshock.sourceRating).toContain('FanFiction.net T');
  expect(bioshock.contentWarnings).toContain('Sexual assault');
  expect(filterModernFanfiction(MODERN_FANFICTION_LINKS,{query:'Yang Xiao Long'}).some(x=>x.id==='sittscho-rwbynov-volume-one')).toBe(true);
  expect(filterModernFanfiction(MODERN_FANFICTION_LINKS,{query:'Stargate SG-1'}).some(x=>x.id==='lancer47-what-happened-here')).toBe(true);
 });
 it('adds twelve permission-checked multi-fandom stories with real original-story destinations',()=>{
  const newIds=[
   'hushbugger-the-long-night','hushbugger-yet-here-i-remain',
   'hushbugger-socrates-in-the-caves','hushbugger-human-habits',
   'robinwingster-bobbin-around','scyllaya-bend-around-the-wind',
   'lordtrychon-a-sith-by-any-other-name','jtheclivaz-every-day-the-same-nightmare',
   'nemebean-mom','perspicacity-riding-the-l',
   'griffyn612-lost-boys-dresdenverse','siriuslyfun19212-alive'
  ];
  expect(newIds).toHaveLength(12);
  for(const id of newIds){
   const work=MODERN_FANFICTION_LINKS.find(w=>w.id===id);
   expect(work).toBeTruthy();
   expect(work.sourceUrl).toMatch(/^https:\/\/www.fanfiction.net\/s\/\d+\//);
   expect(work.permissionUrl).toMatch(/^https:\/\/www.fanfiction.net\//);
   expect(work.permissionLabel).toMatch(/(?:CC BY-|Creative Commons)/);
   expect(modernFanfictionGuide(work).tags.some(t=>t.category==='fandom')).toBe(true);
   expect(modernFanfictionGuide(work).sourceRating).toBeTruthy();
  }
  expect(MODERN_FANFICTION_LINKS.filter(w=>w.creator==='HushBugger')).toHaveLength(4);
  expect(MODERN_FANFICTION_LINKS.filter(w=>w.creator==='HushBugger')
    .every(w=>w.permissionLabel.startsWith('CC BY-SA 4.0'))).toBe(true);
  expect(modernFanfictionGuide({id:'hushbugger-human-habits'}).rating).toBe('general');
  expect(modernFanfictionGuide({id:'robinwingster-bobbin-around'}).rating).toBe('teen');
  expect(modernFanfictionGuide({id:'scyllaya-bend-around-the-wind'}).rating).toBe('mature');
  expect(modernFanfictionGuide({id:'scyllaya-bend-around-the-wind'}).contentWarnings).toContain('Adult sexual content');
  expect(filterModernFanfiction(MODERN_FANFICTION_LINKS,{query:'Hollow Knight'}).map(w=>w.id)).toContain('hushbugger-yet-here-i-remain');
  expect(filterModernFanfiction(MODERN_FANFICTION_LINKS,{query:'Tony Stark/Loki'}).map(w=>w.id)).toContain('scyllaya-bend-around-the-wind');
 });
 it('uses the existing theme and avoids new mobile dock or navigation geometry',()=>{
  expect(css).toContain('var(--ui-surface)');
  expect(css).toContain('var(--ui-text)');
  expect(css).toContain('@media(max-width:620px)');
  expect(css).not.toContain('.mobile-palace-dock');
  expect(css).not.toContain('.full-topbar');
 });
});
