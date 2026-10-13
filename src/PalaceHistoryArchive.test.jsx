import React from 'react';
import {describe,it,expect,vi} from 'vitest';
import {render,screen,fireEvent,within,cleanup} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import PalaceHistoryArchive from './PalaceHistoryArchive';

const life={
 threads:[{id:'discussion-1',created_at:'2026-10-13T10:00:00Z',title:'The Reading Circle',body:'A gentle discussion'}],
 communityIntroductions:[{id:'intro-1',created_at:'2026-10-12T09:00:00Z',title:'A new star',body:'Here to write'}],
 highlights:[{id:'highlight-1',created_at:'2026-10-11T08:00:00Z',title:'Lovely poetry',reason:'A shining poem'}]
};
const stories=[{work:{id:'book-1',slug:'moonlit-book',title:'Moonlit Book',summary:'A story by the sea',profiles:{display_name:'The Blue Moon'}},
 details:{lastChangedAt:'2026-10-13T11:00:00Z',chapterCount:15,wordCount:62329,chapterTitle:'A rainy night',changeKind:'updated'}}];
function mount(props={}){return render(<MemoryRouter><PalaceHistoryArchive life={life} stories={stories} loadState="ready" onRefresh={vi.fn()} onVisitRoom={vi.fn()} {...props}/></MemoryRouter>)}

describe('Palace Life History room',()=>{
 it('shows documented chapters and a private reading-history doorway',()=>{
  const {container}=mount();
  expect(screen.getByRole('heading',{name:/History · The days we gathered/})).toBeTruthy();
  expect(screen.getByText('62,329 words')).toBeTruthy();
  expect(screen.getByText('15 chapters')).toBeTruthy();
  expect(screen.getByText('Latest: A rainy night')).toBeTruthy();
  expect(screen.getByRole('link',{name:/My reading history/}).getAttribute('href')).toBe('/library?tab=history');
  expect(screen.getByRole('link',{name:/Read story/}).getAttribute('href')).toBe('/work/moonlit-book');
  expect(container.querySelectorAll('.palace-chronicle-record')).toHaveLength(4);
  cleanup();
 });
 it('can filter Commons entries, search and return to full history',()=>{
  const visit=vi.fn();
  mount({onVisitRoom:visit});
  fireEvent.click(screen.getByRole('button',{name:/Conversations/}));
  expect(screen.getAllByText('The Reading Circle').length).toBeGreaterThan(0);
  expect(screen.queryByText('Moonlit Book')).toBeNull();
  fireEvent.click(screen.getByRole('button',{name:/View room/}));
  expect(visit).toHaveBeenCalledWith('forum');
  fireEvent.change(screen.getByRole('textbox',{name:'Search Palace Life history'}),{target:{value:'unmatched phrase'}});
  expect(screen.getByText('No moments match your filters.')).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'Show all moments'}));
  expect(screen.getByText('Moonlit Book')).toBeTruthy();
  cleanup();
 });
 it('omits unverified counts on partial story loading, not falsely reporting zero',()=>{
  mount({loadState:'partial'});
  expect(screen.getByText('Chapters not verified')).toBeTruthy();
  expect(screen.getByText('Words not verified')).toBeTruthy();
  expect(screen.queryByText('15 chapters')).toBeNull();
  cleanup();
 });
});
