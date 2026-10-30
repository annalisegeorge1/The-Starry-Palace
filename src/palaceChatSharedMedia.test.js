import {describe,it,expect} from 'vitest';
import {collectPalaceSharedMedia,groupPalaceSharedMedia} from './palaceChatSharedMedia';

describe('loaded-room shared media gallery',()=>{
 const entries=[
  {id:'a',created_at:'2026-10-10T12:00:00Z',media_path:'private/member-a/photo.webp',body:''},
  {id:'b',created_at:'2026-10-12T12:00:00Z',body:'palace-gif://sample'},
  {id:'c',created_at:'2026-10-15T12:00:00Z',works:{title:'A Palace Story',slug:'the palace/story'}},
  {id:'a',created_at:'2026-10-10T12:00:00Z',media_path:'private/member-a/photo.webp'}
 ];
 const checkGif=body=>body.startsWith('palace-gif://');
 it('indexes only currently supplied messages and keeps internal photo paths private',()=>{
  const gallery=collectPalaceSharedMedia(entries,checkGif);
  expect(gallery.map(item=>item.kind)).toEqual(['story','gif','photo']);
  expect(gallery[2].path).toBe('private/member-a/photo.webp');
  expect(gallery[0].messageId).toBe('c');
  expect(gallery[0].slug).toBe('the palace/story');
  expect(gallery).not.toHaveProperty('publicUrl');
 });
 it('filters and limits the gallery without fetching hidden history',()=>{
  const gallery=collectPalaceSharedMedia(entries,checkGif);
  expect(groupPalaceSharedMedia(gallery,'photo').map(m=>m.id)).toEqual(['a']);
  expect(groupPalaceSharedMedia(gallery,'all',2)).toHaveLength(2);
  expect(groupPalaceSharedMedia(gallery,'unexpected')).toHaveLength(3);
  expect(collectPalaceSharedMedia(null,checkGif)).toEqual([]);
  expect(groupPalaceSharedMedia(null)).toEqual([]);
 });
});
