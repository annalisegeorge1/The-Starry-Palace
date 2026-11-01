import {describe,it,expect} from 'vitest';
import {LICENSED_ANIME_FANWORK_INTAKE} from '../src/licensedAnimeFanworkIntake.js';
import {isHostedFanfiction,canDisplayHostedArchive,readingArchiveWorkType} from '../src/palaceFanfictionDiscovery.js';
import {canReadHostedClassic} from '../src/directClassicModel.js';
import {hostedFanfictionGuide,hostedFanfictionCompletion,archiveFanfictionTags} from '../src/fanfictionMetadata.js';

describe('Author-licensed fanfiction intake and safe publication',()=>{
 it('documents source, author, license, age rating and fandom tags for every new candidate',()=>{
  expect(LICENSED_ANIME_FANWORK_INTAKE).toHaveLength(29);
  expect(new Set(LICENSED_ANIME_FANWORK_INTAKE.map(w=>w.slug)).size).toBe(29);
  expect(new Set(LICENSED_ANIME_FANWORK_INTAKE.map(w=>w.sourceUrl)).size).toBe(29);
  for(const work of LICENSED_ANIME_FANWORK_INTAKE){
   expect(work.creator.length).toBeGreaterThan(0);
   expect(work.permissionUrl).toMatch(/^https:\/\//);
   expect(work.sourceUrl).toMatch(/^https:\/\//);
   expect(work.sourceLicense).toMatch(/^CC BY/);
   expect(work.stage).toMatch(/^(metadata_ready|permission_scope_review)_text_not_imported$/);
   expect(work.chapters).toBeGreaterThan(0);
   expect(['general','teen','mature','explicit','not_rated']).toContain(work.rating);
   const guide=hostedFanfictionGuide(work);
   expect(guide.rating).toBe(work.rating);
   expect(guide.tags.some(t=>t.category==='fandom'&&t.name===work.fandom)).toBe(true);
   expect(guide.tags.some(t=>t.category==='format'&&t.name==='Anime & Manga')).toBe(true);
   expect(hostedFanfictionCompletion(work)).toBe(work.completion_status);
   expect(archiveFanfictionTags(work).length).toBeGreaterThan(2);
  }
 });
 it('does not mistake licensed modern fanfiction for public-domain classics or expose drafts',()=>{
  const base={category:'licensed_fanfiction',host_mode:'full',rights_status:'licensed'};
  expect(isHostedFanfiction(base)).toBe(true);
  expect(readingArchiveWorkType(base)).toBe('fanwork');
  expect(canDisplayHostedArchive(base)).toBe(false);
  expect(canReadHostedClassic({...base,publication_status:'draft',verified_at:'2026-11-01'})).toBe(false);
  expect(canReadHostedClassic({...base,publication_status:'published'})).toBe(false);
  expect(canReadHostedClassic({...base,publication_status:'published',verified_at:'2026-11-01'})).toBe(true);
  expect(canReadHostedClassic({...base,publication_status:'published',host_mode:'citation',verified_at:'2026-11-01'})).toBe(false);
  expect(canDisplayHostedArchive({...base,host_mode:'full',rights_status:'unresolved',verified_at:'2026-11-01'})).toBe(false);
 });
 it('does not disrupt public-domain historic fanfiction',()=>{
  const historical={category:'historical_fanfiction',rights_status:'public_domain_verified',host_mode:'full',publication_status:'published'};
  expect(isHostedFanfiction(historical)).toBe(true);
  expect(canDisplayHostedArchive(historical)).toBe(true);
  expect(canReadHostedClassic(historical)).toBe(true);
  expect(readingArchiveWorkType(historical)).toBe('fanwork');
 });
});
