import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';

const css=readFileSync('src/palace-giphy-picker.css','utf8');
const picker=readFileSync('src/PalaceGiphyPicker.jsx','utf8');

describe('Palace GIPHY mobile thumbnail gallery',()=>{
 it('shows the full GIF rendition without stretching or cropping it',()=>{
  expect(css).toContain('.palace-chat-v2 .palace-giphy-result img{position:absolute;inset:0;width:100%;height:100%;display:block;object-fit:contain}');
  expect(css).toContain('.palace-chat-v2 .palace-giphy-result{position:relative;');
  expect(css).not.toContain('object-fit:cover');
 });
 it('has a scrollable two-column gallery on narrow touch screens',()=>{
  expect(css).toContain('grid-auto-rows:max-content');
  expect(css).toContain('overflow-y:auto');
  expect(css).toContain('grid-template-columns:repeat(2,minmax(0,1fr))');
  expect(css).toContain('max-height:min(470px,56dvh)');
 });
 it('retains keyboard focus, sending selected GIFs, and GIPHY attribution',()=>{
  expect(css).toContain('.palace-chat-v2 .palace-giphy-result:focus-visible');
  expect(picker).toContain('onClick={()=>g.url&&onSend(g.url)}');
  expect(picker).toContain('Powered by <strong>GIPHY</strong>');
  expect(picker).toContain("Your chat text isn't sent for searching");
 });
});
