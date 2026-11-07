import React from 'react';
import {describe,it,expect} from 'vitest';
import {render} from '@testing-library/react';
import {readFileSync} from 'node:fs';
import {CHAMBER_FRAMES,GEMSTONE_FRAME_NAMES,PAINTED_TIERS} from './paintedCollection';
import {ChamberFrameArt} from './PaintedPalaceArt';

describe('Jewel Court gemstone frames',()=>{
 it('extends the classic catalogue without moving or renaming existing frame IDs',()=>{
  expect(CHAMBER_FRAMES).toHaveLength(59);
  expect(GEMSTONE_FRAME_NAMES).toHaveLength(12);
  expect(CHAMBER_FRAMES[0].slug).toBe('bamboo-ink');
  expect(CHAMBER_FRAMES[34].slug).toBe('emerald-eden');
  expect(CHAMBER_FRAMES.slice(35,47).every(x=>x.gemstone)).toBe(true);
  expect(CHAMBER_FRAMES.slice(47).every(x=>x.regalia)).toBe(true);
  expect(new Set(CHAMBER_FRAMES.map(x=>x.slug)).size).toBe(59);
  for(const frame of CHAMBER_FRAMES)expect(frame.tier).toBe(PAINTED_TIERS[frame.index%5]);
 });
 it('renders twelve accessible original transparent jewelled frames',()=>{
  const gemFrames=CHAMBER_FRAMES.filter(f=>f.gemstone);
  const {container}=render(<>{gemFrames.map(f=><ChamberFrameArt key={f.slug} slug={f.slug}/>)}</>);
  const svgs=[...container.querySelectorAll('svg[data-gemstone="true"]')];
  expect(svgs).toHaveLength(12);
  expect(new Set(svgs.map(x=>x.getAttribute('aria-label'))).size).toBe(12);
  expect(container.querySelectorAll('image')).toHaveLength(12);
  expect(container.querySelectorAll('rect')).toHaveLength(0);
  expect(new Set([...container.querySelectorAll('image')].map(x=>x.getAttribute('href'))).size).toBe(12);
  expect(new Set([...container.querySelectorAll('[id]')].map(x=>x.id)).size).toBe(container.querySelectorAll('[id]').length);
 });
 it('safely changes a selected preview between classic and gemstone styles',()=>{
  const {container,rerender}=render(<ChamberFrameArt slug="bamboo-ink"/>);
  expect(container.querySelector('[data-gemstone="true"]')).toBeNull();
  rerender(<ChamberFrameArt slug="crown-jewel"/>);
  expect(container.querySelector('[data-gemstone="true"]')).not.toBeNull();
  rerender(<ChamberFrameArt slug="bamboo-ink"/>);
  expect(container.querySelector('[data-gemstone="true"]')).toBeNull();
 });
 it('prepares backend eligibility for every frame and the twelve new free colourways',()=>{
  const sql=readFileSync('database/prism-jewel-court-gemstone-frames.sql','utf8');
  for(const f of CHAMBER_FRAMES.slice(0,47))expect(sql).toContain("'"+f.slug+"'");
  expect(sql).toContain("'Jewel Court','free'");
  expect((sql.match(/'Jewel Court','free'/g)||[]).length).toBe(12);
  expect(sql).toContain("on conflict(slug) do nothing");
  expect(sql).toContain('private.painted_frame_eligible');
 });
});
