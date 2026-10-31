import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const file=path=>readFileSync(path,'utf8');
const shelf=file('src/chamber-creative-shelf-polish.css');
const giphy=file('src/palace-giphy-picker.css');
const rooms=file('src/liveRooms.jsx');
const picker=file('src/PalaceGiphyPicker.jsx');

describe('Writer profile and landscape tablet story previews',()=>{
 it('sizes cards by available content width, not device viewport',()=>{
  expect(shelf).toContain('grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr))!important');
  expect(shelf).toContain('grid-template-columns:92px minmax(0,1fr)!important');
  expect(shelf).toContain('grid-template-columns:82px minmax(0,1fr)!important');
  expect(shelf).toContain('overflow-wrap:break-word');
 });
 it('clamps previews without truncating author data or removing title links',()=>{
  expect(shelf).toContain('-webkit-line-clamp:5');
  expect(rooms).toContain('w.summary||\'This writer has not added a summary yet.\'');
  expect(rooms).toContain('className="member-works creator-work-grid"');
  expect(rooms).toContain('className="chamber-story-content"');
  expect(rooms).toContain('Enter story →');
 });
});
describe('GIPHY result height in floating chats and mobile',()=>{
 it('reserves height for a scrollable gallery on landscape tablets',()=>{
  expect(giphy).toContain('max-height:min(470px,60dvh)');
  expect(giphy).toContain('flex:0 0 auto;height:clamp(150px,26dvh,230px)');
  expect(giphy).toContain('grid-auto-rows:max-content');
  expect(giphy).toContain('overflow-y:auto');
  expect(giphy).toContain('object-fit:contain');
 });
 it('keeps two-column phone thumbnails and shorter landscape viewport fallback',()=>{
  expect(giphy).toContain('grid-template-columns:repeat(2,minmax(0,1fr))');
  expect(giphy).toContain('height:clamp(125px,27dvh,220px)');
  expect(giphy).toContain('height:max(80px,20dvh)');
 });
 it('preserves search, GIF sending, safe third-party attribution and close affordance',()=>{
  expect(picker).toContain('searchPalaceGiphy(q,');
  expect(picker).toContain('onClick={()=>g.url&&onSend(g.url)}');
  expect(picker).toContain('aria-label="Close GIF search"');
  expect(picker).toContain('Powered by <strong>GIPHY</strong>');
 });
});
