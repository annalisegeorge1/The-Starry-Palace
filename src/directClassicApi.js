import {supabase} from './supabase';
import {getArchiveText} from './palaceData';
import {canReadHostedClassic} from './directClassicModel';

/** Fetch one published book, not the complete Lost Works catalogue. */
export async function openHostedClassic(slug,declaredAge=null){
 if(!supabase)throw Error('The Palace Library is temporarily unavailable.');
 const value=String(slug||'').trim();
 if(!value||value.length>240)return null;
 const {data:record,error}=await supabase.from('archive_records')
  .select('id,slug,title,creator_name,record_nature,category,rating,minimum_reader_age,summary,original_language,rights_status,host_mode,provenance_summary,known_gaps,source_notes,publication_status,verified_at')
  .eq('slug',value).eq('publication_status','published').maybeSingle();
 if(error)throw error;
 if(!record||!['full','excerpt'].includes(record.host_mode))return null;
 const licensed=['licensed','creator_authorised'].includes(record.rights_status);
 if(licensed){
  if(!record.verified_at)return null;
  const today=new Date().toISOString().slice(0,10);
  const rights=await supabase.from('archive_rights_records').select('id')
   .eq('record_id',record.id).eq('status','verified').eq('permits_hosting',true)
   .or('valid_from.is.null,valid_from.lte.'+today)
   .or('valid_until.is.null,valid_until.gte.'+today).limit(1);
  if(rights.error)throw rights.error;
  if(!rights.data?.length)return null;
  record.hosted_rights_verified=true;
 }else if(record.rights_status!=='public_domain_verified'){
  return null;
 }
 const adultEdition=Number(record.minimum_reader_age)>=18;
 let text=null;
 if(adultEdition){
  if(!Number.isInteger(declaredAge)||declaredAge<record.minimum_reader_age)return {record,text:null,needsAge:true};
  const response=await supabase.rpc('open_adult_archive',{p_slug:value,p_declared_age:declaredAge});
  if(response.error)throw response.error;
  text=response.data?.[0]||null;
 }else{
  text=await getArchiveText(record.id);
 }
 // Modern licensed editions must be fully present before being advertised
 // or opened. A metadata-only record must never look like a published book.
 if(licensed){
  record.hosted_text_ready=Boolean(String(text?.body_text||'').trim());
 }
 if(!canReadHostedClassic(record))return null;
 return text?.body_text?{record,text}:null;
}
