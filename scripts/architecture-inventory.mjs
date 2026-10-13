#!/usr/bin/env node
/**
 * Read-only architecture inventory for The Starry Palace.
 * Highlights structural hotspots without treating size as a broken feature.
 * No dependency installation, networking or database connections required.
 */
import {readdirSync,readFileSync,statSync} from 'node:fs';
import {join,relative,extname} from 'node:path';

const root=process.cwd();
const files=[];
function scan(dir){
 for(const entry of readdirSync(dir,{withFileTypes:true})){
  const path=join(dir,entry.name);
  if(entry.isDirectory()){scan(path);continue}
  if(!entry.isFile()||!['.js','.jsx','.css','.ts','.tsx'].includes(extname(path)))continue;
  const text=readFileSync(path,'utf8');
  files.push({
   name:relative(root,path).replaceAll('\\','/'),
   type:extname(path),
   size:Buffer.byteLength(text),
   lines:text.split(/\r?\n/).length,
   rules:(text.match(/\{/g)||[]).length,
   overrides:(text.match(/!important\b/g)||[]).length
  });
 }
}
scan(join(root,'src'));
const size=(bytes)=>(bytes/1024).toFixed(1)+' KiB';
const top=(kind,n)=>files.filter(f=>kind.includes(f.type)).sort((a,b)=>b.size-a.size).slice(0,n);
const css=files.filter(f=>f.type==='.css');
console.log('The Starry Palace — read-only architecture inventory');
console.log('Source files:',files.length,'Stylesheets:',css.length);
console.log('\nLargest application modules:');
for(const f of top(['.js','.jsx','.ts','.tsx'],10))
 console.log(' ',size(f.size).padStart(10),String(f.lines).padStart(6)+' lines ',f.name);
console.log('\nLargest stylesheets:');
for(const f of top(['.css'],10))
 console.log(' ',size(f.size).padStart(10),String(f.overrides).padStart(5)+' overrides ',f.name);
console.log('\nTotal CSS !important declarations:',css.reduce((n,f)=>n+f.overrides,0));
console.log('Note: these are source sizes and raw text counts, not delivered bundles, specificity analysis, or performance timings.');
console.log('This command does not modify files or enforce arbitrary limits.');
