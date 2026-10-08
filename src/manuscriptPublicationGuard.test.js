import {describe,it,expect,vi} from 'vitest';
import {ensureChapterSavedForRelease} from './manuscriptPublicationGuard';
describe('publication of latest manuscript revision',()=>{
 it('allows release only after latest draft completes cloud save',async()=>{
  const save=vi.fn(async()=>({ok:true}));
  await expect(ensureChapterSavedForRelease({chapterId:'chapter-1',save,isDirty:()=>false,isSelected:id=>id==='chapter-1'})).resolves.toBe(true);
  expect(save).toHaveBeenCalledTimes(1);
 });
 it('does not release if the author edited again while the save was pending',async()=>{
  let release;
  let dirty=false;
  const pending=ensureChapterSavedForRelease({
   chapterId:'chapter-1',
   save:()=>new Promise(resolve=>{release=resolve}),
   isDirty:()=>dirty,
   isSelected:()=>true
  });
  dirty=true;release({ok:true});
  await expect(pending).rejects.toThrow('New edits');
 });
 it('rejects publishing an earlier chapter if selection changed during save',async()=>{
  let selected='chapter-1';
  const result=ensureChapterSavedForRelease({
   chapterId:'chapter-1',
   save:async()=>{selected='chapter-2'},
   isDirty:()=>false,
   isSelected:id=>id===selected
  });
  await expect(result).rejects.toThrow('chapter changed');
 });
 it('stops publishing if the cloud save itself failed',async()=>{
  await expect(ensureChapterSavedForRelease({
   chapterId:'chapter-1',
   save:()=>Promise.reject(new Error('offline')),
   isDirty:()=>true,
   isSelected:()=>true
  })).rejects.toThrow('offline');
 });
});
