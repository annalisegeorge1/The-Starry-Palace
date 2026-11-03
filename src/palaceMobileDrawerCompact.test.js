import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const source=readFileSync('src/main.jsx','utf8');
const styles=readFileSync('src/palace-mobile-drawer-compact.css','utf8');
const room=source.slice(source.indexOf("{id:'palace',icon:'☾'"),source.indexOf("{id:'reading',icon:'◈'"));
describe('Mobile navigation drawer simplification',()=>{
 it('leaves only home and profile in the My Palace room submenu',()=>{
  expect(room).toContain("['Home','/chamber']");
  expect(room).toContain("['My chamber','/member']");
  expect(room).not.toContain("['Notifications','/activity']");
  expect(room).not.toContain("['Messages','/letters']");
  expect(room).not.toContain("['Invitations','/events?tab=calendar']");
 });
 it('preserves toolbar shortcuts and Events and account utility routes',()=>{
  expect(source).toContain('to="/activity" aria-label={activityBadge');
  expect(source).toContain('to="/letters"');
  expect(source).toContain('to="/chat"');
  expect(source).toContain("label:'Events & Heritage'");
  expect(source).toContain('className="sidebar-theme" aria-pressed={daylight}');
 });
 it('uses a thin banner and compact scannable row sizing only at mobile widths',()=>{
  expect(styles).toContain('@media(max-width:980px)');
  expect(styles).toContain('height:94px!important;min-height:94px!important;max-height:94px!important');
  expect(styles).toContain('object-fit:cover!important;object-position:center 45%!important');
  expect(styles).toContain('min-height:50px!important');
  expect(styles).toContain('.palace-more-subdoors>summary');
  expect(styles).toContain('border-left:3px solid #a78bfa');
 });
 it('retains guest navigation and visible theme indication',()=>{
  expect(source).toContain('className="identity-card-live guest"');
  expect(styles).toContain('.sidebar-theme-switch');
  expect(styles).toContain('.full-nav-room>a.active');
 });
});
