import {expect,it} from 'vitest';
import {toHostedReadingWork} from './hostedReadingWork';
import {readingStoryPresentation} from './readingStoryPresentation';

it.each([
 ['a-house-boat-on-the-styx-john-kendrick-bangs','Literary crossover'],
 ['alice-in-blunderland-john-kendrick-bangs','Literary satire'],
 ['edisons-conquest-of-mars-garrett-p-serviss','Literary sequel']
])('keeps the edition and fandom links for %s', (slug,genre)=>{
 const work=toHostedReadingWork({id:'fixture',slug,category:'historical_fanfiction',rights_status:'public_domain_verified',archive_novel_tags:[{id:'rel',name:'Gen',category:'relationship',status:'canonical'}],archive_resolved_tags:[{id:'source',name:'Source literature',category:'fandom',status:'canonical'}]});
 expect(work.archive_record_id).toBe('fixture');
 expect(work.slug).toBe(slug);
 expect(work.work_tags.map(row=>row.tags.name)).toEqual(['Palace Classics',genre,'Source literature','Gen']);
 expect(readingStoryPresentation(work).kind).toBe('Palace Classic');
 expect(work.rights_status).toBe('public_domain_verified');
});

it('identifies a hosted licensed fanwork on the same card',()=>{
 const work=toHostedReadingWork({id:'modern',category:'licensed_fanfiction',rights_status:'creator_authorised'});
 expect(readingStoryPresentation(work).kind).toBe('Hosted fanfiction');
 expect(work.work_tags[0].tags.name).toBe('Fan-made Works');
});
