import React from 'react';
import {describe,it,expect} from 'vitest';
import {render,screen,cleanup} from '@testing-library/react';
import fs from 'node:fs';
import badges from './badges.json';
import {MergedBadgeArt,courtPortraitCellRect,mergedBadgeArtwork,mergedBadgePathCount,mergedCourtPaths,mergedObjectPaths} from './MergedBadgeArt';

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
 it('uses exact non-overlapping court portrait cells so frames are never clipped by CSS sprite math',()=>{
  const first=courtPortraitCellRect(1000,800,{column:0,row:0});
  const last=courtPortraitCellRect(1000,800,{column:4,row:3});
  expect(first).toEqual({x:0,y:0,width:200,height:200});
  expect(last).toEqual({x:800,y:600,width:200,height:200});
  expect(last.x+last.width).toBe(1000);
  expect(last.y+last.height).toBe(800);
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
