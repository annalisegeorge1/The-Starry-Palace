import React from 'react';
import {describe,it,expect} from 'vitest';
import {render,screen,cleanup} from '@testing-library/react';
import fs from 'node:fs';
import badges from './badges.json';
import {MergedBadgeArt,buildCourtForegroundMask,courtPortraitCellRect,findTransparentGridCuts,foregroundBounds,mergedBadgeArtwork,mergedBadgePathCount,mergedCourtPaths,mergedObjectPaths} from './MergedBadgeArt';

describe('merged 100-path badge artwork',()=>{
 it('absorbs exactly 25 object paintings and 60 court portraits into 17 existing paths',()=>{
  expect(Object.keys(mergedObjectPaths)).toHaveLength(5);
  expect(Object.keys(mergedCourtPaths)).toHaveLength(12);
  expect(mergedBadgePathCount).toBe(17);
  const ids=[...Object.keys(mergedObjectPaths),...Object.keys(mergedCourtPaths)];
  expect(new Set(ids).size).toBe(17);
  for(const id of ids)expect(badges.some(b=>b.id===id),id).toBe(true);
 });
 it('keeps all five object tiers backed by the existing watercolour PNGs',()=>{
  for(const [id,entry] of Object.entries(mergedObjectPaths)){
   for(const tier of ['bronze','silver','gold','platinum','emerald']){
    const art=mergedBadgeArtwork({id},tier);
    expect(art.type).toBe('object');
    expect(fs.existsSync('public/assets/palace-collectibles/'+entry.asset+'-'+tier+'.png')).toBe(true);
   }
  }
 });
 it('maps all twelve portrait paths to the three five-tier court sheets',()=>{
  const rows=new Set();
  for(const [id,entry] of Object.entries(mergedCourtPaths)){
   const art=mergedBadgeArtwork({id},'emerald');
   expect(art.type).toBe('court');
   expect(art.column).toBe(4);
   expect(entry.row).toBeGreaterThanOrEqual(0);
   expect(entry.row).toBeLessThan(4);
   expect(fs.existsSync('public/assets/palace-courts/'+entry.sheet+'.png')).toBe(true);
   rows.add(entry.sheet+':'+entry.row);
  }
  expect(rows.size).toBe(12);
 });
 it('renders both an object painting and a court portrait as badge art',()=>{
  const object=mergedBadgeArtwork({id:'infinite-inkwell'},'gold');
  const portrait=mergedBadgeArtwork({id:'cross-court-visitor'},'silver');
  const {rerender}=render(<MergedBadgeArt art={object} name="Infinite Inkwell"/>);
  expect(screen.getByRole('img',{name:'Infinite Inkwell · gold watercolour'}).getAttribute('src')).toContain('moonlit-inkwell-gold.png');
  cleanup();
  render(<MergedBadgeArt art={portrait} name="Cross-Court Visitor"/>);
  const portraitNode=screen.getByRole('img',{name:/Cross-Court Visitor · silver · Greek court watercolour/});
  expect(portraitNode).toBeTruthy();
  expect(portraitNode.getAttribute('data-court-cell')).toBe('1:2');
 });
 it('finds the real transparent gaps between court portraits instead of assuming equal sheet cells',()=>{
  const width=100,height=80,data=new Uint8ClampedArray(width*height*4);
  for(let row=0;row<4;row++)for(let col=0;col<5;col++){
   const left=col*20+3+(col===2?2:0),top=row*20+2+(row===1?2:0);
   for(let y=top;y<Math.min(top+15,height);y++)for(let x=left;x<Math.min(left+14,width);x++){
    data[(y*width+x)*4+3]=255;
   }
  }
  const mask=buildCourtForegroundMask({data},width,height);
  const xCuts=findTransparentGridCuts(mask,width,height,5,'x');
  const yCuts=findTransparentGridCuts(mask,width,height,4,'y');
  expect(xCuts).toHaveLength(6);expect(yCuts).toHaveLength(5);
  for(let i=1;i<5;i++)expect(Math.abs(xCuts[i]-i*20)).toBeLessThanOrEqual(4);
  for(let i=1;i<4;i++)expect(Math.abs(yCuts[i]-i*20)).toBeLessThanOrEqual(4);
  const b=foregroundBounds(mask,width,height,xCuts[2],yCuts[1],xCuts[3],yCuts[2]);
  expect(b.width).toBeGreaterThan(10);expect(b.height).toBeGreaterThan(10);
  const fallback=courtPortraitCellRect(1000,800,{column:4,row:3});
  expect(fallback).toEqual({x:800,y:600,width:200,height:200});
 });
 it('keeps object badges transparent and gives them tier-matched ornamental frames',()=>{
  const css=fs.readFileSync('src/treasury.css','utf8');
  const component=fs.readFileSync('src/PalaceBadge.jsx','utf8');
  expect(css).toContain('.approved-badge-stage{background:transparent');
  expect(css).toContain('.merged-badge-stage.is-object{');
  expect(css).toContain('.badge-tier-frame::before');
  expect(css).toContain('.tier-emerald .badge-tier-frame');
  expect(component).toContain('approved-badge-stage is-object badge-tier-frame');
  expect(component).toContain("is-object badge-tier-frame");
 });
});
