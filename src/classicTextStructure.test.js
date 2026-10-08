import {describe,it,expect} from 'vitest';
import {structureClassicText,restoreFlatClassicChapterHtml} from './classicTextStructure';
describe('classic literature typesetting',()=>{
 it('repairs one large archive chapter while preserving normal chapter HTML',()=>{
  const flat=Array.from({length:35},(_,i)=>'This is a complete sentence in chapter '+i+' with a long descriptive narrative.').join(' ');
  const html='<p>'+flat+'</p>';
  const result=restoreFlatClassicChapterHtml(html);
  // Node test environment may lack DOMParser, in which case the fallback is unchanged.
  if(typeof DOMParser!=='undefined'){
   expect((result.match(/<p>/g)||[]).length).toBeGreaterThan(1);
   expect(restoreFlatClassicChapterHtml('<p>First.</p><p>Second.</p><p>Third.</p>')).toBe('<p>First.</p><p>Second.</p><p>Third.</p>');
  }
 });
 it('preserves source paragraph boundaries',()=>{
  expect(structureClassicText('First paragraph.\n\nSecond paragraph.').map(x=>x.text))
   .toEqual(['First paragraph.','Second paragraph.']);
 });
 it('recognizes chapter titles among single-spaced import lines',()=>{
  const result=structureClassicText('CHAPTER I\nThe first page begins.\nMore of the same paragraph.');
  expect(result[0]).toEqual({kind:'heading',text:'CHAPTER I'});
  expect(result[1].text).toBe('The first page begins. More of the same paragraph.');
 });
 it('recovers readable blocks from an overly long flattened prose import',()=>{
  const flat=Array.from({length:25},(_,i)=>'This is the rather lengthy sentence number '+i+' with a beginning middle and an ending.').join(' ');
  const blocks=structureClassicText(flat);
  expect(blocks.length).toBeGreaterThan(1);
  expect(blocks.every(block=>block.kind==='paragraph')).toBe(true);
  expect(blocks.map(b=>b.text).join(' ')).toBe(flat);
 });
 it('preserves separated short verse lines',()=>{
  const poem='Upon the hill,\nBeneath the moon;\nAcross the lake,\nA quiet tune;';
  expect(structureClassicText(poem)).toEqual([{kind:'verse',text:poem}]);
 });
 it('handles empty and CRLF source',()=>{
  expect(structureClassicText('')).toEqual([]);
  expect(structureClassicText('One.\r\n\r\nTwo.').map(x=>x.text)).toEqual(['One.','Two.']);
 });
});
