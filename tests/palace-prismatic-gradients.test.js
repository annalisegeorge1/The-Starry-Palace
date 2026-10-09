import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const read=path=>readFileSync(resolve(process.cwd(),path),'utf8');
const css=read('src/palace-prismatic-gradients.css');
const app=read('src/main.jsx');

describe('Palace prismatic gradient finish',()=>{
 it('loads after the existing editorial, reading and comfort styles',()=>{
  const old="import './reader-comfort-finish.css';";
  const gradient="import './palace-prismatic-gradients.css';";
  expect(app).toContain(old);
  expect(app).toContain(gradient);
  expect(app.indexOf(old)).toBeLessThan(app.indexOf(gradient));
 });
 it('gives each main door a distinctive colour story in nightfall and daylight',()=>{
  for(const mode of ['nightfall','daylight']){
   for(const room of ['read','write','belong']){
    expect(css).toContain('.palace-shell.'+mode+' .palace-home-welcome .palace-choice-'+room);
   }
  }
  expect(css).toContain('linear-gradient(135deg,#314e86');
  expect(css).toContain('linear-gradient(135deg,#543770');
  expect(css).toContain('linear-gradient(130deg,#225e6b');
 });
 it('adds gradients to Reading, Writing, Palace Life and Treasury without removing room features',()=>{
  for(const selector of [
   '.legacy-reading-page>.legacy-reading-intro',
   '.writing-head',
   '.legacy-life-page>.legacy-life-head',
   '.legacy-treasury-page>.legacy-treasury-head',
   '.writing-pad-launch',
   '.prompt-orrery',
   '.reading-mood-doors',
   '.reading-classics-hall',
   '.commons-compose-fold',
   '.treasury-wardrobe',
   '.chamber-section-nav'
  ])expect(css).toContain(selector);
 });
 it('keeps contrast and keyboard focus in both themes',()=>{
  expect(css).toContain('.palace-shell.daylight');
  expect(css).toContain('.palace-shell.nightfall');
  expect(css).toContain('color:#ffffff');
  expect(css).toContain('color:#302347');
  expect(css).toContain(':focus-visible');
  expect(css).toContain('@media(max-width:600px)');
 });
 it('avoids costly animated gradient effects and never replaces user art or manuscript backgrounds',()=>{
  expect(css).not.toMatch(/\banimation(?:-name|-duration)?\s*:/);
  expect(css).not.toMatch(/\bbackdrop-filter\s*:/);
  expect(css).not.toMatch(/\bfilter\s*:/);
  expect(css).not.toMatch(/\.legacy-profile-cover\s*\{/);
  expect(css).not.toMatch(/\.manuscript-(?:paper|canvas|editor)\s*\{/);
  expect(css).not.toMatch(/\.badge-(?:art|image)\s*\{/);
  expect(css).not.toMatch(/background-attachment\s*:\s*fixed/);
 });
});
