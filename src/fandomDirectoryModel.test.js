import {describe,it,expect} from 'vitest';
import {visibleFandoms,pageFandoms,fandomMediaLabel,safeFandomSelection,fandomFacetOptions,matchesFandomStoryQuery,resolveFandomDirectoryName} from './fandomDirectoryModel';
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
 it('resolves canonical fandoms and unique public aliases, never ambiguous or unapproved labels',()=>{
  const named=[
   {...input[0],category:'fandom',status:'canonical'},
   {...input[2],category:'fandom',status:'community'},
   {id:'duplicate-alias',name:'A Separate TV World',category:'fandom',status:'canonical',aliases:['TWD']},
   {id:'unapproved',name:'Hidden Canon',category:'fandom',status:'pending',aliases:['Secret Alias']},
   {id:'trope-tag',name:'Fandom Crossover',category:'trope',status:'canonical',aliases:['Crossed Worlds']}
  ];
  expect(resolveFandomDirectoryName(named,'Naruto')?.id).toBe('1');
  expect(resolveFandomDirectoryName(named,'NARUTO—SHIPPUDEN')?.id).toBe('1');
  expect(resolveFandomDirectoryName(named,'The Walking Dead')?.id).toBe('3');
  expect(resolveFandomDirectoryName(named,'TWD')).toBeNull();
  expect(resolveFandomDirectoryName(named,'Secret Alias')).toBeNull();
  expect(resolveFandomDirectoryName(named,'Crossed Worlds')).toBeNull();
  expect(resolveFandomDirectoryName(named,'missing')).toBeNull();
  expect(resolveFandomDirectoryName(named,'')).toBeNull();
  expect(resolveFandomDirectoryName([...named,{id:'canon-twd',name:'TWD',category:'fandom',status:'canonical'}],'TWD')?.id).toBe('canon-twd');
  const multilingual=[
   {id:'cn',name:'魔道祖师',category:'fandom',status:'canonical',aliases:['Mo Dao Zu Shi']},
   {id:'jp',name:'進撃の巨人',category:'fandom',status:'canonical',aliases:['Shingeki no Kyojin']},
   {id:'kr',name:'이상한 변호사 우영우',category:'fandom',status:'community',aliases:['Extraordinary Attorney Woo']}
  ];
  expect(resolveFandomDirectoryName(multilingual,'魔道祖师')?.id).toBe('cn');
  expect(resolveFandomDirectoryName(multilingual,'進撃の巨人')?.id).toBe('jp');
  expect(resolveFandomDirectoryName(multilingual,'이상한 변호사 우영우')?.id).toBe('kr');
  expect(resolveFandomDirectoryName(multilingual,'mo dao zu shi')?.id).toBe('cn');
  expect(resolveFandomDirectoryName(multilingual,'SHINGEKI NO KYOJIN')?.id).toBe('jp');
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
