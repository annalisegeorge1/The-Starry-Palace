import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const main=readFileSync('src/main.jsx','utf8');
const css=readFileSync('src/palace-midnight-theme.css','utf8');
describe('Midnight appearance integration',()=>{
 it('retains Nightfall and Daylight while adding a saved Midnight preference',()=>{
  expect(main).toContain("normalizePalaceTheme(safeLocalGet('palace-theme'))");
  expect(main).toContain("dataset.palaceTheme=palaceTheme");
  expect(main).toContain("safeLocalSet('palace-theme',palaceTheme==='nightfall'?'night':palaceTheme)");
  expect(main).toContain("palaceTheme==='midnight'?' midnight':'");
 });
 it('offers a visible appearance choice in both mobile navigation surfaces',()=>{
  expect(main).toContain('<PalaceThemePicker value={palaceTheme} onChange={setPalaceTheme}/>');
  expect(main).toContain('<PalaceThemePicker compact value={palaceTheme} onChange={setPalaceTheme}/>');
  expect(css).toContain('.palace-theme-option[aria-pressed="true"]');
 });
 it('sets a near-black palette without styling away member artwork',()=>{
  expect(css).toContain('#050506');
  expect(css).toContain('html[data-palace-theme="midnight"]');
  expect(css).toContain('.palace-shell.full-palace-shell.midnight');
  expect(css).toContain('.reading-filter-mobile-result-action');
  expect(css).not.toContain('.palace-cover-live.restored-cover>img{display:none');
 });
 it('loads the Midnight stylesheet after the drawer overrides',()=>{
  expect(main.indexOf("import './palace-midnight-theme.css';")).toBeGreaterThan(main.indexOf("import './palace-mobile-drawer-compact.css';"));
 });
});
