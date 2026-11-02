import {sortReadingWorks} from './readingFacetModel';

/**
 * The published-member search is paginated by Supabase. Verified archive
 * fanworks are a separate, smaller hosted collection. Include them on the
 * first member-search page instead of creating a second visual catalogue.
 * Keep the server pager total separate: an archive fanwork is not a member row.
 */
export function mergeReadingArchivePage({members=[],hostedFanworks=[],page=0,sort='updated',includeHosted=false}={}){
 const rows=Array.isArray(members)?members:[];
 if(!includeHosted||page!==0)return rows;
 const seen=new Set(rows.map(row=>String(row.id)));
 const unique=[...rows];
 for(const work of Array.isArray(hostedFanworks)?hostedFanworks:[]){
  if(!work?.is_archive||work.work_type!=='fanwork'||!work.slug)continue;
  const key=String(work.id);
  if(seen.has(key))continue;
  seen.add(key);
  unique.push(work);
 }
 return sortReadingWorks(unique,sort);
}

/** Count both kinds of published results without inventing server pages. */
export function readingArchiveTotal({memberTotal=0,hostedCount=0,includeHosted=false}={}){
 const members=Math.max(0,Number(memberTotal)||0);
 const hosted=includeHosted?Math.max(0,Number(hostedCount)||0):0;
 return members+hosted;
}
