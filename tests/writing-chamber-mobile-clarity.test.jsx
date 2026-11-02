import React from 'react';
import {readFileSync} from 'node:fs';
import {afterEach,beforeEach,describe,it,expect} from 'vitest';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {PalaceFirstRoomHint} from '../src/PalaceGuidebookHints.jsx';

const live=readFileSync('src/liveRooms.jsx','utf8');
const card=readFileSync('src/WriterManuscriptCard.jsx','utf8');
const css=readFileSync('src/writing-chamber-mobile-clarity.css','utf8');
const entry=readFileSync('src/main.jsx','utf8');
const writing=live.slice(live.indexOf('export function WritingLive'),live.indexOf('export function ',live.indexOf('export function WritingLive')+20));
const hintKey='palace-room-introduction:v1:drafts';

beforeEach(()=>{window.localStorage.removeItem(hintKey)});
afterEach(()=>{cleanup();window.localStorage.removeItem(hintKey)});

describe('Writing Chamber readability and streamlined actions',()=>{
 it('keeps a single pad action and the dedicated new manuscript disclosure',()=>{
  expect(writing).toContain('className="writing-pad-primary"');
  expect(writing).toContain('✎ Resume latest draft');
  expect(writing).toContain('＋ Begin a new work');
  expect(writing).not.toContain('＋ New blank page');
  expect(writing).not.toContain('onClick={newBlankPage}');
  expect(writing).toContain('onSubmit={begin}');
 });
 it('keeps the first-room hint dismissed after it has been acknowledged and remounted',()=>{
  const ui=()=><MemoryRouter><PalaceFirstRoomHint id="drafts"/></MemoryRouter>;
  const first=render(ui());
  const gotIt=screen.getByRole('button',{name:'Got it'});
  fireEvent.click(gotIt);
  expect(window.localStorage.getItem(hintKey)).toBe('seen');
  first.unmount();
  const next=render(ui());
  expect(next.queryByRole('button',{name:'Got it'})).toBeNull();
 });
 it('preserves a labeled keyboard-accessible card overflow menu',()=>{
  expect(card).toContain('className="writer-work-menu"');
  expect(card).toContain("aria-label={'More actions for '+(work.title||'Untitled work')}");
  expect(card).toContain('title="More actions"');
  expect(card).toContain('<span aria-hidden="true">···</span>');
  expect(card).toContain('Manage work');
  expect(card).toContain('Invite co-writer');
 });
 it('loads scoped high-contrast labels for dark and light mode after other theme styles',()=>{
  expect(entry.indexOf("import './writing-chamber-mobile-clarity.css';")).toBeGreaterThan(entry.indexOf("import './tag-constellation-compact-rows.css';"));
  expect(css).toContain('.chic-writing-head .writing-summary');
  expect(css).toContain('rgba(244,246,255,.79)');
  expect(css).toContain('.writer-work-card-stats dt');
  expect(css).toContain('--manuscript-muted:#c6cddd');
  expect(css).toContain('.daylight .writer-work-card .writer-work-card-stats dt');
  expect(css).toContain('color:#515c74!important');
 });
 it('reserves mobile dock scroll clearance, mobile tab fade and compact card spacing',()=>{
  expect(css).toContain('main#palace-content[data-palace-route^="/writing"]');
  expect(css).toContain('padding-bottom:calc(190px + env(safe-area-inset-bottom,0px))!important');
  expect(css).toContain('scroll-padding-bottom:calc(120px + env(safe-area-inset-bottom,0px))!important');
  expect(css).toContain('mask-image:linear-gradient');
  expect(css).toContain('.writing-tabs.chic-writing-tabs>button');
  expect(css).toContain('padding:12px 13px!important');
  expect(css).toContain('min-width:44px!important;min-height:44px!important');
  expect(css).toContain('@media(forced-colors:active)');
 });
});
