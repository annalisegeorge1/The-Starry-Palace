import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
const head=readFileSync('index.html','utf8');
const icon=readFileSync('public/favicon.svg','utf8');
const manifest=JSON.parse(readFileSync('public/site.webmanifest','utf8'));
describe('Palace browser identity',()=>{
  it('serves an actual crawlable favicon URL instead of an embedded data icon',()=>{
    expect(head).toContain('href="/favicon.svg"');
    expect(head).not.toContain('rel="icon" href="data:image/svg+xml');
    expect(icon).toContain('viewBox="0 0 96 96"');
    expect(icon).toContain('palace-icon-title');
  });
  it('keeps the browser manifest consistent with the public domain identity',()=>{
    expect(head).toContain('href="/site.webmanifest"');
    expect(manifest.name).toBe('The Starry Palace');
    expect(manifest.icons[0].src).toBe('/favicon.svg');
  });
});
