import {describe,it,expect,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {palaceGiphyItem,searchPalaceGiphy} from '../src/palaceGiphy';
import {palaceGifUrl} from '../src/palaceChatGif';

describe('Palace GIPHY native search',()=>{
 it('normalizes only safe GIPHY CDN image URLs',()=>{
  const item=palaceGiphyItem({id:'gif1',title:'Happy',
   images:{fixed_width_small:{webp:'https://media2.giphy.com/media/ABC/100.webp?cid=abc'},
   fixed_width:{url:'https://media.giphy.com/media/ABC/200.gif?cid=abc'}},
   url:'https://giphy.com/gifs/hello-ABC'});
  expect(item.preview).toBe('https://media2.giphy.com/media/ABC/100.webp');
  expect(item.url).toBe('https://media.giphy.com/media/ABC/200.gif');
  expect(palaceGifUrl(item.url)).toBe(item.url);
 });
 it('searches browser-side with a PG rating and keeps results ordered',async()=>{
  const fn=vi.fn(async(url)=>({ok:true,json:async()=>({data:[{
   id:'one',title:'Wave',images:{fixed_width:{url:'https://media.giphy.com/media/one/200.gif'}}
  }]})}));
  vi.stubGlobal('fetch',fn);
  const rows=await searchPalaceGiphy('hello',{apiKey:'test-public-web-key'});
  expect(rows.map(r=>r.id)).toEqual(['one']);
  const url=new URL(fn.mock.calls[0][0]);
  expect(url.hostname).toBe('api.giphy.com');
  expect(url.searchParams.get('rating')).toBe('pg');
  expect(url.searchParams.get('q')).toBe('hello');
  vi.unstubAllGlobals();
 });
 it('requires a key and rejects unsafe media hosts',async()=>{
  await expect(searchPalaceGiphy('hello',{apiKey:''})).rejects.toThrow('developer key');
  expect(palaceGiphyItem({id:'x',images:{fixed_width:{url:'https://example.com/x.gif'}}}).url).toBe(null);
 });
});

describe('Palace Chat photos, edits, and replies',()=>{
 const chat=readFileSync('src/PalaceChatDrawer.jsx','utf8');
 const direct=readFileSync('src/palaceData.js','utf8');
 const groups=readFileSync('src/palaceGroupChatData.js','utf8');
 const media=readFileSync('src/palaceChatMedia.js','utf8');
 const sql=readFileSync('supabase/migrations/20261011002000_palace_chat_photos_edits.sql','utf8');
 it('renders real private photos and does not store a public URL in the conversation',()=>{
  expect(media).toContain("PALACE_CHAT_PHOTO_BUCKET='palace-chat-photos'");
  expect(media).toContain('createSignedUrl(path,3600)');
  expect(media).not.toContain('getPublicUrl');
  expect(chat).toContain('<PalaceChatPhoto path={m.media_path}/>');
  expect(direct).toContain('media_path:mediaPath');
  expect(groups).toContain('media_path:mediaPath');
  expect(sql).toContain("'palace-chat-photos',false");
  expect(sql).toContain("private.is_conversation_member(c.id)");
  expect(sql).toContain("private.is_palace_group_member(c.id)");
 });
 it('keeps media references immutable and group replies linked to their original',()=>{
  expect(sql).toContain('new.media_path is distinct from old.media_path');
  expect(sql).toContain('new.reply_to_id is distinct from old.reply_to_id');
  expect(chat).toContain('jumpToQuotedMessage(m.reply_to_id)');
  expect(chat).toContain("replyTarget?.chatId===roomId?{replyToId:replyTarget.id}:{}");
  expect(groups).toContain('reply_to_id:options.replyToId||null');
 });
 it('restricts edits to the original sender and displays an Edited indicator',()=>{
  expect(sql).toContain('sender_id=(select auth.uid())');
  expect(direct).toContain('.eq(\'sender_id\',userId).eq(\'id\',messageId)');
  expect(groups).toContain('.eq(\'sender_id\',userId).eq(\'id\',messageId)');
  expect(chat).toContain('className="palace-chat-edited-mark"');
  expect(chat).toContain('aria-label="Edit your message"');
 });
});

describe('Palace GIF picker privacy and graceful configuration',()=>{
 const picker=readFileSync('src/PalaceGiphyPicker.jsx','utf8');
 it('does not show developer setup instructions to members',()=>{
  expect(picker).toContain('GIF search is temporarily unavailable.');
  expect(picker).not.toContain("GIPHY Web developer key is added");
 });
 it('explains that search terms go to GIPHY without submitting messages',()=>{
  expect(picker).toContain('Search terms go to GIPHY');
  expect(picker).toContain("Your chat text isn't sent for searching");
  expect(picker).toContain('Powered by <strong>GIPHY</strong>');
 });
});
