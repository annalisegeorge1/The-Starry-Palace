import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const read=(path)=>readFileSync(resolve(process.cwd(),path),'utf8');
const live=read('src/liveRooms.jsx');
const sql=read('database/member-chamber-decoration-and-arrangement.sql');
const css=read('src/chamber-creative-shelf-polish.css');
const start=live.indexOf('<details id="chamber-honours"');
const end=live.indexOf('<section id="chamber-worlds"',start);
if(start<0||end<start)throw new Error('Member Gallery must remain linked to its section and contain its original actions.');
const gallery=live.slice(start,end);

describe('Accessible member Gallery arrangement',()=>{
 it('retains both collections and their original backend actions',()=>{
  expect(gallery).toContain('<PalaceBadge family={x.achievement_families}');
  expect(gallery).toContain('<PalaceGift gift={x.virtual_gifts}');
  for(const collection of ['achievement','gift']){
   for(const action of ['up','down','feature']){
    expect(gallery).toContain('moveChamberArt("'+collection+'"');
    expect(sql).toContain("'"+action+"'");
   }
  }
 });
 it('names the individual art in screen-reader controls rather than repeating generic labels',()=>{
  expect(gallery).toContain('className="chamber-art-arrange" role="group" aria-label=');
  expect(gallery).toContain('aria-label={"Move "+(x.achievement_families?.name');
  expect(gallery).toContain('aria-label={"Feature "+(x.achievement_families?.name');
  expect(gallery).toContain('aria-label={"Move "+(x.virtual_gifts?.name');
  expect(gallery).toContain('aria-label={"Feature "+(x.virtual_gifts?.name');
  expect(gallery).not.toContain('aria-label="Move achievement earlier"');
  expect(gallery).not.toContain('aria-label="Move treasure earlier"');
 });
 it('does not send impossible move-later requests from the final piece',()=>{
  expect(gallery).toContain("Number(data.showcase.achievements.at(-1)?.position)");
  expect(gallery).toContain("Number(data.showcase.gifts.at(-1)?.position)");
  expect(gallery).toContain('disabled={arrangeBusy||Number(x.position)===1}');
  expect(gallery).toContain('aria-busy={arrangeBusy}');
 });
 it('keeps full-size finger targets without distorting watercolour art',()=>{
  expect(css).toContain('.chamber-atelier-gallery .chamber-art-arrange button{');
  expect(css).toContain('min-height:44px;');
  expect(css).toContain('.chamber-art-arrange button:focus-visible');
  expect(css).not.toContain('aspect-ratio:');
 });
});
