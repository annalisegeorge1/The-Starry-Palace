import {describe,it,expect} from 'vitest';
import {palaceCommandIcon,uniquePalaceCommandRecents} from './palaceCommandModel';
describe('quick navigation destinations',()=>{
 it('gives legacy history and quick actions the matching room symbol',()=>{
  expect(palaceCommandIcon('/palace-life?room=commons')).toBe('life');
  expect(palaceCommandIcon('/writing')).toBe('writing');
  expect(palaceCommandIcon('/library')).toBe('library');
  expect(palaceCommandIcon('/treasury?tab=draw')).toBe('treasury');
  expect(palaceCommandIcon('/reading?surprise=1')).toBe('activity');
  expect(palaceCommandIcon('/search?q=hello')).toBe('search');
 });
 it('collapses indistinguishable recent rooms while retaining distinct sections',()=>{
  const rows=[{path:'/palace-life?a=1',label:'Palace Life',detail:'Recently visited'}, {path:'/palace-life?a=2',label:'Palace Life',detail:'Recently visited'}, {path:'/palace-life?room=clubs',label:'Clubs',detail:'Palace Life · recently visited'}, {path:'/reading',label:'Read',detail:'Recently visited'}];
  expect(uniquePalaceCommandRecents(rows,'/reading')).toEqual([rows[0],rows[2]]);
 });
});
