import {describe,it,expect,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {scanFandomDirectoryPages,FANDOM_DIRECTORY_PAGE_SIZE}
 from '../src/fandomDirectoryPaging';

const rows=(count,field='id')=>Array.from({length:count},(_,i)=>({[field]:'tag-'+i,name:'Fandom '+i}));
const pageFrom=(items)=>vi.fn(async(offset,size)=>items.slice(offset,offset+size));

describe('Complete public fandom-directory pagination',()=>{
 it('reads beyond the old 1,500 row ceiling without silently omitting fandoms',async()=>{
  const items=rows(1601),fetchPage=pageFrom(items);
  const output=await scanFandomDirectoryPages(fetchPage);
  expect(output).toHaveLength(1601);
  expect(output[1600]).toEqual(items[1600]);
  expect(fetchPage.mock.calls[0]).toEqual([0,FANDOM_DIRECTORY_PAGE_SIZE]);
  expect(fetchPage.mock.calls.at(-1)).toEqual([1500,FANDOM_DIRECTORY_PAGE_SIZE]);
 });
 it('confirms completion when an exact final page needs an empty follow-up',async()=>{
  const fetchPage=pageFrom(rows(500));
  expect(await scanFandomDirectoryPages(fetchPage)).toHaveLength(500);
  expect(fetchPage.mock.calls.map(([offset])=>offset)).toEqual([0,250,500]);
 });
 it('paginates optional metadata by its unique tag_id too',async()=>{
  const meta=rows(503,'tag_id'),fetchPage=pageFrom(meta);
  const output=await scanFandomDirectoryPages(fetchPage,{keyField:'tag_id'});
  expect(output).toHaveLength(503);
  expect(output[502].tag_id).toBe('tag-502');
 });
 it('fails visibly rather than returning a truncated directory at safety bounds',async()=>{
  await expect(scanFandomDirectoryPages(pageFrom(rows(501)),{pageSize:250,maxRows:500}))
   .rejects.toThrow(/exceeds the safe review limit/i);
  await expect(scanFandomDirectoryPages(async()=>null))
   .rejects.toThrow(/incomplete or invalid/i);
  await expect(scanFandomDirectoryPages(async()=>rows(251)))
   .rejects.toThrow(/incomplete or invalid/i);
 });
 it('rejects overlapping page IDs, missing IDs, and backend errors',async()=>{
  const duplicate=vi.fn(async(offset)=>offset? [{id:'same'}]:rows(250).map((row,i)=>i===0?{id:'same'}:row));
  await expect(scanFandomDirectoryPages(duplicate)).rejects.toThrow(/overlapped/i);
  await expect(scanFandomDirectoryPages(async()=>[{name:'No ID'}]))
   .rejects.toThrow(/stable identifiers/i);
  await expect(scanFandomDirectoryPages(async()=>{throw Error('Database unavailable')}))
   .rejects.toThrow('Database unavailable');
 });
 it('uses stable ordering and ranges for both directory tables, without manuscript reads',()=>{
  const data=readFileSync('src/palaceData.js','utf8');
  const chunk=data.slice(data.indexOf('export async function getPalaceFandomDirectory'),
   data.indexOf('export async function getStoriesForFandomsPage'));
  expect(chunk).toContain("scanFandomDirectoryPages(async(offset,size)=>");
  expect(chunk).toContain(".order('name').order('id').range(offset,offset+size-1)");
  expect(chunk).toContain(".order('tag_id').range(offset,offset+size-1)");
  expect(chunk).toContain("{keyField:'tag_id'}");
  expect(chunk).not.toContain('offset<1500');
  expect(chunk).not.toContain('.limit(1500)');
  expect(chunk).not.toContain('body_html');
 });
});
