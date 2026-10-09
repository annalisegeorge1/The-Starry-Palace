import React from 'react';
import {describe,it,expect} from 'vitest';
import {render,screen,cleanup,fireEvent} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {afterEach} from 'vitest';
import {PalaceHomeWelcome,PalaceRoomDirectory,PalaceHomeMore,PalaceHomeCulturePaths} from './PalaceHomeWelcome';
afterEach(cleanup);
describe('inviting Palace entrance',()=>{
 it('offers just three choices before the full directory',()=>{
  render(<MemoryRouter><PalaceHomeWelcome/><PalaceRoomDirectory rooms={[["Treasury","/treasury","Collect and explore"]]}/></MemoryRouter>);
  expect(screen.getByRole('heading',{name:'Where would you like to begin?'})).toBeTruthy();
  expect(screen.getByRole('link',{name:/Explore the Writer’s Door/}).getAttribute('href')).toBe('/writers');
  expect(screen.getByRole('link',{name:/Explore public gatherings/}).getAttribute('href')).toBe('/events');
  expect(screen.getByText('Explore all the Palace rooms')).toBeTruthy();
 });
 it('offers events and literary heritage without adding more primary doors',()=>{
  render(<MemoryRouter><PalaceHomeWelcome/></MemoryRouter>);
  expect(document.querySelectorAll('.palace-choice-card')).toHaveLength(3);
  expect(screen.getByRole('link',{name:/History, heritage & festivals/}).getAttribute('href')).toBe('/events?tab=heritage');
  expect(screen.getByRole('link',{name:/Literature across generations/}).getAttribute('href')).toBe('/reading');
 });
 it('sends signed-in members straight to their room',()=>{
  render(<MemoryRouter><PalaceHomeWelcome member/></MemoryRouter>);
  expect(screen.getByRole('link',{name:/Open my Writing Chamber/}).getAttribute('href')).toBe('/writing');
  expect(screen.getByRole('link',{name:/Enter Palace Life/}).getAttribute('href')).toBe('/palace-life');
 });
 it('keeps the first screen to three doors and hides optional heritage links only in calm mode',()=>{
  render(<MemoryRouter><PalaceHomeWelcome showCulture={false}/></MemoryRouter>);
  expect(document.querySelectorAll('.palace-choice-card')).toHaveLength(3);
  expect(screen.queryByRole('navigation',{name:'Events and literary heritage'})).toBeNull();
 });
 it('does not mount hidden discovery content until the section is opened and remembers the first opening',()=>{
  let mounts=0;
  function DiscoveryProbe(){React.useEffect(()=>{mounts+=1},[]);return <div>Ancient story archives are ready</div>}
  const {container}=render(<MemoryRouter><PalaceHomeMore><DiscoveryProbe/></PalaceHomeMore></MemoryRouter>);
  const fold=container.querySelector('.palace-home-more');
  expect(fold.open).toBe(false);
  expect(mounts).toBe(0);
  expect(screen.queryByText('Ancient story archives are ready')).toBeNull();
  fireEvent.click(screen.getByText('Discover more of the Palace'));
  expect(fold.open).toBe(true);
  expect(screen.getByText('Ancient story archives are ready')).toBeTruthy();
  expect(mounts).toBe(1);
  fireEvent.click(screen.getByText('Discover more of the Palace'));
  expect(fold.open).toBe(false);
  fireEvent.click(screen.getByText('Discover more of the Palace'));
  expect(fold.open).toBe(true);
  expect(mounts).toBe(1);
 });
 it('keeps every discovery destination inside a single accessible, expandable section',()=>{
  const {container}=render(<MemoryRouter>
   <PalaceHomeMore>
    <PalaceRoomDirectory rooms={[[ 'Treasury','/treasury','Badges and gifts' ]]}/>
    <PalaceHomeCulturePaths/>
   </PalaceHomeMore>
  </MemoryRouter>);
  const fold=container.querySelector('.palace-home-more');
  expect(fold.open).toBe(false);
  expect(screen.getByText('Discover more of the Palace')).toBeTruthy();
  fireEvent.click(screen.getByText('Discover more of the Palace'));
  expect(fold.open).toBe(true);
  expect(screen.getByRole('link',{name:/History, heritage & festivals/}).getAttribute('href')).toBe('/events?tab=heritage');
  fireEvent.click(screen.getByText('Explore all the Palace rooms'));
  expect(screen.getByRole('link',{name:/Treasury/}).getAttribute('href')).toBe('/treasury');
 });

});
