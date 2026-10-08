import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';

const workflow=readFileSync('.github/workflows/palace-cloudflare-preview.yml','utf8');
const doc=readFileSync('docs/CLOUDFLARE_MANUAL_PREVIEW.md','utf8');

describe('on-demand Cloudflare preview artifact',()=>{
 it('uses a manual workflow and an initial main-only package without changing Render',()=>{
  expect(workflow).toContain('workflow_dispatch:');
  expect(workflow).toContain('branches: [main]');
  expect(workflow).toContain("if: github.ref == 'refs/heads/main'");
  expect(workflow).toContain('actions/checkout@v4');
  expect(workflow).toContain('npm ci');
  expect(workflow).not.toContain('wrangler pages deploy');
  expect(workflow).not.toContain('render deploy');
 });
 it('tests before packaging a Cloudflare-ready Vite SPA, without root 404 fallback',()=>{
  expect(workflow).toContain('run: npm test');
  expect(workflow).toContain("CF_PAGES: '1'");
  expect(workflow).toContain('npm run build');
  expect(workflow).toContain('test -s dist/index.html');
  expect(workflow).toContain('test -e dist/404.html');
  expect(workflow).toContain('actions/upload-artifact@v4');
  expect(workflow).toContain('path: dist/');
  expect(workflow).toContain('retention-days: 2');
 });
 it('uses only browser-public Supabase configuration from tracked example values',()=>{
  expect(workflow).toContain('cp .env.example .env.local');
  expect(workflow).toContain("VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_");
  for(const secret of ['sb_secret_','SERVICE_ROLE_KEY','SUPABASE_SECRET_KEY','CLOUDFLARE_API_TOKEN'])expect(workflow).not.toContain(secret);
 });
 it('preserves the correct user expectations for an isolated preview',()=>{
  for(const warning of ['Direct Upload','Supabase','Auth URL Configuration','main','2 days','Git-integrated','same Supabase backend']){
   expect(doc).toContain(warning);
  }
 });
});
