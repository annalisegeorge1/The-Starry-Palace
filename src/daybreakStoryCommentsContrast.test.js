import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';

const css=readFileSync('src/daybreak-story-comments-contrast.css','utf8');
const entry=readFileSync('src/main.jsx','utf8');
const work=readFileSync('src/liveRooms.jsx','utf8');

describe('Daybreak story and reader comments readability',()=>{
 it('loads the final correction after other theme layers',()=>{
  const current="import './daybreak-story-comments-contrast.css';";
  expect(entry).toContain(current);
  expect(entry.indexOf(current)).toBeGreaterThan(entry.indexOf("import './daybreak-treasury-settings-tablet-finish.css';"));
 });
 it('makes the comment form container and textarea light, without changing moderation',()=>{
  const composer=readFileSync('src/ReaderCommentComposer.jsx','utf8');
  expect(composer).toContain('className="comment-compose" onSubmit={submit}');
  expect(composer).toContain('Send for moderation');
  expect(css).toContain('.work-community .comment-compose {');
  expect(css).toContain('background:#f8f7fc!important');
  expect(css).toContain('height:82px!important');
  expect(css).toContain('grid-column:2!important');
  expect(css).toContain('justify-self:end!important');
 });
 it('restores accessible comment and empty-state text contrast',()=>{
  expect(css).toContain('color:#4e5064!important');
  expect(css).toContain('.work-community .reader-comment :is(p,small)');
  expect(css).toContain('color:#5f5a70!important');
 });
 it('preserves existing story tag pills while clarifying action hierarchy',()=>{
  expect(work).toContain('className="work-tag-row"');
  expect(work).toContain('className="primary-read-action"');
  expect(work).toContain('Save to Library');
  expect(work).toContain('Follow story');
  expect(css).not.toContain('.work-tag-row a{');
  expect(css).toContain('background:#7047b4!important');
  expect(css).toContain('background:#f2eff7!important');
 });
 it('keeps permissions read-only instead of falsely inviting a click',()=>{
  expect(work).toContain('className="work-rights-grid"');
  expect(work).toContain('<strong>{data.comment_policy}</strong>');
  expect(css).toContain('.work-rights-grid>article');
  expect(css).toContain('cursor:default!important');
  expect(css).toContain('background:#fff!important');
 });
 it('uses a solid header and quiet active sidebar',()=>{
  expect(css).toContain('.full-stage>header.topbar.full-topbar');
  expect(css).toContain('background:#faf9ff!important');
  expect(css).toContain('#palace-sidebar .full-subnav>a.active');
  expect(css).toContain('background:#ebe5f6!important');
 });
});
