import React from 'react';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {render,cleanup} from '@testing-library/react';
import {describe,it,expect,afterEach} from 'vitest';
import {CHAMBER_FRAMES} from './paintedCollection';
import {ChamberFrameArt} from './PaintedPalaceArt';
import {GEMSTONE_FRAME_DESIGNS} from './GemstoneOrnamentalFrame';
import {REGALIA_FRAME_DESIGNS} from './RegaliaOrnamentalFrame';

afterEach(cleanup);

describe('Atelier artwork quality refinement',()=>{
 const newFrames=CHAMBER_FRAMES.slice(35,59);
 it('retains the 35 established frames and all 24 new frame identities',()=>{
  expect(CHAMBER_FRAMES).toHaveLength(73);
  expect(CHAMBER_FRAMES.slice(0,35)).toHaveLength(35);
  expect(newFrames).toHaveLength(24);
  expect(new Set(newFrames.map(f=>f.slug)).size).toBe(24);
  expect(Object.keys(GEMSTONE_FRAME_DESIGNS)).toHaveLength(12);
  expect(Object.keys(REGALIA_FRAME_DESIGNS)).toHaveLength(12);
 });
 it('loads 24 separate illustrated assets with stable accessible names',()=>{
  const {container}=render(<>{newFrames.map(frame=><ChamberFrameArt slug={frame.slug} key={frame.slug} size={84}/>)}</>);
  const artwork=[...container.querySelectorAll('svg[data-art-quality="illustrated"]')];
  expect(artwork).toHaveLength(24);
  expect(artwork.filter(x=>x.dataset.gemstone==='true')).toHaveLength(12);
  expect(artwork.filter(x=>x.dataset.regalia==='true')).toHaveLength(12);
  const hashes=new Set();
  for(const [i,svg] of artwork.entries()){
   expect(svg.getAttribute('aria-label')).toBe(newFrames[i].name+' illustrated chamber frame');
   expect(svg.getAttribute('width')).toBe('84');
   const href=svg.querySelector('image').getAttribute('href');
   expect(href).toBe('/assets/atelier-illustrated/v1/'+newFrames[i].slug+'.webp');
   const bytes=readFileSync('public'+href);
   expect(bytes.toString('ascii',8,12)).toBe('WEBP');
   hashes.add(createHash('sha256').update(bytes).digest('hex'));
   expect(svg.querySelector('circle,polygon,path')).toBeNull();
  }
  expect(hashes.size).toBe(24);
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
