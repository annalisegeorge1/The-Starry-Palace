import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const read=path=>readFileSync(resolve(process.cwd(),path),'utf8');
const css=read('src/palace-unified-rhythm.css');
const main=read('src/main.jsx');
const editorial=read('src/palace-editorial-finish.css');
const roomCss=read('src/palace-calm-inner-rooms.css');

describe('Palace shared editorial rhythm',()=>{
 it('loads as the finishing layer after existing room and theme styles',()=>{
  const imports=[
   "import './palace-editorial-finish.css';",
   "import './palace-calm-inner-rooms.css';",
   "import './palace-calm-treasury-chambers.css';",
   "import './palace-unified-rhythm.css';"
  ];
  for(const p of imports)expect(main).toContain(p);
  expect(main.indexOf(imports[0])).toBeLessThan(main.indexOf(imports[1]));
  expect(main.indexOf(imports[1])).toBeLessThan(main.indexOf(imports[2]));
  expect(main.indexOf(imports[2])).toBeLessThan(main.indexOf(imports[3]));
 });
 it('uses shared spacing, corner and interaction tokens, not a one-size-fits-all page layout',()=>{
  for(const token of ['--palace-rhythm-1:','--palace-rhythm-3:',
   '--palace-rhythm-5:','--palace-rhythm-radius:','--palace-rhythm-rule:',
   '--palace-rhythm-lift:'])expect(css).toContain(token);
  expect(css).toContain('.palace-shell.daylight');
  expect(css).toContain('text-wrap:balance');
  expect(css).toContain('overflow-wrap:anywhere');
  expect(css).toContain('line-height:1.68');
  expect(editorial).toContain('Shared typography and cadence');
 });
 it('targets core card surfaces across Reading, Palace Life, the Treasury and Chambers',()=>{
  for(const surface of ['.chic-story-catalogue>.story-row',
    '.legacy-constellation-list>article','.legacy-life-page .life-tabs.restored',
    '.treasury-room :is(.achievement-card,.gift-card)',
    '.chamber-atelier-gallery .legacy-showcase-grid>article',
    '.chamber-creator-overview','.creator-work-grid>article'
  ])expect(css).toContain(surface);
 });
 it('retains direct access to all sections and never hides content or artwork',()=>{
  expect(roomCss).toContain('.palace-calm-prompt-fold');
  expect(roomCss).toContain('.palace-calm-life-more');
  expect(css).not.toMatch(/\bdisplay\s*:\s*none\b/);
  expect(css).not.toMatch(/\bvisibility\s*:\s*hidden\b/);
  expect(css).not.toMatch(/overflow-x\s*:\s*hidden/);
  expect(css).not.toMatch(/\.chamber-atelier-art-stage[^{}]*\{[^}]*object-fit\s*:\s*cover/); // Watercolour artwork keeps its own sizing.
 });
 it('supports touch, narrow screens, keyboard focus and reduced-motion preferences',()=>{
  for(const requirement of ['@media(max-width:900px)','@media(max-width:600px)',
   '@media(max-width:390px)','@media(hover:hover) and (pointer:fine)',
   '@media(prefers-reduced-motion:reduce)',':focus-visible'
  ])expect(css).toContain(requirement);
  expect(css).not.toMatch(/animation\s*:/);
 });
});
