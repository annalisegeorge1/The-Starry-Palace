import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {routeSeo} from '../src/palaceSeo';

const html=readFileSync('index.html','utf8');
const robots=readFileSync('public/robots.txt','utf8');
const sitemap=readFileSync('public/sitemap.xml','utf8');

describe('public Google discoverability essentials',()=>{
 it('provides descriptive initial metadata and valid site-name markup',()=>{
  expect(html).toContain('Read &amp; Publish Stories, Fanfiction &amp; Poetry | The Starry Palace');
  expect(html).toContain('Read original fiction, fanfiction, poetry and comics');
  const script=html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  expect(script).toBeTruthy();
  const website=JSON.parse(script[1]);
  expect(website['@context']).toBe('https://schema.org');
  expect(website['@type']).toBe('WebSite');
  expect(website.name).toBe('The Starry Palace');
  expect(website.url).toBe('https://thestarrypalace.com/');
 });
 it('keeps search crawlers eligible without opening AI model training',()=>{
  expect(robots).toMatch(/User-agent:\s*\*\s*Allow:\s*\//);
  expect(robots).toContain('Sitemap: https://thestarrypalace.com/sitemap.xml');
  expect(robots).toMatch(/User-agent:\s*Google-Extended\s*Disallow:\s*\//);
  expect(robots).not.toMatch(/User-agent:\s*Googlebot\s*Disallow:\s*\//);
 });
 it('lists only canonical public section pages in the sitemap',()=>{
  const listed=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
  expect(new Set(listed).size).toBe(listed.length);
  for(const path of ['/', '/writers', '/reading', '/fandoms', '/tags', '/comics']){
   expect(listed).toContain('https://thestarrypalace.com'+path);
   expect(routeSeo(path).robots).toBe('index,follow');
  }
  expect(listed.some(url=>/\/login|\/writing|\/settings|\/search/.test(url))).toBe(false);
  expect(routeSeo('/search').robots).toContain('noindex');
  for(const path of ['/login', '/settings', '/writing', '/auth/callback', '/work/unresolved']){
   expect(routeSeo(path).robots).toContain('noindex');
  }
  expect(routeSeo('/writers').robots).toBe('index,follow');
  expect(routeSeo('/reading').robots).toBe('index,follow');
 });
});
