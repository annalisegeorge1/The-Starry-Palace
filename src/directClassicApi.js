import {supabase} from './supabase';
import {getArchiveText} from './palaceData';
import {canReadHostedClassic} from './directClassicModel';

/** Fetch one published book, not the complete Lost Works catalogue. */
export async function openHostedClassic(slug){
 if(!supabase)throw Error('The Palace Library is temporarily unavailable.');
 const value=String(slug||'').trim();
 if(!value||value.length>240)return null;
 const {data:record,error}=await supabase.from('archive_records')
  .select('id,slug,title,creator_name,record_nature,category,summary,original_language,rights_status,host_mode,provenance_summary,known_gaps,publication_status,verified_at')
  .eq('slug',value).eq('publication_status','published').maybeSingle();
 if(error)throw error;
 if(!record)return null;
 // The public reader must independently verify licensed hosting rights even
 // when reached by a direct /classic URL rather than through a catalogue.
 if(record.rights_status==='licensed'||record.rights_status==='creator_authorised'){
  const rights=await supabase.from('archive_rights_records').select('id')
   .eq('record_id',record.id).eq('status','verified').eq('permits_hosting',true).limit(1);
  if(rights.error)return null;
  record.hosted_rights_verified=Boolean(rights.data?.length);
 }
 if(!canReadHostedClassic(record))return null;
 const text=await getArchiveText(record.id);
 return text?.body_text?{record,text}:null;
}
