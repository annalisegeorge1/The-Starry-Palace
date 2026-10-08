import {copyFileSync,existsSync,unlinkSync} from 'node:fs';
import {join} from 'node:path';

const output=join(process.cwd(),'dist');
const entry=join(output,'index.html');
const fallback=join(output,'404.html');

if(!existsSync(entry)){
 console.error('Palace build output is missing dist/index.html.');
 process.exitCode=1;
}else if(process.env.CF_PAGES==='1'){
 // Cloudflare Pages serves SPA routes automatically only if there is no root 404.html.
 if(existsSync(fallback))unlinkSync(fallback);
 console.log('Cloudflare Pages: native SPA deep-link fallback enabled.');
}else{
 // Render static hosting continues to use the existing HTML fallback.
 copyFileSync(entry,fallback);
 console.log('Render/static hosting: dist/404.html fallback generated.');
}
