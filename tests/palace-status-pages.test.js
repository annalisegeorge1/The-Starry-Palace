import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(path,'utf8');
const offline=read('public/offline.html');
const maintenance=read('public/maintenance.html');
const worker=read('public/palace-sw.js');
const app=read('src/main.jsx');
const entry=read('index.html');
const notice=read('src/PalaceConnectionNotice.jsx');

describe('Palace connection and maintenance pages',()=>{
 it('provides standalone, accessible, public pages without auth or React bundles',()=>{
  expect(offline).toContain('The Palace has lost its moonlight.');
  expect(maintenance).toContain('The Palace is being tended.');
  for(const page of [offline,maintenance]){
   expect(page).toContain('name="robots" content="noindex,nofollow"');
   expect(page).toContain('href="/palace-status.css"');
   expect(page).toContain('<main class="status-page">');
   expect(page).toContain('aria-labelledby=');
   expect(page).not.toContain('src="/src/main.jsx"');
  }
  expect(offline).toContain('id="palace-retry"');
  expect(offline).toContain('confirm your work is saved');
  expect(maintenance).toContain('Check the Palace');
 });
 it('installs only a public offline fallback and ignores private API traffic',()=>{
  expect(entry).toContain("navigator.serviceWorker.register('/palace-sw.js'");
  expect(worker).toContain("PALACE_OFFLINE_PAGE='/offline.html'");
  expect(worker).toContain("cache.addAll(PALACE_PUBLIC_ASSETS)");
  expect(worker).toContain("request.mode!=='navigate'");
  expect(worker).toContain("return await fetch(request)");
  expect(worker).toContain("caches.match(PALACE_OFFLINE_PAGE)");
  expect(worker).not.toMatch(/\bskipWaiting\s*\(/);
  expect(worker).not.toContain('cache.put(request');
  expect(worker).not.toContain('caches.open("member');
 });
 it('warns without automatically navigating or refreshing open drafts',()=>{
  expect(app).toContain('<PalaceConnectionNotice/>');
  expect(notice).toContain("window.addEventListener('offline',update)");
  expect(notice).toContain('keep your draft open');
  expect(notice).not.toContain('window.location.reload');
  expect(notice).not.toContain('window.location.replace');
 });
 it('does not turn on a global maintenance gate by default',()=>{
  expect(entry).not.toContain('window.location.replace("/maintenance.html")');
  expect(worker).not.toContain('MAINTENANCE_MODE');
 });
});
