import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const all=readFileSync('src/liveRooms.jsx','utf8');
const tag=all.split('export function TagSearchLive({Frame})')[1].split('export function WorkLive({Frame})')[0];
const css=readFileSync('src/tag-constellation-mobile-calm.css','utf8');
const shell=readFileSync('src/main.jsx','utf8');
describe('Tag Constellation mobile discovery flow',()=>{
 it('has one primary tag lookup, with separate story text search in disclosure',()=>{
  expect(tag).toContain('className="tag-primary-search"');
  expect(tag).toContain('<details className="tag-story-search-toggle"');
  expect(tag).toContain('Search published stories by text');
  expect(tag).toContain('aria-label="Search stories inside the Tag Constellation"');
 });
 it('keeps family, view and order behind an accessible toggle',()=>{
  expect(tag).toContain('aria-expanded={tagFiltersOpen}');
  expect(tag).toContain('hidden={!tagFiltersOpen}');
  expect(tag).toContain('aria-controls="tag-library-extra-controls"');
  expect(tag).toContain('className="tag-family-atlas-rail"');
 });
 it('lets the whole tag row include and keeps exclusion and tag archive accessible',()=>{
  expect(tag).toContain('className="tag-pick-select"');
  expect(tag).toContain("onClick={()=>flip(tag.id,'include')}");
  expect(tag).toContain("onClick={()=>flip(tag.id,'exclude')}");
  expect(tag).toContain('className="tag-pick-archive"');
  expect(tag).toContain('aria-pressed={include.includes(tag.id)}');
  expect(tag).toContain('aria-pressed={exclude.includes(tag.id)}');
  expect(tag).toContain('New · not yet used');
  expect(tag).toContain("!tagQuery.trim()");
 });
 it('makes community tag creation a dismissible sheet without changing permissions',()=>{
  expect(tag).toContain('className="tag-create-open"');
  expect(tag).toContain('role="dialog" aria-modal="true"');
  expect(tag).toContain("event.key==='Escape'");
  expect(tag).toContain('if(!session)');
  expect(tag).toContain('createCommunityTag(newTag,newTagCategory)');
 });
 it('preserves tag combinations and search results',()=>{
  expect(tag).toContain('className="tag-find-matches"');
  expect(tag).toContain('run(null,0,include,exclude,text)');
  expect(tag).toContain('saveConstellation()');
  expect(tag).toContain('<ReadingArchivePager page={resultsPage}');
  expect(tag).toContain('className="tag-story-grid"');
 });
 it('styles only tags plus header surface rather than modifying header icons',()=>{
  expect(shell).toContain("import './tag-constellation-mobile-calm.css';");
  expect(css).toContain('.legacy-tags-page');
  expect(css).toContain('padding-bottom:calc(68px');
  expect(tag).toContain('className="tag-quick-paths"');
  expect(tag).toContain('className="tag-filter-backdrop"');
  expect(tag).toContain('className="tag-filter-sheet-heading"');
  expect(css).toContain('position:fixed!important;');
  expect(css).toContain('header.topbar.full-topbar');
  expect(css).not.toContain('.top-icon-link');
  expect(css).not.toContain('.write-action');
  expect(css).not.toContain('.mobile-palace-dock>');
 });
});
