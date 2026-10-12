import {describe,it,expect} from 'vitest';
import {buildReadingFacets,matchesReadingFacets,sortReadingWorks,READING_SORT_OPTIONS} from './readingFacetModel';
const tag=(id,name,category='trope')=>({tags:{id,name,category,status:'canonical'}});
const works=[
 {id:'w1',title:'Sky',first_published_at:'2025-01-01',last_published_at:'2026-01-15',reading_stats:{words:1800,chapters:2,comments:1,bookmarks:0},work_tags:[tag('f1','Dragon Age','fandom'),tag('t1','Slow burn')]},
 {id:'w2',title:'Ash',first_published_at:'2026-01-12',last_published_at:'2026-01-12',reading_stats:{words:7500,chapters:5,comments:6,bookmarks:3},work_tags:[tag('t1','Slow burn'),tag('w1','Graphic violence','warning')]},
 {id:'w3',title:'Moon',first_published_at:'2026-01-02',last_published_at:'2026-01-19',reading_stats:null,work_tags:[tag('f1','Dragon Age','fandom'),tag('r1','Rook/Emmrich','relationship')]}
];
describe('faceted Palace story catalogue',()=>{
 it('groups tags, counts distinct stories and preserves the intended family order',()=>{
  const groups=buildReadingFacets(works);
  expect(groups.map(group=>group.category)).toEqual(['fandom','relationship','warning','trope']);
  expect(groups.find(group=>group.category==='fandom').tags[0]).toMatchObject({id:'f1',count:2});
  const dup={...works[0],work_tags:[...works[0].work_tags,tag('f1','Dragon Age','fandom')]};
  expect(buildReadingFacets([dup])[0].tags[0].count).toBe(1);
 });
 it('requires every included tag but excludes any unwanted tag',()=>{
  expect(works.filter(work=>matchesReadingFacets(work,['f1'],[])).map(x=>x.id)).toEqual(['w1','w3']);
  expect(works.filter(work=>matchesReadingFacets(work,['f1'],['r1'])).map(x=>x.id)).toEqual(['w1']);
  expect(works.filter(work=>matchesReadingFacets(work,['f1','t1'],[])).map(x=>x.id)).toEqual(['w1']);
  expect(works.filter(work=>matchesReadingFacets(work,['missing'],[]))).toEqual([]);
  expect(works.filter(work=>matchesReadingFacets(work,[],['w1'])).map(x=>x.id)).toEqual(['w1','w3']);
 });
 it('sorts by publication, title, date, and available numerical stats',()=>{
  expect(sortReadingWorks(works,'updated').map(w=>w.id)).toEqual(['w3','w1','w2']);
  expect(sortReadingWorks(works,'published').map(w=>w.id)).toEqual(['w2','w3','w1']);
  expect(sortReadingWorks(works,'oldest').map(w=>w.id)).toEqual(['w1','w3','w2']);
  expect(sortReadingWorks(works,'title').map(w=>w.id)).toEqual(['w2','w3','w1']);
  for(const key of ['words','chapters','comments','bookmarks'])expect(sortReadingWorks(works,key).map(w=>w.id)).toEqual(['w2','w1','w3']);
  expect(sortReadingWorks(works,'words')).not.toBe(works);
  expect(READING_SORT_OPTIONS.length).toBeGreaterThanOrEqual(8);
 });
});
