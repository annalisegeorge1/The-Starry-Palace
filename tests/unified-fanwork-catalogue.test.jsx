import React from 'react';
import {describe,it,expect,afterEach,vi} from 'vitest';
import {render,screen,cleanup} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import UnifiedFanworkCatalogue,{createUnifiedFanworks,filterUnifiedFanworks} from '../src/UnifiedFanworkCatalogue.jsx';
import {MODERN_FANFICTION_LINKS} from '../src/palaceFanfictionDiscovery.js';
import {toHostedReadingWork} from '../src/hostedReadingWork.js';
afterEach(cleanup);

const hosted=[
 {id:'member-1',title:'A Fanwork from the Palace',slug:'palace-story',work_type:'fanwork',
  rating:'teen',summary:'An original member’s Naruto fanwork.',completion_status:'complete',
  profiles:{display_name:'Palace Writer'},
  work_tags:[{tags:{name:'Naruto',category:'fandom'}}]},
 {id:'historic-1',title:'Old Friends and New Fancies',slug:'old-friends-and-new-fancies-sybil-g-brinton',
  work_type:'fanwork',is_archive:true,archive_display_ready:true,archive_category:'historical_fanfiction',rating:'not_rated',
  creator_name:'Sybil G. Brinton',work_tags:[{tags:{name:'Jane Austen',category:'fandom'}}]},
 {id:'novel-1',title:'An Original Novel',slug:'original',work_type:'original',rating:'general'}
];
describe('Unified Fanwork catalogue',()=>{
 it('combines actual member works, public-domain historical works and all curated independent links without duplicating',()=>{
  const entries=createUnifiedFanworks(hosted);
  expect(entries).toHaveLength(MODERN_FANFICTION_LINKS.length+2);
  expect(new Set(entries.map(e=>e.key)).size).toBe(entries.length);
  expect(entries.filter(e=>e.kind==='link')).toHaveLength(MODERN_FANFICTION_LINKS.length);
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
 it('shows rated public metadata by default with evidence and a protected reader boundary',()=>{
  const all=createUnifiedFanworks(hosted);
  const selected=all.find(e=>e.key==='external:anime-primulad-el-secreto-touya');
  expect(selected.rating).toBe('mature');
  expect(filterUnifiedFanworks(all).some(e=>e.key===selected.key)).toBe(true);
  expect(selected.permissionUrl).toMatch(/^https:\/\//);
  expect(selected.author).toBe('PrimulaD');
  render(<MemoryRouter><UnifiedFanworkCatalogue publishedWorks={[]} externalWorks={[selected.work]}/></MemoryRouter>);
  expect(screen.getByText(/Protected chapter access still follows/i)).toBeTruthy();
  expect(screen.queryByRole('button',{name:/I am 18/i})).toBeNull();
 });
 it('matches selected tag IDs, excludes overriding includes, and honours source-link tag names',()=>{
  const member={id:'rated-member',slug:'rated-member',title:'A Published Mature Naruto Fanwork',
   work_type:'fanwork',rating:'explicit',publication_status:'published',visibility:'public',
   work_tags:[
    {tags:{id:'fandom-naruto',name:'Naruto',category:'fandom',status:'canonical'}},
    {tags:{id:'relationship-ff',name:'F/F',category:'relationship',status:'canonical'}}
   ]};
  const rows=createUnifiedFanworks([member]);
  const tagNames={'fandom-naruto':'Naruto','relationship-ff':'F/F'};
  const selected=filterUnifiedFanworks(rows,{includeTags:['fandom-naruto'],tagNames});
  expect(selected.some(row=>row.key==='member:rated-member')).toBe(true);
  expect(selected.some(row=>row.kind==='link')).toBe(true);
  const both=filterUnifiedFanworks(rows,{includeTags:['fandom-naruto','relationship-ff'],tagNames});
  expect(both.some(row=>row.key==='member:rated-member')).toBe(true);
  const excluded=filterUnifiedFanworks(rows,{
   includeTags:['fandom-naruto'],excludeTags:['relationship-ff'],tagNames
  });
  expect(excluded.some(row=>row.key==='member:rated-member')).toBe(false);
  expect(excluded.every(row=>!row.tagDetails.some(tag=>tag.name==='F/F'))).toBe(true);
  expect(filterUnifiedFanworks(rows,{includeTags:['unknown-tag-id'],tagNames})).toHaveLength(0);
 });
 it('applies relationship include and exclude filters independently of story ratings',()=>{
  const member={id:'explicit-ff',slug:'explicit-ff',title:'F/F metadata',
   work_type:'fanwork',rating:'explicit',publication_status:'published',visibility:'public',
   work_tags:[{tags:{id:'f-f',name:'F/F',category:'relationship',status:'canonical'}}]};
  const rows=createUnifiedFanworks([member],[]);
  expect(filterUnifiedFanworks(rows,{relationshipIncluded:['ff']})).toHaveLength(1);
  expect(filterUnifiedFanworks(rows,{relationshipExcluded:['ff']})).toHaveLength(0);
  expect(filterUnifiedFanworks(rows,{relationshipIncluded:['mm']})).toHaveLength(0);
 });
 it('does not turn private member drafts or restricted member listings into public fanfiction',()=>{
  const publicStory={id:'public-work',slug:'public-work',title:'Public fanfiction',
   work_type:'fanwork',rating:'explicit',publication_status:'published',visibility:'public'};
  const privateDraft={...publicStory,id:'private-draft',slug:'draft',
   publication_status:'draft',visibility:'private'};
  const memberOnly={...publicStory,id:'member-only',slug:'member-only',
   publication_status:'published',visibility:'members'};
  const rows=createUnifiedFanworks([publicStory,privateDraft,memberOnly],[]);
  expect(rows.map(x=>x.key)).toEqual(['member:public-work']);
 });
 it('only removes author-source links when a verified hosted edition can be displayed',()=>{
  const linked=MODERN_FANFICTION_LINKS.find(x=>x.id==='anime-primulad-renuncia');
  const record={id:'rights-check',slug:'rights-check',title:'Rights check',
   category:'licensed_fanfiction',publication_status:'draft',host_mode:'metadata_only',
   archive_source_url:linked.sourceUrl,rights_status:'licensed',creator_name:'Original author'};
  const pending=toHostedReadingWork(record);
  expect(pending.archive_display_ready).toBe(false);
  const pendingRows=createUnifiedFanworks([pending],[linked]);
  expect(pendingRows.some(x=>x.kind==='licensed')).toBe(false);
  expect(pendingRows.some(x=>x.key==='external:anime-primulad-renuncia')).toBe(true);
  const cleared=toHostedReadingWork({...record,publication_status:'published',host_mode:'full',
   hosted_text_ready:true,hosted_rights_verified:true,verified_at:'2026-11-01T00:00:00Z'});
  expect(cleared.archive_display_ready).toBe(true);
  const publishedRows=createUnifiedFanworks([cleared],[linked]);
  expect(publishedRows.some(x=>x.kind==='licensed')).toBe(true);
  expect(publishedRows.some(x=>x.key==='external:anime-primulad-renuncia')).toBe(false);
 });
 it('renders a single list with distinct Palace and original-source reading actions',()=>{
  render(<MemoryRouter><UnifiedFanworkCatalogue publishedWorks={hosted}
   externalWorks={[MODERN_FANFICTION_LINKS.find(work=>work.id==='anime-animeisperfection-frozen-heart')]}/></MemoryRouter>);
  expect(screen.getByRole('heading',{name:/Fan-made works/})).toBeTruthy();
  expect(screen.getByRole('combobox',{name:/Read from/}).value).toBe('all');
  expect(screen.getByText(/1 author-source links/)).toBeTruthy();
  expect(screen.getAllByRole('link',{name:/Read on the Palace/})).toHaveLength(2);
  expect(screen.getByRole('link',{name:/Read at original source/})).toBeTruthy();
  expect(screen.getAllByText(/Hosted historical fanwork|Palace member fanwork|Original author’s site/).length).toBe(3);
  expect(screen.getByText(/by Palace Writer/)).toBeTruthy();
  const external=screen.getByRole('link',{name:/Read at original source/});
  expect(external.getAttribute('target')).toBe('_blank');
  expect(external.getAttribute('rel')).toContain('noopener');

 });
 it('does not claim no fanworks exist while an empty hosted search is still loading',()=>{
  const {rerender}=render(<MemoryRouter><UnifiedFanworkCatalogue publishedWorks={[]}
   externalWorks={[]} loading hasMoreHosted/></MemoryRouter>);
  expect(screen.queryByText(/No fanworks match these choices/)).toBeNull();
  expect(screen.queryByText(/No matching works in the loaded pages/)).toBeNull();
  rerender(<MemoryRouter><UnifiedFanworkCatalogue publishedWorks={[]} externalWorks={[]}
   loading={false} hasMoreHosted/></MemoryRouter>);
  expect(screen.getByText(/No matching works in the loaded pages/)).toBeTruthy();
  expect(screen.queryByText(/No fanworks match these choices/)).toBeNull();
 });
 it('keeps the load-more control accessible and prevents repeated clicks while fetching',()=>{
  const onMoreHosted=vi.fn();
  const {rerender}=render(<MemoryRouter><UnifiedFanworkCatalogue publishedWorks={[]}
   externalWorks={[]} hasMoreHosted onMoreHosted={onMoreHosted}/></MemoryRouter>);
  const more=screen.getByRole('button',{name:/Load additional Palace-published works/});
  expect(more.disabled).toBe(false);
  more.click();
  expect(onMoreHosted).toHaveBeenCalledTimes(1);
  rerender(<MemoryRouter><UnifiedFanworkCatalogue publishedWorks={[]}
   externalWorks={[]} hasMoreHosted loadingMoreHosted onMoreHosted={onMoreHosted}/></MemoryRouter>);
  const busy=screen.getByRole('button',{name:/Loading additional Palace works/});
  expect(busy.disabled).toBe(true);
  expect(busy.getAttribute('aria-busy')).toBe('true');
  busy.click();
  expect(onMoreHosted).toHaveBeenCalledTimes(1);
 });
 it('does not show a conclusive empty result when the hosted lookup has failed',()=>{
  render(<MemoryRouter><UnifiedFanworkCatalogue publishedWorks={[]} externalWorks={[]}
   loadError="A temporary source error."/></MemoryRouter>);
  expect(screen.getByRole('alert')).toBeTruthy();
  expect(screen.queryByText(/No fanworks match these choices/)).toBeNull();
 });
 it('does not repeat a Palace-hosted edition as an external author-source recommendation',()=>{
  const linked=MODERN_FANFICTION_LINKS.find(x=>x.id==='anime-primulad-renuncia');
  const archive={id:'archive-renuncia',slug:'renuncia',title:'Renuncia',summary:'Hosted fanfic',
   is_archive:true,archive_display_ready:true,archive_category:'licensed_fanfiction',work_type:'fanwork',rating:'general',
   archive_source_url:linked.sourceUrl,creator_name:'PrimulaD',work_tags:[{tags:{name:'Tsubasa Chronicle',category:'fandom'}}]};
  const catalogue=createUnifiedFanworks([archive],MODERN_FANFICTION_LINKS);
  expect(catalogue.some(x=>x.key==='archive:renuncia')).toBe(true);
  expect(catalogue.some(x=>x.key==='external:anime-primulad-renuncia')).toBe(false);
 });
});
