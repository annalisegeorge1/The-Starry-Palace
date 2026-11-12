import {readingArchiveWorkType,isHostedFanfiction} from './palaceFanfictionDiscovery';
import {hostedFanfictionGuide,hostedFanfictionCompletion,archiveFanfictionTags} from './fanfictionMetadata';

const classicGenres=new Map([
 ['a-house-boat-on-the-styx-john-kendrick-bangs','Literary crossover'],
 ['alice-in-blunderland-john-kendrick-bangs','Literary satire'],
 ['edisons-conquest-of-mars-garrett-p-serviss','Literary sequel']
]);

/** One display model for published archive editions in Reading and Fandom Atlas.
 * This never turns permission-only metadata into a published story. Callers
 * must first use canDisplayHostedArchive on records from the published API.
 */
export function toHostedReadingWork(record){
 const fanwork=isHostedFanfiction(record);
 const classicGenre=record.category==='historical_fanfiction'&&classicGenres.get(record.slug);
 const fanCollection=fanwork&&!classicGenre;
 const collectionName=fanCollection?'Fan-made Works':'Palace Classics';
 const category=classicGenre||String(record.category||'classic').replaceAll('_',' ');
 const tags=fanwork?
  (Array.isArray(record.archive_resolved_tags)&&record.archive_resolved_tags.length?
   record.archive_resolved_tags.map(tag=>({tags:tag})):
   archiveFanfictionTags(record)):[];
 const linkedTags=Array.isArray(record.archive_novel_tags)?record.archive_novel_tags:[];
 const additionalTags=fanwork&&!classicGenre?[]:linkedTags.filter(tag=>
  !tags.some(row=>row.tags.category===tag.category&&row.tags.name===tag.name));
 return {
  id:'archive-'+record.id,archive_record_id:record.id,is_archive:true,
  title:record.title,slug:record.slug,summary:record.summary,
  archive_category:record.category,work_type:readingArchiveWorkType(record),
  rating:fanwork?hostedFanfictionGuide(record).rating:(record.rating|| (record.category==='licensed_web_serial'?'teen':'not_rated')),
  rights_status:record.rights_status,archive_source_url:record.archive_source_url||null,
  creator_name:record.creator_name,language:record.original_language||'English',
  minimum_reader_age:record.minimum_reader_age||13,
  completion_status:fanwork?hostedFanfictionCompletion(record):record.category==='licensed_web_serial'?'in_progress':'complete',
  cover_url:null,first_published_at:null,
  last_published_at:record.updated_at||record.verified_at,
  profiles:{display_name:record.creator_name,
   title:record.category==='licensed_fanfiction'?'Guest fan writer':record.category==='licensed_web_serial'?'Guest web novelist':'Palace Classic',
   username:null,avatar_url:null},
  work_tags:[
   {tags:{id:'archive-collection-'+(fanCollection?'fanwork':'classic'),name:collectionName,category:'format',status:'canonical'}},
   {tags:{id:'archive-category-'+(classicGenre||record.category||'classic'),name:category,category:'genre',status:'canonical'}},
   ...tags,
   ...additionalTags.map(tag=>({tags:tag}))
  ]
 };
}
