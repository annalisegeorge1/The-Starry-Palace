import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const terms=readFileSync('docs/legal/terms-of-service.md','utf8');
const aiPolicy=readFileSync('docs/legal/ai-policy.md','utf8');
const robots=readFileSync('public/robots.txt','utf8');
const liveRooms=readFileSync('src/liveRooms.jsx','utf8');
const data=readFileSync('src/palaceData.js','utf8');

describe('creator choice and AI crawler policy',()=>{
 it('documents the implemented crawler restrictions and their limitations in the Terms',()=>{
  expect(terms).toContain('Cloudflare\'s **Block AI Scrapers and Crawlers** setting is enabled');
  expect(terms).toContain('[`robots.txt`](/robots.txt)');
  expect(terms).toContain('not an authentication tool or legal guarantee');
  expect(terms).toContain('ordinary search discoverability');
  expect(terms).toContain('**Members Only** published works require an eligible signed-in Palace account');
 });
 it('keeps the stand-alone AI policy consistent with the Terms',()=>{
  expect(aiPolicy).toContain('### Crawler restrictions and author-controlled reading access');
  expect(aiPolicy).toContain('**Members Only**');
  expect(aiPolicy).toContain('neither measure can reliably identify every scraper');
 });
 it('maintains public indexing while requesting exclusion from identified model crawlers',()=>{
  expect(robots).toMatch(/User-agent: \*\s+Allow: \//);
  for(const agent of ['GPTBot','ClaudeBot','CCBot','Bytespider','Google-Extended','Applebot-Extended','meta-externalagent'])
   expect(robots).toContain('User-agent: '+agent+'\nDisallow: /');
 });
 it('explains visibility for story and comic creators without changing stored values',()=>{
  expect(liveRooms).toContain('Who can read this story?');
  expect(liveRooms).toContain('Who can read this comic?');
  expect(liveRooms.match(/Members Only — sign-in required/g)?.length).toBe(2);
  expect(liveRooms).toContain('value="members"');
  expect(liveRooms).toContain('value="private"');
  expect(liveRooms).toContain('value="public"');
  expect(data).toContain('visibility:patch.visibility');
 });
});
