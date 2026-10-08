import {afterEach,describe,expect,it} from 'vitest';
import {mkdtempSync,mkdirSync,readFileSync,rmSync,writeFileSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

const folders=[];
const script=join(process.cwd(),'scripts','prepare-spa-fallback.mjs');
const makeDist=()=>{
 const root=mkdtempSync(join(tmpdir(),'palace-host-routing-'));
 folders.push(root);
 mkdirSync(join(root,'dist'));
 writeFileSync(join(root,'dist','index.html'),'<title>The Starry Palace</title>');
 return root;
};
const run=(root,cloudflare)=>{
 const env={...process.env};
 if(cloudflare)env.CF_PAGES='1';
 else delete env.CF_PAGES;
 return spawnSync(process.execPath,[script],{cwd:root,env,encoding:'utf8'});
};
afterEach(()=>{while(folders.length)rmSync(folders.pop(),{recursive:true,force:true})});

describe('host-appropriate deep-link fallback',()=>{
 it('preserves the Render 404 copy of the React entrypoint',()=>{
  const root=makeDist();
  const result=run(root,false);
  expect(result.status).toBe(0);
  expect(readFileSync(join(root,'dist','404.html'),'utf8')).toContain('The Starry Palace');
 });
 it('lets Cloudflare Pages handle all client routes natively',()=>{
  const root=makeDist();
  writeFileSync(join(root,'dist','404.html'),'stale Render fallback');
  const result=run(root,true);
  expect(result.status).toBe(0);
  expect(existsSync(join(root,'dist','404.html'))).toBe(false);
  expect(existsSync(join(root,'dist','index.html'))).toBe(true);
 });
 it('fails safely rather than appearing successful with no built site',()=>{
  const root=makeDist();
  rmSync(join(root,'dist','index.html'));
  const result=run(root,false);
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain('missing dist/index.html');
 });
});
