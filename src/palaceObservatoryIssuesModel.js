/**
 * The Palace Observatory: issue review only. A "Fixed" status is a human
 * review milestone, never a request to publish or deploy a correction.
 * Keep these rules in sync with the unapplied SQL review proposal.
 */
export const OBSERVATORY_ISSUE_STATUSES=Object.freeze([
 'New','Investigating','Fix Proposed','Awaiting Review','Fixed','Rechecked','Reopened'
]);
export const OBSERVATORY_SEVERITIES=Object.freeze(['Critical','High','Medium','Low']);
export const OBSERVATORY_TRANSITIONS=Object.freeze({
 'New':['Investigating'],
 'Investigating':['Fix Proposed'],
 'Fix Proposed':['Awaiting Review','Investigating'],
 'Awaiting Review':['Fixed','Investigating'],
 'Fixed':['Rechecked','Reopened'],
 'Rechecked':['Reopened'],
 'Reopened':['Investigating']
});
const clean=(value,limit=1200)=>String(value??'').trim().slice(0,limit);
const validHttps=value=>!value||/^https:\/\//i.test(value);
// Metadata checks and unfinished probes are candidates, not firsthand reports.
export function observatoryIsUnverifiedObservation(value){
 const v=clean(value,1800).toLowerCase();
 return !v||/^(not independently tested|not yet checked|not yet verified|unknown|unverified|pending manual check)(?:[\s.:—-]|$)/.test(v);
}
export function observatoryCanTransition(from,to){
 return Boolean(OBSERVATORY_TRANSITIONS[from]?.includes(to));
}
export function observatoryNextStatuses(from){
 return OBSERVATORY_TRANSITIONS[from]||[];
}
export function observatoryValidateIssue(draft){
 const title=clean(draft?.title,160),expected=clean(draft?.expected,1800),
  observed=clean(draft?.observed,1800),steps=clean(draft?.steps,2400),
  surface=clean(draft?.surface,100),sourceUrl=clean(draft?.source_url,750);
 const errors=[];
 if(title.length<3)errors.push('Give the issue a title of at least 3 characters.');
 if(!expected)errors.push('Describe what should happen.');
 if(observatoryIsUnverifiedObservation(observed))
  errors.push('Record a real observation before saving this candidate as an issue. Do not use an unverified audit placeholder.');
 if(!surface)errors.push('Choose or name the affected page or section.');
 if(!validHttps(sourceUrl))errors.push('Source URLs must use HTTPS.');
 if(!OBSERVATORY_SEVERITIES.includes(draft?.severity))errors.push('Choose a supported severity.');
 return {valid:errors.length===0,errors,value:{
  title,expected,observed,steps,surface,source_url:sourceUrl||null,
  severity:draft?.severity,device:clean(draft?.device,120),
  browser:clean(draft?.browser,120),fix_proposal:clean(draft?.fix_proposal,2400),
  review_note:clean(draft?.review_note,2400),work_title:clean(draft?.work_title,160),
  finding_key:clean(draft?.finding_key,190)||null
 }};
}
export function observatoryValidateTransition(current,next,note){
 const errors=[];
 if(!observatoryCanTransition(current,next))
  errors.push('That review status change is not permitted.');
 const reason=clean(note,2400);
 if(['Fixed','Rechecked','Reopened'].includes(next)&&reason.length<8)
  errors.push('Record at least 8 characters of evidence or review notes.');
 return {valid:errors.length===0,errors,note:reason};
}
export function observatoryFindingDraft(candidate={}){
 const issueTitle=clean(candidate.title||candidate.workTitle||'Catalogue issue',160);
 return {
  title:issueTitle,
  work_title:clean(candidate.workTitle||candidate.title,160),
  expected:clean(candidate.expect||candidate.expected,1800),
  observed:observatoryIsUnverifiedObservation(candidate.observed)?'':clean(candidate.observed,1800),
  steps:clean(candidate.detail,2400),
  surface:clean(candidate.surface||'Fanfiction',100),
  severity:OBSERVATORY_SEVERITIES.includes(candidate.severity)?candidate.severity:'Medium',
  finding_key:clean(candidate.id,190)||null,
  source_url:'',device:'',browser:'',fix_proposal:'',review_note:''
 };
}
export function observatoryValidateScreenshot(file){
 const validTypes=['image/png','image/jpeg','image/webp'];
 const extension={'image/png':'png','image/jpeg':'jpg','image/webp':'webp'};
 if(!file)return {valid:false,error:'Choose an image first.'};
 if(!validTypes.includes(file.type))return {valid:false,error:'Only PNG, JPEG or WebP screenshots are accepted.'};
 if(file.size<=0||file.size>6*1024*1024)return {valid:false,error:'Screenshot files must be between 1 byte and 6 MB.'};
 return {valid:true,extension:extension[file.type]};
}

/** Check decoded file signatures before sending bytes to private storage.
 * The MIME label alone is user-controlled and cannot prove the file type.
 * This is not a malware scanner or proof the image is safe to share.
 */
export function observatoryScreenshotSignature(bytes,type){
 const b=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes||[]);
 if(type==='image/png')return b.length>=8&&
  [137,80,78,71,13,10,26,10].every((v,i)=>b[i]===v);
 if(type==='image/jpeg')return b.length>=3&&
  b[0]===255&&b[1]===216&&b[2]===255;
 if(type==='image/webp')return b.length>=12&&
  [82,73,70,70].every((v,i)=>b[i]===v)&&
  [87,69,66,80].every((v,i)=>b[i+8]===v);
 return false;
}
export async function observatoryInspectScreenshot(file){
 const initial=observatoryValidateScreenshot(file);
 if(!initial.valid)return initial;
 if(typeof file?.slice!=='function')return {valid:false,error:'Unable to inspect screenshot bytes.'};
 try{
  const header=new Uint8Array(await file.slice(0,12).arrayBuffer());
  if(!observatoryScreenshotSignature(header,file.type))
   return {valid:false,error:'The screenshot file contents do not match its stated image format.'};
  return initial;
 }catch{
  return {valid:false,error:'The screenshot could not be inspected. Choose another file.'};
 }
}
