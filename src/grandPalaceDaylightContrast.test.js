import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
const css=readFileSync('src/grand-palace-daylight-card-contrast.css','utf8');
const welcome=readFileSync('src/GrandPalaceWelcome.jsx','utf8');
const main=readFileSync('src/main.jsx','utf8');
function relativeLuminance(hex){
 const parts=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
 const linear=parts.map(v=>v<=0.04045?v/12.92:Math.pow((v+0.055)/1.055,2.4));
 return .2126*linear[0]+.7152*linear[1]+.0722*linear[2];
}
const contrast=(a,b)=>{const x=relativeLuminance(a),y=relativeLuminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
describe('Grand Palace Daylight four-room card contrast',()=>{
 it('keeps the four original court destinations and their signed-in navigation',()=>{
  for(const name of ['Explore the Courts','Make Something','Find Your People','Visit the Treasury'])expect(welcome).toContain(name);
  expect(welcome).toContain('onNavigate(item.key)');
  expect(welcome).toContain('className={\'grand-path grand-path-\'+item.key}');
  expect(welcome).toContain('YOUR COURT\'S PLACEMENT');
  expect(welcome).toContain('YOUR QUARTERLY CONTRIBUTION');
  expect(welcome).toContain('TIME TO WRITE HISTORY');
 });
 it('protects bright ink on dark gradient destinations and readable labels on white banners',()=>{
  expect(css).toContain('grand-path-description');
  expect(css).toContain('grand-path-foot');
  expect(css).toContain('color:#fff!important');
  expect(css).toContain('color:#f1edfa!important');
  expect(css).toContain('color:#e7f0ff!important');
  // Keep the palette dark enough for the selected light text at its solid stops.
  for(const ink of ['#ffffff','#f1edfa','#e7f0ff'])expect(contrast(ink,'#2d347c')).toBeGreaterThanOrEqual(5);
  expect(contrast('#594e70','#ffffff')).toBeGreaterThanOrEqual(4.5);
  expect(css).toContain('box-shadow:0 4px 12px rgba(35,41,75,.07)!important');
 });
 it('applies the patch after shared Daylight CSS and clears the fixed dock',()=>{
  expect(main.lastIndexOf("import './grand-palace-daylight-card-contrast.css'"))
   .toBeGreaterThan(main.lastIndexOf("import './palace-daylight-life-commons-clarity.css'"));
  expect(css).toContain('[data-palace-route^="/grand-palaces"]');
  expect(css).toContain('padding-bottom:calc(200px + env(safe-area-inset-bottom,0px))!important');
  expect(css).toContain('header.topbar.full-topbar::before');
  expect(css).not.toContain('padding-bottom:calc(120px + env(safe-area-inset-bottom,0px))');
  expect(css).not.toContain('.nightfall');
 });
});
