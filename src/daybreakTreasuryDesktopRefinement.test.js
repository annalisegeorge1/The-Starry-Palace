import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';

const css=readFileSync('src/daybreak-treasury-desktop-refinement.css','utf8');
const main=readFileSync('src/main.jsx','utf8');
const treasury=readFileSync('src/liveRooms.jsx','utf8');
const wardrobe=readFileSync('src/CelestialTitleWardrobe.jsx','utf8');

describe('Daybreak Royal Treasury desktop refinement',()=>{
 it('loads after prior Daybreak calendar and dashboard corrections',()=>{
  const name="import './daybreak-treasury-desktop-refinement.css';";
  expect(main).toContain(name);
  expect(main.indexOf(name)).toBeGreaterThan(main.indexOf("import './daybreak-events-desktop-polish.css';"));
 });
 it('keeps all four actual summary metrics while reducing card height',()=>{
  expect(treasury).toContain('achievement paths begun');
  expect(treasury).toContain('collectible holdings');
  expect(treasury).toContain('catalogued prizes');
  expect(treasury).toContain('showcased honours');
  expect(css).toContain('grid-template-columns:repeat(4,minmax(0,1fr))!important');
  expect(css).toContain('min-height:58px!important');
 });
 it('flattens the wardrobe without hiding the three selectable distinctions',()=>{
  expect(treasury).toContain('className="treasury-wardrobe-grid"');
  expect(treasury).toContain('Choose worn achievement');
  expect(treasury).toContain('Choose worn treasure');
  expect(css).toContain('.treasury-wardrobe-grid> :is(article,label)');
  expect(css).toContain('background:transparent!important');
  expect(css).toContain('color:#53596b!important');
 });
 it('supports legible veiled labels, full-width Wear actions and thicker progress',()=>{
  expect(treasury).toContain('VEILED TITLE');
  expect(treasury).toContain('Wear this title');
  expect(wardrobe).toContain('Wear this title');
  expect(css).toContain('height:8px!important');
  expect(css).toContain('font-size:.72rem!important');
  expect(css).toContain('width:100%!important;min-width:0!important;margin-top:auto!important');
 });
 it('keeps the original art while making collectible names and courts wrap',()=>{
  expect(treasury).toContain('draw.preview.map');
  expect(treasury).toContain('PalaceGift gift={p} tier="bronze" compact');
  expect(css).toContain('grid-template-columns:repeat(auto-fit,minmax(240px,1fr))!important');
  expect(css).toContain('white-space:normal!important');
  expect(css).toContain('min-width:76px!important');
 });
 it('marks only legitimately claimed gifts green and leaves draw logic alone',()=>{
  expect(treasury).toContain("draw.claim&&gift?");
  expect(treasury).toContain('Claimed ✓');
  expect(css).toContain('color:#176f43!important');
  expect(css).not.toContain('display:none!important');
 });
 it('restricts refinements to tablet and desktop Daybreak and respects accessibility',()=>{
  expect(css).toContain('@media (min-width: 761px)');
  expect(css).toContain('.palace-shell.full-palace-shell.daylight');
  expect(css).toContain('@media (forced-colors:active)');
 });
});
