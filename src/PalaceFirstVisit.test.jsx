import React from 'react';
import {beforeEach,afterEach,describe,it,expect} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {PalaceStartingPath} from './PalaceFirstVisit';

beforeEach(()=>localStorage.clear());
afterEach(()=>{cleanup();localStorage.clear()});
const mount=(memberId='new-reader')=>render(<MemoryRouter><PalaceStartingPath memberId={memberId}/></MemoryRouter>);

describe('gentle first-visit Palace map',()=>{
 it('starts folded and opens four real, readable room links',()=>{
  mount();
  const heading=screen.getByText('Your first four doorways');
  expect(heading.closest('summary')).toBeTruthy();
  fireEvent.click(heading.closest('summary'));
  expect(screen.getByRole('progressbar',{name:'Welcome doorways opened'}).getAttribute('aria-valuenow')).toBe('0');
  expect(screen.getByRole('link',{name:/Find a story/}).getAttribute('href')).toBe('/reading');
  expect(screen.getByRole('link',{name:/Open your writing pad/}).getAttribute('href')).toBe('/writing');
  expect(screen.getByRole('link',{name:/Meet your Grand Palace/}).getAttribute('href')).toBe('/grand-palaces');
  expect(screen.getByRole('link',{name:/Explore Palace Life/}).getAttribute('href')).toBe('/palace-life');
  expect(screen.getByText('A place to start:').textContent).toContain('Find a story');
 });
 it('counts doorways opened, persists progress and does not invent a reward',()=>{
  const view=mount();
  fireEvent.click(screen.getByText('Your first four doorways').closest('summary'));
  fireEvent.click(screen.getByRole('link',{name:/Find a story/}));
  expect(screen.getByRole('progressbar',{name:'Welcome doorways opened'}).getAttribute('aria-valuenow')).toBe('1');
  expect(screen.getByText('A place to start:').textContent).toContain('Open your writing pad');
  const record=JSON.parse(localStorage.getItem('palace-first-visit:v1:new-reader'));
  expect(record.visited).toEqual(['read']);
  view.unmount();
  mount();
  expect(screen.getAllByText(/1 of 4 doorways opened/).length).toBeGreaterThan(0);
 });
 it('keeps members separate and caps corrupted stored progress at four doorways',()=>{
  localStorage.setItem('palace-first-visit:v1:a',JSON.stringify({visited:['read','read','write','palace','gather','bogus']}));
  mount('a');
  fireEvent.click(screen.getByText('All four doorways opened. Keep exploring.').closest('summary'));
  expect(screen.getByRole('progressbar',{name:'Welcome doorways opened'}).getAttribute('aria-valuenow')).toBe('4');
  cleanup();
  mount('b');
  expect(screen.getAllByText(/0 of 4 doorways opened/).length).toBeGreaterThan(0);
 });
 it('allows members to hide the introduction without altering member content',()=>{
  mount();
  fireEvent.click(screen.getByText('Your first four doorways').closest('summary'));
  fireEvent.click(screen.getByRole('button',{name:'Hide this introduction'}));
  expect(screen.queryByText('Your first four doorways')).toBeNull();
  expect(JSON.parse(localStorage.getItem('palace-first-visit:v1:new-reader')).hidden).toBe(true);
 });
 it('does not show the member introduction to visitors without an account',()=>{
  mount(null);
  expect(screen.queryByText('Your first four doorways')).toBeNull();
 });
});
