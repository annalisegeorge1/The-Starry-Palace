import {describe,it,expect} from 'vitest';
import {structureClassicText} from '../src/classicTextStructure.js';

describe('Historic derivative fiction source chapter preservation',()=>{
 it('recognizes separated Roman numeral chapter and uppercase source title',()=>{
  const source='I\n\nTHE ASSOCIATED SHADES TAKE ACTION\n\nThe first chapter begins.\n\nII\n\nA SECOND ENCOUNTER\n\nThe next chapter begins.';
  const blocks=structureClassicText(source);
  expect(blocks.filter(b=>b.kind==='heading').map(b=>b.text))
   .toEqual(['I — THE ASSOCIATED SHADES TAKE ACTION','II — A SECOND ENCOUNTER']);
  expect(blocks.filter(b=>b.kind==='paragraph').map(b=>b.text))
   .toEqual(['The first chapter begins.','The next chapter begins.']);
 });
 it('recognizes an inline Roman heading without promoting ordinary dialogue',()=>{
  const source='I\nINTRODUCING MR. RAFFLES HOLMES\n\nIt began in the night.\n\nI see him again, she said.';
  const blocks=structureClassicText(source);
  expect(blocks[0]).toEqual({kind:'heading',text:'I — INTRODUCING MR. RAFFLES HOLMES'});
  expect(blocks.at(-1)).toEqual({kind:'paragraph',text:'I see him again, she said.'});
 });
 it('does not reinterpret a bare numeral unless followed by an uppercase literary chapter title',()=>{
  const b=structureClassicText('I\n\nwas walking home when it started to rain.');
  expect(b.some(x=>x.kind==='heading')).toBe(false);
 });
});
