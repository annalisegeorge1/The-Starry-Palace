import {describe,it,expect} from 'vitest';
import {approvedBadgeFrame} from './ApprovedBadgeArt';
import sheets from './approvedBadgeSheets.json';
import badges from './badges.json';
import fs from 'node:fs';

describe('approved achievement paintings',()=>{
 it('maps 100 exact families to 500 distinct, in-bounds tier cells',()=>{
  const seen=new Set();
  expect(Object.keys(sheets)).toHaveLength(100);
  for(const [id,entry] of Object.entries(sheets)){
   expect(badges.find(b=>b.id===id)?.name).toBe(entry.name);
   expect(fs.existsSync('public/assets/palace-courts/'+entry.asset)).toBe(true);
   for(const tier of ['bronze','silver','gold','platinum','emerald']){
    const frame=approvedBadgeFrame({id},tier);
    const [x,y,w,h]=frame.box;
    expect(x).toBeGreaterThanOrEqual(0);expect(y).toBeGreaterThanOrEqual(0);
    expect(x+w).toBeLessThanOrEqual(frame.width+.001);
    expect(y+h).toBeLessThanOrEqual(frame.height+.001);
    seen.add(frame.asset+frame.box.join(','));
    expect(approvedBadgeFrame({id:'database-uuid',name:entry.name},tier)).toEqual(frame);
   }
  }
  expect(seen.size).toBe(500);
 });
 it('does not assign an unrelated illustration to an unknown achievement',()=>{
  expect(approvedBadgeFrame({id:'unknown',name:'Unknown'})).toBeNull();
 });
});

it('keeps crop boundaries between rows instead of cutting by equal sheet divisions',()=>{
 for(const family of Object.values(sheets)){
  expect(family.frames).toHaveLength(5);
  for(const [x,y,w,h] of family.frames){expect(w).toBeGreaterThan(30);expect(h).toBeGreaterThan(30);}
 }
 const shelf=approvedBadgeFrame({id:'collection-curator'},'emerald');
 expect(shelf.box[1]).toBeGreaterThan(1500);
 expect(shelf.box[1]+shelf.box[3]).toBeLessThanOrEqual(shelf.height);
});
