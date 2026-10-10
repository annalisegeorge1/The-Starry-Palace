import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/main.jsx', 'utf8');
const checker = source.slice(source.indexOf('function PalaceBuildFreshnessWatch(){'), source.indexOf('const TreasuryCatalogueLazy=', source.indexOf('function PalaceBuildFreshnessWatch(){')));

describe('Palace update checker lifecycle', () => {
 it('tracks every navigation and browser-resume timeout and cancels pending checks on cleanup', () => {
  expect(checker).toContain('const pendingChecks=new Set()');
  expect(checker).toContain('pendingChecks.add(timer)');
  expect(checker).toContain('pendingChecks.delete(timer)');
  expect(checker).toContain('pendingChecks.forEach(timer=>window.clearTimeout(timer))');
  expect(checker).toContain('window.clearInterval(interval)');
  expect(checker).toContain("document.removeEventListener('visibilitychange',onVisible)");
  expect(checker).toContain("window.removeEventListener('pageshow',onVisible)");
 });
 it('keeps draft-safety protections and the original auto-recovery behavior', () => {
  expect(checker).toContain('shouldOfferManualPalaceRefresh(location.pathname)');
  expect(checker).toContain('schedulePalaceReload');
  expect(checker).toContain('finish saving your work before reloading'.replace(/^finish/, 'Finish'));
 });
});
