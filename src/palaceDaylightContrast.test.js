import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';

const css=readFileSync('src/palace-daylight-contrast-depth.css','utf8');
const main=readFileSync('src/main.jsx','utf8');
function luminance(hex){
 let color=hex.replace('#','');
 if(color.length===3)color=[...color].map(c=>c+c).join('');
 const rgb=[0,2,4].map(i=>parseInt(color.slice(i,i+2),16)/255)
  .map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);
 return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];
}
function contrast(foreground,background){
 const a=luminance(foreground),b=luminance(background);
 return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
}
describe('Daylight legibility and mobile shell safeguards',()=>{
 it('keeps the dedicated Daylight pass last and separate from Nightfall styling',()=>{
  expect(main).toContain("import './palace-daylight-contrast-depth.css'");
  expect(main.lastIndexOf("import './palace-daylight-contrast-depth.css'"))
   .toBeGreaterThan(main.lastIndexOf("import './palace-home-content-jewels.css'"));
  expect(css).toContain('.palace-shell.full-palace-shell.daylight');
  expect(css).not.toContain('.nightfall');
 });
 it('gives supporting copy, labels and calls to action at least WCAG AA text contrast',()=>{
  for(const ink of ['#475569','#536076','#594775','#20283b']){
   expect(contrast(ink,'#fff')).toBeGreaterThanOrEqual(4.5);
   expect(contrast(ink,'#edf0f7')).toBeGreaterThanOrEqual(4.5);
  }
  expect(contrast('#fff','#614b8c')).toBeGreaterThanOrEqual(4.5);
  expect(contrast('#fff','#69548f')).toBeGreaterThanOrEqual(4.5);
 });
 it('adds a real dock clearance and retains the deliberate jewel shapes',()=>{
  expect(css).toContain('main#palace-content');
  expect(css).toContain('padding-bottom:calc(188px + env(safe-area-inset-bottom,0px))!important');
  expect(css).toContain('.palace-mobile-end-spacer');
  expect(css).toContain('.mobile-palace-dock');
  expect(css).toContain('--dock-paper');
  expect(css).toContain('header.topbar.full-topbar::before');
  expect(css).not.toContain('content:"☾"');
 });
});
