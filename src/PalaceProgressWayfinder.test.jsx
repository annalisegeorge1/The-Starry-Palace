import React from 'react';
import {afterEach,describe,expect,it} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import PalaceProgressWayfinder from './PalaceProgressWayfinder';

afterEach(cleanup);
function setup(){
 return render(<MemoryRouter initialEntries={['/grand-palaces?tab=overview']}>
  <main className="palace-shell"><PalaceProgressWayfinder/></main>
 </MemoryRouter>);
}

describe('A connected Grand Palace progress journey',()=>{
 it('leads to actual creative and honour rooms without inventing rewards',()=>{
  setup();
  expect(screen.getByRole('heading',{name:'From spark to honour.'})).toBeTruthy();
  const duels=screen.getByRole('link',{name:/Ink Duels/});
  const achievements=screen.getByRole('link',{name:/Achievement paths/});
  const titles=screen.getByRole('link',{name:/Celestial titles/});
  expect(duels.getAttribute('href')).toBe('/writing?tab=duels');
  expect(achievements.getAttribute('href')).toBe('/treasury?tab=achievements');
  expect(titles.getAttribute('href')).toBe('/treasury?tab=titles');
  expect(screen.getAllByRole('link')).toHaveLength(3);
  expect(screen.queryByText(/you have earned 50 points/i)).toBeNull();
 });
 it('leaves economic distinctions and anti-spam rules behind a help mark',()=>{
  setup();
  expect(screen.queryByText(/Spendable Palace Points:/)).toBeNull();
  fireEvent.click(screen.getByRole('button',{name:'About: How Palace recognition connects'}));
  expect(screen.getByText(/Spendable Palace Points:/)).toBeTruthy();
  expect(screen.getByText(/Grand Palace competition credit:/)).toBeTruthy();
  expect(screen.queryByText(/Own-work comments, private-work comments/)).toBeNull();
  fireEvent.click(screen.getByText('Read the fairness essentials'));
  expect(screen.getByText(/Own-work comments, private-work comments/)).toBeTruthy();
 });
});
