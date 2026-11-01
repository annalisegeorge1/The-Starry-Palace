import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const profile=readFileSync('src/liveRooms.jsx','utf8');
const showcase=readFileSync('src/MemberPalaceShowcase.jsx','utf8');
const css=readFileSync('src/member-profile-mobile-refinement.css','utf8');
const entry=readFileSync('src/main.jsx','utf8');
const member=profile.slice(profile.indexOf('export function MemberProfileLive'),profile.indexOf('\nexport function ',profile.indexOf('export function MemberProfileLive')+30));

describe('Member profile remains artwork-rich and usable on mobile',()=>{
 it('preserves all six profile stats while laying them out in three columns',()=>{
  for(const label of ['FOLLOWERS','STORIES','COMICS','SERIES','CLUBS','DISPLAYED HONOURS']){
   expect(member).toContain('<span>'+label+'</span>');
  }
  expect(css).toContain('grid-template-columns:repeat(3,minmax(0,1fr))!important');
  expect(css).toContain('.legacy-profile-stats>div:after');
 });
 it('preserves four real honours with a single compact row',()=>{
  expect(showcase).toContain("['heart','♥','Hearts'");
  expect(showcase).toContain("['star','✦','Stars'");
  expect(showcase).toContain("['moon','☾','Moons'");
  expect(showcase).toContain("['crown','♛','Crowns'");
  expect(showcase).toContain('identity?.honours?.[key]');
  expect(css).toContain('grid-template-columns:repeat(4,minmax(0,1fr))!important');
 });
 it('keeps reading controls and true story covers while moving rating out of a blank cover column',()=>{
  expect(showcase).toContain('onChange={toggle}');
  expect(member).toContain("w.cover_url&&<div className=\"chamber-story-cover\"");
  expect(member).toContain('<StoryRatingBadge rating={w.rating}/>');
  expect(member).toContain('className="chamber-story-rating palace-rating-anchor"');
  expect(member).toContain('className="chamber-story-enter"');
  expect(css).toContain('>.palace-story-rating');
 });
 it('keeps notes composition but no redundant empty-state box',()=>{
  expect(member).toContain('className="chamber-post-compose"');
  expect(member).toContain('posts.map(post=>');
  expect(member).not.toContain('No chamber notes yet.');
 });
 it('preserves artwork and practical arrangement controls with safe navigation clearance',()=>{
  expect(member).toContain('<PalaceBadge family={x.achievement_families} tier={x.display_tier}/>');
  expect(member).toContain('<PalaceGift gift={x.virtual_gifts} tier={x.display_tier}/>');
  expect(member).toContain('moveChamberArt("achievement"');
  expect(member).toContain('moveChamberArt("gift"');
  expect(css).toContain('min-width:44px!important;height:44px!important;min-height:44px!important');
  expect(css).toContain('padding-bottom:max(172px,calc(152px + env(safe-area-inset-bottom,0px)))!important');
  expect(css).toContain('mask-image:linear-gradient(to right');
  expect(entry).toContain("import './member-profile-mobile-refinement.css';");
 });
});
