import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import {isHostedFanfiction,canDisplayHostedArchive} from '../src/palaceFanfictionDiscovery.js';
import {canReadHostedClassic} from '../src/directClassicModel.js';

const source=readFileSync('src/liveRooms.jsx','utf8');
const css=readFileSync('src/unified-fanwork-catalogue.css','utf8');

describe('Main Reading Room includes genuinely readable archive fanfiction',()=>{
 it('does not rely only on published member-story pagination for hosted fanfiction',()=>{
  expect(source).toContain('const hostedFanworksInArchive=filtered.filter');
  expect(source).toContain("w.is_archive&&w.work_type==='fanwork'");
  expect(source).toContain("archiveBrowseEnabled&&origin==='all'&&hostedFanworksInArchive.length>0");
  expect(source).toContain('className="reading-hosted-fanworks"');
  expect(source).toContain('to={directClassicHref(work)}');
  expect(source).toContain("archiveRows.filter(canDisplayHostedArchive)");
  expect(source).toContain("hosted fanfiction displayed separately below");
  expect(css).toContain('.reading-hosted-fanwork-card');
 });
 it('keeps unpublished permission notes out of the Reading shelf and reader',()=>{
  const intake={category:'licensed_fanfiction',publication_status:'draft',host_mode:'metadata_only',
   rights_status:'licensed',verified_at:null};
  expect(isHostedFanfiction(intake)).toBe(true);
  expect(canDisplayHostedArchive(intake)).toBe(false);
  expect(canReadHostedClassic(intake)).toBe(false);
  const published={...intake,publication_status:'published',host_mode:'full',verified_at:'2026-11-01T00:00:00Z'};
  expect(canDisplayHostedArchive(published)).toBe(true);
  expect(canReadHostedClassic(published)).toBe(true);
 });
});
