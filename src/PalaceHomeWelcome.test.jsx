import React from 'react';
import {describe,it,expect} from 'vitest';
import {render,screen,cleanup} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {afterEach} from 'vitest';
import {PalaceHomeWelcome,PalaceRoomDirectory} from './PalaceHomeWelcome';
afterEach(cleanup);
describe('inviting Palace entrance',()=>{
 it('offers just three choices before the full directory',()=>{
  render(<MemoryRouter><PalaceHomeWelcome/><PalaceRoomDirectory rooms={[["Treasury","/treasury","Collect and explore"]]}/></MemoryRouter>);
  expect(screen.getByRole('heading',{name:'Where would you like to begin?'})).toBeTruthy();
  expect(screen.getByRole('link',{name:/Explore the Writer’s Door/}).getAttribute('href')).toBe('/writers');
  expect(screen.getByRole('link',{name:/Explore public gatherings/}).getAttribute('href')).toBe('/events');
  expect(screen.getByText('Explore all the Palace rooms')).toBeTruthy();
 });
 it('sends signed-in members straight to their room',()=>{
  render(<MemoryRouter><PalaceHomeWelcome member/></MemoryRouter>);
  expect(screen.getByRole('link',{name:/Open my Writing Chamber/}).getAttribute('href')).toBe('/writing');
  expect(screen.getByRole('link',{name:/Enter Palace Life/}).getAttribute('href')).toBe('/palace-life');
 });
});
