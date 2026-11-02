import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import {isHostedFanfiction,canDisplayHostedArchive} from '../src/palaceFanfictionDiscovery.js';
import {canReadHostedClassic} from '../src/directClassicModel.js';
import {mergeReadingArchivePage,readingArchiveTotal} from '../src/readingHostedIntegration.js';
import {toHostedReadingWork} from '../src/hostedReadingWork.js';

const source=readFileSync('src/liveRooms.jsx','utf8');


describe('Main Reading Room includes genuinely readable archive fanfiction',()=>{
 it('does not rely only on published member-story pagination for hosted fanfiction',()=>{
  expect(source).toContain('const hostedFanworksInArchive=filtered.filter');
  expect(source).toContain("w.is_archive&&w.work_type==='fanwork'");
  expect(source).toContain('mergeReadingArchivePage({');
  expect(source).toContain('includeHosted:origin===\'all\'');
  expect(source).toContain('visibleCatalogue.map(w=>{');
  expect(source).toContain("archiveRows.filter(canDisplayHostedArchive)");
  expect(source).toContain('matching published member stories and hosted fanfiction');
  expect(source).toContain('total={archiveBrowse.snapshot?.total||0}');
 });
 it('keeps unpublished permission notes out of the Reading shelf and reader',()=>{
  const intake={category:'licensed_fanfiction',publication_status:'draft',host_mode:'metadata_only',
   rights_status:'licensed',verified_at:null};
  expect(isHostedFanfiction(intake)).toBe(true);
  expect(canDisplayHostedArchive(intake)).toBe(false);
  expect(canReadHostedClassic(intake)).toBe(false);
  const published={...intake,publication_status:'published',host_mode:'full',verified_at:'2026-11-01T00:00:00Z'};
  expect(canDisplayHostedArchive(published)).toBe(false);
  expect(canReadHostedClassic(published)).toBe(false);
  const cleared={...published,hosted_rights_verified:true,hosted_text_ready:true};
  expect(canDisplayHostedArchive(cleared)).toBe(true);
  expect(canReadHostedClassic(cleared)).toBe(true);
 });
 it('merges published hosted fanfiction only on the first server page, with no duplicate cards or phantom pages',()=>{
  const member={id:'member-1',title:'Member Story',last_published_at:'2026-10-30T00:00:00Z'};
  const hosted=toHostedReadingWork({id:'archive-1',title:'Anime Fanfic',slug:'anime-fic',
   creator_name:'Original Writer',category:'licensed_fanfiction',rights_status:'licensed',
   summary:'An approved anime fanwork',original_language:'English',verified_at:'2026-11-01T00:00:00Z'});
  expect(hosted.work_type).toBe('fanwork');
  expect(hosted.profiles.display_name).toBe('Original Writer');
  expect(hosted.work_tags.some(tag=>tag.tags.name==='Fan-made Works')).toBe(true);
  expect(mergeReadingArchivePage({members:[member],hostedFanworks:[hosted],includeHosted:true,page:0})).toHaveLength(2);
  expect(mergeReadingArchivePage({members:[member],hostedFanworks:[hosted],includeHosted:true,page:1})).toHaveLength(1);
  expect(mergeReadingArchivePage({members:[member],hostedFanworks:[hosted],includeHosted:false,page:0})).toHaveLength(1);
  expect(readingArchiveTotal({memberTotal:6,hostedCount:2,includeHosted:true})).toBe(8);
  expect(readingArchiveTotal({memberTotal:6,hostedCount:2,includeHosted:false})).toBe(6);
 });
});
