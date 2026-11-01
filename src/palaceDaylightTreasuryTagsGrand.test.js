import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
const css=readFileSync('src/palace-daylight-treasury-tags-grand-finish.css','utf8');
const main=readFileSync('src/main.jsx','utf8');
const tagWorld=readFileSync('src/PalaceTagWorld.jsx','utf8');
const hall=readFileSync('src/GrandPalaceHall.jsx','utf8');
const rooms=readFileSync('src/liveRooms.jsx','utf8');
function lum(hex){
 const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255)
  .map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
 return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];
}
function contrast(a,b){const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
describe('Daylight contrast on Treasury, tag filters and Grand Palaces',()=>{
 it('keeps the original artist/reader/writer court and dark celestial hero readable',()=>{
  expect(rooms).toContain('Twenty stars. Countless stories.');
  expect(rooms).toContain("['writers','Writers'],['readers','Readers'],['artists','Artists']");
  expect(css).toContain('.legacy-ranking-room .ranking-cosmos');
  expect(css).toContain('.ranking-cosmos p:not(.eyebrow)');
  expect(css).toContain('overflow-x:auto!important');
  expect(css).toContain('.ranking-controls::after');
  for(const ink of ['#ffffff','#ede9fa','#f1edfa'])expect(contrast(ink,'#232847')).toBeGreaterThan(4.5);
 });
 it('separates enabled actions from genuinely disabled Honour Exchange purchases',()=>{
  expect(hall).toContain('Number(data.balance||0)<item.price');
  expect(hall).toContain('Buy to give');
  expect(css).toContain('.grand-token button:not(:disabled)');
  expect(css).toContain('.grand-token button:disabled');
  expect(css).toContain('cursor:not-allowed!important');
  expect(contrast('#ffffff','#5b437f')).toBeGreaterThan(4.5);
  expect(contrast('#435065','#e7e8ee')).toBeGreaterThan(4.5);
 });
 it('keeps usable tag include/exclude buttons and clear search fields',()=>{
  expect(tagWorld).toContain('aria-pressed={extraInclude.includes(item.id)}');
  expect(tagWorld).toContain('aria-pressed={extraExclude.includes(item.id)}');
  expect(css).toContain('.tag-world-suggestion button[aria-pressed="true"]');
  expect(css).toContain('.tag-pick-tools .tag-pick-exclude[aria-pressed="true"]');
  expect(css).toContain('.grand-exhibit-search input');
  expect(css).toContain('.treasury-gallery input[type="search"]');
 });
 it('prevents leaderboard rank overflow and preserves Palace banner artwork',()=>{
  expect(hall).toContain('className="grand-place"');
  expect(css).toContain('grid-template-columns:40px 36px minmax(0,1fr) minmax(50px,auto)!important');
  expect(css).toContain('font-variant-numeric:tabular-nums!important');
  expect(css).toContain('.grand-atlas-choice em');
  expect(css).toContain('color:#493761!important');
  expect(css).not.toContain('.grand-atlas-choice img');
 });
 it('loads this Daylight-only sheet last, with mobile dock clearance',()=>{
  expect(main.lastIndexOf("import './palace-daylight-treasury-tags-grand-finish.css'"))
    .toBeGreaterThan(main.lastIndexOf("import './grand-palace-daylight-card-contrast.css'"));
  expect(css).toContain('padding-bottom:calc(190px + env(safe-area-inset-bottom,0px))!important');
  expect(css).toContain('.palace-mobile-end-spacer');
  expect(css).not.toContain('.nightfall');
 });
});
