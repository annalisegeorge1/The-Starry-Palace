import {describe,it,expect} from 'vitest';
import {filterPalaceDirectInbox,findPalaceChatMessages} from './palaceChatInboxModel';
const row=(id,opts={})=>({
 conversation_id:id,conversations:{kind:'direct',updated_at:opts.date||'2026-10-17T12:00:00Z'},
 correspondent:{username:id,display_name:opts.name||id},
 unread:!!opts.unread,preference:{archived:!!opts.archived,starred:!!opts.starred}
});
describe('Palace Messenger inbox',()=>{
 it('sorts favourites before other threads without mutating source',()=>{
  const a=row('a'),b=row('b',{starred:true}),c=row('c',{date:'2026-10-28T12:00:00Z'});
  const source=[a,b,c];expect(filterPalaceDirectInbox(source).map(x=>x.conversation_id)).toEqual(['b','c','a']);
  expect(source).toEqual([a,b,c]);
 });
 it('shows archived threads only inside the deliberate Archived inbox',()=>{
  const rows=[row('a'),row('archived',{archived:true,name:'Moonlight'}),row('quiet',{archived:true,name:'Solstice'})];
  expect(filterPalaceDirectInbox(rows,'','all').map(x=>x.conversation_id)).toEqual(['a']);
  expect(filterPalaceDirectInbox(rows,'','archived').map(x=>x.conversation_id)).toEqual(['archived','quiet']);
  expect(filterPalaceDirectInbox(rows,'solstice','archived').map(x=>x.conversation_id)).toEqual(['quiet']);
 });
 it('filters unread or favourites and never displays archived threads',()=>{
  const rows=[row('reader',{unread:true}),row('writer',{starred:true}),row('hidden',{archived:true})];
  expect(filterPalaceDirectInbox(rows,'','unread').map(x=>x.conversation_id)).toEqual(['reader']);
  expect(filterPalaceDirectInbox(rows,'','starred').map(x=>x.conversation_id)).toEqual(['writer']);
  expect(filterPalaceDirectInbox(rows).map(x=>x.conversation_id)).not.toContain('hidden');
 });
 it('finds a contact or recent message despite accents and spacing',()=>{
  const rows=[row('a',{name:'Café Reader'}),row('b')];
  const previews=new Map([['b',{text:'One   moonlit evening'}]]);
  expect(filterPalaceDirectInbox(rows,'cafe').map(x=>x.conversation_id)).toEqual(['a']);
  expect(filterPalaceDirectInbox(rows,'moonlit evening','all',previews).map(x=>x.conversation_id)).toEqual(['b']);
 });
 it('searches only locally loaded messages, never claiming full history',()=>{
  const messages=[{id:'one',body:'The Moon is Bright'},{id:'two',body:'Goodnight'},{id:'three',body:'MOON glow'}];
  expect(findPalaceChatMessages(messages,' moon ').map(m=>m.id)).toEqual(['one','three']);
  expect(findPalaceChatMessages(messages,'')).toEqual([]);
  expect(findPalaceChatMessages(null,'word')).toEqual([]);
 });
});
