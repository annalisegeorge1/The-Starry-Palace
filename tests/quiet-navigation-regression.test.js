import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const main=readFileSync(resolve(process.cwd(),'src/main.jsx'),'utf8');

describe('Palace navigation without disruptive jumping',()=>{
 it('returns to the top only when entering a different pathname',()=>{
  const scroll=main.slice(main.indexOf('function NavigationReset()'),main.indexOf('function RouteStateReset()'));
  expect(scroll).toContain('window.scrollTo({top:0,left:0,behavior:\'auto\'})');
  expect(scroll).toContain('},[location.pathname]);');
  expect(scroll).not.toContain('},[location.pathname,location.search]);');
 });
 it('closes the mobile sidebar after any actual room or section navigation',()=>{
  expect(main).toContain('React.useEffect(()=>setNavOpen(false),[location.pathname,location.search]);');
  expect(main).toContain('React.useEffect(()=>{setCommandOpen(false);setMobileMoreOpen(false);');
 });
 it('still keeps the entire Palace shell visible and recoverable during navigation',()=>{
  expect(main).toContain('<Frame><RouteGuard><Routes>');
  expect(main).toContain('function BlankScreenWatchdog()');
  expect(main).toContain('function RouteLoading()');
 });
});
