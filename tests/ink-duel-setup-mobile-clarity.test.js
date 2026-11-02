import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';

const live=readFileSync('src/liveRooms.jsx','utf8');
const style=readFileSync('src/ink-duel-setup-mobile-clarity.css','utf8');
const main=readFileSync('src/main.jsx','utf8');
const writing=live.slice(live.indexOf('export function WritingLive'),live.indexOf('export function ',live.indexOf('export function WritingLive')+20));
const dialog=writing.slice(writing.indexOf('<PalaceDialog open={duelOpen}'),writing.indexOf('<PalaceDialog open={relayOpen}'));

describe('Ink Duel setup dialog clarity',()=>{
 it('places draw controls after the prompt and keeps help beside the heading',()=>{
  const prompt=dialog.indexOf('<label>Prompt<textarea');
  const basis=dialog.indexOf('<div className="duel-basis-draw"');
  const special=dialog.indexOf('<div className="duel-twist-label"');
  expect(prompt).toBeGreaterThan(0);
  expect(basis).toBeGreaterThan(prompt);
  expect(special).toBeGreaterThan(basis);
  expect(dialog).toContain('className="duel-basis-heading"');
  expect(dialog).toContain('Shared word and topic rules');
  expect(dialog).toContain("pullDuelBasis('word')");
  expect(dialog).toContain("pullDuelBasis('topic')");
  expect(style).toContain('.ink-duel-dialog .duel-basis-draw{');
  expect(style).toContain('position:static!important');
  expect(style).toContain('grid-template-columns:repeat(2,minmax(0,1fr))!important');
 });
 it('exposes a readable judging note instead of a standalone warning icon',()=>{
  expect(dialog).toContain('<div className="duel-seal-note" role="note">');
  expect(dialog).toContain('Blind voting protects the duel.');
  expect(dialog).toContain('competitors cannot vote.');
  expect(dialog).toContain('Shared word and topic rules');
  expect(dialog).toContain('Blind voting and judging rules');
  expect(dialog).not.toContain('title="Blind voting and judging rules" variant="warning"');
 });
 it('preserves form actions and makes a missing title or prompt explicit',()=>{
  expect(dialog).toContain('id="ink-duel-form"');
  expect(dialog).toContain('onSubmit={openDuel}');
  expect(dialog).toContain('form="ink-duel-form"');
  expect(dialog).toContain('disabled={duelBusy===\'create\'||!duelForm.title.trim()||!duelForm.prompt.trim()}');
  expect(dialog).toContain('className="duel-submit-hint" role="status"');
  expect(dialog).toContain('Add a duel title to continue.');
  expect(dialog).toContain('Add a shared prompt to continue.');
  expect(style).toContain('-webkit-text-fill-color:#fff!important');
 });
 it('provides obvious aria-pressed creative form, competition and pressure selections',()=>{
  expect(dialog).toContain('aria-pressed={duelForm.contentType===key}');
  expect(dialog).toContain('aria-pressed={duelForm.matchType===key}');
  expect(dialog).toContain('aria-pressed={duelForm.mode===mode}');
  expect(style).toContain('border:2px solid #dabdff!important');
  expect(style).toContain('button[aria-pressed="true"]');
 });
 it('reserves a mobile-safe scrollable dialog above its fixed action footer',()=>{
  expect(main.indexOf("import './ink-duel-setup-mobile-clarity.css';")).toBeGreaterThan(main.indexOf("import './writing-chamber-mobile-clarity.css';"));
  expect(style).toContain('.palace-dialog-backdrop:has(>.ink-duel-dialog)');
  expect(style).toContain('max-height:calc(100dvh - 32px)!important');
  expect(style).toContain('overflow-y:auto!important');
  expect(style).toContain('padding:12px 15px max(120px,calc(120px + env(safe-area-inset-bottom,0px)))!important');
  expect(style).toContain('.ink-duel-dialog>footer{');
  expect(style).toContain('flex:0 0 auto!important');
  expect(style).toContain('grid-template-columns:repeat(2,minmax(0,1fr))!important');
  expect(style).toContain('@media(forced-colors:active)');
  expect(style).toContain('@media(prefers-reduced-motion:reduce)');
 });
});
