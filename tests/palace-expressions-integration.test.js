import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const chat=readFileSync('src/PalaceChatDrawer.jsx','utf8');
const life=readFileSync('src/liveRooms.jsx','utf8');
const gif=readFileSync('src/PalaceChatGif.jsx','utf8');
describe('Palace expression controls',()=>{
 it('never renders an escaped newline between the GIF/photo panels and composer',()=>{
  expect(chat).not.toContain('onClose={()=>setGifOpen(false)}/>}\\\\n');
  expect(chat).toContain('onClose={()=>setGifOpen(false)}/>}\n     {photoFile&&');
  expect(chat).toContain('<form className="palace-chat-compose" onSubmit={send}>');
 });
 it('offers emoji in direct/group chat, keeps existing send paths, and uses safe GIF rendering',()=>{
  expect(chat).toContain('<PalaceEmojiPicker label="Palace Chat"');
  expect(chat).toContain('<PalaceGiphyPicker busy={busy} onSend={sendGif}');
  expect(chat).toContain('className="palace-chat-photo-toggle"');
  expect(chat).toContain('className="palace-chat-photo-stage"');
  expect(chat).toContain('encodePalaceGif(url)');
  expect(chat).toContain('sendLetterPhoto(userId,roomId,path,caption)');
  expect(chat).toContain('sendPalaceGroupPhoto(roomId,userId,path,caption,');
  expect(chat).toContain('<PalaceChatGif body={m.body}/>');
  expect(chat).toContain('await sendLetter(userId,roomId,body)');
  expect(chat).toContain('await sendPalaceGroupMessage(roomId,userId,body,replyTarget?.chatId===roomId');
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
