import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const main=readFileSync(resolve(process.cwd(),'src/main.jsx'),'utf8');

describe('careful route loading for the Palace',()=>{
 it('keeps the main library, reading and writing rooms eager for navigation stability',()=>{
  expect(main).toContain("} from './liveRooms';");
  expect(main).not.toContain("import('./liveRooms')");
  expect(main).toContain('<ReadingLive Frame={Frame}/>');
  expect(main).toContain('<WritingLive Frame={Frame}/>');
  expect(main).toContain('<WorkStudioLive Frame={Frame}/>');
 });
 it('defers the optional Grand Palace, Council and tester destinations',()=>{
  for(const name of ['GrandPalaceHall','PalaceGovernance','PalaceBetaGuide']){
   expect(main).toContain("const "+name+"=React.lazy(()=>importWithRecovery(()=>import('./"+name+"')))");
   expect(main).not.toContain("import "+name+" from './"+name+"';");
   expect(main).toContain('<React.Suspense fallback={<RouteLoading/>}><'+name+' Frame={Frame}/></React.Suspense>');
  }
 });
 it('retains a visible recovery path if a deferred screen takes too long',()=>{
  expect(main).toContain('ROOM_IMPORT_TIMEOUT_MS=12000');
  expect(main).toContain('function RouteLoading()');
  expect(main).toContain("new Error('Palace room load timeout')");
  expect(main).toContain('function reloadForStaleChunk(error)');
  expect(main).toContain('RouteErrorBoundary');
 });
});
