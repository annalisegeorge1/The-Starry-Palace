import {describe,it,expect} from 'vitest';
import {chapterRecoveryCopies,discardDisplayedCopy} from './manuscriptRecoveryCopies';

describe('on-device chapter recovery',()=>{
 it('lists earlier single-key drafts and independent tabs, scoped to the open chapter',()=>{
  const chapter={id:'c1',body_html:'cloud',title:'Chapter',revision_note:''};
  const values=new Map();
  const storage={get length(){return values.size},key:i=>[...values.keys()][i],getItem:k=>values.get(k),removeItem:k=>values.delete(k)};
  function put(key,body,date){
   values.set(key,JSON.stringify({...chapter,body_html:body,saved_at:date}));
  }
  put('palace-recovery:c1','legacy','2026-01-01');
  put('palace-recovery:c1:tab','another draft','2026-01-02');
  put('palace-recovery:c1:saved','cloud','2026-01-03');
  put('palace-recovery:c11:tab','different chapter','2026-01-04');
  values.set('palace-recovery:c1:broken','{');
  const copies=chapterRecoveryCopies(storage,chapter);
  expect(copies.map(copy=>copy.body_html)).toEqual(['another draft','legacy']);
  put(copies[0].key,'new edits','2026-01-05');
  expect(discardDisplayedCopy(storage,copies[0])).toBe(false);
  expect(discardDisplayedCopy(storage,copies[1])).toBe(true);
  expect(chapterRecoveryCopies(storage,chapter).map(copy=>copy.body_html)).toEqual(['new edits']);
 });
});
