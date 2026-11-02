import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';

const room=readFileSync('src/liveRooms.jsx','utf8');
const css=readFileSync('src/tag-constellation-compact-rows.css','utf8');
const entry=readFileSync('src/main.jsx','utf8');
const tagRoom=room.slice(room.indexOf('export function TagSearchLive'),room.indexOf('export function ',room.indexOf('export function TagSearchLive')+20));

describe('Tag Constellation compact mobile rows',()=>{
 it('loads compact tag overrides after the legacy theme styles',()=>{
  const compact="import './tag-constellation-compact-rows.css';";
  expect(entry).toContain(compact);
  expect(entry.indexOf(compact)).toBeGreaterThan(entry.indexOf("import './palace-daylight-treasury-tags-grand-finish.css';"));
  expect(entry.indexOf(compact)).toBeGreaterThan(entry.indexOf("import './fanfiction-reading-polish.css';"));
  expect(css).toContain('.legacy-tags-page .tag-picker.restored>.tag-pick-row');
  expect(css).toContain('display:flex!important;flex-direction:row!important');
  expect(css).toContain('min-height:53px!important');
 });
 it('keeps selecting include by tapping the tag name and exposes exclude and archive independently',()=>{
  expect(tagRoom).toContain('className="tag-pick-select" aria-pressed={include.includes(tag.id)}');
  expect(tagRoom).toContain("onClick={()=>flip(tag.id,'include')}");
  expect(tagRoom).toContain('className="tag-pick-exclude"');
  expect(tagRoom).toContain("onClick={()=>flip(tag.id,'exclude')}");
  expect(tagRoom).toContain('className="tag-pick-archive"');
  expect(tagRoom).toContain('aria-label={"View stories tagged "+tag.name}');
  expect(tagRoom).toContain('aria-label={(exclude.includes(tag.id)?"Remove exclusion for ":"Exclude ")+tag.name}');
  expect(tagRoom).toContain('aria-label={(include.includes(tag.id)?"Remove included tag ":"Include tag ")+tag.name}');
 });
 it('displays family, truthful use counts and community provenance even when empty',()=>{
  expect(tagRoom).toContain("category.replaceAll('_',' ')");
  expect(tagRoom).toContain('Number(tag.usage_count||0).toLocaleString()+" uses"');
  expect(tagRoom).toContain("(tag.status==='community'?\" · community\":\"\")");
  expect(tagRoom).toContain('Number(tag.usage_count||0)===0?"unused ":""');
  expect(css).toContain('.tag-pick-row.unused:not(.included):not(.excluded)');
  expect(css).toContain('border:1px dashed var(--tag-row-line)!important');
 });
 it('keeps icon actions comfortably tappable and subtitles legible in both themes',()=>{
  expect(css).toContain('min-width:44px!important;width:44px!important');
  expect(css).toContain('min-height:44px!important;height:44px!important');
  expect(css).toContain('--tag-row-muted:#b6bfd2');
  expect(css).toContain('--tag-row-muted:#53617a');
  expect(css).toContain('color:var(--tag-row-muted)!important');
  expect(css).toContain('color:var(--tag-row-ink)!important');
  expect(css).toContain(':focus-visible');
  expect(css).toContain('@media(forced-colors:active)');
 });
 it('reserves safe scrolling room at the actual tags main container',()=>{
  expect(css).toContain('main#palace-content[data-palace-route^="/tags"]');
  expect(css).toContain('padding-bottom:calc(190px + env(safe-area-inset-bottom,0px))!important');
  expect(css).toContain('scroll-padding-bottom:calc(120px + env(safe-area-inset-bottom,0px))!important');
  expect(css).toContain('scroll-margin-block-end:calc(120px + env(safe-area-inset-bottom,0px))!important');
 });
});
