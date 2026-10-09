import {describe,it,expect} from 'vitest';
import {mergePalaceGroupMessages,oldestPalaceGroupMessage,palaceChatUnreadGroup,palaceChatMatchesGroup,GROUP_HISTORY_PAGE_SIZE} from './palaceChatHistory';
const row=(id,date,body)=>({id,chat_id:'private-circle',created_at:'2026-10-09T'+date+'Z',body});
describe('private Palace group chat history',()=>{
 it('keeps older pages when live refreshes bring newer messages',()=>{
  const older=[row('one','10:00:00','First'),row('two','10:10:00','Second')];
  const current=[row('two','10:10:00','Second corrected'),row('three','10:15:00','Third')];
  expect(mergePalaceGroupMessages(older,current).map(x=>x.id)).toEqual(['one','two','three']);
  expect(mergePalaceGroupMessages(older,current)[1].body).toBe('Second corrected');
 });
 it('does not manufacture blank messages or shuffle ties unpredictably',()=>{
  const messages=mergePalaceGroupMessages([null,row('b','10:00:00','B')],[{},row('a','10:00:00','A')]);
  expect(messages.map(x=>x.id)).toEqual(['a','b']);
  expect(GROUP_HISTORY_PAGE_SIZE).toBeLessThanOrEqual(100);
 });
 it('returns a safe exclusive history cursor for the oldest loaded message',()=>{
  const messages=[row('late','15:00:00','Later'),row('early','10:00:00','First')];
  expect(oldestPalaceGroupMessage(messages)).toBe('2026-10-09T10:00:00Z');
  expect(oldestPalaceGroupMessage([])).toBeNull();
 });
 it('distinguishes muted unread items from read status',()=>{
  expect(palaceChatUnreadGroup({lastMessageAt:'2026-10-09T10:00:00Z',lastReadAt:null,muted:true})).toBe(true);
  expect(palaceChatUnreadGroup({lastMessageAt:'2026-10-09T10:00:00Z',lastReadAt:'2026-10-09T11:00:00Z'})).toBe(false);
  expect(palaceChatUnreadGroup({lastMessageAt:null,lastReadAt:null})).toBe(false);
 });
 it('can find a circle by title, description or member without exposing other groups',()=>{
  const group={title:'Blue Moon Circle',description:'Poetry and folklore',members:[{display_name:'River Song',username:'river'}]};
  expect(palaceChatMatchesGroup(group,'blue')).toBe(true);
  expect(palaceChatMatchesGroup(group,'folklore')).toBe(true);
  expect(palaceChatMatchesGroup(group,'river song')).toBe(true);
  expect(palaceChatMatchesGroup(group,'unrelated')).toBe(false);
 });
});