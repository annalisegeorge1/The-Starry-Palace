import {describe,it,expect} from 'vitest';
import {buildPalaceObservatorySnapshot,filterPalaceObservatoryRows} from '../src/palaceObservatoryModel.js';
describe('The Palace Observatory — metadata-only audit',()=>{
 const tagged={id:'w1',title:'Moonlit Story',slug:'moonlit',work_type:'fanwork',publication_status:'published',
  visibility:'public',rating:'explicit',profiles:{display_name:'Writer'},work_tags:[
   {tags:{id:'f1',name:'Naruto',category:'fandom',status:'canonical'}},
   {tags:{id:'r1',name:'F/F',category:'relationship',status:'canonical'}}
  ]};
 it('keeps public Mature/Explicit fanwork entries discoverable as metadata without loading text',()=>{
  const s=buildPalaceObservatorySnapshot({works:[tagged]});
  expect(s.rows).toHaveLength(1);
  expect(s.rows[0].rating).toBe('explicit');
  expect(s.rows[0].expected).toContain('Fanfiction');
  expect(s.findings).toHaveLength(0);
  expect(JSON.stringify(s)).not.toContain('body_text');
 });
 it('excludes private member drafts and flags missing published fandom metadata',()=>{
  const s=buildPalaceObservatorySnapshot({works:[
   {...tagged,id:'draft',publication_status:'draft',visibility:'private'},
   {...tagged,id:'public',work_tags:[]}]});
  expect(s.rows).toHaveLength(1);
  expect(s.findings.map(f=>f.type)).toContain('missing_fandom');
 });
 it('does not incorrectly call licensed unpublished metadata an absent public work',()=>{
  const s=buildPalaceObservatorySnapshot({archive:[
   {id:'a',title:'Pending',category:'licensed_fanfiction',publication_status:'draft',
    host_mode:'metadata_only',rights_status:'licensed'}]});
  expect(s.totals.privateIntake).toBe(1);
  expect(s.findings).toHaveLength(0);
  expect(s.rows[0].expected).toEqual(['Private review only']);
 });
 it('requires an active verified hosting grant for a published licensed edition',()=>{
  const archived={id:'a',title:'Licensed',category:'licensed_fanfiction',publication_status:'published',
   host_mode:'full',rights_status:'licensed',hosted_word_count:100};
  const s=buildPalaceObservatorySnapshot({archive:[archived],rights:[{
   record_id:'a',status:'verified',permits_hosting:true,verified_at:'2026-01-01',valid_until:'2026-10-01'}]},'2026-11-03');
  expect(s.findings.some(f=>f.type==='hosting_rights')).toBe(true);
 });
 it('does not treat external source links as hosted stories',()=>{
  const s=buildPalaceObservatorySnapshot({linked:[{
   id:'x',title:'External Work',creator:'Writer',fandom:'Naruto',sourceUrl:'https://example.org/work'}]});
  expect(s.totals.sourceLinks).toBe(1);
  expect(s.rows[0].hosting).toContain('not hosted');
  expect(filterPalaceObservatoryRows(s.rows,{query:'Naruto'})).toHaveLength(1);
 });
});
