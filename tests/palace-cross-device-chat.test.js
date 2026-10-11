import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';

const shared=readFileSync('src/palace-unified-action-gradients.css','utf8');
const mobile=readFileSync('src/palace-mobile-theme-parity.css','utf8');
const chat=readFileSync('src/PalaceChatDrawer.jsx','utf8');
const chatCss=readFileSync('src/palace-chat-context-polish.css','utf8');
const chatViewport=readFileSync('src/palace-chat-mobile-viewport.css','utf8');
const chatTheme=readFileSync('src/palace-chat-refined.css','utf8');

describe('Palace cross-device colour consistency',()=>{
 it('keeps one actual token set for Nightfall and Daylight on every viewport',()=>{
  expect(shared).toContain('html[data-palace-theme="nightfall"],.full-palace-shell.nightfall');
  expect(shared).toContain('html[data-palace-theme="daylight"],.full-palace-shell.daylight');
  for(const token of ['--palace-chrome-header','--palace-chrome-search','--palace-chrome-panel','--palace-chrome-ink','--palace-chrome-border']){
   expect(shared).toContain(token);
   expect(mobile).toContain('var('+token+')');
  }
  expect(shared).toContain('background:var(--palace-chrome-header)!important');
  expect(shared).toContain('background:var(--palace-chrome-search)!important');
 });
 it('reuses the large-screen primary action gradient for the mobile dock rather than hardcoded phone hues',()=>{
  expect(shared).toContain('--palace-unified-action-gradient:linear-gradient(');
  expect(mobile).toContain('background:var(--palace-unified-action-gradient)!important');
  expect(mobile).toContain('background:var(--palace-chrome-panel)!important');
  expect(mobile).not.toContain('linear-gradient(145deg,#7259bb');
  expect(mobile).not.toContain('linear-gradient(135deg,#e0d5f2');
  expect(mobile).not.toContain('.palace-shell.daylight .chic-writing-head{');
  expect(mobile).not.toContain('.palace-shell.nightfall .chic-writing-head{');
  expect(chatTheme).toContain('--pc-surface:var(--palace-chrome-panel');
 });
});

describe('Mobile Palace Chat behaves as a focused messaging surface',()=>{
 it('shows a single header for opened conversations, with an accessible back option',()=>{
  expect(chat).toContain('className="palace-chat-thread-identity"');
  expect(chat).toContain('className="palace-chat-header-back" aria-label="Back to inbox"');
  expect(chat).toContain('className="palace-chat-header-avatar"');
  expect(chat).toContain('aria-label="Group settings"');
  expect(chatCss).toContain('.is-thread-open .palace-chat-correspondent');
  expect(chatCss).toContain('display:none!important; /* name/avatar already shown in the one actual header */');
  expect(chat).toContain('className="palace-chat-mobile-close"');
 });
 it('makes the inbox a scrollable list with real previews rather than squeezed pills',()=>{
  expect(chat).toContain('className="palace-chat-list-preview"');
  expect(chat).toContain('className="palace-chat-list-details"');
  expect(chat).toContain('className="palace-chat-list-meta"');
  expect(chatCss).toContain('grid-template-columns:minmax(0,1fr)!important');
  expect(chatCss).toContain('min-height:64px!important');
  expect(chat).toContain('setSelectedDirect(c.conversation_id);setThreadOpen(true)');
 });
 it('uses a single composer and full viewport, preserving current messaging actions',()=>{
  expect(chat).toContain('className="palace-chat-composer-shell"');
  expect(chatCss).toContain('.palace-chat-composer-shell>.palace-chat-compose-tools');
  expect(chat).toContain('sendLetterPhoto(userId,roomId,path,caption)');
  expect(chat).toContain('saveEditedMessage');
  expect(chat).toContain('PalaceGiphyPicker');
  expect(chat).toContain('onPointerDown={e=>beginMessageHold(e,m)}');
  expect(chatViewport).toContain('bottom:max(4px,env(safe-area-inset-bottom,0px))!important');
  expect(chatViewport).toContain('body:has(.palace-chat-v2.palace-chat-dock.is-open) .mobile-palace-dock');
 });
});
