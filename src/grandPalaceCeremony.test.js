import{describe,it,expect}from'vitest';
import{CEREMONY_STAGES,ceremonyStage,nextCeremonyStage,ceremonyProgress,ceremonyOrnaments,ceremonyQuarterLabel}from'./grandPalaceCeremony';
describe('Grand Palace Ceremony Hall',()=>{
 it('has five earned standards and advances strictly by verified per-member score',()=>{
  expect(CEREMONY_STAGES).toHaveLength(5);
  expect(ceremonyStage(0).name).toBe('Founding Crest');
  expect(ceremonyStage(24).name).toBe('Founding Crest');
  expect(ceremonyStage(25).name).toBe('Awakened Court');
  expect(ceremonyStage(150).name).toBe('Starlit Court');
  expect(ceremonyStage(500).name).toBe('Regal Court');
  expect(ceremonyStage(1500).name).toBe('Sovereign Constellation');
 });
 it('shows the next stage and a bounded progress percentage',()=>{
  expect(nextCeremonyStage(150).name).toBe('Regal Court');
  expect(nextCeremonyStage(1500)).toBeNull();
  expect(ceremonyProgress(0)).toBe(0);
  expect(ceremonyProgress(1500)).toBe(100);
  expect(ceremonyProgress(100)).toBeGreaterThan(0);
  expect(ceremonyProgress(100)).toBeLessThan(100);
 });
 it('honours exactly the actual permanent victory count, with compact display',()=>{
  expect(ceremonyOrnaments(0)).toHaveLength(0);
  expect(ceremonyOrnaments(1)).toHaveLength(1);
  expect(ceremonyOrnaments(3)).toHaveLength(3);
  expect(ceremonyOrnaments(27)).toHaveLength(7);
 });
 it('formats actual archived quarter labels without fabricating dates',()=>{
  expect(ceremonyQuarterLabel('2026-10-01')).toBe('Quarter 4 · 2026');
  expect(ceremonyQuarterLabel('2027-01-01')).toBe('Quarter 1 · 2027');
  expect(ceremonyQuarterLabel('bad-data')).toBe('Recorded season');
 });
});
