import React from 'react';
import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import LibraryHistoryChronicle from './LibraryHistoryChronicle';
import {getPalaceHistoryMoments,getPublishedWorks,getStoryHistoryMetadata} from './palaceData';

vi.mock('./palaceData',()=>({
 getPalaceHistoryMoments:vi.fn(),
 getPublishedWorks:vi.fn(),
 getStoryHistoryMetadata:vi.fn()
}));
const progress={work_id:'private-book',updated_at:'2026-10-13T09:00:00Z',progress_percent:38,completed:false,
 chapter_id:'page-12',works:{id:'private-book',title:'The Private Moon',slug:'private-moon',
 summary:'A private reading journey'}};
const pub={id:'public-book',title:'The Glass Garden',slug:'glass-garden',
 summary:'A published story',last_published_at:'2026-10-12T10:00:00Z',
 profiles:{display_name:'Celestial Writer'}};
const history={progress:[progress],comicProgress:[]};
function mount(){return render(<MemoryRouter><LibraryHistoryChronicle userId="reader-1" library={history}
 historyChapters={{'private-book':[{status:'published',word_count:500,title:'Chapter One',published_at:'2026-10-12T09:00:00Z'}]}}/></MemoryRouter>)}

beforeEach(()=>{
 vi.clearAllMocks();
 getPalaceHistoryMoments.mockResolvedValue({threads:[{id:'forum-1',title:'Gathering with Readers',created_at:'2026-10-13T10:00:00Z',body:'Poems and books'}],communityIntroductions:[],highlights:[]});
 getPublishedWorks.mockResolvedValue([pub]);
 getStoryHistoryMetadata.mockResolvedValue({'public-book':[{status:'published',title:'Garden Door',word_count:4100,published_at:'2026-10-12T10:00:00Z'}]});
});
afterEach(cleanup);

describe('My Library unified History screen',()=>{
 it('shows private reading alongside published updates and shared moments without conflating visibility',async()=>{
  const {container}=mount();
  expect(screen.getByText('The Private Moon')).toBeTruthy();
  expect(await screen.findByText('The Glass Garden')).toBeTruthy();
  expect(screen.getByText('Gathering with Readers')).toBeTruthy();
  expect(screen.getAllByText(/PRIVATE · YOUR HISTORY/).length).toBe(1);
  expect(screen.getAllByText(/PALACE MOMENT/).length).toBe(2);
  expect(screen.getByText('4,100 words')).toBeTruthy();
  expect(screen.getByRole('link',{name:/Resume/}).getAttribute('href')).toBe('/work/private-moon/chapter/page-12');
  expect(container.querySelectorAll('.library-chronicle-item')).toHaveLength(3);
 });
 it('filters history to private reading without removing public data',async()=>{
  mount();
  await screen.findByText('The Glass Garden');
  fireEvent.click(screen.getByRole('button',{name:/My reading/}));
  expect(screen.getByText('The Private Moon')).toBeTruthy();
  expect(screen.queryByText('The Glass Garden')).toBeNull();
  fireEvent.click(screen.getByRole('button',{name:/Story updates/}));
  expect(screen.getByText('The Glass Garden')).toBeTruthy();
  expect(screen.queryByText('The Private Moon')).toBeNull();
  fireEvent.change(screen.getByRole('textbox',{name:'Search combined Library history'}),{target:{value:'not-found'}});
  expect(screen.getByText('Nothing matches these filters.')).toBeTruthy();
 });
 it('keeps a direct saved-chapter shortcut when a story has newer changes',async()=>{
  const updatedProgress={...progress,works:{...progress.works,last_published_at:'2026-10-14T09:00:00Z'}};
  render(<MemoryRouter><LibraryHistoryChronicle userId="reader-1" library={{progress:[updatedProgress],comicProgress:[]}}
   historyChapters={{'private-book':[{status:'published',word_count:500,title:'Chapter One',published_at:'2026-10-12T09:00:00Z'}]}}/></MemoryRouter>);
  const resume=screen.getByRole('link',{name:'Resume saved chapter ↗'});
  expect(resume.getAttribute('href')).toBe('/work/private-moon/chapter/page-12');
  expect(screen.getByRole('link',{name:'See latest story updates ↗'}).getAttribute('href')).toBe('/work/private-moon');
  expect(screen.getByText(/Last story publication:/)).toBeTruthy();
  expect(screen.getByText('New story update available · saved at 38%')).toBeTruthy();
  expect(screen.getByRole('progressbar',{name:'Saved reading progress for The Private Moon'}).getAttribute('aria-valuenow')).toBe('38');
 });
 it('lets readers expand and collapse a long History summary without hiding story details',async()=>{
  const longSummary='An intricate tale of moonlit rooms and lost letters. '.repeat(13).trim();
  getPublishedWorks.mockResolvedValue([{...pub,summary:longSummary}]);
  mount();
  await screen.findByText('The Glass Garden');
  const toggle=screen.getByRole('button',{name:'Show more summary ↓'});
  expect(toggle.getAttribute('aria-expanded')).toBe('false');
  fireEvent.click(toggle);
  expect(screen.getByRole('button',{name:'Show less ↑'}).getAttribute('aria-expanded')).toBe('true');
  const summary=screen.getByText(longSummary.slice(0,180),{exact:false});
  expect(summary.classList.contains('is-expanded')).toBe(true);
  fireEvent.click(screen.getByRole('button',{name:'Show less ↑'}));
  expect(screen.getByRole('button',{name:'Show more summary ↓'}).getAttribute('aria-expanded')).toBe('false');
 });
 it('keeps private reading accessible when community and published queries fail',async()=>{
  getPalaceHistoryMoments.mockRejectedValue(new Error('Offline'));
  getPublishedWorks.mockRejectedValue(new Error('Offline'));
  mount();
  expect(screen.getByText('The Private Moon')).toBeTruthy();
  await waitFor(()=>expect(screen.getByRole('alert').textContent).toContain('could not be loaded'));
  expect(screen.getByText('The Private Moon')).toBeTruthy();
  expect(screen.queryByText('The Glass Garden')).toBeNull();
 });
});
