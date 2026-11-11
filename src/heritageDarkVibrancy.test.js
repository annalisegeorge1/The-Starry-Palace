import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';

const css=readFileSync('src/heritage-dark-vibrancy.css','utf8');
const main=readFileSync('src/main.jsx','utf8');
const themeTokens=['winter','spring','carnival','lamplight','crescent','lunar','twilight','midnight','olive','river','horizon','festival','heritage','sepia','sapphire','mint','rainbow'];

function luminance(hex){
 const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+0.055)/1.055)**2.4);
 return rgb[0]*0.2126+rgb[1]*0.7152+rgb[2]*0.0722;
}
function ratio(a,b){
 const x=luminance(a),y=luminance(b);
 return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05);
}

describe('vivid event cards in the dark Palace themes',()=>{
 it('only targets Heritage card artwork in Nightfall and Midnight',()=>{
  expect(css).toContain('.palace-shell.full-palace-shell:is(.nightfall,.midnight)');
  expect(css).toContain('#palace-content[data-palace-route^="/events"]');
  expect(css).toContain('.heritage-grid.enriched .heritage-card');
  expect(css).toContain('--heritage-night-veil');
  expect(css).not.toContain('.palace-calendar-days>button');
  expect(css).not.toContain('.calendar-kind-dots');
 });
 it('gives every heritage theme an opaque, distinct and saturated gradient',()=>{
  for(const name of themeTokens)expect(css).toContain('.heritage-card.heritage-theme-'+name);
  const gradientDeclarations=[...css.matchAll(/--holiday-wash:linear-gradient\\([\\s\\S]*?\\);/g)].map(m=>m[0]);
  expect(gradientDeclarations).toHaveLength(themeTokens.length);
  expect(new Set(gradientDeclarations).size).toBe(themeTokens.length);
  // With nearly-white body copy, even the brightest gradient stop must meet WCAG AA.
  for(const declaration of gradientDeclarations) {
   const stops=[...declaration.matchAll(/#[0-9a-f]{6}/gi)].map(m=>m[0]);
   expect(stops.length).toBeGreaterThanOrEqual(3);
   for(const background of stops)expect(ratio('#fff9ff',background)).toBeGreaterThanOrEqual(4.5);
  }
 });
 it('keeps Midnight darker without desaturating its event cards',()=>{
  expect(css).toContain('.palace-shell.full-palace-shell.midnight');
  expect(css).toContain('rgba(4,4,8,.18)');
  expect(css).toContain('background-image:var(--heritage-night-veil),var(--holiday-wash)!important;');
  expect(css).toContain('filter:none!important;');
 });
 it('loads last so older dark chrome styles cannot wash out event cards',()=>{
  expect(main.indexOf("import './heritage-dark-vibrancy.css'")).toBeGreaterThan(main.indexOf("import './heritage-festival-pink-gold.css'"));
  expect(main.indexOf("import './heritage-dark-vibrancy.css'")).toBeGreaterThan(main.indexOf("import './palace-dark-theme-priority.css'"));
  expect(main.indexOf("import './heritage-dark-vibrancy.css'")).toBeGreaterThan(main.indexOf("import './daybreak-events-desktop-polish.css'"));
 });
 it('preserves coloured festival calendar dots and actual observance data',()=>{
  expect(css).not.toContain('dot-festival');
  expect(css).not.toContain('legend-festival');
  expect(css).not.toContain('data-day-index');
  expect(css).toContain('.heritage-card > button');
 });
});
