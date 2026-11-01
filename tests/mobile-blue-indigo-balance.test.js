import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const css=readFileSync('src/palace-mobile-blue-indigo-balance.css','utf8');
const main=readFileSync('src/main.jsx','utf8');

function luminance(hex){
 const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
 const [r,g,b]=rgb.map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
 return r*.2126+g*.7152+b*.0722;
}
function contrast(a,b){
 const x=luminance(a),y=luminance(b);
 return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}
describe('mobile blue/indigo theme parity',()=>{
 it('loads last, after existing accessibility and dock/header fixes',()=>{
  expect(main).toContain("import './palace-mobile-blue-indigo-balance.css'");
  expect(main.lastIndexOf("import './palace-mobile-blue-indigo-balance.css'"))
   .toBeGreaterThan(main.lastIndexOf("import './palace-daylight-library-council-fix.css'"));
  expect(main.lastIndexOf("import './palace-mobile-blue-indigo-balance.css'"))
   .toBeGreaterThan(main.lastIndexOf("import './mobile-global-shell-palace-polish.css'"));
 });
 it('limits palette changes to phone layouts and keeps desktop/tablet colour stable',()=>{
  expect(css).toContain('@media (max-width:720px), (max-width:950px) and (max-height:600px) and (pointer:coarse)');
  expect(css).toContain('.palace-shell.full-palace-shell.nightfall');
  expect(css).toContain('.palace-shell.full-palace-shell.daylight');
  expect(css).toContain('--lustre-card:');
  expect(css).toContain('--palace-glass-panel:');
  expect(css).not.toMatch(/(?:^|\n)\s*img\s*\{/);
  expect(css).not.toContain('.chamber-atelier');
  expect(css).not.toContain('.top-icon-link');
  expect(css).not.toContain('.palace-chat-open');
 });
 it('keeps the top header opaque and mobile navigation tokens blue-toned',()=>{
  expect(css).toContain('.full-stage>header.topbar.full-topbar::before');
  expect(css).toContain('background:#f4f7fd!important');
  expect(css).toContain('--palace-chrome-panel:rgba(15,27,48,.98)');
  expect(css).toContain('--palace-chrome-panel:rgba(247,250,254,.99)');
  expect(css).toContain('--palace-unified-action-gradient:');
 });
 it('uses readable white-on-blue action stops in Nightfall',()=>{
  for(const blue of ['#455b8c','#356b92','#2d7180']){
   expect(contrast('#ffffff',blue)).toBeGreaterThanOrEqual(4.5);
  }
 });
 it('does not override artwork, writer pages, controls or content routes',()=>{
  expect(css).not.toContain('background-attachment:fixed');
  expect(css).not.toContain('filter:');
  expect(css).not.toContain('stroke:');
  expect(css).not.toContain('z-index:');
  expect(css).not.toContain('padding-bottom:');
  expect(css).not.toContain('[data-palace-route');
 });
});
