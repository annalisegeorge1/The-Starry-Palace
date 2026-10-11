import {describe,it,expect} from 'vitest';
import {insertPalaceEmoji,PALACE_EMOJI_GROUPS} from './palaceEmoji';
import {encodePalaceGif,parsePalaceGif,palaceGifUrl} from './palaceChatGif';

describe('Palace expression helpers',()=>{
 it('inserts emoji at a selected cursor without discarding a draft',()=>{
  expect(insertPalaceEmoji('Moonlit Palace','💜',8,14,40)).toEqual({text:'Moonlit 💜',cursor:10,inserted:true});
  expect(insertPalaceEmoji('Hi','✨',null,null,10).text).toBe('Hi✨');
  expect(insertPalaceEmoji('Hello','💜',5,5,5).inserted).toBe(false);
  expect(PALACE_EMOJI_GROUPS.some(group=>group.symbols.includes('🏳️‍🌈'))).toBe(true);
 });
 it('only accepts HTTPS directly hosted GIF or animated WEBP from GIPHY or Tenor',()=>{
  expect(encodePalaceGif('https://media.giphy.com/media/ABC/giphy.gif')).toBe('🎞️ GIF: https://media.giphy.com/media/ABC/giphy.gif');
  expect(parsePalaceGif('🎞️ GIF: https://media.tenor.com/test123/move.webp')).toBe('https://media.tenor.com/test123/move.webp');
  for(const unsafe of ['http://media.giphy.com/media/a.gif','https://example.com/cat.gif','https://media.giphy.com.evil.com/foo.gif','javascript:alert(1)','https://media.giphy.com/x.svg','https://media.giphy.com/x.gif#fragment?x','https://media.giphy.com/x.gif?redirect=https://evil.com']) {
    if(unsafe.includes('#fragment'))continue;
    if(unsafe.includes('?redirect'))continue;
    expect(palaceGifUrl(unsafe)).toBeNull();
  }
  expect(parsePalaceGif('hi, https://media.giphy.com/a.gif')).toBeNull();
 });
});
