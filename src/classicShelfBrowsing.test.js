import {describe,it,expect} from 'vitest';
import {CLASSIC_LIBRARY_COLLECTIONS,filterClassicShelf,pageClassicShelf,normalizeClassicSearch} from './classicShelfBrowsing';
const works=[
 {id:'jane',slug:'jane-eyre',title:'Jane Eyre',creator_name:'Charlotte Brontë',summary:'Gothic romance',work_tags:[]},
 {id:'emma',slug:'emma',title:'Emma',creator_name:'Jane Austen',summary:'Society and courtship',work_tags:[]},
 {id:'dracula',slug:'dracula',title:'Dracula',creator_name:'Bram Stoker',summary:'Gothic horror',work_tags:[]},
 {id:'folklore',slug:'jamaican-story',title:'Jamaican Song and Story',creator_name:'Jamaican oral tradition',summary:'Annancy stories',work_tags:[{tags:{name:'Caribbean folklore',category:'genre',status:'canonical'}}]}
];
describe('Complete Classics shelf selection',()=>{
 it('keeps all books in the All Classics shelf instead of silently slicing to 10',()=>{
  const many=Array.from({length:29},(_,i)=>({...works[0],id:'b-'+i,title:'Book '+i}));
  const all=filterClassicShelf(many,CLASSIC_LIBRARY_COLLECTIONS.find(c=>c.id==='all'));
  expect(all).toHaveLength(29);
  expect(pageClassicShelf(all,0).items).toHaveLength(8);
  expect(pageClassicShelf(all,3)).toMatchObject({total:29,page:3,first:25,last:29,pages:4,hasNext:false});
 });
 it('filters by title or author, ignoring case, accents and punctuation',()=>{
  const all=CLASSIC_LIBRARY_COLLECTIONS.find(c=>c.id==='all');
  expect(normalizeClassicSearch('  Brontë’s  ')).toBe('bronte s');
  expect(filterClassicShelf(works,all,'Brontë').map(w=>w.id)).toEqual(['jane']);
  expect(filterClassicShelf(works,all,'Jane Austen').map(w=>w.id)).toEqual(['emma']);
  expect(filterClassicShelf(works,all,'Jamaican folklore').map(w=>w.id)).toEqual(['folklore']);
  expect(filterClassicShelf(works,all,'unknown')).toEqual([]);
 });
 it('keeps the existing meaningful collections while honoring search within each one',()=>{
  const gothic=CLASSIC_LIBRARY_COLLECTIONS.find(c=>c.id==='gothic');
  expect(filterClassicShelf(works,gothic).map(w=>w.id)).toEqual(['dracula','jane']);
  expect(filterClassicShelf(works,gothic,'Stoker').map(w=>w.id)).toEqual(['dracula']);
  const caribbean=CLASSIC_LIBRARY_COLLECTIONS.find(c=>c.id==='black-caribbean');
  expect(filterClassicShelf(works,caribbean).map(w=>w.id)).toEqual(['folklore']);
 });
 it('supports title and author sorting without changing the original input',()=>{
  const snapshot=works.map(w=>w.id);
  const all=CLASSIC_LIBRARY_COLLECTIONS.find(c=>c.id==='all');
  expect(filterClassicShelf(works,all,'','title').map(w=>w.id)).toEqual(['dracula','emma','folklore','jane']);
  expect(filterClassicShelf(works,all,'','author').map(w=>w.id)).toEqual(['dracula','jane','folklore','emma']);
  expect(works.map(w=>w.id)).toEqual(snapshot);
 });
 it('bounds bad page values and handles empty shelves gracefully',()=>{
  expect(pageClassicShelf([],99)).toMatchObject({items:[],page:0,pages:1,first:0,last:0,hasPrevious:false,hasNext:false});
  expect(pageClassicShelf(works,999,2)).toMatchObject({page:1,last:4});
  expect(pageClassicShelf(works,-999,2)).toMatchObject({page:0,first:1});
  expect(pageClassicShelf(works,Number.NaN,2).page).toBe(0);
 });
});
