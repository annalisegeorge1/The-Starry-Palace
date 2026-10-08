import {describe,it,expect} from 'vitest';
import {storyOverviewStats} from './storyOverviewStats';

describe('public story overview statistics',()=>{
 it('counts only published chapters, never private draft words',()=>{
  const work={chapters:[
   {status:'published',word_count:1200},{status:'draft',word_count:9000},
   {status:'published',word_count:500},{status:'scheduled',word_count:850}
  ]};
  expect(storyOverviewStats(work,[],0)).toEqual({words:1700,chapters:2,comments:0,bookmarks:0});
 });
 it('counts only approved comments and keeps aggregate bookmarks',()=>{
  const stats=storyOverviewStats(
   {chapters:[{status:'published',word_count:62329}]},
   [{status:'approved'},{status:'pending'},{status:'approved'},{status:'rejected'}],
   52
  );
  expect(stats).toEqual({words:62329,chapters:1,comments:2,bookmarks:52});
 });
 it('distinguishes unavailable counts from an actual zero',()=>{
  const stats=storyOverviewStats({chapters:[]});
  expect(stats).toEqual({words:0,chapters:0,comments:null,bookmarks:null});
 });
 it('never lets negative or malformed word counts appear',()=>{
  expect(storyOverviewStats({chapters:[{status:'published',word_count:-14},{status:'published',word_count:'bad'}]}).words).toBe(0);
 });
});
