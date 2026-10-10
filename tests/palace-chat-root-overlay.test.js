import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';

const shell=readFileSync('src/main.jsx','utf8');
const chat=readFileSync('src/PalaceChatDrawer.jsx','utf8');
const viewport=readFileSync('src/palace-chat-mobile-viewport.css','utf8');

describe('Palace Chat is a viewport overlay, never clipped by the Reading Room',()=>{
 it('uses a React portal to move chat outside the scrolling Palace main',()=>{
  expect(shell).toContain("import { createPortal } from 'react-dom';");
  const host=shell.slice(shell.indexOf('function PalaceChatHost()'),shell.indexOf('function App()'));
  expect(host).toContain('return createPortal(');
  expect(host).toContain('document.body');
  expect(host).toContain('<PalaceChatDrawerLazy userId={session.user.id}/>');
  expect(host).toContain('if(!session?.user?.id)return null');
  expect(shell).toContain('<PalaceChatHost/></Frame>');
 });
 it('preserves the private letter/group controls and reachable header/footer close buttons',()=>{
  expect(chat).toContain('className="palace-chat-heading"');
  expect(chat).toContain('aria-label="Minimize Palace chat"');
  expect(chat).toContain('className="palace-chat-mobile-close" aria-label="Close Palace chat"');
  expect(chat).toContain('className="palace-chat-tabs"');
  expect(chat).toContain("setTab('groups');");
  expect(chat).toContain("onClick={()=>setOpen(false)}");
  expect(viewport).toContain('top:max(10px,env(safe-area-inset-top,0px))!important');
  expect(viewport).toContain('bottom:calc(89px + env(safe-area-inset-bottom,0px))!important');
  expect(viewport).toContain('z-index:1400!important');
 });
 it('avoids an enormous empty mobile inbox without shrinking active conversations',()=>{
  expect(chat).toContain("(open&&!active&&!creating?' is-inbox-empty':'')");
  expect(viewport).toContain('@media(max-width:720px) and (min-height:600px)');
  expect(viewport).toContain('.palace-chat-v2.palace-chat-dock.is-open.is-inbox-empty');
  expect(viewport).toContain('height:min(68dvh,590px)!important');
  expect(viewport).toContain('max-height:calc(100dvh - 110px - env(safe-area-inset-bottom,0px))!important');
  expect(viewport).toContain('@media(max-width:720px) and (max-height:480px)');
  expect(viewport).toContain('min-width:88px;min-height:44px;');
 });
});
