import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const read=path=>readFileSync(resolve(process.cwd(),path),'utf8');

describe('Chamber avatar ring and palette corrections',()=>{
 const css=read('src/chamber-avatar-palette-correction.css');
 it('removes legacy profile halo without hiding real member-selected painted frames',()=>{
  expect(css).toContain('.legacy-profile-avatar.member-avatar-framed');
  expect(css).toContain('border:0!important;');
  expect(css).toContain('box-shadow:none!important;');
  expect(css).toContain('.painted-chamber-frame');
  expect(css).not.toMatch(/\.painted-chamber-frame\s*\{[^}]*display\s*:\s*none/s);
  expect(css).not.toMatch(/\.painted-chamber-frame\s*\{[^}]*opacity\s*:\s*0/s);
 });
 it('only forces personalised navigation colours for selected palettes',()=>{
  expect(css).toContain('[data-viewer-appearance="palette"] #palace-sidebar');
  expect(css).toContain('var(--palette-panel-ink)');
  expect(css).toContain('var(--palette-accent-ink)');
 });
 it('uses the visited member palette rather than a hardcoded pink or cyan for profile content',()=>{
  expect(css).toContain('[data-member-appearance="palette"]');
  expect(css).toContain('var(--palette-ground-ink)');
  expect(css).toContain('var(--palette-panel-ink)');
 });
 it('loads after legacy theme styles and uses neutral avatar placeholders',()=>{
  const main=read('src/main.jsx');
  expect(main.indexOf("import './chamber-avatar-palette-correction.css'")).toBeGreaterThan(main.indexOf("import './reader-daybreak-final-contrast.css'"));
  const avatars=read('src/member-avatar.css');
  expect(avatars).not.toContain('#676aa4,#34345c');
  expect(avatars).toContain('--appearance-raised');
 });
});
