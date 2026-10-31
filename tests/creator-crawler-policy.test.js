import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const robots=readFileSync(resolve(process.cwd(),'public/robots.txt'),'utf8');

describe('creator crawler preferences',()=>{
 it('expresses ordinary search indexing while opting out of AI model use',()=>{
  expect(robots).toMatch(/User-agent:\s*\*/i);
  expect(robots).toMatch(/Content-signal:\s*search=yes,\s*ai-input=no,\s*ai-train=no/i);
  expect(robots).toMatch(/Sitemap:\s*https:\/\/thestarrypalace\.com\/sitemap\.xml/i);
 });
 it('asks known training crawlers not to visit without blanket-blocking search engines',()=>{
  for(const agent of ['GPTBot','ClaudeBot','CCBot','Bytespider','Google-Extended','Applebot-Extended','meta-externalagent','Amazonbot']){
   const escaped=agent.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
   expect(robots,agent).toMatch(new RegExp('User-agent:\\s*'+escaped+'\\s*\\nDisallow:\\s*/','i'));
  }
  expect(robots).not.toMatch(/User-agent:\s*Googlebot\s*\nDisallow:\s*\//i);
  expect(robots).not.toMatch(/User-agent:\s*Bingbot\s*\nDisallow:\s*\//i);
 });
});
