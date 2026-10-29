import {describe,expect,it} from 'vitest';
import {selectHomeReading,visibleHomeReading,chapterReadingPercent,readingReturnPath,searchHomeReading} from './readingHomeShelf';

const row=(id,extra={})=>({
 work_id:id,chapter_id:'chapter-'+id,completed:false,chapter_progress_percent:47,
 works:{id,title:'Work '+id,slug:'story-'+id,publication_status:'published'},...extra
});

describe('private home reading shelf',()=>{
 it('keeps only unfinished published work, in the supplied recent-first order',()=>{
  const result=selectHomeReading([
   row('done',{completed:true}),
   row('hidden',{works:{id:'hidden',slug:'hidden',publication_status:'draft'}}),
   row('one'),row('one',{chapter_id:'older-chapter'}),row('two'),
   row('broken',{works:{id:'broken',slug:'',publication_status:'published'}}),row('three'),row('four')
  ]);
  expect(result.map(x=>x.work_id)).toEqual(['one','two','three']);
  expect(result[0].chapter_id).toBe('chapter-one');
 });
 it('handles absent relations and empty responses without inventing activity',()=>{
  expect(selectHomeReading(null)).toEqual([]);
  expect(selectHomeReading([null,row('no-work',{works:null}),row('good')])).toEqual([row('good')]);
  expect(selectHomeReading([row('good')],0)).toEqual([]);
 });
 it('never presents the previous member’s rows while accounts are switching',()=>{
  const shelf={memberId:'alice',rows:[row('private')]};
  expect(visibleHomeReading(shelf,'alice')).toHaveLength(1);
  expect(visibleHomeReading(shelf,'bob')).toEqual([]);
  expect(visibleHomeReading(shelf,null)).toEqual([]);
  expect(visibleHomeReading({memberId:'bob',rows:[]},'alice')).toEqual([]);
 });
 it('clamps the precise chapter position and suppresses invalid progress',()=>{
  expect(chapterReadingPercent(35.5)).toBe(36);
  expect(chapterReadingPercent(-12)).toBe(0);
  expect(chapterReadingPercent(190)).toBe(100);
  expect(chapterReadingPercent('')).toBeNull();
  expect(chapterReadingPercent('unknown')).toBeNull();
 });
 it('finds accented titles despite alternate accents and extra spaces',()=>{
  const items=[row('a',{works:{title:'Café at Midnight',slug:'cafe',publication_status:'published'}}),row('b')];
  expect(searchHomeReading(items,'  cafe   at midnight ')).toEqual([items[0]]);
  expect(searchHomeReading(items,'WORK B')).toEqual([items[1]]);
  expect(searchHomeReading(null,'x')).toEqual([]);
 });
 it('keeps a safe chapter destination, or falls back to the work',()=>{
  expect(readingReturnPath(row('a',{chapter_id:'chapter 1'}))).toBe('/work/story-a/chapter/chapter%201');
  expect(readingReturnPath(row('a',{chapter_id:null,works:{slug:'A & B',publication_status:'published'}}))).toBe('/work/A%20%26%20B');
 });
});
