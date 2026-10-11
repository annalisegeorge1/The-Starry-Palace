import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const chat=readFileSync('src/PalaceChatDrawer.jsx','utf8');
const life=readFileSync('src/liveRooms.jsx','utf8');
const gif=readFileSync('src/PalaceChatGif.jsx','utf8');
describe('Palace expression controls',()=>{
 it('offers emoji in direct/group chat, keeps existing send paths, and uses safe GIF rendering',()=>{
  expect(chat).toContain('<PalaceEmojiPicker label="Palace Chat"');
  expect(chat).toContain('aria-label="Direct GIF link"');
  expect(chat).toContain('encodePalaceGif(gifLink)');
  expect(chat).toContain('<PalaceChatGif body={m.body}/>');
  expect(chat).toContain('await sendLetter(userId,roomId,body)');
  expect(chat).toContain('await sendPalaceGroupMessage(roomId,userId,body,{})');
  expect(gif).toContain('referrerPolicy="no-referrer"');
  expect(gif).toContain('onClick={()=>setLoaded(true)}');
 });
 it('offers emoji buttons in Commons composer, Forum replies and Moonlight',()=>{
  expect(life).toContain('label="Commons posts"');
  expect(life).toContain('label="Forum replies"');
  expect(life).toContain('label="Moonlight chat"');
  expect(life).toContain('insertPalaceEmoji');
  expect(life).toContain('maxLength="1600"');
  expect(life).toContain('maxLength="2400"');
 });
});
