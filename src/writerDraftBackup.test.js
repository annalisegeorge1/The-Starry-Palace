import {describe,it,expect} from 'vitest';
import {writerBackupFilename,writerBackupText,writerSavePhase} from './writerDraftBackup';

describe('writer draft backup',()=>{
 it('makes a readable, safe filename without leaking a path',()=>{
  expect(writerBackupFilename('Moonlit stories','Chapter 2: / The road?')).toBe('starry-palace-Chapter-2-The-road.txt');
  expect(writerBackupFilename('')).toBe('starry-palace-untitled-chapter.txt');
  expect(writerBackupFilename('','   ')).toBe('starry-palace-untitled-chapter.txt');
  expect(writerBackupFilename('', 'A'.repeat(250)).length).toBeLessThan(90);
 });
 it('preserves current unsaved draft text and a private note without HTML',()=>{
  const txt=writerBackupText({
   workTitle:'Sounds of a Black Dahlia',
   chapterTitle:'A new page',body:'Opening line.\r\nSecond line.',
   revisionNote:'Keep the ending quiet.',exportedAt:'2026-10-08 09:00'
  });
  expect(txt).toContain('Work: Sounds of a Black Dahlia');
  expect(txt).toContain('Chapter: A new page');
  expect(txt).toContain('Opening line.\nSecond line.');
  expect(txt).toContain('--- PRIVATE REVISION NOTE ---');
  expect(txt).toContain('Keep the ending quiet.');
  expect(txt).toContain('not confirmation of a cloud save');
  expect(writerBackupText({body:'Only text'})).not.toContain('PRIVATE REVISION NOTE');
 });
 it('shows pending, saved, recovery, or cloud failure honestly',()=>{
  expect(writerSavePhase()).toBe('ready');
  expect(writerSavePhase('Saving to Palace…')).toBe('pending');
  expect(writerSavePhase('New edits waiting to save…')).toBe('pending');
  expect(writerSavePhase('Saved to Palace')).toBe('saved');
  expect(writerSavePhase('Recovery copy kept on this device')).toBe('recovery');
  expect(writerSavePhase('Cloud save failed · export draft now')).toBe('attention');
  expect(writerSavePhase('Restored locally · unsaved cloud edits. Choose Save now.')).toBe('recovery');
  expect(writerSavePhase('Publication was not completed. Your chapter remains available.')).toBe('attention');
 });
});
