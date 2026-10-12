import {describe,it,expect} from 'vitest';
import {tagWorldPath,TAG_WORLD_LABELS} from './tagWorldRoutes';
const id='00429c8b-83e1-4ec0-8bcc-8ae42bacad75';
describe('public tag and fandom doors',()=>{
 it('gives each registered tag a stable, shareable ID destination',()=>{
  expect(tagWorldPath(id)).toBe('/tag/'+id);
  expect(tagWorldPath({id,name:'Slow burn',category:'trope'})).toBe('/tag/'+id);
  expect(tagWorldPath({id:'not-an-id',name:'Unregistered'})).toBeNull();
  expect(tagWorldPath({name:'Slow burn'})).toBeNull();
  expect(tagWorldPath(null)).toBeNull();
 });
 it('names relationship, fandom, warnings and character pages explicitly',()=>{
  expect(TAG_WORLD_LABELS.relationship).toBe('Relationship');
  expect(TAG_WORLD_LABELS.fandom).toBe('Fandom');
  expect(TAG_WORLD_LABELS.warning).toBe('Content warning');
  expect(TAG_WORLD_LABELS.character).toBe('Character');
 });
});
