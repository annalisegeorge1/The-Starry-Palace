import {readingArchiveWorkType,isHostedFanfiction} from './palaceFanfictionDiscovery';
import {hostedFanfictionGuide,hostedFanfictionCompletion,archiveFanfictionTags} from './fanfictionMetadata';

/** One display model for published archive editions in Reading and Fandom Atlas.
 * This never turns permission-only metadata into a published story. Callers
 * must first use canDisplayHostedArchive on records from the published API.
 */
export function toHostedReadingWork(record){
 const fanwork=isHostedFanfiction(record);
 const collectionName=fanwork?'Fan-made Works':'Palace Classics';
 const category=String(record.category||'classic').replaceAll('_',' ');
 const tags=fanwork?
  (Array.isArray(record.archive_resolved_tags)&&record.archive_resolved_tags.length?
   record.archive_resolved_tags.map(tag=>({tags:tag})):
   archiveFanfictionTags(record)):[];
 return {
  id:'archive-'+record.id,archive_record_id:record.id,is_archive:true,
  title:record.title,slug:record.slug,summary:record.summary,
  archive_category:record.category,work_type:readingArchiveWorkType(record),
  rating:fanwork?hostedFanfictionGuide(record).rating:'not_rated',
  rights_status:record.rights_status,archive_source_url:record.archive_source_url||null,
  creator_name:record.creator_name,language:record.original_language||'English',
  completion_status:fanwork?hostedFanfictionCompletion(record):'complete',
  cover_url:null,first_published_at:null,
  last_published_at:record.updated_at||record.verified_at,
  profiles:{display_name:record.creator_name,
   title:record.category==='licensed_fanfiction'?'Guest fan writer':'Palace Classic',
   username:null,avatar_url:null},
  work_tags:[
   {tags:{id:'archive-collection-'+(fanwork?'fanwork':'classic'),name:collectionName,category:'format',status:'canonical'}},
   {tags:{id:'archive-category-'+(record.category||'classic'),name:category,category:'genre',status:'canonical'}},
   ...tags
  ]
 };
}
