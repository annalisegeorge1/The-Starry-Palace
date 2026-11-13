import React from 'react';
import {describe,it,expect} from 'vitest';
import {render,cleanup} from '@testing-library/react';
import {readFileSync} from 'node:fs';
import {afterEach} from 'vitest';
import {PalaceBanner} from './PaintedPalaceArt';

afterEach(cleanup);
describe('court paintings retain their native watercolor proportions',()=>{
 it('does not distort the original painted banner',()=>{
  const {container}=render(<PalaceBanner palace={{slug:'amethyst-sky',name:'Palace of the Amethyst Sky'}}/>);
  const svg=container.querySelector('.painted-palace-banner');
  expect(svg).toBeTruthy();
  expect(svg.getAttribute('preserveAspectRatio')).toBe('xMidYMid meet');
  expect(svg.getAttribute('viewBox')).toBe('100 799 643 158');
 });
 it('keeps the painting at court and the linked crest in the member chamber',()=>{
  const chamber=readFileSync('src/MemberPalaceShowcase.jsx','utf8');
  const court=readFileSync('src/GrandPalaceHall.jsx','utf8');
  const styles=readFileSync('src/grand-palace-visual-refinement.css','utf8');
  expect(chamber).not.toContain('<PalaceBanner');
  expect(chamber).toContain('<PalaceEmblem palace={palace}');
  expect(chamber).toContain('to="/grand-palaces?tab=courts"');
  expect(court).toContain('<PalaceBanner palace={mine}/>');
  expect(chamber).not.toContain('<PalaceBanner palace={palace} wide/>');
  expect(court).not.toContain('<PalaceBanner palace={mine} wide/>');
  expect(styles).toContain('aspect-ratio:643 / 158!important');
  expect(styles).not.toContain('.member-palace-banner-rail');
 });
});
