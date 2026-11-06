import React from 'react';
import {render,cleanup} from '@testing-library/react';
import {describe,it,expect,afterEach} from 'vitest';
import {CHAMBER_FRAMES} from './paintedCollection';
import {ChamberFrameArt} from './PaintedPalaceArt';
import {GEMSTONE_FRAME_DESIGNS} from './GemstoneOrnamentalFrame';
import {REGALIA_FRAME_DESIGNS} from './RegaliaOrnamentalFrame';

afterEach(cleanup);

describe('Atelier artwork quality refinement',()=>{
 const newFrames=CHAMBER_FRAMES.slice(35);
 it('retains the 35 established frames and all 24 new frame identities',()=>{
  expect(CHAMBER_FRAMES).toHaveLength(59);
  expect(CHAMBER_FRAMES.slice(0,35)).toHaveLength(35);
  expect(newFrames).toHaveLength(24);
  expect(new Set(newFrames.map(f=>f.slug)).size).toBe(24);
  expect(Object.keys(GEMSTONE_FRAME_DESIGNS)).toHaveLength(12);
  expect(Object.keys(REGALIA_FRAME_DESIGNS)).toHaveLength(12);
 });
 it('keeps portrait centres clear while adding fine metalwork, jewel facets and unique crests',()=>{
  const {container}=render(<>{newFrames.map(frame=><ChamberFrameArt slug={frame.slug} key={frame.slug} size={110}/>)}</>);
  const svg=[...container.querySelectorAll('svg[data-art-quality="hand-finished"]')];
  expect(svg).toHaveLength(24);
  expect(svg.filter(x=>x.dataset.gemstone==='true')).toHaveLength(12);
  expect(svg.filter(x=>x.dataset.regalia==='true')).toHaveLength(12);
  expect(new Set(svg.map(x=>x.getAttribute('aria-label'))).size).toBe(24);
  for(const frame of svg){
   expect(frame.getAttribute('viewBox')).toBe('0 0 200 200');
   expect(frame.querySelectorAll('linearGradient').length).toBeGreaterThanOrEqual(2);
   expect(frame.querySelectorAll('radialGradient').length).toBeGreaterThanOrEqual(1);
   expect(frame.querySelectorAll('feDropShadow')).toHaveLength(1);
   expect(frame.querySelector('image')).toBeNull();
   expect(frame.querySelector('rect')).toBeNull();
   expect([...frame.querySelectorAll('circle')].some(c=>Number(c.getAttribute('r'))>40 && c.getAttribute('fill') && c.getAttribute('fill')!=='none')).toBe(false);
   expect(frame.querySelectorAll('path').length).toBeGreaterThan(15);
  }
  const ids=[...container.querySelectorAll('[id]')].map(el=>el.id);
  expect(new Set(ids).size).toBe(ids.length);
 });
 it('preserves thick and lighter frame silhouettes and distinct motifs',()=>{
  const styles=Object.values(REGALIA_FRAME_DESIGNS);
  expect(styles.filter(x=>x.thickness==='grand')).toHaveLength(6);
  expect(styles.filter(x=>x.thickness==='medium')).toHaveLength(4);
  expect(styles.filter(x=>x.thickness==='delicate')).toHaveLength(2);
  expect(styles.filter(x=>x.gems===0)).toHaveLength(3);
  expect(new Set([...styles,...Object.values(GEMSTONE_FRAME_DESIGNS)].map(x=>x.motif)).size).toBeGreaterThan(9);
 });
});
