import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const view=readFileSync('src/PalaceChatDrawer.jsx','utf8');
const style=readFileSync('src/palace-chat-refined.css','utf8');
const mobile=readFileSync('src/palace-chat-mobile-viewport.css','utf8');
const theme=readFileSync('src/palace-chat-theme-parity.css','utf8');

describe('Palace Chat professional visual finish',()=>{
 it('loads the professional skin last without replacing existing messaging functions',()=>{
  expect(view).toContain("import './palace-chat-expressions.css';\nimport './palace-chat-refined.css';");
  expect(view).toContain('await sendLetter(');
  expect(view).toContain('await sendPalaceGroupMessage(');
  expect(view).toContain('role="log" aria-label="Conversation messages"');
  expect(view).toContain('<PalaceEmojiPicker label="Palace Chat"');
  expect(view).toContain('<PalaceGiphyPicker busy={busy} onSend={sendGif}');
  expect(view).toContain('<PalaceChatGif body={m.body}/>');
 });
 it('uses a compact chat brand with reachable accessible controls',()=>{
  expect(view).toContain('className="palace-chat-brand"');
  expect(view).toContain('className="palace-chat-brand-mark"');
  expect(view).toContain('aria-label="Minimize Palace chat"');
  expect(view).toContain('aria-label="Close Palace chat"');
  expect(style).toContain('.palace-chat-v2 .palace-chat-heading .palace-chat-header-actions button');
  expect(style).toContain('min-width:38px;min-height:38px');
  expect(mobile).toContain('min-width:44px!important;min-height:44px!important');
 });
 it('makes conversation identity clear without exposing private information',()=>{
  expect(view).toContain('data-chat-type={tab}');
  expect(view).toContain('className="palace-chat-person-avatar"');
  expect(view).toContain('className="palace-chat-person-copy"');
  expect(view).toContain('className="palace-chat-list-avatar"');
  expect(style).toContain('.palace-chat-v2[data-chat-type="direct"] .palace-chat-correspondent');
  expect(style).toContain('.palace-chat-v2[data-chat-type="groups"] .palace-chat-correspondent');
  expect(view).toContain('aria-label="Back to conversations"');
  expect(mobile).toContain('.palace-chat-v2.palace-chat-dock.is-open.is-thread-open');
 });
 it('leaves messages legible and preserves a distinct send button',()=>{
  expect(style).toContain('max-width:min(86%,380px)');
  expect(style).toContain('.palace-chat-v2 .palace-chat-bubble.mine');
  expect(style).toContain('.palace-chat-v2 .palace-chat-compose .palace-chat-send');
  expect(view).toContain('className="palace-chat-send"');
  expect(view).toContain('disabled={busy||!currentDraft.trim()}');
 });
 it('matches Nightfall/Daylight and respects the phone viewport',()=>{
  expect(style).toContain('html[data-palace-theme="daylight"] .palace-chat-v2');
  expect(theme).toContain('html[data-palace-theme="nightfall"]');
  expect(style).toContain('@media(max-width:720px)');
  expect(mobile).toContain('bottom:calc(89px + env(safe-area-inset-bottom,0px))!important');
  expect(style).toContain('@media(prefers-reduced-motion:reduce)');
 });
});
