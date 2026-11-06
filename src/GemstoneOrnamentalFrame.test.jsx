import React from 'react';
import {describe,it,expect} from 'vitest';
import {render} from '@testing-library/react';
import {readFileSync} from 'node:fs';
import {CHAMBER_FRAMES,GEMSTONE_FRAME_NAMES,PAINTED_TIERS} from './paintedCollection';
import {ChamberFrameArt} from './PaintedPalaceArt';

describe('Jewel Court gemstone frames',()=>{
 it('extends the classic catalogue without moving or renaming existing frame IDs',()=>{
  expect(CHAMBER_FRAMES).toHaveLength(47);
  expect(GEMSTONE_FRAME_NAMES).toHaveLength(12);
  expect(CHAMBER_FRAMES[0].slug).toBe('bamboo-ink');
  expect(CHAMBER_FRAMES[34].slug).toBe('emerald-eden');
  expect(CHAMBER_FRAMES.slice(35).every(x=>x.gemstone)).toBe(true);
  expect(new Set(CHAMBER_FRAMES.map(x=>x.slug)).size).toBe(47);
  for(const frame of CHAMBER_FRAMES)expect(frame.tier).toBe(PAINTED_TIERS[frame.index%5]);
 });
 it('renders twelve accessible original transparent jewelled frames',()=>{
  const gemFrames=CHAMBER_FRAMES.filter(f=>f.gemstone);
  const {container}=render(<>{gemFrames.map(f=><ChamberFrameArt key={f.slug} slug={f.slug}/>)}</>);
  const svgs=[...container.querySelectorAll('svg[data-gemstone="true"]')];
  expect(svgs).toHaveLength(12);
  expect(new Set(svgs.map(x=>x.getAttribute('aria-label'))).size).toBe(12);
  expect(container.querySelectorAll('image')).toHaveLength(0);
  expect(container.querySelectorAll('rect')).toHaveLength(0);
  expect(container.querySelectorAll('[data-ornament="gemstone-setting"]')).toHaveLength(0);
  expect(new Set([...container.querySelectorAll('[id]')].map(x=>x.id)).size).toBe(container.querySelectorAll('[id]').length);
 });
 it('prepares backend eligibility for every frame and the twelve new free colourways',()=>{
  const sql=readFileSync('database/prism-jewel-court-gemstone-frames.sql','utf8');
  for(const f of CHAMBER_FRAMES)expect(sql).toContain("'"+f.slug+"'");
  expect(sql).toContain("'Jewel Court','free'");
  expect((sql.match(/'Jewel Court','free'/g)||[]).length).toBe(12);
  expect(sql).toContain("on conflict(slug) do nothing");
  expect(sql).toContain('private.painted_frame_eligible');
 });
});
