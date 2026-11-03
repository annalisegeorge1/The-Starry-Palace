import {describe,it,expect} from 'vitest';
import {makePalacePlacementChecks,makePalaceTagScenarioChecks,
 assertCompletePalacePublicResult,makePalaceFanfictionCatalogueChecks,makePalaceFanfictionExclusionCheck}
 from '../src/palaceObservatoryVerificationModel.js';

const story={id:'story1',title:'A Fandom Tale',work_type:'fanwork',rating:'explicit',
 publication_status:'published',visibility:'public',
 work_tags:[{tags:{id:'fandom1',name:'Naruto',category:'fandom',status:'canonical'}}]};
const snapshot={rows:[{key:'member:story1',title:story.title,kind:'Member fanfiction',publication:'published'},
 {key:'archive:pending',title:'Draft source',kind:'Archive fanfiction',publication:'draft',expected:['Private review only']}]};
const response=(results)=>({results,total:results.length});

describe('Observatory guest-discovery verification',()=>{
 it('passes when anonymous catalogue and the real public search results include a published fanwork',()=>{
  const audit=makePalacePlacementChecks(snapshot,{
   guestWorks:[story],reading:response([story]),fandom:response([story]),guestArchive:[]});
  expect(audit.summary).toEqual({checked:3,pass:3,mismatch:0});
 });
 it('identifies a guest/member mismatch without claiming a browser navigation failure',()=>{
  const audit=makePalacePlacementChecks(snapshot,{
   guestWorks:[story],reading:response([]),fandom:response([story]),guestArchive:[]});
  expect(audit.summary.mismatch).toBe(1);
  expect(audit.checks.find(c=>c.status==='Mismatch').surface).toBe('Reading Rooms');
  expect(audit.checks.some(c=>c.title==='Draft source')).toBe(false);
 });
 it('checks multiple required tags and exclusion precedence from a real query result',()=>{
  const checked=makePalaceTagScenarioChecks([story],[
   {workId:'story1',kind:'two-includes',label:'Two tags',shouldInclude:true,actual:response([story])},
   {workId:'story1',kind:'exclude',label:'Exclude',shouldInclude:false,actual:response([])}]);
  expect(checked.map(c=>c.status)).toEqual(['Pass','Pass']);
 });
 it('does not treat incomplete or truncated pagination as proof that a work is missing',()=>{
  expect(()=>assertCompletePalacePublicResult({results:[],total:1})).toThrow(/truncated/i);
  expect(()=>assertCompletePalacePublicResult({results:[],total:0})).not.toThrow();
 });
 it('detects when the unified catalogue ignores a real excluded tag',()=>{
  const annotated={...story,work_tags:[...story.work_tags,
   {tags:{id:'relationship1',name:'F/F',category:'relationship',status:'canonical'}}]};
  const build=rows=>rows.map(r=>({key:'member:'+r.id}));
  const ignoresTagFilters=rows=>rows;
  const audit=makePalaceFanfictionExclusionCheck([annotated],build,ignoresTagFilters);
  expect(audit).toHaveLength(1);
  expect(audit[0].status).toBe('Mismatch');
 });
 it('flags code-level Mature/Explicit fandom suppression without testing age-gated text',()=>{
  const build=(rows)=>rows.map(r=>({key:'member:'+r.id,rating:r.rating}));
  const filter=(rows,{includeMature=false})=>rows.filter(r=>includeMature||!['mature','explicit'].includes(r.rating));
  const audit=makePalaceFanfictionCatalogueChecks([story],build,filter);
  expect(audit).toHaveLength(1);
  expect(audit[0].status).toBe('Mismatch');
  expect(audit[0].observed).toMatch(/Hidden by default/);
 });
});
