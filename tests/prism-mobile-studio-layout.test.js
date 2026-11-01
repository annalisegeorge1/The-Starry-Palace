import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';

const studio=readFileSync('src/MemberChamberDecor.jsx','utf8');
const frames=readFileSync('src/ChamberFramePicker.jsx','utf8');
const css=readFileSync('src/prism-mobile-studio-refinement.css','utf8');
const entry=readFileSync('src/main.jsx','utf8');

describe('Prism Atelier mobile refinement preserves real member choices',()=>{
 it('keeps the mobile open/close action accessible and compact',()=>{
  expect(studio).toContain('aria-controls="prism-workspace" aria-expanded={open}');
  expect(studio).toContain("open?'← Back':'Open Prism Atelier ✧'");
  expect(studio).toContain('id="prism-workspace"');
  expect(css).toContain('prism-studio-heading.is-open');
 });
 it('keeps points available distinct from paid colour purchase',()=>{
  expect(studio).toContain('prism-inline-balance');
  expect(studio).toContain('pts available');
  expect(studio).toContain('Purchase {choice.name} · {choice.price} pts');
  expect(studio).toContain('purchasePrismPalette(choice.slug)');
  expect(studio).toContain('selectPrismPalette(palette,finish,accent)');
  expect(studio).toContain('saveMemberChamberDecor(decor.backdrop,ornament,layout)');
 });
 it('retains frames, their unlock checks and saving event',()=>{
  expect(frames).toContain('CHAMBER_FRAMES.map(');
  expect(frames).toContain('chamberFrameUnlocked(frame,decor?.unlocks)');
  expect(frames).toContain('savePaintedChamberFrame(selected||null)');
  expect(frames).toContain("'palace:frame-changed'");
  expect(frames).toContain('painted-frame-none-ring');
  expect(frames).toContain('painted-frame-action');
 });
 it('uses a swipeable palette, compact selects and vertical saved-looks controls',()=>{
  expect(css).toContain('mask-image:linear-gradient(to right');
  expect(css).toContain('height:39px!important;min-height:39px!important;max-height:39px!important');
  expect(css).toContain('grid-template-columns:minmax(0,1fr)!important;gap:9px!important');
  expect(studio).toContain('savePrismLook(slot,lookName,palette,finish,accent)');
 });
 it('preserves mobile profile stats and dock clearance',()=>{
  expect(css).toContain('padding-bottom:max(190px,calc(160px + env(safe-area-inset-bottom,0px)))');
  expect(css).toContain('min-height:0!important;padding-bottom:8px!important');
  expect(entry).toContain("import './prism-mobile-studio-refinement.css';");
 });
});
