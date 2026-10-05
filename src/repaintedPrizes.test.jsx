import React from 'react';
import {it,expect,afterEach} from 'vitest';
import {render,screen,cleanup} from '@testing-library/react';
import {CollectibleArt} from './PalaceCollectibles';
import catalogue from './originalCollectibles.json';
afterEach(cleanup);
it('uses separate full paintings for the four repaired original prizes',()=>{
 const ids=['majapahit-3','majapahit-8','majapahit-9','achaemenid-17'];
 for(const suffix of ids){
  const item=catalogue.prizes.find(i=>i.id==='palace-prize-'+suffix);
  const {unmount}=render(<CollectibleArt item={item}/>);
  const image=screen.getByRole('img',{name:item.name});
  expect(image.tagName).toBe('IMG');
  expect(image.getAttribute('src')).toBe('/assets/palace-courts/prize-'+suffix+'.png');
  expect(image.style.objectFit).toBe('contain');unmount();
 }
});
