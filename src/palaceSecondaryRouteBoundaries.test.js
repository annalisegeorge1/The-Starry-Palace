import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(path,'utf8');
const main=read('src/main.jsx');
const live=read('src/liveRooms.jsx');
const code=read('src/PalaceCodeRoom.jsx');
const lost=read('src/PalaceLostWorksRoom.jsx');

describe('Isolated Palace secondary route boundaries',()=>{
 it('keeps public policy and archive rooms out of the giant eager room module',()=>{
  expect(live).not.toContain('export function CodeLive(');
  expect(live).not.toContain('export function LostWorksLive(');
  expect(code).toContain('export default CodeLive');
  expect(lost).toContain('export default LostWorksLive');
 });
 it('loads those public rooms only when their routes are visited and uses stale-chunk recovery',()=>{
  expect(main).toContain("importWithRecovery(()=>import('./PalaceCodeRoom'))");
  expect(main).toContain("importWithRecovery(()=>import('./PalaceLostWorksRoom'))");
  expect(main).toContain('<Route path="/code" element={<React.Suspense fallback={<RouteLoading/>}><PalaceCodeRoom Frame={Frame}/></React.Suspense>}/>');
  expect(main).toContain('<Route path="/lost-works" element={<React.Suspense fallback={<RouteLoading/>}><PalaceLostWorksRoom Frame={Frame}/></React.Suspense>}/>');
  const eager=main.split("} from './liveRooms';")[0];
  expect(eager).not.toMatch(/\bCodeLive\b/);
  expect(eager).not.toMatch(/\bLostWorksLive\b/);
 });
 it('preserves creator and archival safety through the extraction',()=>{
  expect(code).toContain('Publishing in the Palace does not transfer ownership');
  expect(code).toContain('A report is an allegation');
  expect(lost).toContain("['full','excerpt'].includes(r.host_mode)");
  expect(lost).toContain("r.host_mode==='citation'");
  expect(lost).toContain('setArchiveRecordSaved');
  expect(lost).toContain('<ArchiveClassicReader');
 });
});
