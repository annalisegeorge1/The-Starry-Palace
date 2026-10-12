import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(path,'utf8');
const data=read('src/palaceData.js');
const main=read('src/main.jsx');
const css=read('src/palace-cohesive-experience.css');
const reading=data.slice(data.indexOf('export async function getPublishedWorks('),data.indexOf('export async function getPublicWorkBookmarkCount('));
describe('Public Reading Room speed without less reliable navigation',()=>{
 it('loads optional stats and author badges in parallel and tolerates independently failing enhancements',()=>{
  expect(reading).toContain('Promise.allSettled([');
   expect(reading).toContain('.range(start,start+size-1)');
  expect(reading).toContain('getIdentityMarks(rows.map(x=>x.author_id))');
  expect(reading).toContain("marksResult.status==='fulfilled'?marksResult.value:{}");
  expect(reading).toContain('counts.every(result=>result.status');
  expect(reading).toContain("return rows.map(x=>({...x,profiles:withIdentity(x.profiles,x.author_id,marks),reading_stats:stats[x.id]||null}))");
  expect(reading).not.toContain('await getIdentityMarks(rows.map');
 });
 it('retains eager, reliable core routes and protected writer reload flows',()=>{
  expect(main).toContain("} from './liveRooms';");
  expect(main).toContain('shouldOfferManualPalaceRefresh(location.pathname)');
  expect(main).toContain("window.addEventListener('vite:preloadError'");
 });
 it('avoids frequent repeated build checks but keeps recovery active',()=>{
  expect(main).toContain('if(Date.now()-last<90000)return;');
  expect(main).toContain('window.setInterval(check,180000)');
  expect(main).toContain('setUpdateAvailable(true)');
 });
 it('decodes decorative artwork asynchronously and gives mobile cards room to wrap',()=>{
  expect(main).toContain('aria-hidden="true" loading="lazy" decoding="async"');
  expect(read('src/PalaceHomeHub.jsx')).toContain('src="/assets/palace/palace-belonging.gif" alt="" decoding="async"');
  expect(css).toContain('@media(max-width:600px)');
  expect(css).toContain('.palace-main-stage .palace-home-more>summary');
  expect(css).toContain('overflow-wrap:anywhere');
 });
});
