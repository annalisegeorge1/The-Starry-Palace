import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const live=readFileSync(resolve(process.cwd(),'src/liveRooms.jsx'),'utf8');
const main=readFileSync(resolve(process.cwd(),'src/main.jsx'),'utf8');
const css=readFileSync(resolve(process.cwd(),'src/palace-creative-flow.css'),'utf8');

describe('work settings and reader note visual flow',()=>{
 it('keeps multiple tag additions within work settings with useful feedback',()=>{
  expect(live).toContain('const[tagBusy,setTagBusy]=useState(false)');
  expect(live).toContain('const availableTagOptions=tagOptions.filter(');
  expect(live).toContain('aria-label="Search work tags"');
  expect(live).toContain('aria-label="Tag family"');
  expect(live).toContain('disabled={tagBusy} onClick={()=>attachTagToWork(t)}');
  expect(live).toContain('No more matching tags in this family.');
  expect(live).toContain('finally{setTagBusy(false)}');
 });
 it('loads creative styles last without changing core manuscript logic',()=>{
  expect(main.indexOf("import './palace-creative-flow.css';")).toBeGreaterThan(main.indexOf("import './palace-build-safety.css';"));
  expect(css).toContain('.palace-shell .studio-tag-results');
  expect(css).toContain('.palace-shell .reader-notes-panel');
  expect(css).toContain('.palace-shell.daylight');
  expect(css).toContain('@media(max-width:650px)');
  expect(css).toContain('prefers-reduced-motion:reduce');
 });
});
