import {describe,it,expect} from 'vitest';
import {PALACE_SLUGS} from './grandPalaceLore';
import {ROYAL_HOUSE_IDENTITY,royalHouseIdentity} from './grandPalaceRoyalIdentity';
import {shouldShowPalaceTidings,normalizePalaceTidings} from './palaceTidingsModel';
describe('Grand Palace ceremonial titles and mottos',()=>{
 it('covers ten established houses with unique member names',()=>{
  expect(Object.keys(ROYAL_HOUSE_IDENTITY).sort()).toEqual([...PALACE_SLUGS].sort());
  expect(new Set(Object.values(ROYAL_HOUSE_IDENTITY).map(x=>x.title)).size).toBe(10);
  for(const slug of PALACE_SLUGS)expect(royalHouseIdentity(slug)?.motto.length).toBeGreaterThan(10);
 });
 it('does not replace established sigils and art',()=>{
  expect(royalHouseIdentity('winter-phoenix')).toEqual({title:'The Ever-Risen',motto:'Not even winter shall end us.'});
 });
});
describe('Palace Tidings editorial safety',()=>{
 it('stays out of all reading and writing routes',()=>{
  for(const path of ['/reading','/reading?q=moon','/work/story','/work/story/chapter/one',
   '/writing','/writing/a-draft','/comic/story','/comic/story/episode/one','/comics/studio',
   '/lost-works','/library','/chamber','/settings','/login','/welcome','/ink-duels']){
   expect(shouldShowPalaceTidings(path),path).toBe(false);
  }
 });
 it('remains eligible on lively public and Palace community pages',()=>{
  for(const path of ['/','/events','/grand-palaces','/palace-life','/search'])expect(shouldShowPalaceTidings(path),path).toBe(true);
 });
 it('shows no invented winners while awards are unconfirmed',()=>{
  expect(normalizePalaceTidings([])).toEqual([]);
  expect(normalizePalaceTidings(null)).toEqual([]);
 });
 it('separates live ranking from finalized victories and rejects unknown event kinds',()=>{
  const items=normalizePalaceTidings([{id:'leading',kind:'current_leader',headline:'Azure Moon currently first'},{id:'done',kind:'season_winner',headline:'Silver Crane won'},{id:'done',kind:'season_winner',headline:'duplicate'},{id:'unsafe',kind:'imaginary',headline:'imaginary'}]);
  expect(items).toHaveLength(2);expect(items[0].label).toBe('CURRENTLY FIRST');expect(items[1].label).toBe('QUARTERLY CHAMPION');
 });
 it('only links into the Palace, ignoring untrusted URLs',()=>{
  expect(normalizePalaceTidings([{id:'x',kind:'lottery_winner',headline:'Winner',href:'https://evil.example'}])[0].href).toBe('/grand-palaces?tab=treasury');
 });
});
