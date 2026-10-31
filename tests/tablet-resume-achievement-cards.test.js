import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(path,'utf8');
const resumeCss=read('src/palace-resume-reading.css');
const galleryCss=read('src/member-chamber-journey.css');
const resume=read('src/PalaceResumeReading.jsx');
const rooms=read('src/liveRooms.jsx');

describe('reading resume cards adapt to sidebar-constrained tablet widths',()=>{
 it('chooses track count from available space and preserves readable titles',()=>{
  expect(resumeCss).toContain('grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr))');
  expect(resumeCss).toContain('width:100%;min-width:0');
  expect(resumeCss).toContain('overflow-wrap:break-word;word-break:normal;hyphens:none');
  expect(resumeCss).not.toContain('grid-template-columns:repeat(3,minmax(0,1fr))');
 });
 it('retains private progress, correct chapter link and complete story text',()=>{
  expect(resume).toContain('visibleHomeReading(shelf,memberId)');
  expect(resume).toContain('readingReturnPath(row)');
  expect(resume).toContain('role="progressbar"');
  expect(resume).toContain('{work.title}');
  expect(resume).toContain('{resumeLabel} →');
 });
});

describe('tablet achievement honours remain readable and arrangeable',()=>{
 it('uses minimum readable widths on the actual achievement gallery',()=>{
  expect(galleryCss).toContain('.legacy-showcase-grid.achievement-grid');
  expect(galleryCss).toContain('grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr))!important');
  expect(galleryCss).toContain('word-break:normal!important');
  expect(galleryCss).toContain('min-height:40px!important');
 });
 it('preserves full milestone descriptions, badge art and member ordering actions',()=>{
  expect(rooms).toContain('legacy-showcase-grid achievement-grid');
  expect(rooms).toContain('<PalaceBadge family={x.achievement_families} tier={x.display_tier}/>');
  expect(rooms).toContain("moveChamberArt(\"achievement\",x.achievement_id,\"feature\")");
  expect(rooms).toContain("x.achievement_families?.description||'A displayed Palace achievement.'");
 });
});
