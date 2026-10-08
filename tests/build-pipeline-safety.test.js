import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';

describe('safe build pipeline division',()=>{
 it('builds the static app with a host-aware SPA fallback, without rerunning all tests on Render',()=>{
  const pkg=JSON.parse(readFileSync('package.json','utf8'));
  expect(pkg.scripts.build).toContain('vite build');
  expect(pkg.scripts.build).toContain('node scripts/prepare-spa-fallback.mjs');
  expect(pkg.scripts.build).not.toMatch(/vitest|npm run test/);
 });
 it('requires a full test suite followed by the production build in GitHub CI',()=>{
  const pkg=JSON.parse(readFileSync('package.json','utf8'));
  const workflow=readFileSync('.github/workflows/palace-build.yml','utf8');
  expect(pkg.scripts.verify).toBe('vitest run && npm run build');
  expect(workflow).toContain('run: npm run verify');
  expect(workflow).toContain('branches: [main]');
 });
});
