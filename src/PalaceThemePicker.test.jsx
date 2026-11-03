import React from 'react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import PalaceThemePicker,{normalizePalaceTheme,PALACE_THEMES} from './PalaceThemePicker';
afterEach(cleanup);
describe('Palace appearance preferences',()=>{
 it('keeps old Nightfall storage compatible and does not misread unknown values',()=>{
  expect(normalizePalaceTheme('night')).toBe('nightfall');
  expect(normalizePalaceTheme('nightfall')).toBe('nightfall');
  expect(normalizePalaceTheme('midnight')).toBe('midnight');
  expect(normalizePalaceTheme('daylight')).toBe('daylight');
  expect(normalizePalaceTheme('unknown')).toBe('nightfall');
  expect(PALACE_THEMES).toHaveLength(3);
  expect(PALACE_THEMES.find(theme=>theme.id==='daylight')?.label).toBe('Daybreak');
 });
 it('lets a reader select near-black Midnight separately from Nightfall and Daybreak',()=>{
  const onChange=vi.fn();
  const {rerender}=render(<PalaceThemePicker value="nightfall" onChange={onChange}/>);
  expect(screen.getByRole('button',{name:'Nightfall theme'}).getAttribute('aria-pressed')).toBe('true');
  fireEvent.click(screen.getByRole('button',{name:'Midnight theme'}));
  expect(onChange).toHaveBeenCalledWith('midnight');
  rerender(<PalaceThemePicker value="midnight" onChange={onChange}/>);
  expect(screen.getByRole('button',{name:'Midnight theme'}).getAttribute('aria-pressed')).toBe('true');
  expect(screen.getByRole('button',{name:'Nightfall theme'}).getAttribute('aria-pressed')).toBe('false');
  fireEvent.click(screen.getByRole('button',{name:'Daybreak theme'}));
  expect(onChange).toHaveBeenLastCalledWith('daylight');
 });
 it('shows all three choices in compact mobile More mode',()=>{
  render(<PalaceThemePicker compact onChange={()=>{}}/>);
  expect(screen.getByRole('group',{name:'Palace appearance'}).className).toContain('is-compact');
  expect(screen.getAllByRole('button')).toHaveLength(3);
 });
});
