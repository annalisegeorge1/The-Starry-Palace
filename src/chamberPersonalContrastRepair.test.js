import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {contrastRatio} from './profileSkinModel';
import {prismAppearance} from './prismAppearance';
const css=readFileSync('src/chamber-personal-contrast-repair.css','utf8');
const main=readFileSync('src/main.jsx','utf8');
describe('Member Chamber contrast and palette isolation',()=>{
 it('loads owner-specific contrast after global dark mode overrides',()=>{
  expect(main.indexOf("import './chamber-personal-contrast-repair.css'")).toBeGreaterThan(main.indexOf("import './palace-dark-theme-priority.css'"));
 });
 it('gives a dark Chamber primary and a pale secondary different readable ink',()=>{
  const appearance=prismAppearance({
   prism_colour_chosen:true,
   prism_palette_data:{slug:'test',primary:'#20345B',secondary:'#87ACD5',accent:'#D6B7EC'},
   prism_accent:'harmony'
  });
  expect(appearance.kind).toBe('palette');
  const styles=appearance.style;
  expect(contrastRatio(styles['--appearance-primary'],styles['--palette-ground-ink'])).toBeGreaterThanOrEqual(4.5);
  expect(contrastRatio(styles['--appearance-secondary'],styles['--palette-panel-ink'])).toBeGreaterThanOrEqual(4.5);
  expect(styles['--palette-ground-ink']).not.toBe(styles['--palette-panel-ink']);
 });
 it('corrects the actual unreadable published-worlds heading and preview counts',()=>{
  expect(css).toContain('.creator-worlds-room>.section-heading :is(h2,p,.eyebrow)');
  expect(css).toContain('.creator-worlds-room>.chamber-shelf-count');
  expect(css).toContain('var(--palette-ground-ink)!important;');
  expect(css).toContain('text-shadow:none!important;');
 });
 it('uses secondary-surface ink for correspondence, about, shelves, and search controls',()=>{
  for(const selector of ['.chamber-contact-state','.chamber-about-card','.creator-shelf-block','.chamber-shelf-search input','.chamber-shelf-filters button'])expect(css).toContain(selector);
  expect(css).toContain('var(--palette-panel-ink)!important;');
  expect(css).toContain('var(--palette-accent-ink)!important;');
  expect(css).toContain('input::placeholder');
 });
 it('does not repaint default mode or member art with a global fixed colour',()=>{
  expect(css).not.toContain('.legacy-profile-cover{');
  expect(css).not.toContain('.painted-chamber-frame{');
  expect(css).not.toContain('.member-avatar{');
  expect(css).toContain('.public-chamber-appearance[data-member-appearance="palette"]');
  expect(css).toContain('.public-chamber-appearance[data-member-appearance="skin"]');
  expect(css).not.toContain('#87ACD5');
 });
});
