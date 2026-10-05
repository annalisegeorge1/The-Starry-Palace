import {it,expect} from 'vitest';
import {treasures,treasureForGift,treasureCourts} from './treasureCatalogue';
import {giftEdition} from './PalaceGift';
import {readFileSync} from 'node:fs';
it('maps 600 distinct reward identities to real, complete artwork frames',()=>{
 expect(treasures).toHaveLength(600);
 expect(new Set(treasures.map(t=>t.gift_key)).size).toBe(600);
 expect(new Set(treasures.map(t=>t.name)).size).toBe(600);
 expect(treasureCourts).toHaveLength(21);
 const sheets=Array.from({length:7},(_,i)=>JSON.parse(readFileSync(`src/collectibleFrames.${i}.json`)));
 for(const item of treasures){
  expect(sheets[item.artSheet][item.id],item.id).toBeTruthy();
  expect(treasureForGift({name:item.name})).toBe(item);
  expect(treasureForGift({gift_key:item.gift_key})).toBe(item);
 }
});
it('does not replace a legacy owned gift with an unrelated treasure sharing its number',()=>{
 expect(treasureForGift({name:'Moon Garden Starlit Gazebo',catalogue_number:81})).toBeNull();
 expect(giftEdition({name:'Moon Garden Starlit Gazebo',catalogue_number:10081})).toBe('starlit');
 expect(giftEdition({name:treasures[0].name,catalogue_number:1})).toBe('court-treasures');
 expect(giftEdition({name:treasures[500].name,catalogue_number:501})).toBe('palace-keepsakes');
});
