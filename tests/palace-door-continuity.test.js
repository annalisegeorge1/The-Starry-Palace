import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const main=readFileSync(resolve(process.cwd(),'src/main.jsx'),'utf8');
const home=readFileSync(resolve(process.cwd(),'src/PalaceHomeWelcome.jsx'),'utf8');
const passage=main.split('const passageMap={')[1]?.split('const recentCommandItems=')[0]||'';
const login=main.split('function Login(){')[1]?.split('function Callback(')[0]||'';

describe('Palace route continuity for visitors and members',()=>{
 it('sends guest writing, library and Commons doors through destination-aware sign-in',()=>{
  expect(passage).toContain("path:session?'/writing':palaceSignInDoor('/writing')");
  expect(passage).toContain("path:session?'/library':palaceSignInDoor('/library')");
  expect(passage).toContain("path:session?'/palace-life?room=commons':palaceSignInDoor('/palace-life?room=commons')");
  expect(passage).not.toContain("path:session?'/writing':'/login'");
  expect(passage).not.toContain("path:session?'/library':'/login'");
  expect(main).toContain("to={session?'/writing':palaceSignInDoor('/writing')}");
 });
 it('lets guests wander into genuinely public rooms instead of surprising them with login',()=>{
  expect(passage).toContain("passageDoors.filter(x=>x.path!==currentHref&&!x.path.startsWith('/login'))");
  expect(main).toContain("Sign in to enter · ");
  expect(passage).toContain("path:'/reading'");
 });
 it('explains the requested destination at the existing sign-in gate',()=>{
  expect(login).toContain("location.state?.from||new URLSearchParams(location.search).get('next')");
  expect(login).toContain('safePalaceReturnPath(requested)');
  expect(login).toContain('requested&&palaceDoorDestinationMessage(destination)');
  expect(login).toContain('<Navigate to={destination} replace/>');
 });
 it('makes the home invitation clear for both visitors and signed-in writers',()=>{
  expect(home).toContain("member?'Enter Palace Life':'Explore public gatherings'");
  expect(home).toContain("member&&choice.id==='belong'?'/palace-life':choice.url");
  expect(main).toContain("to={session?'/writing':'/writers'}");
 });
});
