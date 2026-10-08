import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const css=readFileSync(resolve(process.cwd(),'src/mobile-profile-writer-layout.css'),'utf8');
const app=readFileSync(resolve(process.cwd(),'src/main.jsx'),'utf8');
const rooms=readFileSync(resolve(process.cwd(),'src/liveRooms.jsx'),'utf8');

describe('Mobile screenshots: member cover and writing desk',()=>{
 it('caps the Edit cover control rather than letting it become a banner-sized oval',()=>{
  expect(rooms).toContain('className="legacy-edit-cover" onClick={openEdit}');
  expect(css).toContain('.chic-member-profile .legacy-profile-cover > .legacy-edit-cover');
  expect(css).toContain('top:12px!important');
  expect(css).toContain('bottom:auto!important');
  expect(css).toContain('height:40px!important');
  expect(css).toContain('max-height:40px!important');
  expect(css).toContain('width:max-content!important');
  expect(css).toContain('max-width:calc(100% - 24px)!important');
  expect(css).toContain('writing-mode:horizontal-tb!important');
  expect(css).toContain('.chic-member-profile .legacy-profile-cover > .legacy-edit-cover:focus-visible');
 });
 it('restores a real grid to the settings drawer and stops vertical-letter headings',()=>{
  expect(rooms).toContain('className="writer-view-controls" aria-label="Writing view"');
  expect(rooms).toContain('Make the desk yours.');
  expect(rooms).toContain('className="writer-desk-drawer-body"');
  expect(css).toContain('.writer-desk-drawer-body > .writer-view-controls');
  expect(css).toContain('grid-template-columns:repeat(2,minmax(0,1fr))!important');
  expect(css).toContain('.writer-view-controls > .writer-view-heading');
  expect(css).toContain('grid-column:1/-1!important');
  expect(css).toContain('grid-template-columns:36px minmax(0,1fr)!important');
  expect(css).toContain('word-break:normal!important');
  expect(css).toContain('overflow-wrap:normal!important');
  expect(css).toContain('.writer-view-controls > label > select');
  expect(css).toContain('width:100%!important');
 });
 it('works with existing large-desktop editor rail as well as one-column phones',()=>{
  expect(css).toContain('@media(min-width:1280px)');
  expect(css).toContain('grid-area:view!important');
  expect(css).toContain('@media(max-width:1279px)');
  expect(css).toContain('grid-area:auto!important');
  expect(css).toContain('@media(max-width:520px)');
  expect(css).toContain('grid-template-columns:minmax(0,1fr)!important');
  expect(css).toContain('.writer-view-controls > .writer-view-toggles');
 });
 it('limits the writing update prompt without silently reloading unsaved work',()=>{
  expect(app).toContain('if(!updateAvailable||!shouldOfferManualPalaceRefresh(location.pathname))return null');
  expect(app).toContain('Finish saving your work before reloading.');
  expect(app).toContain('onClick={()=>window.location.reload()}');
  expect(css).toContain('@media(max-width:720px)');
  expect(css).toContain('.palace-update-safety');
  expect(css).toContain('max-width:116px!important');
  expect(css).toContain('@media(max-width:365px)');
 });
 it('loads the targeted repair last and respects daylight, keyboard and reduced motion',()=>{
  expect(app).toContain("import './mobile-profile-writer-layout.css';");
  expect(app.indexOf("import './mobile-profile-writer-layout.css';")).toBeGreaterThan(app.indexOf("import './writer-desk-drawer.css';"));
  expect(css).toContain('.palace-shell.daylight');
  expect(css).toContain('focus-visible');
  expect(css).toContain('prefers-reduced-motion:reduce');
 });
});
