import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {buildLibraryOverview} from '../src/libraryOverviewModel.js';

const library=readFileSync('src/liveRooms.jsx','utf8');
const overview=readFileSync('src/LibraryOverview.jsx','utf8');
const css=readFileSync('src/library-artwork-first.css','utf8');

describe('My Library preserves all shelves with less mobile clutter',()=>{
 it('keeps the same URL-backed tabs while showing three derived stats',()=>{
  expect(library).toContain('library-quick-stats');
  expect(library).toContain('buildLibraryOverview(data,org).counts');
  for(const shelf of ['continue','saved','comics','collections','lists','notes','following','writers','history','finished']){
   expect(library).toContain("['"+shelf+"',");
  }
  expect(library).toContain("import './library-artwork-first.css';");
 });
 it('keeps actual reading previews and updates, not a duplicate shelf directory',()=>{
  expect(overview).toContain('view.continueReading');
  expect(overview).toContain('view.savedForLater');
  expect(overview).toContain('view.updates.map(');
  expect(overview).toContain('No saved stories yet.');
  expect(overview).not.toContain('library-overview-shortcuts');
  expect(overview).not.toContain('library-overview-hero');
  expect(overview).not.toContain('library-overview-pulse');
 });
 it('computes stats from verified saved and progress data without losing other shelves',()=>{
  const state={saved:[{},{}],savedComics:[{}],subscriptions:[{}],comicSubscriptions:[{}],
   progress:[{work_id:1,updated_at:'2026-10-30',works:{slug:'test-story',title:'Test Story'}}]};
  const counts=buildLibraryOverview(state,{notes:[{},{}]}).counts;
  expect(counts.reading).toBe(1);
  expect(counts.subscriptions).toBe(2);
  expect(counts.saved).toBe(3);
  expect(counts.notes).toBe(2);
 });
 it('provides tabs with fade and enough room under mobile nav with solid header',()=>{
  expect(css).toContain('[data-palace-route^="/library"]');
  expect(css).toContain('grid-template-columns:repeat(3,minmax(0,1fr))!important');
  expect(css).toContain('mask-image:linear-gradient(to right');
  expect(css).toContain('padding-bottom:max(140px,calc(120px + env(safe-area-inset-bottom,0px)))');
  expect(css).toContain('background-color:#0d142b!important');
  expect(css).toContain('background-color:#f0ecfa!important');
 });
});
