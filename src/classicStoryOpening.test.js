import {describe,it,expect} from 'vitest';
import {structureClassicText} from './classicTextStructure';
import {paginateClassicBlocks,firstClassicStoryBlock,classicStoryPage} from './archiveReaderModel';

const story='The carriage stopped outside the town as the travellers considered the long night. '.repeat(4);
describe('Open public-domain novels at the narrative, not the publisher table of contents',()=>{
 it('skips a long Gutenberg-style TOC and preserves every source block',()=>{
  const contents=Array.from({length:75},(_,i)=>'CHAPTER '+(i+1)+'\nTITLE OF THIS CHAPTER');
  const raw='THE GREAT NOVEL\n\nBy Someone\n\nCONTENTS\n\n'+contents.join('\n\n')+'\n\nCHAPTER 1\n\n'+story+'\n\nCHAPTER 2\n\n'+story;
  const blocks=structureClassicText(raw);
  const storyIndex=firstClassicStoryBlock(blocks);
  expect(storyIndex).toBeGreaterThan(70);
  expect(blocks[storyIndex].text).toBe('CHAPTER 1');
  const pages=paginateClassicBlocks(blocks,18,storyIndex);
  const opening=classicStoryPage(pages,storyIndex);
  expect(opening).toBeGreaterThan(0);
  expect(pages[opening][0].text).toBe('CHAPTER 1');
  expect(pages.flat().map(b=>b.text)).toEqual(blocks.map(b=>b.text));
 });
 it('does not confuse a contents entry with the chapter heading that starts actual prose',()=>{
  const source='CONTENTS\n\nCHAPTER I\n\nCHAPTER II\n\nCHAPTER I\n\n'+story;
  const blocks=structureClassicText(source);
  const index=firstClassicStoryBlock(blocks);
  expect(index).toBe(3);
  expect(blocks[index].text).toBe('CHAPTER I');
 });
 it('does not skip legitimate opening prose where no chapter structure is established',()=>{
  const source='This day was unusually quiet. '.repeat(30)+'\n\nThe door opened slowly.';
  expect(firstClassicStoryBlock(structureClassicText(source))).toBe(0);
 });
 it('avoids mistaking descriptive uppercase contents entries for literary prose',()=>{
  const source='CONTENTS\n\nCHAPTER I\n\nWHICH TREATS OF THE CHARACTER AND PURSUITS OF THE FAMOUS GENTLEMAN\n\nCHAPTER II\n\nA PROMISING DESCENT FROM THE MOUNTAIN\n\nCHAPTER I\n\n'+story;
  const blocks=structureClassicText(source);
  expect(blocks[firstClassicStoryBlock(blocks)].text).toBe('CHAPTER I');
  expect(firstClassicStoryBlock(blocks)).toBe(blocks.length-2);
 });
 it('works for empty and already clean editions',()=>{
  expect(firstClassicStoryBlock([])).toBe(0);
  expect(classicStoryPage([],42)).toBe(0);
  const chapters=structureClassicText('CHAPTER I\n'+story);
  expect(firstClassicStoryBlock(chapters)).toBe(0);
 });
});
