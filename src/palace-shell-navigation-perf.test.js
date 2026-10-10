import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {PALACE_SHELL_BADGE_INTERVAL_MS,shouldRefreshShellBadges} from './palaceShellRefreshPolicy';
const main=readFileSync('src/main.jsx','utf8');
const live=readFileSync('src/liveRooms.jsx','utf8');
const css=readFileSync('src/palace-calm-layout.css','utf8');
describe('Fast and accessible Palace navigation',()=>{
 it('does not reload the member profile on pathname changes',()=>{
  const area=main.slice(main.indexOf('// Stable member identity:'),main.indexOf('const visibleRooms='));
  expect(area).toContain("supabase.from('profiles')");
  expect(area).toContain("},[session?.user?.id]);");
  expect(area).toContain("React.useEffect(()=>{badgeRefreshRef.current?.()},[location.pathname]);");
  expect(area).not.toContain("},[session?.user?.id,location.pathname]);");
 });
 it('throttles unread counts but keeps later refreshes working',()=>{
  expect(PALACE_SHELL_BADGE_INTERVAL_MS).toBe(20000);
  expect(shouldRefreshShellBadges(0,90000)).toBe(true);
  expect(shouldRefreshShellBadges(90000,93000)).toBe(false);
  expect(shouldRefreshShellBadges(90000,110000)).toBe(true);
  expect(shouldRefreshShellBadges(90000,89000)).toBe(true);
  expect(main).toContain("window.addEventListener('focus',refresh);");
  expect(main).toContain("document.addEventListener('visibilitychange',onVisible);");
 });
 it('keeps the mobile navigation keyboard accessible and closes it on navigation',()=>{
  expect(main).toContain("usePalaceDialogFocusTrap(navOpen,'palace-sidebar','.nav-toggle')");
  expect(main).toContain("aria-modal={navOpen?'true':undefined}");
  expect(main).toContain("aria-expanded={navOpen}");
  expect(main).toContain("React.useEffect(()=>setNavOpen(false),[location.pathname,location.search]);");
  expect(css).toContain('.palace-shell.nav-open .full-sidebar :is(a,button,summary):focus-visible');
 });
 it('preserves eager core routes and memoizes stable story collections',()=>{
  expect(main).toContain("} from './liveRooms';");
  expect(live).toContain("const allReadingWorks=useMemo(");
  expect(live).toContain("const roomWorks=useMemo(");
  expect(live).toContain("const livingRoomWorks=useMemo(");
  expect(main).toContain('function BlankScreenWatchdog()');
 });
});
