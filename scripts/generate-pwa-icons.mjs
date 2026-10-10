/**
 * The Starry Palace install icons. This lightweight PNG writer uses only Node
 * built-ins, so deployment never depends on paid icon services or extra packages.
 * Generated into dist after Vite: no legacy asset caching or service worker.
 */
import {deflateSync} from 'node:zlib';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';

const SIGNATURE=Buffer.from([137,80,78,71,13,10,26,10]);
const table=Array.from({length:256},(_,i)=>{
 let c=i;
 for(let j=0;j<8;j++)c=c&1?0xedb88320^(c>>>1):c>>>1;
 return c>>>0;
});
function crc32(bytes){
 let crc=0xffffffff;
 for(const value of bytes)crc=table[(crc^value)&255]^(crc>>>8);
 return (crc^0xffffffff)>>>0;
}
function chunk(kind,bytes){
 const type=Buffer.from(kind,'ascii');
 const length=Buffer.alloc(4);length.writeUInt32BE(bytes.length);
 const tail=Buffer.alloc(4);tail.writeUInt32BE(crc32(Buffer.concat([type,bytes])));
 return Buffer.concat([length,type,bytes,tail]);
}
const clamp=x=>Math.max(0,Math.min(255,Math.round(x)));
const inside=(x,y,cx,cy,r)=>Math.hypot(x-cx,y-cy)<r;
function star(x,y,cx,cy,r){
 const dx=Math.abs(x-cx)/r,dy=Math.abs(y-cy)/r;
 // A small four-ray star with tapered diagonals.
 return (dx<.16&&dy<1)||(dy<.16&&dx<1)||(dx+dy<.7);
}
export function palacePngIcon(size){
 if(!Number.isInteger(size)||size<32||size>1024)throw new RangeError('Unsupported icon size');
 const pixels=Buffer.alloc((size*4+1)*size);
 for(let y=0;y<size;y++){
  const row=y*(size*4+1);
  pixels[row]=0; // PNG scanline None filter.
  for(let x=0;x<size;x++){
   const px=(x+.5)/size,py=(y+.5)/size;
   const glow=Math.max(0,1-Math.hypot((px-.27)*1.16,(py-.22)*1.26));
   let r=clamp(10+18*glow+6*py),g=clamp(14+7*glow+17*py),b=clamp(33+36*glow+39*py);
   // Night-sky orbit, crescent and three differently sized stars.
   const ring=Math.abs(Math.hypot((px-.5)/.365,(py-.5)/.365)-1)<.017;
   if(ring){r=82;g=99;b=161;}
   const moon=inside(px,py,.443,.465,.247)&&!inside(px,py,.55,.365,.222);
   if(moon){r=222;g=216;b=252;}
   if(star(px,py,.747,.292,.083)){r=136;g=211;b=244;}
   if(star(px,py,.657,.722,.044)){r=187;g=169;b=246;}
   if(star(px,py,.278,.777,.028)){r=177;g=211;b=246;}
   const at=row+1+x*4;
   pixels[at]=r;pixels[at+1]=g;pixels[at+2]=b;pixels[at+3]=255;
  }
 }
 const header=Buffer.alloc(13);
 header.writeUInt32BE(size,0);header.writeUInt32BE(size,4);
 header[8]=8;header[9]=6; // 8-bit RGBA.
 const png=Buffer.concat([
  SIGNATURE,chunk('IHDR',header),
  chunk('IDAT',deflateSync(pixels,{level:9})),
  chunk('IEND',Buffer.alloc(0))
 ]);
 return png;
}
export function writePalacePwaIcons(outDir='dist'){
 mkdirSync(outDir,{recursive:true});
 for(const size of [180,192,512]){
  writeFileSync(join(outDir,'palace-icon-'+size+'.png'),palacePngIcon(size));
 }
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 writePalacePwaIcons(resolve(process.cwd(),'dist'));
}
