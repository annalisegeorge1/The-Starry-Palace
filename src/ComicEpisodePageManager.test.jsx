import {describe,it,expect} from 'vitest';
import {movedComicPageIds} from './ComicEpisodePageManager';

const pages=[{id:'page-a'},{id:'page-b'},{id:'page-c'},{id:'page-d'}];
describe('Comic Studio page ordering',()=>{
 it('moves a dragged page before its drop target without dropping other pages',()=>{
  expect(movedComicPageIds(pages,'page-a','page-c')).toEqual(['page-b','page-c','page-a','page-d']);
 });
 it('supports movement towards the beginning',()=>{
  expect(movedComicPageIds(pages,'page-d','page-b')).toEqual(['page-a','page-d','page-b','page-c']);
 });
 it('does not alter order for missing or identical IDs',()=>{
  expect(movedComicPageIds(pages,'missing','page-a')).toEqual(['page-a','page-b','page-c','page-d']);
  expect(movedComicPageIds(pages,'page-a','page-a')).toEqual(['page-a','page-b','page-c','page-d']);
 });
 it('does not mutate the source episode pages',()=>{
  movedComicPageIds(pages,'page-a','page-d');
  expect(pages.map(p=>p.id)).toEqual(['page-a','page-b','page-c','page-d']);
 });
});
