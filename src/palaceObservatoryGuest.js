import {createClient} from '@supabase/supabase-js';
import {assertCompletePalacePublicResult} from './palaceObservatoryVerificationModel';

/**
 * A SECOND Supabase client, deliberately anonymous and with no persisted auth
 * session, models what signed-out readers can query. No service role, writes,
 * manuscripts, or user account data. The project's normal publishable key is
 * already browser-public; RLS still controls every read.
 */
let guest;
function guestClient(){
 if(guest)return guest;
 const url=import.meta.env.VITE_SUPABASE_URL;
 const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key?.startsWith('sb_publishable_'))throw Error('Public catalogue verification is not configured.');
 guest=createClient(url,key,{auth:{
  persistSession:false,autoRefreshToken:false,detectSessionInUrl:false,
  storageKey:'palace-observatory-anonymous-verification'
 }});
 return guest;
}
const UUID=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const cleanIds=values=>[...new Set((values||[]).map(String).filter(id=>UUID.test(id)))].slice(0,12);
async function publicRows(table,select,modify){
 const out=[],size=150,max=1500,client=guestClient();
 for(let start=0;start<max;start+=size){
  let query=client.from(table).select(select);
  if(modify)query=modify(query);
  const {data,error}=await query.order('id',{ascending:true}).range(start,start+size-1);
  if(error)throw error;
  out.push(...(data||[]));
  if((data||[]).length<size)return out;
 }
 throw Error('Too many public records for a bounded audit. No missing-work claim has been made.');
}
async function publicSearch({text='',include=[],exclude=[],rating='all',origin='all'}={}){
 const client=guestClient(),args={
  p_text:String(text||'').trim().slice(0,160),p_include:cleanIds(include),p_exclude:cleanIds(exclude),
  p_rating:rating,p_status:'all',p_origin:origin,p_language:'all',
  p_min_words:null,p_max_words:null,p_sort:'updated',p_limit:48,p_offset:0
 };
 const combined=[],max=1500;
 for(let offset=0;offset<max;offset+=48){
  const {data,error}=await client.rpc('search_published_works_v2',{...args,p_offset:offset});
  if(error)throw error;
  if(!data||!Array.isArray(data.results)||!Number.isInteger(Number(data.total)))
   throw Error('Public archive RPC returned an incomplete response.');
  if(Number(data.total)>max)throw Error('Public archive search exceeds safe audit pagination.');
  combined.push(...data.results);
  if(combined.length>=Number(data.total))
   return assertCompletePalacePublicResult({results:combined,total:Number(data.total)},max);
  if(data.results.length===0)break;
 }
 throw Error('Public archive pagination was incomplete; the Observatory will not report a missing work.');
}
export async function readPalaceAnonymousPlacement(){
 const [guestWorks,guestArchive,reading,fandom]=await Promise.all([
  publicRows('works','id,title,slug,work_type,rating,publication_status,visibility,work_tags(tags(id,name,category,status))',
   q=>q.eq('publication_status','published').eq('visibility','public')),
  publicRows('archive_records','id,title,category,publication_status,host_mode,rights_status',
   q=>q.eq('publication_status','published')),
  publicSearch(),
  publicSearch({origin:'fandom'})
 ]);
 return {guestWorks,guestArchive,reading,fandom};
}
/**
 * Bounded reproducible scenarios using real public work IDs and their accepted
 * tag IDs. Each checks the public RPC's complete paginated result, not UI cards.
 */
export async function runPalaceGuestTagScenarios(works=[],maxWorks=8){
 const selected=works.filter(w=>w?.work_type==='fanwork'&&w?.publication_status==='published'&&w?.visibility==='public')
  .slice(0,Math.min(12,Math.max(1,maxWorks)));
 const scenarios=[];
 for(const work of selected){
  const tags=(work.work_tags||[]).map(row=>row?.tags).filter(t=>t?.id&&['canonical','community'].includes(t.status));
  const fandom=tags.find(t=>t.category==='fandom');
  const relationship=tags.find(t=>t.category==='relationship'&&t.id!==fandom?.id);
  const plan=[
   {kind:'title',label:'Title text search',params:{text:work.title},shouldInclude:true,
    detail:'Exact published title in public Reading Rooms search'},
   ...(fandom?[{kind:'fandom-tag',label:'Include fandom tag',params:{include:[fandom.id],origin:'fandom'},shouldInclude:true,
    detail:'Matching accepted fandom tag ID'}]:[]),
   ...(fandom&&relationship?[{kind:'two-includes',label:'Two required tags',params:{include:[fandom.id,relationship.id],origin:'fandom'},shouldInclude:true,
    detail:'Both accepted tags required together'}]:[]),
   ...(fandom?[{kind:'exclude-override',label:'Excluded tag wins',params:{include:[fandom.id],exclude:[fandom.id],origin:'fandom'},shouldInclude:false,
    detail:'A tag simultaneously included and excluded must never return the work'}]:[]),
   ...(['mature','explicit'].includes(work.rating)?[{
    kind:'rated',label:work.rating+' rating in public search',
    params:{rating:work.rating,origin:'fandom'},shouldInclude:true,
    detail:'Public metadata search; does not grant access to restricted chapters'}]:[])
  ];
  for(const item of plan){
   const actual=await publicSearch(item.params);
   scenarios.push({workId:work.id,kind:item.kind,label:item.label,shouldInclude:item.shouldInclude,
    detail:item.detail,actual});
  }
 }
 return scenarios;
}
