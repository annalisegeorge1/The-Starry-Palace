import {describe,it,expect} from 'vitest';
import {validateCommonsPollChoices,restoreCommonsPollOptions} from './commonsPollComposer';
describe('Palace Commons poll preparation',()=>{
 it('requires two distinct choices before any public thread is created',()=>{
  expect(validateCommonsPollChoices(['Only one','']).valid).toBe(false);
  expect(validateCommonsPollChoices(['Moon','  MOON  ']).message).toMatch(/different/);
  expect(validateCommonsPollChoices([' Moon ', ' Stars  '])).toEqual({valid:true,choices:['Moon','Stars'],message:''});
 });
 it('lets members draft extra options without posting blanks',()=>{
  const result=validateCommonsPollChoices(['North','South','','']);
  expect(result.valid).toBe(true);
  expect(result.choices).toEqual(['North','South']);
 });
 it('keeps drafts bounded when a device contains invalid data',()=>{
  expect(restoreCommonsPollOptions(null)).toEqual(['','']);
  expect(restoreCommonsPollOptions(['one'])).toEqual(['one','']);
  expect(restoreCommonsPollOptions(Array.from({length:12},(_,i)=>String(i)))).toHaveLength(6);
  expect(restoreCommonsPollOptions(['a',{},'b'])).toEqual(['a','','b']);
 });
});
