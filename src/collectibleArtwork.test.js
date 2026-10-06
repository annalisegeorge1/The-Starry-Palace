import {describe,it,expect} from 'vitest';
import {readFileSync,existsSync} from 'node:fs';
import catalogue from './originalCollectibles.json';
describe('restored original artwork',()=>{
 const items=[...catalogue.prizes,...catalogue.gifts];
 const sheets=Array.from({length:7},(_,i)=>JSON.parse(readFileSync(new URL('./collectibleFrames.'+i+'.json',import.meta.url),'utf8')));
 it('restores exactly 500 distinct court prizes and 100 gift variants',()=>{
  expect(catalogue.prizes).toHaveLength(500);expect(catalogue.gifts).toHaveLength(100);
  expect(new Set(items.map(i=>i.id)).size).toBe(600);
  expect(new Set(catalogue.prizes.map(i=>i.court)).size).toBe(20);
  for(const court of new Set(catalogue.prizes.map(i=>i.court)))expect(catalogue.prizes.filter(i=>i.court===court)).toHaveLength(25);
 });
 it('maps every item to its own in-bounds artwork and an existing sheet',()=>{
  const positions=new Set();
  for(const item of items){
   const frame=sheets[item.artSheet][item.id];
   expect(frame,item.id).toBeTruthy();
   const [x,y,w,h]=frame.box;
   expect(x).toBeGreaterThanOrEqual(0);expect(y).toBeGreaterThanOrEqual(0);
   expect(w).toBeGreaterThan(0);expect(h).toBeGreaterThan(0);
   expect(x+w).toBeLessThanOrEqual(frame.width);expect(y+h).toBeLessThanOrEqual(frame.height);
   expect(frame.clip.length).toBeGreaterThan(0);
   expect(existsSync('public/assets/palace-collectibles/'+frame.asset)).toBe(true);
   positions.add(frame.asset+':'+frame.box.join(','));
  }
  expect(positions.size).toBe(600);
 });
 it('keeps the three Majapahit repaint corrections smaller and uncropped',()=>{
  const component=readFileSync('src/PalaceCollectibles.jsx','utf8');
  const css=readFileSync('src/treasury.css','utf8');
  expect(component).toContain("'palace-prize-majapahit-3':.72");
  expect(component).toContain("'palace-prize-majapahit-8':.70");
  expect(component).toContain("'palace-prize-majapahit-9':.72");
  expect(component).toContain('majapahit-repainted-fix');
  expect(css).toContain('.repainted-collectible-stage>img');
  expect(css).toContain('transform:scale(var(--repaint-scale,.9))');
  expect(css).toContain('.treasure-painting.compact .majapahit-repainted-fix>img');
 });
 it('ships each individually painted Moonlit Tea tier',()=>{
  for(const tier of ['bronze','silver','gold','platinum','emerald']){
   expect(existsSync('public/assets/palace-collectibles/moonlit-tea-'+tier+'.png')).toBe(true);
  }
 });
});

