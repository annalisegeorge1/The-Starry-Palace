import {describe,it,expect} from 'vitest';
import {readerFlow,readerPageNumber,readerPagePercent} from './readerFlowModel.js';
describe('reader view flow',()=>{
 it('defaults to scrolling, rejects invalid modes and supports page turning',()=>{
  expect(readerFlow()).toBe('scroll');
  expect(readerFlow('pages')).toBe('pages');
  expect(readerFlow('unsafe')).toBe('scroll');
 });
 it('safely restores a saved percentage to a page',()=>{
  expect(readerPageNumber(0,12)).toBe(1);
  expect(readerPageNumber(100,12)).toBe(12);
  expect(readerPageNumber(50,1)).toBe(1);
  expect(readerPagePercent(12,12)).toBe(100);
  expect(readerPagePercent(1,1)).toBe(0);
 });
});
