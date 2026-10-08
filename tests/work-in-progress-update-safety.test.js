import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const main=readFileSync(resolve(process.cwd(),'src/main.jsx'),'utf8');
const style=readFileSync(resolve(process.cwd(),'src/palace-build-safety.css'),'utf8');

describe('in-progress work survives Palace deployments',()=>{
 it('checks both builds but lets members finish composing before a refresh',()=>{
  expect(main).toContain('shouldOfferManualPalaceRefresh(location.pathname)');
  expect(main).toContain('setUpdateAvailable(true)');
  expect(main).toContain("schedulePalaceReload('palace-new-build-reload',80)");
  expect(main).toContain('Finish saving your work before reloading.');
  expect(main).toContain('Reload after saving');
  expect(main).toContain('onClick={()=>window.location.reload()}');
 });
 it('does not interfere with the original stale-chunk recovery path',()=>{
  expect(main).toContain("window.addEventListener('vite:preloadError'");
  expect(main).toContain('function importWithRecovery(importer)');
  expect(main).toContain('function PalaceBuildFreshnessWatch()');
  expect(main).toContain('const [updateAvailable,setUpdateAvailable]=useState(false)');
 });
 it('keeps the notice accessible on smaller screens and both themes',()=>{
  expect(main).toContain('role="status" aria-live="polite"');
  expect(style).toContain('.palace-update-safety button:focus-visible');
  expect(style).toContain('.palace-shell.daylight');
  expect(style).toContain('safe-area-inset-bottom');
  expect(style).toContain('prefers-reduced-motion:reduce');
 });
});
