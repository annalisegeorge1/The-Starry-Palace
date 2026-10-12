import React from 'react';
import {describe,it,expect,vi,afterEach} from 'vitest';
import {readFileSync} from 'node:fs';
import {render,screen,fireEvent,cleanup,waitFor} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {readingDefaults,cleanReadingDiscovery} from './useReadingDiscoveryState';
import ReadingArchivePager from './ReadingArchivePager';
import ReadingFacetSidebar from './ReadingFacetSidebar';

afterEach(cleanup);
const code=readFileSync('src/liveRooms.jsx','utf8');
const reading=code.split('export function ReadingLive({Frame})')[1].split('export function WritingLive({Frame})')[0];

describe('Reading atlas archive vs classics',()=>{
 it('defaults to archive-wide browsing but keeps all personal and classics scope options',()=>{
  expect(readingDefaults.catalogueScope).toBe('archive');
  expect(cleanReadingDiscovery({catalogueScope:'loaded'}).catalogueScope).toBe('loaded');
  expect(cleanReadingDiscovery({catalogueScope:'unknown'}).catalogueScope).toBe('archive');
  expect(reading).toContain("readingChoices.catalogueScope==='archive'");
  expect(reading).toContain("readerLens==='all'");
  expect(reading).toContain("vibeDoor==='all'");
  expect(reading).toContain("catalogueSort!=='bookmarks'");
  expect(reading).toContain('onClick={browseAllPublished}');
  expect(reading).toContain('onClick={browseLoadedShelves}');
  expect(reading).toContain('readerLens!==\'all\'');
  expect(reading).toContain('ClassicsLibraryHall');
 });
 it('searches server for public stories and never counts loaded stories as total published works',()=>{
  expect(reading).toContain('archiveBrowse=usePublishedBrowse(');
  expect(reading).toContain('archiveBrowse.snapshot?.results||[]');
  expect(reading).toContain('archiveBrowse.snapshot?.total||0');
  expect(reading).toContain('<ReadingArchivePager page={archiveBrowse.page}');
  expect(reading).toContain('onSearchTags={searchPalaceTags}');
  expect(reading).toContain('archiveWide={archiveBrowseEnabled}');
  expect(reading).toContain('onTagIdentified={identifyReadingTag}');
  expect(reading).toContain('getPublishedWorks({limit:48})');
 });
 it('retains broader sort options and safe remembered tag names',()=>{
  const p=cleanReadingDiscovery({catalogueSort:'chapters',includeTags:['tag-a'],tagLabels:{'tag-a':'Royal intrigue','unused':'unrelated'}});
  expect(p.catalogueSort).toBe('chapters');
  expect(p.tagLabels).toEqual({'tag-a':'Royal intrigue'});
  expect(cleanReadingDiscovery({catalogueSort:'bookmarks'}).catalogueSort).toBe('bookmarks');
 });
 it('allows page changes only within the reported server result count',()=>{
  const onPage=vi.fn();
  render(<ReadingArchivePager page={1} total={54} onPage={onPage}/>);
  expect(screen.getByText(/54/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:/Previous/}));
  fireEvent.click(screen.getByRole('button',{name:/Next/}));
  expect(onPage).toHaveBeenNthCalledWith(1,0);
  expect(onPage).toHaveBeenNthCalledWith(2,2);
 });
 it('searches the full tag directory without mixing remote tags into local suggestion counts',async()=>{
  const onToggle=vi.fn(),onSearchTags=vi.fn().mockResolvedValue([{id:'tag-x',name:'Palace intrigue',category:'trope',status:'canonical'}]);
  const onTagIdentified=vi.fn();
  render(<MemoryRouter><ReadingFacetSidebar archiveWide facets={[]} sort="updated" onSort={()=>{}} onRating={()=>{}} onStatus={()=>{}} onToggle={onToggle} onClear={()=>{}} onSearchTags={onSearchTags} onTagIdentified={onTagIdentified}/></MemoryRouter>);
  fireEvent.change(screen.getByPlaceholderText(/Fandom, character, relationship/),{target:{value:'intrigue'}});
  await waitFor(()=>expect(onSearchTags).toHaveBeenCalledWith('intrigue','all',60),{timeout:2200});
  await waitFor(()=>expect(screen.getByText('Palace intrigue')).toBeTruthy(),{timeout:2200});
  fireEvent.click(screen.getByText('Tropes'));
  fireEvent.click(screen.getByRole('button',{name:'Include Palace intrigue'}));
  expect(onToggle).toHaveBeenCalledWith('tag-x','include');
  expect(onTagIdentified).toHaveBeenCalledWith(expect.objectContaining({name:'Palace intrigue'}));
 });
});
