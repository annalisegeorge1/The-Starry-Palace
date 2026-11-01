import {describe,expect,it} from 'vitest';
import {COMIC_IMAGE_ACCEPT,COMIC_PAGE_MAX_BYTES,COMIC_COVER_MAX_BYTES,validateComicImage,selectComicPageFiles,comicUploadReady} from './comicUploadPreparation';

const f=(name,size=1024,type='image/png',lastModified=1)=>({name,size,type,lastModified});

describe('Comic Studio image-upload preflight',()=>{
 it('honours the supported storage MIME types and the separate 15 MiB/8 MiB limits',()=>{
  expect(COMIC_IMAGE_ACCEPT).toContain('image/avif');
  expect(COMIC_PAGE_MAX_BYTES).toBe(15728640);
  expect(COMIC_COVER_MAX_BYTES).toBe(8388608);
  expect(validateComicImage(f('comic.png',COMIC_PAGE_MAX_BYTES))).toBe('');
  expect(validateComicImage(f('cover.png',COMIC_PAGE_MAX_BYTES),'cover')).toMatch(/8 MiB/);
  expect(validateComicImage(f('giant.jpg',COMIC_PAGE_MAX_BYTES+1,'image/jpeg'))).toMatch(/15 MiB/);
  expect(validateComicImage(f('art.svg',1000,'image/svg+xml'))).toMatch(/not supported/);
  expect(validateComicImage(f('art.gif',1000,'image/gif'))).toMatch(/not supported/);
  expect(validateComicImage(f('empty.png',0))).toMatch(/empty/);
 });
 it('uses natural filename ordering, caps each batch, and rejects accidental duplicates',()=>{
  const files=[f('page10.png'),f('page2.png'),f('page1.png'),f('page2.png')];
  const selected=selectComicPageFiles(files);
  expect(selected.accepted.map(x=>x.name)).toEqual(['page1.png','page2.png','page10.png']);
  expect(selected.rejected).toHaveLength(1);
  expect(selected.rejected[0].reason).toMatch(/already/);
  const more=selectComicPageFiles([f('page11.png')],[{file:f('page1.png')}],1);
  expect(more.accepted).toHaveLength(0);
  expect(more.rejected[0].reason).toMatch(/batch/);
 });
 it('never starts partial uploads when a non-decorative page lacks description',()=>{
  const entries=[{file:f('p1.png'),altText:'A bridge at dusk',status:'pending',decorative:false},{file:f('p2.png'),altText:'',status:'pending',decorative:false}];
  expect(comicUploadReady(entries).reason).toContain('p2.png');
  entries[1].decorative=true;
  expect(comicUploadReady(entries).ready).toBe(true);
  entries[0].status='uploaded';entries[1].status='uploaded';
  expect(comicUploadReady(entries).ready).toBe(false);
 });
});
