import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';

const styles=readFileSync('src/palace-navigation-jewels.css','utf8');
const main=readFileSync('src/main.jsx','utf8');

describe('mobile More Palace doors',()=>{
 it('wraps whole room names and descriptions rather than hiding them',()=>{
  const finish=styles.split('Mobile More: never hide the room names behind an ellipsis.')[1];
  expect(finish).toBeTruthy();
  expect(finish).toContain('.mobile-more-grid>a>strong,');
  expect(finish).toContain('.mobile-more-grid>a>small');
  expect(finish).toContain('white-space:normal');
  expect(finish).toContain('overflow-wrap:anywhere');
  expect(finish).toContain('text-overflow:clip');
  expect(finish).not.toContain('text-overflow:ellipsis');
 });
 it('keeps the drawer usable in short viewports with independently scrolling cards',()=>{
  expect(styles).toContain('max-height:min(76dvh,calc(100dvh - 110px),690px)');
  expect(styles).toContain('overflow-y:auto');
  expect(styles).toContain('overscroll-behavior:contain');
  expect(styles).toContain('.mobile-more-sheet>footer');
  expect(styles).toContain('flex:0 0 auto');
  expect(styles).toContain('@media(max-width:980px) and (max-height:550px)');
  expect(styles).toContain('@media(max-width:380px)');
 });
 it('retains every destination, close control, artwork and theme switch',()=>{
  const panel=main.slice(main.indexOf('id="mobile-palace-more-sheet"'),main.indexOf('function Home(){'));
  for(const path of ['/library','/events?tab=calendar','/treasury','/letters','/activity','/search','/settings']){
   expect(panel).toContain('to="'+path+'"');
  }
  expect(panel).toContain('palace-belonging.gif');
  expect(panel).toContain('aria-label="Close more Palace rooms"');
  expect(panel).toContain('Switch to Daylight');
  expect(panel).toContain('Full Palace map');
  expect(main.indexOf("import './palace-navigation-jewels.css'")).toBeGreaterThan(main.indexOf("import './polish.css'"));
 });
});
