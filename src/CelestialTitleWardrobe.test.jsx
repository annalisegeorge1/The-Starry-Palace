import React from 'react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import CelestialTitleWardrobe from './CelestialTitleWardrobe';

afterEach(cleanup);
const options=[
 {title:'Palace Member',public_selectable:true,category:'General'},
 {title:'Golden Maiden',entitled:true,public_selectable:false,category:'Special'},
 {title:'Veiled Crown',entitled:false,public_selectable:false,category:'Special'}
];
describe('The Treasury Celestial changing room',()=>{
 it('shows the current title and only public or owned choices',()=>{
  render(<CelestialTitleWardrobe options={options} currentTitle="Palace Member"/>);
  expect(screen.getByText('Palace Member',{selector:'strong'})).toBeTruthy();
  expect(screen.getByRole('option',{name:/Golden Maiden/})).toBeTruthy();
  expect(screen.queryByRole('option',{name:'Veiled Crown'})).toBeNull();
  expect(screen.getByRole('button',{name:'Currently worn'}).disabled).toBe(true);
 });
 it('lets a member deliberately choose an unlocked honour and wear it',()=>{
  const onSelect=vi.fn(),onWear=vi.fn();
  const view=render(<CelestialTitleWardrobe options={options} currentTitle="Palace Member"
   selectedTitle="Palace Member" onSelect={onSelect} onWear={onWear}/>);
  fireEvent.change(screen.getByLabelText('Choose a title'),{target:{value:'Golden Maiden'}});
  expect(onSelect).toHaveBeenCalledWith('Golden Maiden');
  view.rerender(<CelestialTitleWardrobe options={options} currentTitle="Palace Member"
   selectedTitle="Golden Maiden" onSelect={onSelect} onWear={onWear}/>);
  fireEvent.click(screen.getByRole('button',{name:/Wear this title/}));
  expect(onWear).toHaveBeenCalledWith('Golden Maiden');
 });
 it('disables title changes during a pending save and reports the result accessibly',()=>{
  render(<CelestialTitleWardrobe options={options} currentTitle="Palace Member"
   selectedTitle="Golden Maiden" busy notice="Your Palace title was saved."/>);
  expect(screen.getByRole('button',{name:'Placing your title…'}).disabled).toBe(true);
  expect(screen.getByRole('status').textContent).toContain('saved');
 });
 it('keeps action errors visible and does not pretend a save succeeded',()=>{
  render(<CelestialTitleWardrobe options={[]} currentTitle="Palace Member" error="Not entitled."/>);
  expect(screen.getByRole('alert').textContent).toContain('Not entitled');
  expect(screen.getByRole('button',{name:'Currently worn'}).disabled).toBe(true);
 });
});
