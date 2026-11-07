import React from 'react';
import {describe,it,expect,afterEach} from 'vitest';
import {render,cleanup} from '@testing-library/react';
import {readFileSync} from 'node:fs';
import {CHAMBER_FRAMES,GRAND_FRAME_NAMES,ARTISAN_FRAME_NAMES,PAINTED_TIERS} from './paintedCollection';
import {REGALIA_FRAME_DESIGNS} from './RegaliaOrnamentalFrame';
import {ChamberFrameArt} from './PaintedPalaceArt';

afterEach(cleanup);

describe('Prism Atelier grand and artisan frame collection',()=>{
 it('keeps all 47 previous frames in the same order and adds twelve distinct designs',()=>{
  expect(CHAMBER_FRAMES).toHaveLength(59);
  expect(GRAND_FRAME_NAMES).toHaveLength(6);
  expect(ARTISAN_FRAME_NAMES).toHaveLength(6);
  expect(CHAMBER_FRAMES[34].slug).toBe('emerald-eden');
  expect(CHAMBER_FRAMES[46].slug).toBe('violet-empress');
  expect(CHAMBER_FRAMES.slice(47,53).every(x=>x.regalia&&x.thickness==='grand')).toBe(true);
  expect(CHAMBER_FRAMES.slice(53).every(x=>x.regalia&&x.thickness!=='grand')).toBe(true);
  expect(new Set(CHAMBER_FRAMES.map(x=>x.slug)).size).toBe(59);
  for(const frame of CHAMBER_FRAMES)expect(frame.tier).toBe(PAINTED_TIERS[frame.index%5]);
 });
 it('provides six genuinely thick settings and six lighter artisan settings with an open centre',()=>{
  const frames=CHAMBER_FRAMES.slice(47);
  const {container}=render(<>{frames.map(f=><ChamberFrameArt key={f.slug} slug={f.slug} size={84}/>)}</>);
  const svgs=[...container.querySelectorAll('svg[data-regalia="true"]')];
  expect(svgs).toHaveLength(12);
  expect(svgs.filter(s=>s.dataset.thickness==='grand')).toHaveLength(6);
  expect(svgs.filter(s=>s.dataset.thickness==='delicate')).toHaveLength(2);
  expect(svgs.filter(s=>s.dataset.thickness==='medium')).toHaveLength(4);
  expect(new Set(svgs.map(s=>s.getAttribute('aria-label'))).size).toBe(12);
  for(const svg of svgs){
   expect(svg.getAttribute('viewBox')).toBe('0 0 200 200');
   expect(svg.querySelector('image').getAttribute('href')).toMatch(/^\/assets\/atelier-illustrated\/v1\/[a-z-]+\.webp$/);
   expect(svg.querySelector('rect')).toBeNull();
   expect(svg.dataset.artQuality).toBe('illustrated');
  }
  const ids=[...container.querySelectorAll('[id]')].map(el=>el.id);
  expect(new Set(ids).size).toBe(ids.length);
 });
 it('mixes gemstone accents and gem-free metalwork, stars, ivy and pearls',()=>{
  const designs=Object.values(REGALIA_FRAME_DESIGNS);
  expect(designs).toHaveLength(12);
  expect(designs.filter(x=>x.gems===0)).toHaveLength(3);
  expect(designs.filter(x=>x.gems>0)).toHaveLength(9);
  expect(designs.filter(x=>x.thickness==='grand')).toHaveLength(6);
  expect(new Set(designs.map(x=>x.motif)).size).toBeGreaterThanOrEqual(7);
 });
 it('extends the server-side frame whitelist and the eligibility calculation, not member privileges',()=>{
  const sql=readFileSync('database/atelier-grand-and-artisan-frames.sql','utf8');
  for(const frame of CHAMBER_FRAMES)expect(sql).toContain("'"+frame.slug+"'");
  expect(sql).toContain('private.painted_frame_eligible');
  expect(sql).toContain('Existing Palace frame whitelist differs; aborting expansion');
  expect(sql).toContain('chamber_frame is null or chamber_frame in');
  expect(sql).not.toMatch(/delete from|drop table|grant execute|disable row level security/i);
 });
});
