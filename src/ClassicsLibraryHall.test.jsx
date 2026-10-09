import React from 'react';
import {afterEach,describe,expect,it} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import ClassicsLibraryHall from './ClassicsLibraryHall';

const classics=Array.from({length:13},(_,i)=>({
 id:'classic-'+i,slug:'classic-'+i,title:'Book '+String(i+1).padStart(2,'0'),
 creator_name:i===10?'Jane Austen':'Archive Author',rights_status:'public_domain_verified',
 is_archive:true,rating:'not_rated',summary:i===10?'An Austen comedy.':'A published older world.',
 profiles:{display_name:i===10?'Jane Austen':'Archive Author'},work_tags:[]
}));
afterEach(cleanup);
function setup(records=classics){
 return render(<MemoryRouter initialEntries={['/reading']}>
  <div className="palace-shell"><ClassicsLibraryHall works={records} storyHref={w=>'/lost-works?open='+w.slug}/></div>
 </MemoryRouter>);
}
describe('Palace Classics library hall',()=>{
 it('shows page one and can reach every later book, keeping real archive links',()=>{
  setup();
  fireEvent.click(screen.getByRole('button',{name:/All Classics/}));
  expect(screen.getAllByText(/Open this book/)).toHaveLength(8);
  expect(screen.getByText(/Showing 1–8 of 13/)).toBeTruthy();
  expect(screen.getByRole('button',{name:'Previous classics page'}).disabled).toBe(true);
  fireEvent.click(screen.getByRole('button',{name:'Next classics page'}));
  expect(screen.getByText(/Showing 9–13 of 13/)).toBeTruthy();
  expect(screen.getByRole('heading',{name:'Book 13'})).toBeTruthy();
  expect(screen.getByRole('button',{name:'Next classics page'}).disabled).toBe(true);
  expect(screen.getByRole('link',{name:/Book 13/}).getAttribute('href'))
    .toBe('/lost-works?open=classic-12');
 });
 it('finds a specific author inside All Classics and resets the page',()=>{
  setup();
  fireEvent.click(screen.getByRole('button',{name:/All Classics/}));
  fireEvent.click(screen.getByRole('button',{name:'Next classics page'}));
  fireEvent.change(screen.getByRole('searchbox',{name:'Find Classics by book or author'}),{target:{value:'Jane Austen'}});
  expect(screen.getByText(/Showing 1–1 of 1/)).toBeTruthy();
  expect(screen.getByRole('heading',{name:'Book 11'})).toBeTruthy();
  expect(screen.getByRole('button',{name:'Previous classics page'}).disabled).toBe(true);
 });
 it('clears fruitless searches without losing the full archive',()=>{
  setup();
  fireEvent.change(screen.getByRole('searchbox',{name:'Find Classics by book or author'}),{target:{value:'no such volume'}});
  expect(screen.getByText('No books match that shelf.')).toBeTruthy();
  expect(screen.getByRole('button',{name:/Wander a classic/}).disabled).toBe(true);
  fireEvent.click(screen.getByRole('button',{name:/Explore all Classics/}));
  expect(screen.getAllByText(/Open this book/)).toHaveLength(8);
  expect(screen.getByRole('link',{name:/Open full archive/}).getAttribute('href')).toBe('/lost-works');
 });
 it('keeps cover provenance and content-rating guidance hidden behind the question icon',()=>{
  setup(classics.slice(0,1));
  expect(screen.queryByText(/not necessarily the first printing/)).toBeNull();
  fireEvent.click(screen.getByRole('button',{name:'About: About these Classic editions'}));
  expect(screen.getByText(/not necessarily the first printing/)).toBeTruthy();
  expect(screen.getByText(/means no separate content classification/)).toBeTruthy();
 });
 it('shows no hall without archived works',()=>{
  setup([]);
  expect(screen.queryByRole('region',{name:'Palace Classics Hall'})).toBeNull();
 });
});
