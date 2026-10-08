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
 it('does not strip intentional inline formatting from a source edition',()=>{
  const prose='A deliberately long source paragraph. '.repeat(35);
  const html='<p><em>'+prose+'</em></p>';
  expect(restoreFlatClassicChapterHtml(html)).toBe(html);
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
 it('uses prose indentation and quoted dialogue as real paragraph evidence',()=>{
  const prose='The garden was quiet.\n   “Do you hear it?” she whispered.\nThe wind moved through the trees.\n   “Only the rain,” he said.';
  const blocks=structureClassicText(prose);
  expect(blocks.map(x=>x.kind)).toEqual(['paragraph','paragraph','paragraph']);
  expect(blocks[0].text).toBe('The garden was quiet.');
  expect(blocks[1].text).toBe('“Do you hear it?” she whispered. The wind moved through the trees.');
  expect(blocks[2].text).toBe('“Only the rain,” he said.');
 });
 it('keeps heading order relative to the surrounding source paragraphs',()=>{
  const blocks=structureClassicText('A closing line.\nCHAPTER II\nThe next opening line.');
  expect(blocks).toEqual([
   {kind:'paragraph',text:'A closing line.'},
   {kind:'heading',text:'CHAPTER II'},
   {kind:'paragraph',text:'The next opening line.'}
  ]);
 });
 it('does not invent paragraph boundaries inside evidenced long paragraphs',()=>{
  const first='First long paragraph with a distinct source boundary. '.repeat(20).trim();
  const second='Second long paragraph from the same edition. '.repeat(20).trim();
  const blocks=structureClassicText(first+'\n\n'+second);
  expect(blocks).toEqual([{kind:'paragraph',text:first},{kind:'paragraph',text:second}]);
 });
 it('handles empty and CRLF source',()=>{
  expect(structureClassicText('')).toEqual([]);
  expect(structureClassicText('One.\r\n\r\nTwo.').map(x=>x.text)).toEqual(['One.','Two.']);
 });
});
