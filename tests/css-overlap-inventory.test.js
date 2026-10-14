import {describe,it,expect} from 'vitest';
import {
 collectCssSelectors,summarizeCssOverlaps,renderCssOverlapReport,GLOBAL_STYLES
} from '../scripts/css-overlap-inventory.mjs';

describe('Read-only CSS cascade inventory',()=>{
 it('collects plain selectors and preserves distinct responsive contexts',()=>{
  const css=[
   '/* .fake{display:none} */',
   '.card { color: red; content: "{ a }"; }',
   '@media(max-width:700px){.card{color:blue}.pill:is(.one,.two),.title{color:white}}',
   '@supports(display:grid){.card{display:grid}}'
  ].join('\n');
  const entries=collectCssSelectors(css,'one.css');
  expect(entries.filter(e=>e.selector==='.card')).toHaveLength(3);
  expect(entries.some(e=>e.context==='@media(max-width:700px)'&&e.selector==='.pill:is(.one,.two)')).toBe(true);
  expect(entries.some(e=>e.selector==='.title')).toBe(true);
  expect(entries.some(e=>e.selector.includes('.fake'))).toBe(false);
  expect(entries.find(e=>e.selector==='.card').line).toBe(2);
 });
 it('does not mistake keyframe stages or string braces for ordinary selectors',()=>{
  const css='@keyframes shimmer{from{opacity:0}50%{opacity:.5}to{opacity:1}}'
   + '.message::before{content:"{";color:purple}'
   + '.message::after{content:"}";color:blue}';
  const selectors=collectCssSelectors(css,'animation.css').map(x=>x.selector);
  expect(selectors).toEqual(['.message::before','.message::after']);
 });
 it('reports candidate overlap across files without treating theme variants as safe to delete',()=>{
  const r=summarizeCssOverlaps({
   'src/style.css':'.card{color:red}@media(max-width:400px){.card{color:blue}}',
   'src/polish.css':'.card{color:green}.banner{color:purple}'
  });
  expect(r.repeatedSelectors).toBe(1);
  expect(r.crossFileSelectors).toBe(1);
  expect(r.hotspots[0]).toMatchObject({
   selector:'.card',occurrences:3,rootCount:2,
   files:['src/style.css','src/polish.css'],
   contexts:['root','@media(max-width:400px)']
  });
  const report=renderCssOverlapReport(r,1);
  expect(report).toContain('READ ONLY');
  expect(report).toContain('NOT automatically redundant');
  expect(report).toContain('.card');
 });
 it('includes all three legacy global stylesheets in its bounded inventory',()=>{
  expect(GLOBAL_STYLES).toEqual(['src/style.css','src/polish.css','src/palace-next.css']);
 });
});
