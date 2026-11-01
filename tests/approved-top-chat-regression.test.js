import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const read=(path)=>readFileSync(path,'utf8');
const shell=read('src/main.jsx');
const base=read('src/mobile-global-shell-palace-polish.css');
const chat=read('src/chat-topbar-calm.css');
const pageStyles=['src/tag-constellation-mobile-calm.css','src/events-calendar-mobile-clarity.css','src/treasury-mobile-badge-cabinet.css','src/palace-letters-mobile-calm.css'];
describe('Preserve the approved top chat bubble and header across page refinements',()=>{
 it('keeps the approved chat bubble, trigger selector and chat-opening action',()=>{
  const marker='className="top-icon-link palace-top-chat-trigger"';
  const start=shell.indexOf(marker);
  expect(start).toBeGreaterThan(-1);
  const button=shell.slice(start,start+300);
  expect(button).toContain('>💬</button>');
  expect(button).not.toContain('>✉</button>');
  expect(button).toContain('aria-label="Open Palace Chat"');
  expect(button).toContain('window.dispatchEvent(new Event("palace-chat-open"))');
  expect(chat).toContain('.palace-top-chat-trigger{cursor:pointer;display:inline-flex;align-items:center;justify-content:center;min-width:36px;border:0;background:transparent;color:inherit;font-size:1.15rem}');
 });
 it('retains the canonical opaque mobile header including Daylight',()=>{
  expect(base).toContain('.full-stage>header.topbar.full-topbar');
  expect(base).toContain('background:#0d142b!important');
  expect(base).toContain('z-index:9999!important');
  expect(base).toContain('.palace-shell.full-palace-shell.daylight .full-stage>header.topbar.full-topbar');
  expect(base).toContain('background:#f0ecfa!important');
 });
 it('prevents Tag, Events, Treasury and Letters CSS from globally overriding the header',()=>{
  for(const path of pageStyles){
   const css=read(path);
   expect(css, path).not.toContain('header.topbar.full-topbar');
   expect(css, path).not.toContain('.palace-top-chat-trigger');
   expect(css, path).not.toContain('.top-icon-link');
  }
 });
});
