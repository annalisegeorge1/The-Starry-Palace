import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const app=readFileSync(resolve(process.cwd(),'src/main.jsx'),'utf8');
const base=readFileSync(resolve(process.cwd(),'src/palace-next.css'),'utf8');
const layout=readFileSync(resolve(process.cwd(),'src/mobile-profile-writer-layout.css'),'utf8');
const notice=readFileSync(resolve(process.cwd(),'src/palace-build-safety.css'),'utf8');
const rooms=readFileSync(resolve(process.cwd(),'src/liveRooms.jsx'),'utf8');

describe('Writing Chamber uses the current drawer, not old ghost layout slots',()=>{
 it('maps the actual desktop support controls to one nested drawer',()=>{
  const desktop=base.split('/* Large desktop: centre = manuscript, right = writer utilities. */')[1]?.split('/* Mid-size/tablet:')[0]||'';
  const area=desktop.split('grid-template-areas:')[1]?.split('!important;')[0]||'';
  expect(area).toContain('"canvas view"');
  expect(area).toContain('"canvas goal"');
  expect(area).toContain('"canvas revision"');
  expect(area).not.toContain('"canvas map"');
  expect(area).not.toContain('"canvas notes"');
  expect(area).not.toContain('"canvas find"');
  expect(area).not.toContain('"canvas spell"');
  expect(desktop).toContain('.chic-editor-form>.writer-desk-drawer{grid-area:view!important;min-width:0}');
  expect(desktop).toContain('.chic-editor-form>.writer-recovery-alert{grid-area:alert;min-width:0}');
  expect(desktop).toContain('.chic-editor-form>.writer-backup-feedback{grid-area:feedback;min-width:0}');
  expect(layout).toContain('grid-area:view!important');
  expect(rooms).toContain('className="writer-desk-drawer"');
  expect(rooms).toContain('className="legacy-goal-progress"');
 });
});

describe('Nonblocking, manual Palace updates during sensitive work',()=>{
 it('keeps a real manual reload action while permitting writers to finish',()=>{
  expect(app).toContain('const [updateAvailable,setUpdateAvailable]=useState(false)');
  expect(app).toContain('const [updateSnoozed,setUpdateSnoozed]=useState(false)');
  expect(app).toContain('const offeredAssetRef=React.useRef(\'\')');
  expect(app).toContain('if(offeredAssetRef.current!==newestPath)');
  expect(app).toContain('setUpdateSnoozed(false)');
  expect(app).toContain('setUpdateSnoozed(true)');
  expect(app).toContain('Later · keep writing');
  expect(app).toContain('Review the available Palace update');
  expect(app).toContain('Finish saving your work before reloading.');
  expect(app).toContain('onClick={()=>window.location.reload()}');
  expect(app).toContain("schedulePalaceReload('palace-new-build-reload',80)");
 });
 it('allows the update to be reopened in both themes with a compact mobile position',()=>{
  expect(app).toContain('className="palace-update-peek"');
  expect(notice).toContain('.palace-update-safety .palace-update-later');
  expect(notice).toContain('.palace-update-peek');
  expect(notice).toContain('.palace-update-peek:focus-visible');
  expect(notice).toContain('.palace-shell.daylight');
  expect(notice).toContain('safe-area-inset-bottom');
  expect(notice).toContain('prefers-reduced-motion:reduce');
 });
});
