import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const live=readFileSync(resolve(process.cwd(),'src/liveRooms.jsx'),'utf8');

describe('isolated Palace writing desks',()=>{
 it('gives every work slug its own fresh editor state',()=>{
  expect(live).toContain('export function WorkStudioLive({Frame})');
  expect(live).toContain('<WorkStudioForWork key={slug} slug={slug} Frame={Frame}/>');
  expect(live).toContain('function WorkStudioForWork({Frame,slug})');
  expect(live).toContain('const initialChapterResolvedRef=useRef(false)');
 });
 it('does not let a slow tag search replace newer suggestions',()=>{
  expect(live).toContain('searchPalaceTags(tagQuery,tagCategory,60)');
  expect(live).toContain('.then(options=>{if(active)setTagOptions(options)})');
  expect(live).toContain('return()=>{active=false;clearTimeout(t)};');
  expect(live).not.toContain('searchPalaceTags(tagQuery,tagCategory,60).then(setTagOptions)');
 });
 it('keeps the tag picker open and focused after attaching or removing a tag',()=>{
  expect(live).toContain("setSaved('#'+tag.name+' added · keep choosing tags.')");
  expect(live).toContain('refocusTagSearch()');
  expect(live).toContain('async function detachTagFromWork(tag)');
 });
});
