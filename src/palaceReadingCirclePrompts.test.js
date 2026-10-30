import {describe,it,expect} from 'vitest';
import {PALACE_READING_CIRCLE_PROMPTS,makePalaceCircleDraft} from './palaceReadingCirclePrompts';
describe('editable literary circle prompts',()=>{
 it('offers original, neutral, age-appropriate discussion questions',()=>{
  expect(PALACE_READING_CIRCLE_PROMPTS.length).toBeGreaterThanOrEqual(5);
  expect(PALACE_READING_CIRCLE_PROMPTS.every(p=>p.id&&p.category&&p.text)).toBe(true);
  expect(new Set(PALACE_READING_CIRCLE_PROMPTS.map(p=>p.id)).size).toBe(PALACE_READING_CIRCLE_PROMPTS.length);
 });
 it('does not overwrite an existing private draft and never sends data',()=>{
  expect(makePalaceCircleDraft('What happens next?','My notes')).toBe('My notes\n\nWhat happens next?');
  expect(makePalaceCircleDraft('What happens next?','')).toBe('What happens next?');
  expect(makePalaceCircleDraft('', 'My notes')).toBe('My notes');
  expect(makePalaceCircleDraft('x'.repeat(5000)).length).toBe(3000);
 });
});
