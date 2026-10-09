import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {INITIAL_FANDOM_DIRECTORY,FANDOM_MEDIA_SHELVES,NON_FANDOM_CLASSIFICATIONS} from './palaceFandomCatalogue';
import {FANDOM_EXPANSION_V2} from './palaceFandomExpansionV2';
import {visibleFandoms} from './fandomDirectoryModel';
const read=path=>readFileSync(resolve(process.cwd(),path),'utf8');
const sql=read('database/palace-fandom-directory-v2.sql');

describe('Expanded Palace canon and media discovery',()=>{
 it('grows the catalog by at least 150 distinctive titles without duplicate canonical labels',()=>{
  expect(FANDOM_EXPANSION_V2.length).toBeGreaterThanOrEqual(150);
  expect(INITIAL_FANDOM_DIRECTORY.length).toBeGreaterThanOrEqual(350);
  const labels=INITIAL_FANDOM_DIRECTORY.map(row=>row.name.toLowerCase());
  expect(new Set(labels).size).toBe(labels.length);
  expect(NON_FANDOM_CLASSIFICATIONS).toEqual(expect.arrayContaining(['Original Work','Fanwork']));
 });
 it('keeps real aliases, media, franchising and distinct fandom tags',()=>{
  const entries=[
   ['Pokémon','anime_manga','video_games','Pokemon'],
   ['League of Legends','video_games',null,'LoL'],
   ['The Magnus Protocol','other_media',null,'TMP'],
   ['Natasha, Pierre & the Great Comet of 1812','theater',null,'The Great Comet'],
   ['Fourth Wing','books_literature',null,'The Empyrean'],
   ['Formula 1','celebrities_real_people',null,'F1'],
   ['The Mandalorian','tv_shows',null,'Mando']
  ];
  for(const [name,media,other,alias] of entries){
   const row=INITIAL_FANDOM_DIRECTORY.find(x=>x.name===name);
   expect(row,name).toBeTruthy();
   expect(row.media_categories).toContain(media);
   if(other)expect(row.media_categories).toContain(other);
   expect(row.aliases).toContain(alias);
  }
  for(const row of INITIAL_FANDOM_DIRECTORY){
   expect(row.name.length).toBeGreaterThan(1);
   expect(row.franchise.length).toBeGreaterThan(0);
   expect(row.subcategory.length).toBeGreaterThan(0);
   expect(row.media_categories.length).toBeGreaterThan(0);
   for(const media of row.media_categories)expect(FANDOM_MEDIA_SHELVES.map(x=>x.id)).toContain(media);
  }
 });
 it('finds expansion by aliases and media while keeping franchises separate',()=>{
  const rows=FANDOM_EXPANSION_V2.map((x,i)=>({...x,id:String(i)}));
  expect(visibleFandoms(rows,{query:'DDLC'}).map(x=>x.name)).toEqual(['Doki Doki Literature Club']);
  expect(visibleFandoms(rows,{query:'Arianators'}).map(x=>x.name)).toEqual(['Ariana Grande']);
  expect(visibleFandoms(rows,{query:'Mando'}).map(x=>x.name)).toEqual(['The Mandalorian']);
  expect(visibleFandoms(rows,{media:'theater'}).length).toBeGreaterThanOrEqual(10);
  expect(visibleFandoms(rows,{media:'other_media',query:'protocol'}).map(x=>x.name)).toEqual(['The Magnus Protocol']);
 });
 it('uses only safe, additive metadata seeding and preserves user-written works',()=>{
  expect(sql).toContain('INSERT INTO public.tags(name,category,status)');
  expect(sql).toContain('INSERT INTO public.fandom_directory(tag_id,media_categories,subcategory,aliases,franchise)');
  expect(sql).toContain('ON CONFLICT DO NOTHING');
  expect(sql).toContain('ON CONFLICT(tag_id) DO NOTHING');
  expect(sql).not.toMatch(/\b(?:DELETE|TRUNCATE|DROP|UPDATE)\s+(?:FROM|TABLE)?\s*public\./i);
  expect(sql).not.toContain('public.work_tags');
  expect(sql).not.toContain('public.works');
 });
 it('gives writers more results rather than an unscrollable selector',()=>{
  const mini=read('src/PalaceFandomMiniPicker.jsx'),atlas=read('src/PalaceFandomAtlas.jsx');
  expect(mini).toContain('pageFandoms(matching,page,12)');
  expect(mini).toContain('fandomFacetOptions(rows,media)');
  expect(mini).toContain('Sort fandom choices');
  expect(mini).toContain('Filter fandoms by subcategory');
  expect(mini).toContain('Filter fandoms by franchise');
  expect(mini).toContain('shelf.total');
  expect(mini).toContain('tag.aliases.slice(0,2)');
  expect(mini).toContain('onChoose?.(tag)');
  expect(atlas).toContain('mediaCounts');
  expect(atlas).toContain('palace-fandom-media-count');
  expect(atlas).toContain('safeFandomSelection');
  expect(atlas).toContain("getStoriesForFandoms(selected,mode)");
 });
});
