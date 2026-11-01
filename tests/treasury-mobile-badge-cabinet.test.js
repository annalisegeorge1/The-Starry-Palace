import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const source=readFileSync('src/liveRooms.jsx','utf8');
const treasury=source.slice(source.indexOf('export function TreasuryLive({Frame})'),source.indexOf('export function ',source.indexOf('export function TreasuryLive({Frame})')+24));
const css=readFileSync('src/treasury-mobile-badge-cabinet.css','utf8');
const main=readFileSync('src/main.jsx','utf8');
const badge=readFileSync('src/PalaceBadge.jsx','utf8');

describe('Treasury mobile badge showcase without artwork regression',()=>{
 it('keeps Treasury help but removes the bulky first-look tutorial',()=>{
  expect(treasury).toContain('<PalaceTopicHelp id="treasury"/>');
  expect(treasury).not.toContain('<PalaceFirstRoomHint id="point-balances"/>');
  expect(source).toContain('PalaceFirstRoomHint');
 });
 it('brightens all four stats without hiding the counters or changing the categories',()=>{
  for(const label of ['achievement paths begun','collectible holdings','catalogued prizes','showcased honours'])
   expect(treasury).toContain(label);
  expect(css).toContain('.treasury-summary>article>span');
  expect(css).toContain('color:#e4def0!important');
  expect(css).toContain('.daylight #palace-content');
 });
 it('preserves badge award data, rank artwork and accessible progress',()=>{
  expect(treasury).toContain('<PalaceBadge family={a.achievement_families}');
  expect(treasury).toContain('current_value');
  expect(treasury).toContain('role="progressbar"');
  expect(treasury).toContain('aria-valuenow={Math.round(progress)}');
  expect(treasury).toContain('className="achievement-progress-label"');
  expect(treasury).toContain('Bronze → Silver → Gold → Platinum → Emerald');
  expect(badge).toContain('PaintedBadge');
  expect(badge).toContain('original-badge-stage');
  expect(badge).toContain('PaintedTierMount');
 });
 it('retains earned showcases while rendering Remove as a smaller secondary action',()=>{
  expect(treasury).toContain('onClick={()=>toggleAchievement(a,current)}');
  expect(treasury).toContain("removeProfileAchievementShowcase");
  expect(treasury).toContain('is-showcased');
  expect(treasury).toContain("'Remove from chamber'");
  expect(treasury).toContain("'Display on chamber'");
  expect(css).toContain('.showcase-toggle.is-showcased');
  expect(css).toContain('text-decoration:underline');
 });
 it('makes the real achievement cards full-width compact horizontal rows only on small screens',()=>{
  expect(css).toContain('@media(max-width:900px)');
  expect(css).toContain('.badge-grid.refined>.achievement-card');
  expect(css).toContain('grid-template-columns:106px minmax(0,1fr)!important');
  expect(css).toContain('min-height:0!important');
  expect(css).toContain('height:116px!important');
  expect(css).not.toContain('display:none!important;\n  .palace-watercolour-badge');
 });
 it('has mobile dock clearance and an opaque header without changing the original header icons',()=>{
  expect(main).toContain("import './treasury-mobile-badge-cabinet.css';");
  expect(css).toContain('padding-bottom:max(120px,var(--palace-mobile-dock-clearance,120px))');
  expect(css).toContain('header.topbar.full-topbar');
  expect(css).toContain('background-color:#0d142b!important');
  expect(css).not.toContain('.top-icon-link');
  expect(css).not.toContain('.write-action');
 });
});
