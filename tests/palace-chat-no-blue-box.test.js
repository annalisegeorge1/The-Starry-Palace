import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {CHAT_BUBBLE_BRANCH,isSafeChatBubblePreview} from '../scripts/guard-chat-bubble-preview.mjs';
const css=readFileSync('src/palace-chat-conversation-first.css','utf8');
describe('Palace chat sent-bubble blue-box styling regression',()=>{
 it('replaces the teal right-hand end of Nightfall sent bubbles with quiet purple',()=>{
  expect(css).toContain('--chat3-outgoing:linear-gradient(131deg,#795e9e 0%,#685783 59%,#544d72 100%);');
  expect(css).not.toContain('--chat3-outgoing:linear-gradient(131deg,#7457a7,#555e9d 59%,#3a7d94);');
 });
 it('keeps the lighter theme softly lilac instead of a blue square',()=>{
  expect(css).toContain('--chat3-outgoing:linear-gradient(128deg,#e2d1f3 0%,#d6cbe9 55%,#cdd0e4 100%);');
 });
 it('rounds all four corners consistently and preserves the message bubble flow',()=>{
  const rule=css.match(/\.palace-chat-v2 \.palace-chat-messages \.palace-chat-bubble\.mine\{([^}]+)\}/)?.[1]||'';
  expect(rule).toContain('background:var(--chat3-outgoing)!important');
  expect(rule).toContain('border-radius:16px!important');
  expect(rule).not.toMatch(/border-radius:[^;]*5px/);
 });
 it('blocks unsafe Cloudflare previews but not production main or local CI builds',()=>{
  expect(isSafeChatBubblePreview({CF_PAGES:'1',CF_PAGES_BRANCH:CHAT_BUBBLE_BRANCH})).toBe(false);
  expect(isSafeChatBubblePreview({CF_PAGES:'1',CF_PAGES_BRANCH:'main'})).toBe(true);
  expect(isSafeChatBubblePreview({CF_PAGES_BRANCH:CHAT_BUBBLE_BRANCH})).toBe(true);
  expect(JSON.parse(readFileSync('package.json','utf8')).scripts.build.startsWith('node scripts/guard-chat-bubble-preview.mjs &&')).toBe(true);
 });
});
