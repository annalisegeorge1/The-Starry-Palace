import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';

const shell=readFileSync('src/main.jsx','utf8');
const mobile=readFileSync('src/palace-mobile-theme-parity.css','utf8');
const chat=readFileSync('src/PalaceChatDrawer.jsx','utf8');
const chatTheme=readFileSync('src/palace-chat-theme-parity.css','utf8');
const chatViewport=readFileSync('src/palace-chat-mobile-viewport.css','utf8');

describe('Shared Palace colours on phones, tablets and desktops',()=>{
 it('has one persisted Nightfall/Daylight choice for the entire shell and lazy chat',()=>{
  expect(shell).toContain("document.documentElement.dataset.palaceTheme=theme;");
  expect(shell).toContain("safeLocalSet('palace-theme',daylight?'daylight':'night');");
  expect(shell).toContain("import './palace-mobile-theme-parity.css';");
  expect(chat).toContain("import './palace-chat-theme-parity.css';");
  expect(chat.indexOf("import './palace-chat-theme-parity.css';"))
   .toBeGreaterThan(chat.indexOf("import './palace-chat-mobile-viewport.css';"));
 });
 it('keeps both modes distinct but uses restrained mobile versions of the same palettes',()=>{
  // The header and Writing Chamber hero inherit the same theme on every device.
  expect(mobile).not.toContain('.palace-shell.nightfall .full-topbar{');
  expect(mobile).not.toContain('.palace-shell.daylight .full-topbar{');
  expect(mobile).not.toContain('.palace-shell.nightfall .chic-writing-head{');
  expect(mobile).not.toContain('.palace-shell.daylight .chic-writing-head{');
  expect(mobile).toContain('.palace-shell.nightfall .mobile-palace-dock');
  expect(mobile).toContain('.palace-shell.daylight .mobile-palace-dock');
  expect(mobile).toContain('.palace-shell.daylight .mobile-palace-dock .mobile-dock-write');
  expect(mobile).toContain('@media(max-width:720px)');
  expect(mobile).toContain('(max-height:600px) and (pointer:coarse)');
 });
 it('prevents the Writing Chamber statistics from crushing captions on a narrow phone',()=>{
  expect(mobile).toContain('grid-template-columns:repeat(2,minmax(0,1fr))!important;');
  expect(mobile).toContain('.chic-writing-summary>span small');
  expect(mobile).toContain('word-break:normal!important;');
  expect(mobile).toContain('font-size:clamp(.72rem,1.9vw,.82rem)!important');
 });
 it('makes the chat readable in Daylight while keeping Nightfall and functional close buttons',()=>{
  expect(chatTheme).toContain('html[data-palace-theme="daylight"] .palace-chat-v2 .palace-chat-panel');
  expect(chatTheme).toContain('html[data-palace-theme="nightfall"] .palace-chat-v2 .palace-chat-heading');
  expect(chatTheme).toContain('.palace-chat-mobile-close');
  expect(chatViewport).toContain('min-width:88px;min-height:44px;');
  expect(mobile).toContain('body:has(.palace-chat-v2.palace-chat-dock.is-open) .restored-floating-controls');
  expect(chat).toContain('onClick={()=>setOpen(false)}');
 });
});
