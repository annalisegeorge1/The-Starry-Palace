import {describe,it,expect,vi} from 'vitest';
import {stageManuscriptRestore} from './manuscriptRestoreStage';
describe('recovering manuscripts safely',()=>{
 it('marks restored text as unsaved and keeps a device recovery copy',()=>{
  const saved=new Map();
  const storage={setItem:(key,value)=>saved.set(key,value)};
  const markChanged=vi.fn(()=>7);
  const result=stageManuscriptRestore({
   chapterId:'c-1',draft:{title:'After the Moon',body_html:'<p>Restored story</p>',revision_note:'Retest'},
   storage,markChanged,savedAt:'2026-10-08T20:00:00.000Z'
  });
  expect(result.stored).toBe(true);
  expect(result.revision).toBe(7);
  expect(markChanged).toHaveBeenCalledWith('c-1');
  expect(JSON.parse(saved.get('palace-recovery:c-1')).body_html).toBe('<p>Restored story</p>');
 });
 it('still marks the manuscript unsaved if device storage is blocked',()=>{
  const markChanged=vi.fn(()=>1);
  const result=stageManuscriptRestore({
   chapterId:'c-2',draft:{title:'Something saved earlier',body_html:'<p>Recovered</p>'},
   storage:{setItem(){throw Error('quota')}},markChanged
  });
  expect(result.stored).toBe(false);
  expect(markChanged).toHaveBeenCalledOnce();
  expect(result.draft.body_html).toContain('Recovered');
 });
});
