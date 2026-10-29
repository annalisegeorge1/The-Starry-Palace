import React from 'react';
import {afterEach,describe,expect,it} from 'vitest';
import {cleanup,render,screen,within} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import LibraryOverview from './LibraryOverview';

afterEach(cleanup);
const library={
 progress:[{work_id:'read',chapter_id:'one',updated_at:'2026-10-15T12:00:00Z',completed:false,chapter_progress_percent:50,
  works:{id:'read',title:'The Silver Door',slug:'silver-door',last_published_at:'2026-10-15T12:00:00Z'}}],
 saved:[{saved_at:'2026-10-16T12:00:00Z',works:{id:'unread',title:'The Purple Orchard',slug:'purple-orchard'}}],
 subscriptions:[{work_id:'read',enabled:true,works:{id:'read',title:'The Silver Door',slug:'silver-door',last_published_at:'2026-10-20T12:00:00Z'}}]
};
describe('My Library overview presentation',()=>{
 it('links genuine reading and saved-for-later positions into the existing shelves',()=>{
  render(<MemoryRouter><LibraryOverview library={library} organizers={{collections:[{id:'one',name:'Favourite Folktales'}]}}/></MemoryRouter>);
  const overview=screen.getByLabelText('My Library overview');
  expect(within(overview).getByText('A home for every story you keep.')).toBeTruthy();
  expect(screen.getByRole('link',{name:/The Silver Door.*Open story/}).getAttribute('href')).toBe('/work/silver-door/chapter/one');
  expect(screen.getByRole('link',{name:/The Purple Orchard.*Open story/}).getAttribute('href')).toBe('/work/purple-orchard');
  expect(screen.getByRole('link',{name:/Favourite Folktales/}).getAttribute('href')).toBe('/library?tab=collections');
  expect(screen.getByRole('link',{name:/Notes & Bookmarks/}).getAttribute('href')).toBe('/library?tab=notes');
  expect(screen.getByRole('link',{name:/History/}).getAttribute('href')).toBe('/library?tab=history');
 });
 it('offers one useful reading invitation instead of two empty shelf panels',()=>{
  const finished={
   progress:[{work_id:'done',completed:true,updated_at:'2026-10-15T12:00:00Z',
    works:{id:'done',title:'A Finished Book',slug:'finished-book'}}],
   subscriptions:[{work_id:'done',enabled:true,works:{id:'done',title:'A Finished Book',slug:'finished-book'}}]
  };
  render(<MemoryRouter><LibraryOverview library={finished} organizers={{}}/></MemoryRouter>);
  expect(screen.getByRole('region',{name:'Find your next reading journey'})).toBeTruthy();
  expect(screen.queryByRole('region',{name:'Your place in the story'})).toBeNull();
  expect(screen.queryByRole('region',{name:'Saved for another night'})).toBeNull();
  expect(screen.getByRole('link',{name:/Revisit finished stories/}).getAttribute('href')).toBe('/library?tab=finished');
  expect(screen.getByRole('link',{name:/Finished works \(1\)/}).getAttribute('href')).toBe('/library?tab=finished');
  expect(screen.getByRole('link',{name:/Following \(1\)/}).getAttribute('href')).toBe('/library?tab=following');
 });
 it('does not claim new updates when no last-reading position exists',()=>{
  render(<MemoryRouter><LibraryOverview library={{subscriptions:[{work_id:'new',works:{id:'new',title:'Unopened',slug:'unopened',last_published_at:'2026-10-20T12:00:00Z'}}]}} organizers={{}}/></MemoryRouter>);
  expect(screen.getByText(/Nothing new is confirmed against your recorded reading positions/)).toBeTruthy();
  expect(screen.getByRole('link',{name:/View subscriptions/}).getAttribute('href')).toBe('/library?tab=following');
 });
});
