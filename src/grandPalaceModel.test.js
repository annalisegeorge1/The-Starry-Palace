import{describe,it,expect}from'vitest';
import{HONOUR_SHOP,QUARTERLY_BOXES,prizeTierForRank,daysUntilSeasonEnd,formatHonourCount}from'./grandPalaceModel';
describe('Grand Palace awards',()=>{
 it('reserves Emerald for the single winning contributor',()=>{
  expect(prizeTierForRank(1)).toBe('emerald');
  expect(prizeTierForRank(2)).toBe('platinum');
  expect(prizeTierForRank(3)).toBe('gold');
  expect(prizeTierForRank(4)).toBe('silver');
  expect(prizeTierForRank(5)).toBe('silver');
  expect(prizeTierForRank(6)).toBe('bronze');
  expect(prizeTierForRank(10)).toBe('bronze');
  expect(prizeTierForRank(11)).toBeNull();
 });
 it('makes rare honours more costly to gift',()=>{
  expect(HONOUR_SHOP.map(x=>x.price)).toEqual([20,150,600,3000]);
  expect(QUARTERLY_BOXES).toHaveLength(5);
 });
 it('never shows a negative season countdown',()=>{
  expect(daysUntilSeasonEnd('2027-01-01T00:00:00Z',Date.parse('2026-12-31T12:00:00Z'))).toBe(1);
  expect(daysUntilSeasonEnd('2027-01-01T00:00:00Z',Date.parse('2027-01-02T00:00:00Z'))).toBe(0);
 });
 it('displays only earned/received honour, never purchased stock',()=>{
  expect(formatHonourCount([{honour:'crown',display_count:0,gift_stock:100}],'crown')).toBe(0);
 });
});
