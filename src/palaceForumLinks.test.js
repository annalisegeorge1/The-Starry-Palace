import {describe,it,expect} from 'vitest';
import {safeForumThreadId,palaceForumThreadUrl,palaceForumThreadFromSearch,pageForForumThread} from './palaceForumLinks';
describe('Palace Forum durable discussion links',()=>{
 it('creates a safe, explicit, shareable Forum URL',()=>{
  const id='e313abc6-0085-4c41-a011-783eb37ee051';
  expect(palaceForumThreadUrl(id)).toBe('/palace-life?room=forum&thread='+id);
  expect(palaceForumThreadFromSearch('?room=forum&thread='+id)).toBe(id);
  expect(palaceForumThreadFromSearch('?room=commons&thread='+id)).toBeNull();
  expect(palaceForumThreadFromSearch('?room=forum')).toBeNull();
 });
 it('rejects unsafe and nonexistent thread address inputs without throwing',()=>{
  for(const value of ['','../../private','?=','<script>','x'.repeat(200)]){
   expect(safeForumThreadId(value)).toBeNull();
   expect(palaceForumThreadUrl(value)).toBe('/palace-life?room=forum');
  }
  expect(palaceForumThreadFromSearch('?room=forum&thread=%2F..%2F')).toBeNull();
 });
 it('opens a selected thread even if it is buried in a long chronological ledger',()=>{
  const entries=Array.from({length:146},(_,i)=>({id:'thread-'+i}));
  expect(pageForForumThread(entries,'thread-0')).toBe(1);
  expect(pageForForumThread(entries,'thread-12')).toBe(2);
  expect(pageForForumThread(entries,'thread-119')).toBe(10);
  expect(pageForForumThread(entries,'thread-145')).toBe(13);
  expect(pageForForumThread(entries,'not-in-list')).toBe(1);
  expect(pageForForumThread([],null)).toBe(1);
 });
});
