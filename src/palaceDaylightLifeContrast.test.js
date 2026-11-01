import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
const css=readFileSync('src/palace-daylight-life-commons-clarity.css','utf8');
const jsx=readFileSync('src/liveRooms.jsx','utf8');
const main=readFileSync('src/main.jsx','utf8');
const light=hex=>{const v=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return .2126*v[0]+.7152*v[1]+.0722*v[2]};
const ratio=(fg,bg)=>{const [a,b]=[light(fg),light(bg)].sort((x,y)=>y-x);return (a+.05)/(b+.05)};
describe('Daylight Writing and Palace Life refinement',()=>{
 it('uses readable slate/ink on paper and white on deep-violet actions',()=>{
  for(const ink of ['#20283b','#475569','#536076','#465369','#4c586b','#46526a','#302747']){
   expect(ratio(ink,'#ffffff')).toBeGreaterThanOrEqual(4.5);
  }
  expect(ratio('#ffffff','#604a88')).toBeGreaterThanOrEqual(4.5);
  expect(ratio('#ffffff','#635084')).toBeGreaterThanOrEqual(4.5);
 });
 it('keeps Commons view navigation scrollable rather than four large rows',()=>{
  expect(css).toContain('.commons-lens .commons-view-buttons');
  expect(css).toContain('flex-wrap:nowrap!important');
  expect(css).toContain('overflow-x:auto!important');
  expect(css).toContain('border-radius:999px!important');
  expect(jsx).toContain('aria-label="Commons feed view"');
  expect(jsx).toContain("['all','Palace'],['following','Following'],['saved','Saved'],['mine','Mine']");
 });
 it('uses a clean vector search icon and actually loads the final stylesheet',()=>{
  expect(jsx).toContain('className="commons-search-icon"');
  expect(jsx).toContain('Search Commons conversations');
  expect(jsx).toContain('Search Forum conversations');
  expect(main.lastIndexOf("import './palace-daylight-life-commons-clarity.css'"))
   .toBeGreaterThan(main.lastIndexOf("import './palace-daylight-contrast-depth.css'"));
  expect(css).toContain('.palace-mobile-end-spacer');
  expect(css).not.toContain('.nightfall');
 });
});
