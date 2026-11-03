import {supabase} from './supabase';

/**
 * Owner-only Phase 1 reads. All database row/column access remains subject to
 * existing Supabase RLS. Never use a service-role key in this browser module.
 * No INSERT, UPDATE, DELETE, RPC mutation, or manuscript body reads.
 */
function client(){if(!supabase)throw Error('Palace data connection unavailable.');return supabase}
export async function getPalaceObservatoryAccess(userId){
 if(!userId)return false;
 const {data,error}=await client().from('platform_memberships')
  .select('platform_role,suspended').eq('user_id',userId).maybeSingle();
 if(error)throw error;
 return data?.platform_role==='owner'&&data?.suspended===false;
}
async function selectPages(table,fields,orderColumn='id'){
 const results=[],size=200,max=2000;
 for(let start=0;start<max;start+=size){
  const {data,error}=await client().from(table).select(fields)
   .order(orderColumn,{ascending:true}).range(start,start+size-1);
  if(error)throw error;
  results.push(...(data||[]));
  if((data||[]).length<size)return results;
 }
 throw Error('Observatory result limit reached. Add server-side paging before relying on these totals.');
}
export async function readPalaceObservatoryMetadata(){
 // Revalidate identity and Owner membership on every refresh. A route guard
 // alone is not an authorization boundary; RLS is still authoritative.
 const {data:{user},error}=await client().auth.getUser();
 if(error||!user||!await getPalaceObservatoryAccess(user.id))
  throw Error('Owner access is required. No catalogue records were loaded.');
 const [works,archive,rights,texts]=await Promise.all([
  selectPages('works',
   'id,title,slug,work_type,publication_status,visibility,rating,work_tags(tags(id,name,category,status)),profiles!works_author_id_fkey(username,display_name)'),
  selectPages('archive_records',
   'id,title,slug,creator_name,category,publication_status,host_mode,rights_status,rating,hosted_word_count,minimum_reader_age,source_notes'),
  selectPages('archive_rights_records',
   'id,record_id,basis,status,permits_hosting,verified_at,valid_from,valid_until'),
  selectPages('archive_texts','record_id,word_count,source_url','record_id')
 ]);
 // Do not load private member works. Owners do not automatically have access
 // to manuscripts belonging to other members, and must not acquire it here.
 return {works:works.filter(w=>w.publication_status==='published'&&w.visibility==='public'),
  archive,rights,texts};
}
