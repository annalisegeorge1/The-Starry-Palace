import React from 'react';
import {it,expect,afterEach} from 'vitest';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {existsSync,readFileSync} from 'node:fs';
import PalaceGift from './PalaceGift';
import Gallery,{paintedFamilies,teaTiers} from './MoonlitTea';
afterEach(cleanup);
it('displays the right painting for every supported gift family and tier',()=>{
 const names={tea:'Teacup',lantern:'Lantern',crown:'Crown',inkwell:'Inkwell',book:'Book'};
 const {rerender}=render(<span/>);
 const sources=new Set();
 for(const family of paintedFamilies)for(const tier of teaTiers){
  rerender(<PalaceGift gift={{name:names[family.id],court_name:'Moon Garden'}} tier={tier}/>);
  const image=screen.getByRole('img',{name:family.name+' · '+tier+' watercolour'});
  const src=image.getAttribute('src');
  expect(src).toBe('/assets/palace-collectibles/'+family.asset+'-'+tier+'.png');
  sources.add(src);expect(existsSync('public'+src)).toBe(true);
  const file=readFileSync('public'+src);expect(file.subarray(1,4).toString()).toBe('PNG');
  expect(file.readUInt32BE(16)).toBeGreaterThan(500);
  expect(file.readUInt32BE(20)).toBeGreaterThan(500);
 }
 expect(sources.size).toBe(25);
});
it('lets members browse each collection without loading all 25 paintings at once',()=>{
 render(<Gallery/>);
 for(const family of paintedFamilies){
  const button=screen.getByRole('button',{name:family.name});
  fireEvent.click(button);
  expect(button.getAttribute('aria-pressed')).toBe('true');
  expect(screen.getAllByRole('img')).toHaveLength(5);
  for(const tier of teaTiers)expect(screen.getByRole('img',{name:family.name+' · '+tier+' watercolour'})).toBeTruthy();
 }
});
