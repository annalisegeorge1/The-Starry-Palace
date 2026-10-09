import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const read=(file)=>readFileSync(resolve(process.cwd(),file),'utf8');
const rooms=read('src/liveRooms.jsx');
const data=read('src/palaceData.js');
const styles=read('src/chamber-creative-shelf-polish.css');
const main=read('src/main.jsx');
const profileData=data.slice(data.indexOf('export async function getMemberProfile('),data.indexOf('export async function setFollow('));
const chamber=rooms.slice(rooms.indexOf('export function MemberProfileLive('),rooms.indexOf('export function ',rooms.indexOf('export function MemberProfileLive(')+30));

describe('Member Chamber visual polish and truthful discovery',()=>{
 it('uses only real author uploads as cover imagery and a decorative fallback',()=>{
  expect(chamber).toContain('className="chamber-story-card"');
  expect(chamber).toContain('className="chamber-story-cover palace-rating-anchor"');
  expect(chamber).toContain('<StoryRatingBadge rating={w.rating}/>');
  expect(chamber).toContain('w.cover_url?<img src={w.cover_url} alt="" loading="lazy" decoding="async"/>');
  expect(styles).toContain('object-fit:contain;');
  expect(styles).not.toContain('aspect-ratio:');
  expect(styles).not.toContain('background-image:');
 });
 it('describes the true preview scope and makes empty searches recoverable',()=>{
  expect(profileData).toContain(".limit(12)");
  expect(chamber).toContain("search filters only these previews");
  expect(chamber).toContain('matchesChamberPreview(x,creatorQuery)');
  expect(chamber).toContain('chamberPreviewCount({shown:visibleStories.length');
  expect(chamber).toContain('type="search" maxLength={120}');
  expect(chamber).toContain('chamber-shelf-no-matches');
  expect(chamber).toContain('No matches among the newest titles.');
  expect(chamber).toContain("onClick={()=>setCreatorQuery('')}");
  expect(chamber).toContain('!creatorQuery.trim()||visibleSeries.length>0');
  expect(chamber).toContain('<Link to="/reading">Explore Reading Rooms →</Link>');
 });
 it('keeps private series off guest/other-member profile shelves, including their counts',()=>{
  expect(profileData).toContain("const seriesVisibilities=own?['public','members','private']:viewerId?['public','members']:['public'];");
  expect((profileData.match(/\.in\('visibility',seriesVisibilities\)/g)||[])).toHaveLength(2);
  expect(chamber).toContain("series.visibility==='private'?' · Private'");
  expect(chamber).toContain("series.visibility==='members'?' · Members only'");
 });
 it('keeps gallery art and existing reward interactions while polishing controls',()=>{
  expect(chamber).toContain('className="chamber-atelier-art-stage"><PalaceBadge');
  expect(chamber).toContain('className="chamber-atelier-art-stage"><PalaceGift');
  expect(chamber).toContain('moveChamberArt("achievement"');
  expect(chamber).toContain('moveChamberArt("gift"');
  expect(styles).toContain('.chamber-atelier-gallery .chamber-atelier-gallery-filters');
  expect(styles).toContain('flex-wrap:wrap!important;');
  expect(styles).toContain('min-height:44px!important;');
  expect(styles).toContain('button:focus-visible');
 });
 it('brings story, comics, series and search controls into the same responsive language',()=>{
  expect(styles).toContain('.creator-worlds-room .creator-work-grid>article.chamber-story-card');
  expect(styles).toContain('@media(max-width:760px)');
  expect(styles).toContain('@media(max-width:420px)');
  expect(styles).toContain('grid-template-columns:repeat(2,minmax(0,1fr))!important;');
  expect(styles).toContain('.palace-shell.daylight');
  expect(styles).toContain('@media(prefers-reduced-motion:reduce)');
  expect(main).toContain("import './chamber-creative-shelf-polish.css';");
  expect(main.indexOf("import './chamber-creative-shelf-polish.css';")).toBeGreaterThan(main.indexOf("import './profile-grid-restoration.css';"));
 });
});
