/**
 * Phase 2: compare independently fetched anonymous/public results with the
 * Owner's expected catalogue. A mismatch is a *data-layer* finding, not proof
 * that a browser rendered a broken page. No chapter text is read.
 */
const resultsOf = response => Array.isArray(response?.results) ? response.results : [];
const idsOf = rows => new Set((rows||[]).map(r => String(r?.id||'')).filter(Boolean));

export function makePalacePlacementChecks(expectedSnapshot,actual={}){
 const guest=idsOf(actual.guestWorks),reading=idsOf(resultsOf(actual.reading)),
  fandom=idsOf(resultsOf(actual.fandom)),archive=idsOf(actual.guestArchive);
 const checks=[];
 const add=(row,surface,expect,observed,status,detail)=>{
  checks.push({id:row.key+':'+surface.toLowerCase().replace(/[^a-z0-9]+/g,'-'),
   rowKey:row.key,title:row.title,surface,expect,observed,status,detail,
   evidence:'Read-only anonymous metadata / published-archive search'});
 };
 for(const row of expectedSnapshot?.rows||[]){
  if(row.publication!=='published')continue;
  if(row.key.startsWith('member:')){
   const id=row.key.slice(7),isFan=row.kind==='Member fanfiction';
   add(row,'Guest catalogue','Published public work must be readable in guest metadata',
    guest.has(id)?'Present':'Missing',guest.has(id)?'Pass':'Mismatch',
    'Checks the public works query, not the rendered page');
   add(row,'Reading Rooms','Published work must be in unfiltered public archive search',
    reading.has(id)?'Present':'Missing',reading.has(id)?'Pass':'Mismatch',
    'Compares to the published-reading RPC used by Reading Rooms');
   if(isFan)add(row,'Fandom backend','Published fanwork must appear in fandom-filtered search',
    fandom.has(id)?'Present':'Missing',fandom.has(id)?'Pass':'Mismatch',
    'Fandom-only origin RPC; does not verify individual fandom Atlas cards');
  }else if(row.key.startsWith('archive:')&&
    row.expected.includes('Reading Rooms')&&row.kind==='Archive fanfiction'){
   const id=row.key.slice(8);
   add(row,'Archive metadata','Published hosted archive fanfiction must be visible to guests',
    archive.has(id)?'Present':'Missing',archive.has(id)?'Pass':'Mismatch',
    'Guest archive metadata only; hosted-text rights and card rendering need separate tests');
  }
 }
 return {checks,summary:{
  checked:checks.length,pass:checks.filter(c=>c.status==='Pass').length,
  mismatch:checks.filter(c=>c.status==='Mismatch').length
 }};
}
export function makePalaceTagScenarioChecks(expectedWorks=[],scenarios=[]){
 const checks=[];
 for(const item of scenarios){
  const work=expectedWorks.find(w=>String(w.id)===String(item.workId));
  if(!work)continue;
  const found=idsOf(resultsOf(item.actual)).has(String(work.id));
  const expected=Boolean(item.shouldInclude);
  checks.push({id:String(work.id)+':'+item.kind,title:work.title||'Untitled',
   surface:item.label||item.kind,expect:expected?'Should match':'Should be excluded',
   observed:found?'Present':'Not returned',status:found===expected?'Pass':'Mismatch',
   detail:item.detail||'',evidence:'Anonymous published-archive RPC; tag IDs checked against public metadata'});
 }
 return checks;
}
/** Never call a capped/failed query "missing." Only complete result sets qualify. */
export function assertCompletePalacePublicResult(result,max=1500){
 if(!result||!Array.isArray(result.results)||!Number.isFinite(Number(result.total)))
  throw Error('The public verification response was incomplete.');
 if(result.results.length!==Number(result.total)||result.total>max)
  throw Error('The public verification search was truncated. Mark this test unverified and review pagination.');
 return result;
}


/**
 * Compare the site's actual unified catalogue filter with the intended
 * discoverability rule, without opening chapter text. Only works with an
 * accepted fandom tag can be verified in this test.
 */
export function makePalaceFanfictionCatalogueChecks(guestWorks=[],buildCatalogue,filterCatalogue){
 const candidates=guestWorks.filter(w=>w.work_type==='fanwork'&&['mature','explicit'].includes(w.rating));
 const entries=buildCatalogue(guestWorks,[]);
 return candidates.flatMap(work=>{
  const fandom=(work.work_tags||[]).map(r=>r?.tags)
   .find(t=>t?.category==='fandom'&&['canonical','community'].includes(t.status));
  if(!fandom)return [];
  const chosen={fandomNames:[fandom.name]};
  const defaultPresent=filterCatalogue(entries,chosen).some(row=>row.key==='member:'+work.id);
  const optInPresent=filterCatalogue(entries,{...chosen,includeMature:true})
   .some(row=>row.key==='member:'+work.id);
  return [{id:String(work.id)+':fanfiction-tag-default',title:work.title||'Untitled',
   surface:'Fanfiction tag discovery',expect:'Published rated metadata in matching fandom',
   observed:defaultPresent?'Present':optInPresent?'Hidden by default rating switch':'Absent from both filter states',
   status:defaultPresent?'Pass':'Mismatch',
   detail:'Code-path comparison only. Reader chapter age gates are outside this test.',
   evidence:'Existing unified fanfiction catalogue filter with matching fandom'}];
 });
}


/**
 * A bounded *capability check* for arbitrary tag exclusions in the unified
 * fanfiction catalogue. The public Reading Rooms RPC handles exclusions, but
 * other surfaces may not accept those filter inputs at all.
 */
export function makePalaceFanfictionExclusionCheck(guestWorks=[],buildCatalogue,filterCatalogue){
 const candidate=guestWorks.find(w=>w.work_type==='fanwork'&&
  (w.work_tags||[]).filter(r=>r?.tags?.id&&['canonical','community'].includes(r.tags.status)).length>=2);
 if(!candidate)return [];
 const tags=candidate.work_tags.map(r=>r?.tags)
  .filter(t=>t?.id&&['canonical','community'].includes(t.status));
 const entries=buildCatalogue(guestWorks,[]);
 const visible=filterCatalogue(entries,{includeTags:[tags[0].id],excludeTags:[tags[1].id],includeMature:true})
  .some(row=>row.key==='member:'+candidate.id);
 return [{id:'catalogue:tag-exclusion-capability',title:candidate.title||'Published fanwork',
  surface:'Unified catalogue tag exclusion',expect:'Excluded-tag match must not appear',
  observed:visible?'Still present':'Excluded from results',
  status:visible?'Mismatch':'Pass',
  detail:'Code-path capability check using two actual accepted tag IDs. It does not inspect page rendering.',
  evidence:'Unified fanfiction catalogue filtering contract'}];
}
