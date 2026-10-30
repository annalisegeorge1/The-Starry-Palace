import {describe,it,expect} from 'vitest';
import {preparePalaceEmail} from './emailContent.js';
const token='a375df00-ae20-4e31-bd4f-5831f197c044';
describe('private-by-default Palace email composer',()=>{
 it('uses only generic category names and includes an unsubscribe link',()=>{
  const m=preparePalaceEmail({frequency:'daily',unsubscribe_token:token,items:[{type:'story'},{type:'message'}]});
  expect(m.subject).toMatch(/daily/);
  expect(m.count).toBe(2);
  expect(m.html).toContain('Unsubscribe');
  expect(m.text).toContain(token);
  expect(m.text).not.toContain('private manuscript');
 });
 it('rejects malformed tokens and empty supported events',()=>{
  expect(()=>preparePalaceEmail({unsubscribe_token:'<script>',items:[{type:'story'}]})).toThrow();
  expect(()=>preparePalaceEmail({unsubscribe_token:token,items:[{type:'secret'}]})).toThrow();
 });
});
