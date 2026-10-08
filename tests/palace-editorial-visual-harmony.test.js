import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const css=readFileSync(resolve(process.cwd(),'src/palace-editorial-finish.css'),'utf8');
const home=readFileSync(resolve(process.cwd(),'src/PalaceHomeWelcome.jsx'),'utf8');
const main=readFileSync(resolve(process.cwd(),'src/main.jsx'),'utf8');

describe('Palace editorial finish',()=>{
 it('preserves the existing wind-chime artwork and the simple three-door welcome',()=>{
  expect(main).toContain('/assets/palace/palace-belonging.gif');
  expect(home).toContain('Where would you like to begin?');
  expect(home).toContain('Read, write, or find your people.');
  expect(main).toContain("<PalaceHomeWelcome member={!!session}/>");
 });
 it('keeps nightfall and daylight design systems distinct and legible',()=>{
  for(const selector of [
   '.palace-shell.nightfall .palace-home-welcome .palace-choice-card',
   '.palace-shell.daylight .palace-home-welcome .palace-choice-card',
   '.palace-shell.nightfall .writer-welcome .writer-feature-grid article',
   '.palace-shell.daylight .writer-welcome .writer-feature-grid article',
   '.palace-shell.daylight .writer-welcome .writer-faq-items details',
   '.palace-shell.nightfall .palace-first-shelf .palace-story-shelf-feedback',
   '.palace-shell.daylight .palace-first-shelf .palace-story-shelf-feedback'
  ])expect(css).toContain(selector);
 });
 it('respects reduced-motion and narrow screens without hiding interactive elements',()=>{
  expect(css).toContain('@media(max-width:600px)');
  expect(css).toContain('@media(prefers-reduced-motion:reduce)');
  expect(css).toContain('transform:none!important;');
  expect(css).toContain('text-wrap:balance');
  expect(css).not.toContain('display:none!important');
 });
 it('loads its restrained styles after existing Palace styles',()=>{
  expect(main.indexOf("import './palace-editorial-finish.css';")).toBeGreaterThan(main.indexOf("} from './liveRooms';"));
 });
});
