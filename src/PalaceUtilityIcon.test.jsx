import React from 'react';
import {describe,expect,it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {readFileSync} from 'node:fs';
import PalaceUtilityIcon from './PalaceUtilityIcon';

const shell=readFileSync('src/main.jsx','utf8');
const styles=readFileSync('src/palace-utility-jewels.css','utf8');
const info=readFileSync('src/PalaceInfoMark.jsx','utf8');

describe('quiet Palace header and help icon system',()=>{
 it('renders accessible-decorative SVG linework without text emoji or images',()=>{
  for(const name of ['menu','search','profile','chat','activity','write','help']){
   const html=renderToStaticMarkup(<PalaceUtilityIcon name={name}/>);
   expect(html).toContain('<svg');
   expect(html).toContain('aria-hidden="true"');
   expect(html).toContain('focusable="false"');
   expect(html).toContain('stroke="currentColor"');
   expect(html).not.toContain('<img');
  }
 });
 it('changes icons rather than navigation or click handlers',()=>{
  expect(shell).toContain('className="top-icon-link palace-top-chat-trigger"');
 });
 it('retains functional routes and action labels when giving all header tools matching line icons',()=>{
  for(const name of ['menu','search','profile','chat','activity','write'])
   expect(shell).toContain('<PalaceUtilityIcon name="'+name+'"/>');
  expect(shell).toContain('onClick={()=>window.dispatchEvent(new Event("palace-chat-open"))}');
  expect(shell).toContain('to="/activity"');
  expect(shell).toContain('aria-label="My profile"');
  expect(shell).toContain('to={session?\'/writing\':palaceSignInDoor(\'/writing\')}');
  expect(shell).toContain('aria-expanded={mobileGlobalSearchOpen}');
  expect(shell).toContain('aria-label="Toggle Palace navigation"');
 });
 it('uses the same quiet jewel treatment in both modes with clear keyboard focus',()=>{
  expect(shell).toContain("import './palace-utility-jewels.css';");
  expect(styles).toContain('--utility-jewel-surface');
  expect(styles).toContain('.palace-shell.full-palace-shell.daylight');
  expect(styles).toContain('.full-topbar :is(');
  expect(styles).toContain(':focus-visible');
  expect(styles).toContain('prefers-reduced-motion:reduce');
  expect(styles).not.toContain('animation:');
 });
 it('retains accessible help popovers while changing their icon artwork',()=>{
  expect(info).toContain('<PalaceUtilityIcon name="help"/>');
  expect(info).toContain('aria-expanded={open}');
  expect(info).toContain('aria-label={(variant===');
  expect(info).toContain("role=\"group\"");
 });
});
