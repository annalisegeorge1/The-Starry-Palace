import {describe,expect,it} from 'vitest';
import {captureEditorSelection,restoreEditorSelection,toolbarScrollAmount} from './editorSelection';

function selectionWithRange(editor,text,start,end){
 const node=document.createTextNode(text);
 editor.appendChild(node);
 const range=document.createRange();
 range.setStart(node,start);range.setEnd(node,end);
 const selection=window.getSelection();
 selection.removeAllRanges();selection.addRange(range);
 return{range,selection,node};
}
describe('manuscript format selection',()=>{
 it('captures the writer’s highlighted words and restores them after toolbar focus',()=>{
  const editor=document.createElement('div');
  editor.contentEditable='true';
  document.body.appendChild(editor);
  const {selection}=selectionWithRange(editor,'A chapter with a lovely phrase',15,21);
  const saved=captureEditorSelection(editor,selection);
  expect(saved?.range.toString()).toBe('lovely');
  selection.removeAllRanges();
  expect(restoreEditorSelection(editor,saved,selection)).toBe(true);
  expect(selection.toString()).toBe('lovely');
  editor.remove();selection.removeAllRanges();
 });
 it('refuses to capture a selection in a search box or another chapter',()=>{
  const a=document.createElement('div'),b=document.createElement('div');
  document.body.append(a,b);
  const {selection}=selectionWithRange(b,'Wrong chapter',0,5);
  expect(captureEditorSelection(a,selection)).toBeNull();
  const saved=captureEditorSelection(b,selection);
  expect(restoreEditorSelection(a,saved,selection)).toBe(false);
  a.remove();b.remove();selection.removeAllRanges();
 });
 it('never resurrects a detached editor selection after chapter replacement',()=>{
  const editor=document.createElement('div');
  document.body.appendChild(editor);
  const {selection}=selectionWithRange(editor,'First manuscript',0,5);
  const saved=captureEditorSelection(editor,selection);
  editor.textContent='Second manuscript';
  expect(restoreEditorSelection(editor,saved,selection)).toBe(false);
  editor.remove();selection.removeAllRanges();
 });
 it('handles missing selection and computes a useful horizontal step',()=>{
  expect(captureEditorSelection(null,null)).toBeNull();
  expect(restoreEditorSelection(null,null,null)).toBe(false);
  expect(toolbarScrollAmount(500,'right')).toBe(360);
  expect(toolbarScrollAmount(500,'left')).toBe(-360);
  expect(toolbarScrollAmount(100,'right')).toBe(160);
 });
});
