import {supabase} from './supabase';
import {getPalaceObservatoryAccess} from './palaceObservatoryData';
import {observatoryValidateIssue,observatoryValidateTransition,observatoryInspectScreenshot} from './palaceObservatoryIssuesModel';

export const OBSERVATORY_EVIDENCE_BUCKET='palace-observatory-evidence';
export const OBSERVATORY_SETUP_MESSAGE='The private Observatory issue tables have not been approved and installed. This draft build will not create or modify your database.';
function api(){if(!supabase)throw Error('Palace data connection unavailable.');return supabase}
function schemaMissing(error){
 const str=String(error?.message||'').toLowerCase();
 return ['42P01','PGRST205','PGRST116'].includes(String(error?.code))&&error?.code!=='PGRST116'
  ||str.includes("could not find the table 'public.observatory_issues'")
  ||str.includes('relation "public.observatory_issues" does not exist')
  ||str.includes("could not find the table 'public.observatory_issue_events'")
  ||str.includes("could not find the table 'public.observatory_evidence'");
}
async function requireOwner(){
 const {data,error}=await api().auth.getUser();
 const id=data?.user?.id;
 if(error||!id||!await getPalaceObservatoryAccess(id))
  throw Error('Only the authenticated Palace Owner can manage Observatory issues.');
 return id;
}
export async function listPalaceObservatoryIssues(){
 await requireOwner();
 const {data,error}=await api().from('observatory_issues')
  .select('id,title,work_title,finding_key,surface,severity,status,expected,observed,steps,device,browser,source_url,fix_proposal,review_note,created_at,updated_at')
  .order('updated_at',{ascending:false}).limit(250);
 if(error){if(schemaMissing(error))return {configured:false,issues:[]};throw error}
 return {configured:true,issues:data||[]};
}
export async function getPalaceObservatoryIssueHistory(issueId){
 await requireOwner();
 const [events,evidence]=await Promise.all([
  api().from('observatory_issue_events')
   .select('id,action,status_before,status_after,changed_fields,review_note,actor_id,created_at').eq('issue_id',issueId)
   .order('created_at',{ascending:false}).limit(100),
  api().from('observatory_evidence')
   .select('id,issue_id,file_path,file_name,mime_type,file_size,created_at')
   .eq('issue_id',issueId).order('created_at',{ascending:false}).limit(30)
 ]);
 if(events.error)throw events.error;
 if(evidence.error)throw evidence.error;
 return {events:events.data||[],evidence:evidence.data||[]};
}
export async function createPalaceObservatoryIssue(draft){
 await requireOwner();
 const parsed=observatoryValidateIssue(draft);
 if(!parsed.valid)throw Error(parsed.errors.join(' '));
 const {data,error}=await api().from('observatory_issues')
  .insert(parsed.value).select('id').single();
 if(error?.code==='23505')throw Error('A tracker issue already exists for this audit finding.');
 if(error?.code==='23514')throw Error('The Observatory issue format was rejected. Review its fields.');
 if(error)throw error;
 return data;
}
export async function updatePalaceObservatoryIssue(current,draft){
 await requireOwner();
 if(!current?.id||!current.updated_at)throw Error('Select an issue to revise.');
 const parsed=observatoryValidateIssue({...draft,finding_key:current.finding_key});
 if(!parsed.valid)throw Error(parsed.errors.join(' '));
 // Never allow an edit to change status or the immutable audit key.
 const {status,review_note,...fields}=parsed.value;
 const {data,error}=await api().from('observatory_issues')
  .update({...fields,review_note})
  .eq('id',current.id).eq('updated_at',current.updated_at)
  .select('id,updated_at').maybeSingle();
 if(error)throw error;
 if(!data)throw Error('This issue changed elsewhere. Reload before editing again.');
 return data;
}
export async function transitionPalaceObservatoryIssue(current,next,note=''){
 await requireOwner();
 if(!current?.id||!current.updated_at)throw Error('Select a current issue.');
 const checked=observatoryValidateTransition(current.status,next,note);
 if(!checked.valid)throw Error(checked.errors.join(' '));
 const {data,error}=await api().from('observatory_issues')
  .update({status:next,review_note:checked.note})
  .eq('id',current.id).eq('status',current.status).eq('updated_at',current.updated_at)
  .select('id,status,updated_at').maybeSingle();
 if(error)throw error;
 if(!data)throw Error('The issue was updated elsewhere. Reload to avoid overwriting its history.');
 return data;
}
export async function attachPalaceObservatoryScreenshot(issue,file){
 await requireOwner();
 if(!issue?.id)throw Error('Save the issue before adding a screenshot.');
 const checked=await observatoryInspectScreenshot(file);
 if(!checked.valid)throw Error(checked.error);
 const id=crypto.randomUUID();
 const filePath=issue.id+'/'+id+'.'+checked.extension;
 // Private bucket and Owner-only Storage RLS; upserts forbidden.
 const uploaded=await api().storage.from(OBSERVATORY_EVIDENCE_BUCKET)
  .upload(filePath,file,{contentType:file.type,cacheControl:'0',upsert:false});
 if(uploaded.error)throw uploaded.error;
 const metadata=await api().from('observatory_evidence').insert({
  issue_id:issue.id,file_path:filePath,file_name:String(file.name||'Screenshot').slice(0,160),
  file_size:file.size,mime_type:file.type
 }).select('id').single();
 if(metadata.error)throw Error('The screenshot uploaded privately but could not be indexed. No public URL was generated. '+metadata.error.message);
 return metadata.data;
}
/** Signed evidence links expire after two minutes; never expose storage paths publicly. */
export async function openPalaceObservatoryScreenshot(evidence){
 await requireOwner();
 if(!evidence?.file_path)throw Error('No screenshot file is attached.');
 const {data,error}=await api().storage.from(OBSERVATORY_EVIDENCE_BUCKET)
  .createSignedUrl(evidence.file_path,120);
 if(error)throw error;
 if(!data?.signedUrl)throw Error('A private preview link could not be generated.');
 return data.signedUrl;
}
