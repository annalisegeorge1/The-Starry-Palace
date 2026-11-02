import React from 'react';
import {describe,it,expect,afterEach} from 'vitest';
import {render,screen,cleanup} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import UnifiedFanworkCatalogue,{createUnifiedFanworks,filterUnifiedFanworks} from '../src/UnifiedFanworkCatalogue.jsx';
import {MODERN_FANFICTION_LINKS} from '../src/palaceFanfictionDiscovery.js';
afterEach(cleanup);

const hosted=[
 {id:'member-1',title:'A Fanwork from the Palace',slug:'palace-story',work_type:'fanwork',
  rating:'teen',summary:'An original member’s Naruto fanwork.',completion_status:'complete',
  profiles:{display_name:'Palace Writer'},
  work_tags:[{tags:{name:'Naruto',category:'fandom'}}]},
 {id:'historic-1',title:'Old Friends and New Fancies',slug:'old-friends-and-new-fancies-sybil-g-brinton',
  work_type:'fanwork',is_archive:true,archive_category:'historical_fanfiction',rating:'not_rated',
  creator_name:'Sybil G. Brinton',work_tags:[{tags:{name:'Jane Austen',category:'fandom'}}]},
 {id:'novel-1',title:'An Original Novel',slug:'original',work_type:'original',rating:'general'}
];
describe('Unified Fanwork catalogue',()=>{
 it('combines actual member works, public-domain historical works and 98 independent links without duplicating',()=>{
  const entries=createUnifiedFanworks(hosted);
  expect(entries).toHaveLength(100);
  expect(new Set(entries.map(e=>e.key)).size).toBe(100);
  expect(entries.filter(e=>e.kind==='link')).toHaveLength(98);
  expect(entries.filter(e=>e.kind==='member')).toHaveLength(1);
  expect(entries.filter(e=>e.kind==='historical')).toHaveLength(1);
  expect(entries.find(e=>e.kind==='member').href).toBe('/work/palace-story');
  expect(entries.find(e=>e.kind==='historical').href).toBe('/classic/old-friends-and-new-fancies-sybil-g-brinton');
  expect(entries.find(e=>e.kind==='link').href).toMatch(/^https:\/\//);
  expect(entries.some(e=>e.title==='An Original Novel')).toBe(false);
 });
 it('matches host and external fanworks with the same search and source controls',()=>{
  const items=createUnifiedFanworks(hosted);
  const naruto=filterUnifiedFanworks(items,{query:'Naruto'});
  expect(naruto.some(e=>e.kind==='member')).toBe(true);
  expect(naruto.some(e=>e.kind==='link')).toBe(true);
  expect(filterUnifiedFanworks(items,{source:'linked'}).every(e=>e.kind==='link')).toBe(true);
  expect(filterUnifiedFanworks(items,{source:'hosted'}).every(e=>e.kind!=='link')).toBe(true);
  expect(filterUnifiedFanworks(items,{fandomNames:['Naruto']}).some(e=>e.title==='A Fanwork from the Palace')).toBe(true);
  expect(filterUnifiedFanworks(items,{fandomNames:['Naruto']}).every(e=>e.title!=='Old Friends and New Fancies')).toBe(true);
 });
 it('hides mature external works by default and preserves rating/warning evidence',()=>{
  const all=createUnifiedFanworks(hosted);
  const selected=all.find(e=>e.key==='external:anime-primulad-el-secreto-touya');
  expect(selected.rating).toBe('mature');
  expect(filterUnifiedFanworks(all).some(e=>e.key===selected.key)).toBe(false);
  expect(filterUnifiedFanworks(all,{includeMature:true}).some(e=>e.key===selected.key)).toBe(true);
  expect(selected.permissionUrl).toMatch(/^https:\/\//);
  expect(selected.author).toBe('PrimulaD');
 });
 it('renders a single list with distinct Palace and original-source reading actions',()=>{
  render(<MemoryRouter><UnifiedFanworkCatalogue publishedWorks={hosted}
   externalWorks={MODERN_FANFICTION_LINKS.slice(0,1)}/></MemoryRouter>);
  expect(screen.getByRole('heading',{name:/Fan-made works/})).toBeTruthy();
  expect(screen.getAllByRole('link',{name:/Read on the Palace/})).toHaveLength(2);
  expect(screen.getByRole('link',{name:/Read at original source/})).toBeTruthy();
  expect(screen.getAllByText(/Hosted historical fanwork|Palace member fanwork|Original author’s site/).length).toBe(3);
  expect(screen.getByText(/by Palace Writer/)).toBeTruthy();
  const external=screen.getByRole('link',{name:/Read at original source/});
  expect(external.getAttribute('target')).toBe('_blank');
  expect(external.getAttribute('rel')).toContain('noopener');

 });
 it('does not repeat a Palace-hosted edition as an external author-source recommendation',()=>{
  const linked=MODERN_FANFICTION_LINKS.find(x=>x.id==='anime-primulad-renuncia');
  const archive={id:'archive-renuncia',slug:'renuncia',title:'Renuncia',summary:'Hosted fanfic',
   is_archive:true,archive_category:'licensed_fanfiction',work_type:'fanwork',rating:'general',
   archive_source_url:linked.sourceUrl,creator_name:'PrimulaD',work_tags:[{tags:{name:'Tsubasa Chronicle',category:'fandom'}}]};
  const catalogue=createUnifiedFanworks([archive],MODERN_FANFICTION_LINKS);
  expect(catalogue.some(x=>x.key==='archive:renuncia')).toBe(true);
  expect(catalogue.some(x=>x.key==='external:anime-primulad-renuncia')).toBe(false);
 });
});
