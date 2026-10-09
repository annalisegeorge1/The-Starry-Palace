import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {structureClassicText} from './classicTextStructure';
import {firstClassicStoryBlock,paginateClassicBlocks,classicContents} from './archiveReaderModel';

const prose='The carriage arrived at the gates after the storm, and everyone in the town gathered to find out what happened. '.repeat(4);

describe('Named historical edition structures',()=>{
 it('opens The Three Musketeers at its numbered narrative, not a TOC entry or the author preface',()=>{
  const first='1 THE THREE PRESENTS OF D’ARTAGNAN THE ELDER';
  const raw=['THE THREE MUSKETEERS','CONTENTS',first,'2 THE ANTECHAMBER OF M. DE TREVILLE',
    'AUTHOR’S PREFACE',prose,first,prose,'2 THE ANTECHAMBER OF M. DE TREVILLE',prose].join('\n\n');
  const blocks=structureClassicText(raw);
  const index=firstClassicStoryBlock(blocks);
  expect(blocks.filter(b=>b.kind==='heading').map(b=>b.text)).toContain('AUTHOR’S PREFACE');
  expect(index).toBeGreaterThan(4);
  expect(blocks[index]).toEqual({kind:'heading',text:first});
  const pages=paginateClassicBlocks(blocks,3,index);
  expect(pages.flat().map(b=>b.text)).toEqual(blocks.map(b=>b.text));
  expect(classicContents(pages,index).map(b=>b.title)).toEqual([first,'2 THE ANTECHAMBER OF M. DE TREVILLE']);
 });
 it('keeps the Middlemarch Prelude as the true story opening before Chapter I',()=>{
  const raw=['CONTENTS','BOOK I','BOOK II','PRELUDE',prose,'BOOK I.','MISS BROOKE','CHAPTER I.',prose].join('\n\n');
  const blocks=structureClassicText(raw);
  const start=firstClassicStoryBlock(blocks);
  expect(blocks[start]).toEqual({kind:'heading',text:'PRELUDE'});
  expect(blocks.slice(start+1).some(b=>b.text==='CHAPTER I.')).toBe(true);
 });
 it('recognises Bleak House Roman headings without promoting ordinary numbered sentences',()=>{
  const raw='I. In Chancery\n\n'+prose+'\n\nII. In Fashion\n\n'+prose;
  const blocks=structureClassicText(raw);
  expect(blocks.filter(b=>b.kind==='heading').map(b=>b.text)).toEqual(['I. In Chancery','II. In Fashion']);
  expect(firstClassicStoryBlock(blocks)).toBe(0);
  expect(structureClassicText('1 person walked into the room.\n\n'+prose)[0].kind).toBe('paragraph');
  expect(structureClassicText('1 THIS IS A COMPLETE CHAPTER TITLE')[0].kind).toBe('heading');
 });
 it('separates translator prefatory matter and illustration transcriptions without erasing them',()=>{
  const note='[Illustration: Bookshelf spines]';
  const raw='TRANSLATOR’S PREFACE\n\n'+prose+'\n\n'+note+'\n\nCHAPTER I\n\n'+prose;
  const blocks=structureClassicText(raw);
  expect(blocks[0].text).toBe('TRANSLATOR’S PREFACE');
  expect(blocks[0].kind).toBe('heading');
  expect(blocks.find(b=>b.text===note)?.kind).toBe('illustration');
  expect(blocks[firstClassicStoryBlock(blocks)].text).toBe('CHAPTER I');
  expect(blocks.map(b=>b.text).join(' ')).toContain(note);
  expect(structureClassicText('The note [Illustration: portrait] was cited in the manuscript.')[0].kind).toBe('paragraph');
 });
 it('preserves ordinary novels, multiple chapters and excerpt sources in full',()=>{
  const raw='CHAPTER I\n\n'+prose+'\n\nCHAPTER II\n\n'+prose;
  const blocks=structureClassicText(raw);
  expect(firstClassicStoryBlock(blocks)).toBe(0);
  expect(blocks.map(b=>b.kind)).toEqual(['heading','paragraph','heading','paragraph']);
 });
 it('actually renders source captions as accessible notes rather than imaginary artwork',()=>{
  const reader=readFileSync(resolve(process.cwd(),'src/ArchiveClassicReader.jsx'),'utf8');
  const styles=readFileSync(resolve(process.cwd(),'src/classic-edition-caption.css'),'utf8');
  expect(reader).toContain("block.kind==='illustration'");
  expect(reader).toContain('aria-label="Original-edition illustration description"');
  expect(reader).toContain("import './classic-edition-caption.css'");
  expect(styles).toContain('.archive-classic-illustration-note');
  expect(styles).toContain('tone-paper');
  expect(styles).toContain('tone-soft');
 });
});