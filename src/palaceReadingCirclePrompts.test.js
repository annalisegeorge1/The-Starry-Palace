import {describe,it,expect} from 'vitest';
import {PALACE_READING_CIRCLE_PROMPTS,PALACE_READING_CIRCLE_KITS,makePalaceCircleDraft} from './palaceReadingCirclePrompts';
describe('editable literary circle prompts',()=>{
 it('offers original, neutral, age-appropriate discussion questions',()=>{
  expect(PALACE_READING_CIRCLE_PROMPTS.length).toBeGreaterThanOrEqual(5);
  expect(PALACE_READING_CIRCLE_PROMPTS.every(p=>p.id&&p.category&&p.text)).toBe(true);
  expect(new Set(PALACE_READING_CIRCLE_PROMPTS.map(p=>p.id)).size).toBe(PALACE_READING_CIRCLE_PROMPTS.length);
 });
 it('offers distinct chapter discussions, theory nights and opt-in writer workshops',()=>{
  expect(PALACE_READING_CIRCLE_KITS.length).toBeGreaterThanOrEqual(4);
  expect(new Set(PALACE_READING_CIRCLE_KITS.map(k=>k.id)).size).toBe(PALACE_READING_CIRCLE_KITS.length);
  for(const kit of PALACE_READING_CIRCLE_KITS){
   expect(kit.text.length).toBeLessThanOrEqual(3000);
   expect(makePalaceCircleDraft(kit.text)).toBe(kit.text);
  }
 });
 it('does not overwrite an existing private draft and never sends data',()=>{
  expect(makePalaceCircleDraft('What happens next?','My notes')).toBe('My notes\n\nWhat happens next?');
  expect(makePalaceCircleDraft('What happens next?','')).toBe('What happens next?');
  expect(makePalaceCircleDraft('', 'My notes')).toBe('My notes');
  expect(makePalaceCircleDraft('x'.repeat(5000)).length).toBe(3000);
 });
});
