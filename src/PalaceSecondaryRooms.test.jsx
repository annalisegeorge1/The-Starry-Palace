import React from 'react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import PalaceCodeRoom from './PalaceCodeRoom';
import PalaceLostWorksRoom from './PalaceLostWorksRoom';
import {useAuth} from './auth';
import {getArchive,getArchiveText,setArchiveRecordSaved} from './palaceData';
vi.mock('./auth',()=>({useAuth:vi.fn()}));
vi.mock('./palaceData',()=>({
 getArchive:vi.fn(),getArchiveText:vi.fn(),setArchiveRecordSaved:vi.fn()
}));
vi.mock('./ClassicBookCover',()=>({default:()=> <span aria-label="Archive cover"/>}));
vi.mock('./ArchiveClassicReader',()=>({default:({text})=><article aria-label="Hosted archive text">{typeof text==='string'?text:'Text available'}</article>}));
const Frame=({children})=><main>{children}</main>;
const citation={id:'cite-1',slug:'citation-only',host_mode:'citation',category:'novel',title:'Citation record',creator_name:'Archivist',summary:'A reference only',updated_at:'2026-10-12T10:00:00Z'};
const hosted={id:'hosted-1',slug:'hosted-work',host_mode:'full',category:'novel',title:'A Verified Hosted Work',creator_name:'Creator',summary:'A safely hosted reading edition',updated_at:'2026-10-13T10:00:00Z'};

afterEach(()=>{cleanup();vi.clearAllMocks()});
describe('Extracted secondary Palace rooms',()=>{
 it('preserves the entire Code with public routes to Council and archive policy',()=>{
  render(<MemoryRouter><PalaceCodeRoom Frame={Frame}/></MemoryRouter>);
  expect(screen.getByRole('heading',{name:'The Palace Code'})).toBeTruthy();
  expect(screen.getAllByRole('article')).toHaveLength(7);
  expect(screen.getByRole('link',{name:/Palace Council/}).getAttribute('href')).toBe('/council');
  expect(screen.getByRole('link',{name:/Lost Works policy/}).getAttribute('href')).toBe('/lost-works');
 });
 it('shows citation-only records without an illicit reading action',async()=>{
  useAuth.mockReturnValue({session:null});
  getArchive.mockResolvedValue([citation]);
  render(<MemoryRouter><PalaceLostWorksRoom Frame={Frame}/></MemoryRouter>);
  expect(await screen.findByRole('heading',{name:'Citation record'})).toBeTruthy();
  expect(screen.queryByRole('button',{name:/Read story/})).toBeNull();
  expect(getArchive).toHaveBeenCalledWith(undefined);
 });
 it('opens only a hosted reading edition while retaining archive source metadata',async()=>{
  useAuth.mockReturnValue({session:null});
  getArchive.mockResolvedValue([citation,hosted]);
  getArchiveText.mockResolvedValue('The verified archive text.');
  render(<MemoryRouter><PalaceLostWorksRoom Frame={Frame}/></MemoryRouter>);
  await screen.findByRole('heading',{name:'A Verified Hosted Work'});
  expect(screen.getAllByRole('button',{name:/Read story/})).toHaveLength(1);
  fireEvent.click(screen.getByRole('button',{name:/Read story/}));
  await waitFor(()=>expect(getArchiveText).toHaveBeenCalledWith('hosted-1'));
  expect(await screen.findByLabelText('Hosted archive text')).toBeTruthy();
  expect(setArchiveRecordSaved).not.toHaveBeenCalled();
 });
});
