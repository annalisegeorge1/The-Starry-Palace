import {describe,it,expect} from 'vitest';
import {writerSaveDisplay} from './writerSaveDisplay.js';
describe('honest writer save status',()=>{
 it('shows cloud confirmation only after a completed save',()=>{
  expect(writerSaveDisplay('',false).label).toBe('Cloud draft loaded');
  expect(writerSaveDisplay('Saved to Palace',false).phase).toBe('saved');
  expect(writerSaveDisplay('Saved to Palace',true).phase).toBe('pending');
 });
 it('prioritizes failed saves and recovery options',()=>{
  expect(writerSaveDisplay('Cloud save failed',true,true).label).toContain('device copy kept');
  expect(writerSaveDisplay('Cloud save failed',true,false).label).toContain('download backup');
  expect(writerSaveDisplay('Restored locally · unsaved cloud edits',true).phase).toBe('recovery');
 });
 it('does not confuse unrelated studio notices with manuscript saves',()=>{
  expect(writerSaveDisplay('Folder created.').phase).toBe('ready');
  expect(writerSaveDisplay('Chapter order saved.').label).toBe('Cloud draft loaded');
 });
});
