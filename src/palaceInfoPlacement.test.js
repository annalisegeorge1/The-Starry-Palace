import {describe,expect,it} from 'vitest';
import {palaceInfoPlacement} from './palaceInfoPlacement';
describe('Viewport-safe Palace help placement',()=>{
 const inside=(p,width,height)=>{
  expect(p.left).toBeGreaterThanOrEqual(0);
  expect(p.top).toBeGreaterThanOrEqual(0);
  expect(p.left+p.width).toBeLessThanOrEqual(width);
  expect(p.top+p.maxHeight).toBeLessThanOrEqual(height);
 };
 it('clamps left-edge help icons inside a narrow phone',()=>{
  const p=palaceInfoPlacement({left:8,width:36,top:190,bottom:226},{width:360,height:650},310);
  inside(p,360,650);
  expect(p.left).toBe(14);
 });
 it('clamps right-edge icons and preserves a readable width',()=>{
  const p=palaceInfoPlacement({left:338,width:38,top:130,bottom:168},{width:390,height:760},250);
  inside(p,390,760);
  expect(p.width).toBe(360);
 });
 it('opens upward with a bounded scroll region near the bottom dock',()=>{
  const p=palaceInfoPlacement({left:12,width:38,top:670,bottom:708},{width:375,height:740},520);
  inside(p,375,740);
  expect(p.placement).toBe('above');
  expect(p.maxHeight).toBeLessThanOrEqual(460);
 });
 it('does not produce negative coordinates even on a very small visual viewport',()=>{
  const p=palaceInfoPlacement({left:0,width:30,top:90,bottom:120},{width:235,height:225},600);
  inside(p,235,225);
 });
});
