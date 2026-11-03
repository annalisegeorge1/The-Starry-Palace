import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const css=readFileSync('src/palace-events-profile-commons-refinement.css','utf8');
const main=readFileSync('src/main.jsx','utf8');
const live=readFileSync('src/liveRooms.jsx','utf8');
describe('Events, profile and Commons compact presentation',()=>{
 it('loads after the existing Palace mobile visual refinements',()=>{
  expect(main.indexOf("import './palace-events-profile-commons-refinement.css';")).toBeGreaterThan(main.indexOf("import './palace-sophistication-pass.css';"));
 });
 it('keeps calendar interactions and RSVP / reminder actions functional',()=>{
  expect(css).toContain('.event-list>article>.event-actions');
  expect(css).toContain('.event-browser-tools');
  expect(live).toContain("onClick={()=>rsvp(e.id,status)}");
  expect(live).toContain("onClick={()=>reminder(e.id,e.starts_at,e.title)}");
  expect(css).not.toContain('.palace-calendar-days>button{display:none');
 });
 it('preserves member artwork and profile shelf search while flattening ordinary story rows',()=>{
  expect(css).toContain('.creator-work-grid>.chamber-story-card');
  expect(css).toContain('.chamber-shelf-filters');
  expect(live).toContain("onChange={e=>setCreatorQuery(e.target.value)}");
  expect(live).toContain('className="chamber-story-cover"');
  expect(css).not.toContain('.chamber-story-cover{display:none');
 });
 it('styles collapsed conversation feed without modifying live threads and composer behavior',()=>{
  expect(css).toContain('.forum-ledger-thread:not(.open)');
  expect(css).toContain('.commons-compose-fold:not([open])');
  expect(live).toContain('className="commons-conversation-path"');
  expect(live).toContain('className="commons-moment-options"');
  expect(css).not.toContain('.forum-ledger-thread.open{display:none');
 });
});
