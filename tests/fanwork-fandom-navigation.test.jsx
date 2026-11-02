import React from 'react';
import {describe,it,expect,afterEach} from 'vitest';
import {render,screen,cleanup} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {readFileSync} from 'node:fs';
import UnifiedFanworkCatalogue,{createUnifiedFanworks,filterUnifiedFanworks} from '../src/UnifiedFanworkCatalogue.jsx';
import {fanworkFandomHref,fanworkFandomFromSearch,intakeFandomNames} from '../src/fanworkFandomNavigation.js';
import {LICENSED_ANIME_FANWORK_INTAKE} from '../src/licensedAnimeFanworkIntake.js';
import {hostedFanfictionGuide,archiveFanfictionTags} from '../src/fanfictionMetadata.js';
afterEach(cleanup);

describe('Fanwork-to-fandom integration',()=>{
 it('creates one exact fandom route, preserving punctuation and Unicode',()=>{
  const fandom='Yu-Gi-Oh! 5D’s';
  expect(fanworkFandomHref(fandom)).toBe('/fandoms?section=fanfiction&fandom='+encodeURIComponent(fandom));
  expect(fanworkFandomFromSearch(fanworkFandomHref(fandom).split('?')[1])).toBe(fandom);
  expect(fanworkFandomFromSearch('?section=fanfiction')).toBe('');
  expect(intakeFandomNames('Naruto · Star Wars')).toEqual(['Naruto','Star Wars']);
  expect(intakeFandomNames('Yu-Gi-Oh! · Misc. Anime/Manga')).toEqual(['Yu-Gi-Oh!']);
 });
 it('makes crossovers discoverable by both component fandoms, not by an invented combined fandom',()=>{
  const work=LICENSED_ANIME_FANWORK_INTAKE.find(x=>x.slug==='nindo-of-the-force-1-michaelzorch');
  expect(work).toBeTruthy();
  const info=hostedFanfictionGuide(work);
  const names=info.tags.filter(x=>x.category==='fandom').map(x=>x.name);
  expect(names).toEqual(['Naruto','Star Wars']);
  expect(archiveFanfictionTags(work).filter(x=>x.tags.category==='fandom')).toHaveLength(2);
 });
 it('links live hosted and external recommendations to the same fandom shelf',()=>{
  const hosted=[{id:'member-tag',title:'My Naruto Work',slug:'my-naruto-work',work_type:'fanwork',rating:'general',
   profiles:{display_name:'Example Writer'},work_tags:[{tags:{id:'naruto',name:'Naruto',category:'fandom'}}]}];
  const external=[{id:'external-naruto',title:'A Linked Fic',creator:'Another Writer',fandom:'Naruto',
   description:'A shared story',sourceUrl:'https://www.fanfiction.net/s/12345678/1/Example',permissionUrl:'https://example.org/terms',permissionLabel:'Author terms'}];
  const entries=createUnifiedFanworks(hosted,external);
  expect(filterUnifiedFanworks(entries,{fandomNames:['Naruto']}).some(x=>x.kind==='member')).toBe(true);
  render(<MemoryRouter><UnifiedFanworkCatalogue publishedWorks={hosted} externalWorks={[]}
   defaultSource="hosted"/></MemoryRouter>);
  const tag=screen.getByRole('link',{name:'Naruto'});
  expect(tag.getAttribute('href')).toBe(fanworkFandomHref('Naruto'));
  expect(screen.queryByText(/author-source links/)).toBeNull();
 });
 it('reads one exact fandom parameter in the Fandom Atlas, without overriding multi-select',()=>{
  const source=readFileSync('src/PalaceFandomAtlas.jsx','utf8');
  expect(source).toContain('fanworkFandomFromSearch(location.search)');
  expect(source).toContain('const activeFandomNames=selectedNames.length?selectedNames:exactFandom?[exactFandom]:[];');
  expect(source).toContain('fandomNames={activeFandomNames}');
  expect(source).toContain('defaultSource="hosted"');
  expect(source).toContain("changeParams({ids:null,match:null,fandom:null})");
 });
});
