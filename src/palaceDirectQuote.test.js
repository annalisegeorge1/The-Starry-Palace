import {describe,it,expect} from 'vitest';
import {makePalaceDirectQuoteDraft} from './palaceDirectQuote';
describe('direct-message quotation drafts',()=>{
 it('quotes a loaded message without pretending to create a linked database reply',()=>{
  expect(makePalaceDirectQuoteDraft({body:'Meet at dusk'},'River')).toBe('↩ Quoting River: “Meet at dusk”\n\n');
 });
 it('keeps an existing draft and sanitizes line breaks and oversized quotes',()=>{
  const text=makePalaceDirectQuoteDraft({body:'A\n B '+('long'.repeat(100))},'First\nName','My unsent words');
  expect(text).toContain('My unsent words\n\n↩ Quoting First Name');
  expect(text).not.toContain('A\n B');
  expect(text.length).toBeLessThanOrEqual(3000);
 });
 it('describes photos and GIFs without embedding private media paths or remote links',()=>{
  const photo=makePalaceDirectQuoteDraft({media_path:'secret/member/item.webp',body:''},'Reader');
  expect(photo).toContain('“a photo”');expect(photo).not.toContain('secret/member');
  expect(makePalaceDirectQuoteDraft({body:'🎞️ GIF: https://media.giphy.com/x.gif'},'Writer')).toContain('“a GIF”');
 });
});
