import {describe,it,expect} from 'vitest';
import {visibleFandoms,pageFandoms,fandomMediaLabel,safeFandomSelection,fandomFacetOptions,matchesFandomStoryQuery} from './fandomDirectoryModel';
const input=[
 {id:'1',name:'Naruto',media_categories:['anime_manga'],aliases:['Naruto Shippuden'],subcategory:'Shōnen fantasy',franchise:'Naruto'},
 {id:'2',name:'Bridgerton',media_categories:['books_literature','tv_shows'],aliases:['Bridgerton Netflix'],usage_count:12},
 {id:'3',name:'The Walking Dead',media_categories:['tv_shows','cartoons_comics'],aliases:['TWD']},
 {id:'4',name:'New Fandom',media_categories:['uncategorized']},
 {id:'5',name:'Original Work',media_categories:['uncategorized']},
 {id:'6',name:'Fanwork',media_categories:['uncategorized']}
];
describe('Fandom directory media and alias discovery',()=>{
 it('keeps cross-media titles on each appropriate shelf and preserves unclassified community tags',()=>{
  expect(visibleFandoms(input,{media:'tv_shows'}).map(x=>x.id)).toEqual(['2','3']);
  expect(visibleFandoms(input,{media:'books_literature'}).map(x=>x.id)).toEqual(['2']);
  expect(visibleFandoms(input,{media:'uncategorized'}).map(x=>x.id)).toEqual(['4']);
  expect(visibleFandoms(input).map(x=>x.id)).not.toContain('5');
 });
 it('finds actual fandoms by alternate name, punctuation and franchise',()=>{
  expect(visibleFandoms(input,{query:'TWD'}).map(x=>x.id)).toEqual(['3']);
  expect(visibleFandoms(input,{query:'shippuden'}).map(x=>x.id)).toEqual(['1']);
  expect(visibleFandoms(input,{query:'Bridgerton Netflix'}).map(x=>x.id)).toEqual(['2']);
  expect(visibleFandoms(input,{query:'not here'})).toEqual([]);
 });
 it('sorts predictable counts but never edits the input order',()=>{
  const ordered=visibleFandoms(input,{sort:'used'});
  expect(ordered[0].id).toBe('2');
  expect(input[0].id).toBe('1');
  expect(fandomMediaLabel('theater')).toBe('Theater');
 });
 it('narrows actual registered fandoms by franchise and type without inventing results',()=>{
  const facets=fandomFacetOptions(input,'anime_manga');
  expect(facets.categories).toEqual(['Shōnen fantasy']);
  expect(facets.franchises).toEqual(['Naruto']);
  expect(visibleFandoms(input,{media:'anime_manga',subcategory:'Shōnen fantasy',franchise:'Naruto'}).map(x=>x.name)).toEqual(['Naruto']);
  expect(visibleFandoms(input,{media:'tv_shows',franchise:'Naruto'})).toEqual([]);
  expect(visibleFandoms(input,{media:'anime_manga',subcategory:'Unknown'})).toEqual([]);
 });
 it('paginates and limits crossover selections without trusting URL IDs',()=>{
  const all=visibleFandoms(input);
  expect(pageFandoms(all,4,2)).toMatchObject({page:1,total:4,start:3,end:4});
  expect(pageFandoms([],0).items).toEqual([]);
  expect(safeFandomSelection(['1','1','missing','3'],input)).toEqual(['1','3']);
  expect(safeFandomSelection(['1','2','3','4'],input,2)).toEqual(['1','2']);
 });
});


describe('Searching a pairing or character within a selected fandom',()=>{
 it('finds Richonne through a relationship tag even when the title omits it',()=>{
  const story={title:'New Beginnings',summary:'Rick and Michonne start again',work_tags:[{tags:{name:'Richonne',category:'relationship'}}]};
  expect(matchesFandomStoryQuery(story,'Richonne')).toBe(true);
  expect(matchesFandomStoryQuery(story,'Michonne')).toBe(true);
  expect(matchesFandomStoryQuery(story,'Daryl')).toBe(false);
 });
 it('does not treat a relationship as a new fandom or include unrelated stories',()=>{
  expect(matchesFandomStoryQuery({title:'Another World',work_tags:[]},'Richonne')).toBe(false);
  expect(matchesFandomStoryQuery({title:'Another World',work_tags:[]},'')).toBe(true);
 });
});
