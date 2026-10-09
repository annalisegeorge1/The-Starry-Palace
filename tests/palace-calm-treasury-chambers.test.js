import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const live=readFileSync(resolve(process.cwd(),'src/liveRooms.jsx'),'utf8');
const shell=readFileSync(resolve(process.cwd(),'src/main.jsx'),'utf8');
const css=readFileSync(resolve(process.cwd(),'src/palace-calm-treasury-chambers.css'),'utf8');
function room(start,end){
 const a=live.indexOf(start),b=live.indexOf(end,a+start.length);
 expect(a).toBeGreaterThan(-1);expect(b).toBeGreaterThan(a);
 return live.slice(a,b);
}
const treasury=room('export function TreasuryLive({Frame})','export function LostWorksLive({Frame})');
const start=live.indexOf('export function MemberProfileLive({Frame})');
expect(start).toBeGreaterThan(-1);
const end=live.indexOf('\nexport function ',start+30);
const chamber=live.slice(start,end<0?undefined:end);

describe('calm Treasury and member Chambers preserve all original features',()=>{
 it('retains all five Treasury tabs, full catalogue and wearable artwork',()=>{
  for(const feature of ["tab==='achievements'","tab==='titles'","tab==='gifts'",
   "tab==='draw'","tab==='rankings'",'/treasury/catalogue',
   'treasury-wardrobe-grid','wearAchievementValue','wearGiftValue',
   'treasury-celestial-chamber','lucky-draw-room','legacy-ranking-room',
   'PalaceBadge family=','PalaceGift gift='])expect(treasury).toContain(feature);
 });
 it('shows a small collection first, with a reversible accessible path to every owned item',()=>{
  expect(treasury).toContain("data.achievements.slice(0,8)");
  expect(treasury).toContain("data.gifts.slice(0,8)");
  expect(treasury).toContain("allBadgesVisible?data.achievements");
  expect(treasury).toContain("allGiftsVisible?data.gifts");
  expect(treasury).toContain('aria-expanded={allBadgesVisible}');
  expect(treasury).toContain('aria-expanded={allGiftsVisible}');
  expect(treasury).toContain("See all '+data.achievements.length+' achievements");
  expect(treasury).toContain("See all '+data.gifts.length+' treasures");
 });
 it('preserves the wardrobe and overview behind native expandable controls',()=>{
  expect(treasury).toContain('className="palace-calm-treasury-overview"');
  expect(treasury).toContain('className="palace-calm-wardrobe"');
  expect(treasury).toContain('aria-label="What I am wearing around the Palace"');
  expect(treasury).toContain("data?.achievementShowcase.length");
 });
 it('preserves profile identity, writing, gallery, colour studio and visitor boundaries',()=>{
  for(const feature of ['legacy-profile-cover','legacy-profile-actions',
   'chamber-worlds','chamber-creator-overview','chamber-posts-room',
   'chamber-honour-groups','PalaceBadge family=','PalaceGift gift=',
   'MemberChamberDecor decor={decor}','submitMemberReport','toggleBoundary',
   'openEdit','saveEdit','updateMyProfile','moveChamberArt'
  ])expect(chamber).toContain(feature);
  expect(chamber).toContain('palace-calm-chamber-studio');
  expect(chamber).toContain('palace-calm-profile-stats');
  expect(chamber).toContain('palace-calm-member-gallery');
  expect(chamber).toContain('document.getElementById("chamber-honours")');
  expect(chamber).toContain('window.location.hash==="#chamber-honours"');
 });
 it('groups advanced edit options but retains privacy and correspondence controls',()=>{
  for(const feature of ['palace-calm-edit-advanced','featured_fandoms','message_policy',
    'support_url','visibility','cover_position','Chamber accent',
    'Creator roles','Palace Letters'])expect(chamber).toContain(feature);
 });
 it('preserves daylight contrast, small-screen layouts and keyboard focus',()=>{
  expect(shell).toContain("import './palace-calm-treasury-chambers.css'");
  expect(css).toContain('.palace-shell.daylight');
  expect(css).toContain('max-width:650px');
  expect(css).toContain(':focus-visible');
  expect(css).toContain('.palace-calm-member-gallery');
 });
});
