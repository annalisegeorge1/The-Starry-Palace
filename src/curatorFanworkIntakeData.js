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
 const {data:texts,error:textError}=await api.from('archive_texts')
  .select('record_id,word_count,updated_at').in('record_id',records.map(r=>r.id));
 if(textError)throw textError;
 const existing=new Map((texts||[]).map(row=>[row.record_id,row]));
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
   lastStagedAt:existing.get(record.id)?.updated_at||null
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
 return data;
}
