import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {directClassicHref,canReadHostedClassic} from './directClassicModel';
import {shouldShowPalaceTidings} from './palaceTidingsModel';
const main=readFileSync('src/main.jsx','utf8');
const live=readFileSync('src/liveRooms.jsx','utf8');
const hall=readFileSync('src/ClassicsLibraryHall.jsx','utf8');
const direct=readFileSync('src/DirectClassicReader.jsx','utf8');
describe('Fast entry to Palace Classics',()=>{
 it('links hosted classic shelf cards to a dedicated book route',()=>{
  expect(directClassicHref({slug:'pride-and-prejudice'})).toBe('/classic/pride-and-prejudice');
  expect(directClassicHref({slug:'book & tea'})).toBe('/classic/book%20%26%20tea');
  expect(directClassicHref({})).toBe('/lost-works');
  expect(main).toContain('<Route path="/classic/:slug"');
  expect(live).toContain('if(w.is_archive)return directClassicHref(w);');
  expect(hall).toContain('storyHref?.(work)||directClassicHref(work)');
 });
 it('only opens reviewed full texts or hosted excerpts, not citation-only records',()=>{
  expect(canReadHostedClassic({host_mode:'full',rights_status:'public_domain_verified'})).toBe(true);
  expect(canReadHostedClassic({host_mode:'full',rights_status:'unreviewed'})).toBe(false);
  expect(canReadHostedClassic({host_mode:'citation'})).toBe(false);
  expect(canReadHostedClassic({host_mode:'excerpt',publication_status:'published'})).toBe(true);
 });
 it('uses the existing paginated reader instead of wrapping it in a modal',()=>{
  expect(direct).toContain('<ArchiveClassicReader');
  expect(direct).not.toContain('<PalaceDialog');
  expect(direct).toContain("openHostedClassic(slug)");
  expect(shouldShowPalaceTidings('/classic/jane-eyre')).toBe(false);
 });
});
describe('Smaller Palace initial download',()=>{
 it('loads specialist Palace rooms on demand, without changing their route names',()=>{
  expect(main).toContain("import('./liveRooms')");
  expect(main).toContain('function lazyPalaceRoom(name)');
  expect(main).toContain('<React.Suspense fallback={<RouteLoading/>}><Room {...props}/></React.Suspense>');
  expect(main).not.toContain("} from './liveRooms';");
  expect(main).toContain('<Frame><RouteGuard><Routes>');
 });
});
