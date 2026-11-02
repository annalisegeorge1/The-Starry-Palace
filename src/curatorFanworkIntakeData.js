import {supabase} from './supabase';
import {validateFanworkManuscript,curatorImportEditionNote,safeManuscriptSource} from './fanworkManuscriptIntakeModel';

function client(){
 if(!supabase)throw Error('The Palace data connection is unavailable.');
 return supabase;
}
function parseIntakeNotes(value){
 try{
  const object=JSON.parse(value||'');
  return object&&typeof object==='object'&&!Array.isArray(object)?object:{};
 }catch{return {}}
}
/** Archive RLS exposes unpublished records only to authorized curators.
 * This method never exposes draft text to the public Reading Rooms.
 */
export async function getCuratorFanworkQueue(){
 const api=client();
 const {data:records,error}=await api.from('archive_records')
  .select('id,slug,title,creator_name,source_notes,publication_status,host_mode,rights_status,updated_at')
  .eq('category','licensed_fanfiction')
  .in('publication_status',['draft','review'])
  .order('title',{ascending:true}).limit(150);
 if(error)throw error;
 if(!records?.length)return [];
 const ids=records.map(record=>record.id);
 const [textResponse,rightResponse]=await Promise.all([
  api.from('archive_texts')
   .select('record_id,word_count,updated_at').in('record_id',ids),
  api.from('archive_rights_records')
   .select('record_id,basis,status,permits_hosting,valid_from,valid_until,verified_at')
   .in('record_id',ids)
 ]);
 if(textResponse.error)throw textResponse.error;
 if(rightResponse.error)throw rightResponse.error;
 const existing=new Map((textResponse.data||[]).map(row=>[row.record_id,row]));
 const grants=new Map();
 for(const grant of rightResponse.data||[]){
  if(!grants.has(grant.record_id))grants.set(grant.record_id,[]);
  grants.get(grant.record_id).push(grant);
 }
 return records.map(record=>{
  const source=parseIntakeNotes(record.source_notes);
  return {
   id:record.id,slug:record.slug,title:record.title,creator:record.creator_name,
   status:record.publication_status,hostingMode:record.host_mode,rightsStatus:record.rights_status,
   sourceUrl:safeManuscriptSource(source.source_url),sourceLicense:String(source.license||''),
   originalRating:String(source.rating||'not_rated'),
   fandom:String(source.fandom||''),expectedChapters:Number(source.chapter_count)||null,
   permissionUrl:safeManuscriptSource(source.permission_url),
   stagedWords:existing.get(record.id)?.word_count||0,
   lastStagedAt:existing.get(record.id)?.updated_at||null,
   rightsGrants:grants.get(record.id)||[],
   sourceWarnings:Array.isArray(source.warnings)?source.warnings:[],
   sourceTags:Array.isArray(source.tropes)?source.tropes:[],
   originalLanguage:record.original_language||source.language||'Unknown'
  };
 });
}
/** Stage the author-supplied text without changing publication or rights status.
 * Database RLS restricts writes to curators and draft/review fanfiction.
 */
export async function stageCuratorFanworkManuscript({record,body,sourceUrl,deliveryMethod,evidenceNote}){
 if(!record?.id||!record?.slug)throw Error('Select a valid fanfiction draft.');
 const result=validateFanworkManuscript({body,sourceUrl,deliveryMethod,evidenceNote});
 if(!result.valid)throw Error(result.errors.join(' '));
 const api=client();
 // Fail closed if another curator published or archived this record.
 const {data:fresh,error:fetchError}=await api.from('archive_records')
  .select('id,slug,category,publication_status,host_mode')
  .eq('id',record.id).eq('category','licensed_fanfiction').maybeSingle();
 if(fetchError)throw fetchError;
 if(!fresh||fresh.slug!==record.slug||!['draft','review'].includes(fresh.publication_status)||
    fresh.host_mode!=='metadata_only')throw Error('This draft is not available for manuscript staging.');
 const {data,error}=await api.from('archive_texts').upsert({
  record_id:record.id,body_text:result.text,word_count:result.wordCount,
  source_url:safeManuscriptSource(sourceUrl),source_title:record.title,
  source_license:record.sourceLicense||'Author declaration — verification pending',
  edition_note:curatorImportEditionNote({deliveryMethod,evidenceNote}),
  updated_at:new Date().toISOString()
 },{onConflict:'record_id'}).select('record_id,word_count,updated_at').single();
 if(error)throw error;
 // Evidence remains in the private, unverified rights-review queue, not in a
 // published edition note. Verification and permission to host are NEVER set
 // by the intake form. Rights-record SELECT remains curator-only until verified.
 const basis=deliveryMethod==='rights_holder_supplied'?'rights_holder_permission':'creator_permission';
 const review={
  record_id:record.id,basis,rights_holder:record.creator||'',
  evidence_summary:String(evidenceNote||'').trim().slice(0,1200),
  evidence_ref:safeManuscriptSource(sourceUrl),
  permits_hosting:false,permits_translation:false,permits_continuation:false,
  status:'review'
 };
 const prior=await api.from('archive_rights_records').select('id')
  .eq('record_id',record.id).eq('status','review')
  .eq('basis',basis).limit(1);
 if(prior.error)throw prior.error;
 const rights=prior.data?.[0]?.id
  ?await api.from('archive_rights_records').update(review).eq('id',prior.data[0].id)
  :await api.from('archive_rights_records').insert(review);
 if(rights.error)throw Error('Manuscript saved privately, but its rights-review note could not be recorded. Please retry the review note. '+rights.error.message);
 return data;
}

/** Load an individual manuscript only after its curator explicitly requests
 * inspection. The public visitor never receives its draft text.
 */
export async function getCuratorFanworkManuscriptPreview(record){
 if(!record?.id||!/^[a-f0-9-]{36}$/i.test(String(record.id)))throw Error('Select a valid private record.');
 const api=client();
 const {data:work,error:recordError}=await api.from('archive_records')
  .select('id,slug,category,publication_status')
  .eq('id',record.id).eq('category','licensed_fanfiction').maybeSingle();
 if(recordError)throw recordError;
 if(!work||work.slug!==record.slug||!['draft','review'].includes(work.publication_status))
  throw Error('This private manuscript is not available for review.');
 const {data,error}=await api.from('archive_texts')
  .select('record_id,body_text,word_count,updated_at')
  .eq('record_id',record.id).maybeSingle();
 if(error)throw error;
 if(!data?.body_text)return null;
 return {body:data.body_text,words:data.word_count||0,updatedAt:data.updated_at};
}
