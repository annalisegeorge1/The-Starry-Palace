import {describe,it,expect} from 'vitest';
import {parseHostedFanworkMetadata} from '../src/hostedFanworkMetadata.js';
import {hostedFanfictionGuide,hostedFanfictionCompletion,archiveFanfictionTags} from '../src/fanfictionMetadata.js';
import {LICENSED_ANIME_FANWORK_INTAKE} from '../src/licensedAnimeFanworkIntake.js';

const sample=LICENSED_ANIME_FANWORK_INTAKE.find(item=>item.slug==='nindo-of-the-force-1-michaelzorch');
const record=overrides=>({
 ...sample,category:'licensed_fanfiction',original_language:'English',
 source_notes:JSON.stringify({
  rating:sample.rating,source_rating:sample.sourceRating,fandom:sample.fandom,
  genres:sample.genres,characters:sample.characters,
  relationships:sample.relationships,tropes:sample.tropes,warnings:sample.warnings,
  source_url:sample.sourceUrl,permission_url:sample.permissionUrl,
  license:sample.sourceLicense,completion_status:sample.completion_status,
  chapter_count:sample.chapters
 }),...overrides
});

describe('Hosted fanfiction metadata from original archival record',()=>{
 it('uses saved metadata for published editions and splits crossovers',()=>{
  const r=record({slug:'independently-imported-naruto-work'});
  const parsed=parseHostedFanworkMetadata(r);
  expect(parsed?.rating).toBe('mature');
  expect(parsed?.completionStatus).toBe('complete');
  expect(parsed?.chapters).toBe(10);
  expect(parsed?.tags.filter(tag=>tag.category==='fandom').map(tag=>tag.name))
   .toEqual(['Naruto','Star Wars']);
  expect(hostedFanfictionGuide(r).tags.some(tag=>tag.category==='character'&&tag.name==='Naruto Uzumaki')).toBe(true);
  expect(hostedFanfictionCompletion(r)).toBe('complete');
  expect(archiveFanfictionTags(r).some(row=>row.tags.name==='Star Wars')).toBe(true);
 });
 it('does not trust arbitrary source notes, fake ratings or incomplete record fields',()=>{
  expect(parseHostedFanworkMetadata(record({source_notes:'non-JSON'}))).toBeNull();
  expect(parseHostedFanworkMetadata({category:'historical_fanfiction',source_notes:'{}'})).toBeNull();
  const r=record({slug:'newly-approved',source_notes:JSON.stringify({
   rating:'adult_999',completion_status:'unknown',fandom:['Naruto','Star Wars','Naruto'],
   warnings:['Violence','Violence',''],source_url:'javascript:alert(1)',
   permission_url:'http://example.org/terms',chapters:999,
   chapter_count:-4
  })});
  const v=parseHostedFanworkMetadata(r);
  expect(v.rating).toBe('not_rated');
  expect(v.completionStatus).toBe('in_progress');
  expect(v.sourceUrl).toBe('');
  expect(v.permissionUrl).toBe('');
  expect(v.chapters).toBeNull();
  expect(v.contentWarnings).toEqual(['Violence']);
  expect(v.tags.filter(x=>x.category==='fandom').map(x=>x.name)).toEqual(['Naruto','Star Wars']);
  expect(hostedFanfictionCompletion(r)).toBe('in_progress');
 });
 it('keeps historical fanfiction unaffected by licensed intake metadata',()=>{
  const historical={category:'historical_fanfiction',slug:'old-friends-and-new-fancies-sybil-g-brinton'};
  expect(parseHostedFanworkMetadata(historical)).toBeNull();
  expect(hostedFanfictionGuide(historical).rating).toBe('not_rated');
  expect(hostedFanfictionCompletion(historical)).toBe('complete');
 });
});
