import {afterEach,describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';

const source=readFileSync('index.html','utf8');
const script=source.match(/<script>\s*(\(function\(\)\{[\s\S]*?\}\)\(\);)\s*<\/script>/)?.[1];
const main=readFileSync('src/main.jsx','utf8');
const openPages=[];

function startBoot({mounted=false}={}){
 const dom=new JSDOM('<!doctype html><html><body><div id="palace-boot"><h1>Opening The Starry Palace…</h1><p>Gathering rooms.</p><button>Restore the Palace</button></div><div id="root"></div></body></html>',{url:'https://thestarrypalace.com/',runScripts:'outside-only'});
 const {window}=dom;
 const timers=[];
 window.setTimeout=(callback,ms)=>{timers.push({callback,ms});return timers.length};
 if(mounted){
  const shell=window.document.createElement('div');
  shell.dataset.palaceFrame='ready';
  window.document.getElementById('root').appendChild(shell);
 }
 window.eval(script);
 window.document.dispatchEvent(new window.Event('DOMContentLoaded'));
 openPages.push(dom);
 return {window,timers,boot:window.document.getElementById('palace-boot')};
}
afterEach(()=>{for(const page of openPages.splice(0))page.window.close()});

describe('Palace startup never reloads itself in a loop',()=>{
 it('provides a slow-load hint and offers manual restoration after 15 seconds',()=>{
  expect(script).toBeTruthy();
  const {window,timers,boot}=startBoot();
  const slow=timers.find(x=>x.ms===4000),failed=timers.find(x=>x.ms===15000);
  expect(slow).toBeTruthy();
  expect(failed).toBeTruthy();
  slow.callback();
  expect(boot.querySelector('p').textContent).toMatch(/taking longer/i);
  failed.callback();
  expect(boot.dataset.failed).toBe('true');
  expect(boot.querySelector('h1').textContent).toContain('did not finish');
  expect(window.location.pathname).toBe('/');
  expect(window.location.search).toBe('');
 });
 it('immediately clears the cover if React rendered before DOMContentLoaded',()=>{
  const {boot,timers}=startBoot({mounted:true});
  expect(boot.hidden).toBe(true);
  expect(timers).toHaveLength(0);
 });
 it('accepts an explicit successful React shell commit even after slow loading',()=>{
  const {window,timers,boot}=startBoot();
  timers.find(x=>x.ms===4000).callback();
  window.__palaceBootReady();
  expect(boot.hidden).toBe(true);
  timers.find(x=>x.ms===15000).callback();
  expect(boot.hidden).toBe(true);
  expect(boot.dataset.failed).toBe('false');
 });
 it('does not auto-change the URL or clear a member session to recover',()=>{
  expect(script).not.toMatch(/location\.replace|location\.reload|__palace_recover|sessionStorage/);
  expect(main).toContain('React.useEffect(()=>{window.__palaceBootReady?.()},[]);');
 });
});
