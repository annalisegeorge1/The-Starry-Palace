import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
const css=readFileSync('src/palace-daylight-library-council-fix.css','utf8');
const main=readFileSync('src/main.jsx','utf8');
const governance=readFileSync('src/PalaceGovernance.jsx','utf8');
const petitions=readFileSync('src/PalacePetitions.jsx','utf8');
const library=readFileSync('src/LibraryOverview.jsx','utf8');
const rooms=readFileSync('src/liveRooms.jsx','utf8');
function lum(hex){const a=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*a[0]+.7152*a[1]+.0722*a[2]}
function contrast(a,b){const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
describe('Daylight Library and Council contrast',()=>{
 it('protects the existing dark Library feature and Council action-card text',()=>{
  expect(library).toContain('Your place in the story');
  expect(governance).toContain('Cast your vote');
  expect(governance).toContain('Make a proposal');
  expect(css).toContain('.library-overview-feature-grid .library-overview-section');
  expect(css).toContain('.governance-entry-grid>button');
  expect(css).toContain('color:#e2e8f0!important');
  expect(contrast('#e2e8f0','#292445')).toBeGreaterThanOrEqual(4.5);
  expect(contrast('#ffffff','#25243d')).toBeGreaterThanOrEqual(4.5);
 });
 it('shows live Council and petition statistics instead of blank dark blocks',()=>{
  expect(governance).toContain('className="governance-pulse"');
  expect(petitions).toContain('className="petition-stats"');
  expect(css).toContain('.governance-pulse>div');
  expect(css).toContain('.petition-stat strong');
  expect(contrast('#475569','#ffffff')).toBeGreaterThanOrEqual(4.5);
  expect(contrast('#253047','#ffffff')).toBeGreaterThanOrEqual(4.5);
 });
 it('makes Library tabs clearly active and petitions eligibility honest',()=>{
  expect(css).toContain('.chic-library-tabs button.active');
  expect(css).toContain('background:#604780!important');
  expect(petitions).toContain('disabled={busy||!data?.my_palace_id}');
  expect(css).toContain('.petition-panel button:disabled');
  expect(css).toContain('cursor:not-allowed!important');
  expect(contrast('#ffffff','#604780')).toBeGreaterThanOrEqual(4.5);
 });
 it('improves Council queue count padding and keeps mobile dock clearance',()=>{
  expect(rooms).toContain('className="council-queue-count"');
  expect(css).toContain('padding:9px 12px!important');
  expect(css).toContain('font-size:.73rem!important');
  expect(css).toContain('padding-bottom:calc(190px + env(safe-area-inset-bottom,0px))!important');
  expect(css).toContain('.full-stage>header.topbar.full-topbar::before');
  expect(main.lastIndexOf("import './palace-daylight-library-council-fix.css'"))
   .toBeGreaterThan(main.lastIndexOf("import './palace-daylight-treasury-tags-grand-finish.css'"));
  expect(css).not.toContain('.nightfall');
 });
});