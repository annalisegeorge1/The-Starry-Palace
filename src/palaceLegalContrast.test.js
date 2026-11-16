import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';

const css=readFileSync('src/palace-legal-pages.css','utf8');
const source=readFileSync('src/main.jsx','utf8');
const selectorFor={
 nightfall:'.palace-legal-shell',
 daylight:'.palace-shell.full-palace-shell.daylight .palace-legal-shell',
 midnight:'.palace-shell.full-palace-shell.midnight .palace-legal-shell',
};

function themeColors(selector){
 const start=css.indexOf(selector+'{');
 expect(start).toBeGreaterThanOrEqual(0);
 const section=css.slice(start,css.indexOf('}',start));
 return Object.fromEntries([...section.matchAll(/--legal-([a-z-]+):\s*(#[a-fA-F0-9]{6});/g)]
  .map(([,name,color])=>[name,color.toLowerCase()]));
}
function luminance(hex){
 const rgb=[0,2,4].map(i=>parseInt(hex.slice(i+1,i+3),16)/255)
  .map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);
 return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;
}
function contrast(foreground,background){
 const x=luminance(foreground),y=luminance(background);
 return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}

describe('Legal policy readability across the three Palace themes',()=>{
 it('uses dedicated surfaces and colors rather than mixing global --text and --card',()=>{
  expect(css).toContain('background:var(--legal-surface);color:var(--legal-ink)');
  expect(css).toContain('background:var(--legal-nav-surface);color:var(--legal-ink)');
  expect(css).toContain('color:var(--legal-link)');
  expect(css).toContain('color:var(--legal-selected-ink)');
  expect(css).toContain('background:var(--legal-selected)');
  expect(css).not.toContain('background:var(--card,');
  expect(source).toContain("className={\"palace-shell full-palace-shell \"");
 });
 it.each(Object.keys(selectorFor))('%s text, navigation, link and current-tab contrast meets WCAG AA',theme=>{
  const colors={...themeColors(selectorFor.nightfall),...themeColors(selectorFor[theme])};
  for(const [ink,paper] of [
   ['ink','surface'],['muted','surface'],['muted','nav-surface'],
   ['link','surface'],['selected-ink','selected'],
  ]){
   expect(contrast(colors[ink],colors[paper]),theme+' '+ink+' on '+paper).toBeGreaterThanOrEqual(4.5);
  }
 });
 it('keeps the policy navigation usable on phones and clear of the mobile dock',()=>{
  expect(css).toContain('grid-template-columns:repeat(2,minmax(0,1fr))');
  expect(css).toContain('min-height:44px');
  expect(css).toContain('padding-bottom:calc(148px + env(safe-area-inset-bottom,0px))');
  expect(css).toContain('.palace-legal-nav a:focus-visible');
 });
});
