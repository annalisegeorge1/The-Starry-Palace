import {describe,it,expect} from 'vitest';
import {readingStoryPresentation} from './readingStoryPresentation';
describe('Reading Room story context',()=>{
 it('formats a member story using its stored public values',()=>{
  const p=readingStoryPresentation({
   work_type:'fanwork',rating:'teen',completion_status:'in_progress',language:'English',
   summary:'  An unfinished constellation.  ',
   work_tags:[{tags:{name:'Star Wars',category:'fandom',status:'canonical'}},
              {tags:{name:'Star Wars',category:'fandom',status:'community'}},
              {tags:{name:'Fallout',category:'fandom',status:'community'}},
              {tags:{name:'Romance',category:'genre',status:'canonical'}}]
  });
  expect(p.kind).toBe('Fanwork');
  expect(p.fandoms).toEqual(['Star Wars','Fallout']);
  expect(p.rating).toBe('Teen');expect(p.status).toBe('In progress');
  expect(p.summary).toBe('An unfinished constellation.');
 });
 it('does not invent fandoms or planned completion for original works',()=>{
  const p=readingStoryPresentation({work_type:'original',rating:'general',completion_status:'complete'});
  expect(p.fandoms).toEqual([]);expect(p.status).toBe('Complete');
  expect(p.summary).toContain('No summary');
 });
 it('does not display noncanonical or unconfirmed fandom tags',()=>{
  const p=readingStoryPresentation({work_type:'fanwork',work_tags:[{tags:{name:'Not reviewed',category:'fandom',status:'pending'}}]});
  expect(p.fandoms).toEqual([]);expect(p.kind).toBe('Fanwork');
 });
 it('keeps archive stories distinct from member works',()=>{
  const p=readingStoryPresentation({is_archive:true,work_type:'archive',summary:'',completion_status:'complete'});
  expect(p.kind).toBe('Palace Classic');
  expect(p.summary).toContain('classic');
  expect(p.status).toBe('Complete');
 });
});
