import{describe,it,expect}from'vitest';
import{PALACE_SLUGS,GRAND_PALACE_LORE,loreForPalace,palaceRivalryPairs,rivalForPalace,seasonFestival,dailyPalaceRitual}from'./grandPalaceLore';
describe('Grand Palace identities and festivals',()=>{
 it('gives each of the ten courts distinct lore, rituals, a festival and a welcoming oath',()=>{
  expect(PALACE_SLUGS).toHaveLength(10);
  expect(new Set(PALACE_SLUGS)).toHaveProperty('size',10);
  for(const slug of PALACE_SLUGS){const l=GRAND_PALACE_LORE[slug];expect(l.legend.length).toBeGreaterThan(70);expect(l.tradition).toBeTruthy();expect(l.festival).toBeTruthy();expect(l.rituals).toHaveLength(7)}
 });
 it('pairs every court once in each quarter and rotates its rival',()=>{
  const a=palaceRivalryPairs('2026-10-01'),b=palaceRivalryPairs('2027-01-01');
  expect(a.flat().sort((x,y)=>x-y)).toEqual([1,2,3,4,5,6,7,8,9,10]);
  expect(b.flat().sort((x,y)=>x-y)).toEqual([1,2,3,4,5,6,7,8,9,10]);
  expect(rivalForPalace(1,'2026-10-01')).not.toBe(rivalForPalace(1,'2027-01-01'));
 });
 it('shows each of three seasonal ceremonial chapters',()=>{
  expect(seasonFestival('2026-10-01',new Date('2026-10-08')).chapter).toBe(1);
  expect(seasonFestival('2026-10-01',new Date('2026-11-08')).chapter).toBe(2);
  expect(seasonFestival('2026-10-01',new Date('2026-12-08')).chapter).toBe(3);
 });
 it('returns an original ritual for the member\'s real court',()=>{
  expect(GRAND_PALACE_LORE['silver-crane'].rituals).toContain(dailyPalaceRitual('silver-crane',new Date('2026-10-07')));
  expect(loreForPalace('violet-star').epithet).toContain('Atelier');
 });
});
