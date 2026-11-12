import {describe,it,expect} from 'vitest';
import {parseHostedFanworkMetadata} from '../src/hostedFanworkMetadata.js';
import {hostedFanfictionGuide,hostedFanfictionCompletion,archiveFanfictionTags} from '../src/fanfictionMetadata.js';
import {isHostedFanfiction,canDisplayHostedArchive} from '../src/palaceFanfictionDiscovery.js';

const pd={
 id:'example-pd',slug:'alice-in-blunderland-john-kendrick-bangs',
 category:'historical_fanfiction',publication_status:'published',host_mode:'full',
 rights_status:'public_domain_verified',creator_name:'John Kendrick Bangs',
 original_language:'English',
 source_notes:JSON.stringify({
  fandom:'Alice in Wonderland',genre:['Fantasy'],genres:['Fantasy','Humour'],
  characters:['Alice','The Cheshire Cat'],tropes:['Parody','Public Domain Fanfiction'],
  warnings:[],rating:'general',source_rating:'Editorial provisional: general',
  completion_status:'complete',chapter_count:7
 })
};
describe('Public-domain hosted fanfiction source metadata',()=>{
 it('uses original archive metadata for historical works without treating them as modern link-only intake',()=>{
  const x=parseHostedFanworkMetadata(pd);
  expect(x).toBeTruthy();
  expect(x.tags.filter(t=>t.category==='format')).toEqual([]);
  expect(x.rating).toBe('general');
  expect(x.ratingBasis).toBe('editorial');
  expect(x.tags.some(t=>t.category==='fandom'&&t.name==='Alice in Wonderland')).toBe(true);
  expect(x.tags.some(t=>t.category==='character'&&t.name==='The Cheshire Cat')).toBe(true);
  expect(hostedFanfictionGuide(pd).rating).toBe('general');
  expect(hostedFanfictionCompletion(pd)).toBe('complete');
  expect(archiveFanfictionTags(pd).some(t=>t.tags.name==='Alice in Wonderland')).toBe(true);
  expect(isHostedFanfiction(pd)).toBe(true);
  expect(canDisplayHostedArchive(pd)).toBe(true);
 });
 it('keeps previously published historical works that have plain-text provenance on legacy fallback',()=>{
  const legacy={slug:'old-friends-and-new-fancies-sybil-g-brinton',category:'historical_fanfiction',
   source_notes:'Project Gutenberg source notes'};
  expect(parseHostedFanworkMetadata(legacy)).toBeNull();
  expect(hostedFanfictionGuide(legacy).rating).toBe('not_rated');
 });
 it('never treats an unpublished archival record as a public source just because text metadata exists',()=>{
  expect(canDisplayHostedArchive({...pd,publication_status:'draft'})).toBe(false);
 });
});
