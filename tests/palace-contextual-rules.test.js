import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const page=readFileSync(resolve(process.cwd(),'src/liveRooms.jsx'),'utf8');
const styles=readFileSync(resolve(process.cwd(),'src/PalaceInfoMark.css'),'utf8');

describe('Palace explanations use contextual ? and ! without hiding actions',()=>{
 it('keeps all Orrery actions and spin filters while moving its guide to a question mark',()=>{
  expect(page).toContain('PROMPT_ORRERY_RECIPES.length.toLocaleString()');
  expect(page).toContain('title="How the Prompt Orrery works"');
  expect(page).toContain('title="Mature horror and violent themes" variant="warning"');
  for(const required of ['spinPrompt','copyPrompt','bringPromptToDesk','promptFilterKeys','promptLocks'])expect(page).toContain(required);
 });
 it('preserves Ink Duel operations while putting stages, judging and gifts behind marks',()=>{
  for(const required of ['title="How Ink Duels work"','title="When a duel earns a gift"','title="Blind voting and judging rules"',
    'title="Competition styles"','pullDuelBasis','createMicroDuel','submitMicroDuelEntry','voteMicroDuel'])expect(page).toContain(required);
  expect(page).not.toContain('className="duel-how-it-works"');
 });
 it('moves detailed point economics behind ? without removing title progress',()=>{
  expect(page).toContain('title="Point awards, spending and seasonal scoring"');
  expect(page).toContain('CELESTIAL_CREATIVE_RULES');
  expect(page).toContain('CELESTIAL_ECONOMY_EXPLAINERS');
  expect(page).toContain('nextTitle.progress');
 });
 it('keeps both themes legible and the mobile bubble scrollable without animated overlays',()=>{
  expect(styles).toContain('.palace-shell.daylight');
  expect(styles).toContain('.palace-info-mark-trigger:focus-visible');
  expect(styles).toContain('@media(max-width:550px)');
  expect(styles).toContain('overscroll-behavior:contain');
  expect(styles).not.toContain('backdrop-filter');
  expect(styles).not.toMatch(/animation\s*:/);
 });
});
