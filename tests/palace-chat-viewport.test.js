import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const css=readFileSync('src/palace-chat-mobile-viewport.css','utf8');
const jsx=readFileSync('src/PalaceChatDrawer.jsx','utf8');
describe('Palace Chat stays closable on short phones and browser webviews',()=>{
 it('pins both edges of the open drawer independently of the bottom dock',()=>{
  expect(css).toContain('@media(max-width:720px)');
  expect(css).toContain('.palace-chat-v2.palace-chat-dock.is-open{');
  expect(css).toContain('top:max(4px,env(safe-area-inset-top,0px))!important');
  expect(css).toContain('bottom:max(4px,env(safe-area-inset-bottom,0px))!important');
  expect(css).toContain('height:auto!important;max-height:none!important;min-height:0!important');
  expect(css).toContain('height:100%!important;max-height:100%!important;min-height:0!important');
  expect(jsx).toContain("import './palace-chat-mobile-viewport.css';");
 });
 it('provides two independent close paths, both with reachable touch targets',()=>{
  expect(jsx).toContain('aria-label="Minimize Palace chat"');
  expect(jsx).toContain('className="palace-chat-mobile-close" aria-label="Close Palace chat" onClick={()=>{setActionMenu(null);setOpen(false)}}');
  expect(css).toContain('min-width:44px!important;min-height:44px!important;');
  expect(css).toContain('min-width:88px;min-height:44px;');
  expect(css).toContain('display:flex!important;flex:0 0 auto!important;');
 });
 it('keeps the header and footer available in landscape, with reduced motion and existing private messages intact',()=>{
  expect(css).toContain('@media(max-width:720px) and (max-height:480px)');
  expect(css).toContain('prefers-reduced-motion:reduce');
  expect(css).toContain('.palace-chat-v2.palace-chat-dock.is-open .palace-chat-heading');
  expect(jsx).toContain('getLetters');
  expect(jsx).toContain('getPalaceGroupChatOverview');
 });
});
