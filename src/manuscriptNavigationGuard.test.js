import {describe,it,expect} from 'vitest';
import {shouldWarnOnWriterLink} from './manuscriptNavigationGuard';
const currentUrl='https://palace.example/studio/my-story?chapter=123';
describe('writing desk navigation warnings',()=>{
 it('warns when a dirty manuscript would be left through a Palace link',()=>{
  expect(shouldWarnOnWriterLink({currentUrl,href:'/writing',dirty:true})).toBe(true);
  expect(shouldWarnOnWriterLink({currentUrl,href:'/reading',dirty:true})).toBe(true);
 });
 it('does not interrupt safe or in-page actions',()=>{
  expect(shouldWarnOnWriterLink({currentUrl,href:'/writing',dirty:false})).toBe(false);
  expect(shouldWarnOnWriterLink({currentUrl,href:'#manuscript-top',dirty:true})).toBe(false);
  expect(shouldWarnOnWriterLink({currentUrl,href:'https://other.example/',dirty:true})).toBe(false);
  expect(shouldWarnOnWriterLink({currentUrl,href:'/writing',dirty:true,modified:true})).toBe(false);
  expect(shouldWarnOnWriterLink({currentUrl,href:'/writing',dirty:true,download:true})).toBe(false);
  expect(shouldWarnOnWriterLink({currentUrl,href:'/writing',dirty:true,target:'_blank'})).toBe(false);
 });
 it('protects against query-only navigation while editing an unsaved chapter',()=>{
  expect(shouldWarnOnWriterLink({currentUrl,href:'/studio/my-story?chapter=other',dirty:true})).toBe(true);
 });
});
