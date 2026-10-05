import {describe,it,expect} from 'vitest';
import {approvedBadgeFrame} from './ApprovedBadgeArt';
import sheets from './approvedBadgeSheets.json';
import badges from './badges.json';
import fs from 'node:fs';

describe('approved achievement paintings',()=>{
 it('maps 80 exact families to 400 distinct, in-bounds tier cells',()=>{
  const seen=new Set();
  expect(Object.keys(sheets)).toHaveLength(80);
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
  expect(seen.size).toBe(400);
 });
 it('does not assign an unrelated illustration to an unknown achievement',()=>{
  expect(approvedBadgeFrame({id:'unknown',name:'Unknown'})).toBeNull();
 });
});
