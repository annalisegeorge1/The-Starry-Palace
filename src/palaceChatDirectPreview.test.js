import {describe,it,expect} from 'vitest';
import {buildPalaceDirectPreviews} from './palaceChatDirectPreview';

describe('Palace Chat direct inbox preview',()=>{
 it('chooses each conversation’s newest message regardless of input order',()=>{
  const rows=[
   {id:'2',conversation_id:'alpha',created_at:'2026-10-13T10:00:00Z',body:'Newest hello'},
   {id:'1',conversation_id:'alpha',created_at:'2026-10-12T10:00:00Z',body:'Older hello'},
   {id:'3',conversation_id:'beta',created_at:'2026-10-13T11:00:00Z',body:'Another thread'}
  ];
  const previews=buildPalaceDirectPreviews(rows,{formatTime:value=>value.slice(11,16)});
  expect(previews.size).toBe(2);
  expect(previews.get('alpha')).toEqual({text:'Newest hello',time:'10:00'});
  expect(previews.get('beta')).toEqual({text:'Another thread',time:'11:00'});
 });
 it('uses the same photo and GIF privacy-safe inbox labels',()=>{
  const previews=buildPalaceDirectPreviews([
   {conversation_id:'photo',created_at:'2026-10-13T10:00:00Z',media_path:'private-file',body:'caption'},
   {conversation_id:'gif',created_at:'2026-10-13T11:00:00Z',body:'[gif]sample'}
  ],{isGif:body=>body.startsWith('[gif]')});
  expect(previews.get('photo').text).toBe('📷 Photo');
  expect(previews.get('gif').text).toBe('🎞 GIF');
 });
 it('handles malformed rows and preserves the initial chat prompt',()=>{
  const previews=buildPalaceDirectPreviews([null,{},{
   conversation_id:'empty',created_at:null,body:''
  },{conversation_id:'empty',created_at:null,body:'should not replace equal timestamp'}]);
  expect(previews.size).toBe(1);
  expect(previews.get('empty')).toEqual({text:'Message',time:''});
  expect(previews.get('missing')).toBeUndefined();
 });
});
