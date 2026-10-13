import {describe,it,expect} from 'vitest';
import {buildLibraryHistoryEntries,filterLibraryHistory,groupLibraryHistory} from './libraryHistoryChronicleModel';

const saved={
 work_id:'work-private',chapter_id:'chapter-seven',updated_at:'2026-10-11T11:00:00Z',
 progress_percent:43,chapter_progress_percent:71,completed:false,
 works:{id:'work-private',title:'A River Beneath the Stars',slug:'river-stars',
  summary:'An original story',last_published_at:'2026-10-13T09:00:00Z'}
};
const comic={comic_id:'comic-1',episode_id:'episode-two',completed:false,updated_at:'2026-10-12T14:00:00Z',
 comics:{id:'comic-1',title:'The Sapphire',slug:'sapphire-tide'}};
const story={work:{id:'public-1',title:'Letters of Midnight',slug:'letters-midnight',summary:'A moonlit mystery',
 last_published_at:'2026-10-13T12:00:00Z',profiles:{display_name:'June'}},
 details:{chapterCount:2,wordCount:4031,chapterTitle:'Lost in the Palace',
 changeKind:'updated',lastChangedAt:'2026-10-13T12:00:00Z'}};
const community={threads:[{id:'talk-1',title:'The Commons gathers',created_at:'2026-10-10T08:00:00Z',body:'Let us talk about books'}]};
const records=()=>buildLibraryHistoryEntries({
 progress:[saved],comicProgress:[comic],stories:[story],community,chaptersReady:true,
 historyChapters:{'work-private':[{status:'published',word_count:1320,title:'Chapter 1',published_at:'2026-10-01T00:00:00Z'}]}
});

describe('Unified My Library History model',()=>{
 it('combines private reading with public story updates and community moments',()=>{
  const all=records();
  expect(all).toHaveLength(4);
  expect(all.filter(x=>x.private).map(x=>x.category)).toEqual(['reading','reading']);
  expect(all.filter(x=>!x.private).map(x=>x.category)).toEqual(['updates','community']);
  expect(all.find(x=>x.kind==='reading')).toMatchObject({
   progress:43,chapterPercent:71,newer:true,chapterCount:1,wordCount:1320,
   href:'/work/river-stars'
  });
  expect(all.find(x=>x.kind==='comic').href).toBe('/comic/sapphire-tide/episode/episode-two');
  expect(all.find(x=>x.category==='updates')).toMatchObject({
   title:'Letters of Midnight',chapterCount:2,wordCount:4031,
   label:'Chapter updated'
  });
 });
 it('searches and filters all categories and date ranges',()=>{
  const rows=records();
  expect(filterLibraryHistory(rows,{category:'reading'})).toHaveLength(2);
  expect(filterLibraryHistory(rows,{category:'community'})).toHaveLength(1);
  expect(filterLibraryHistory(rows,{category:'updates',query:'June'})).toHaveLength(1);
  expect(filterLibraryHistory(rows,{category:'reading',query:'mystery'})).toHaveLength(0);
  expect(filterLibraryHistory(rows,{query:'Sapphire'})).toHaveLength(1);
  expect(filterLibraryHistory(rows,{period:'week',now:new Date('2026-10-13T18:00:00Z')})).toHaveLength(4);
  expect(filterLibraryHistory(rows,{period:'week',now:new Date('2026-11-30T18:00:00Z')})).toHaveLength(0);
  expect(filterLibraryHistory(rows,{sort:'oldest'}).map(r=>r.kind)).toEqual(['community','reading','comic','stories']);
  expect(groupLibraryHistory(filterLibraryHistory(rows,{sort:'title'}),'title')[0].label).toBe('A–Z');
 });
 it('shows never invented public chapter totals when metadata was missing',()=>{
  const x=buildLibraryHistoryEntries({progress:[saved],stories:[story],historyChapters:{},chaptersReady:false});
  expect(x.find(r=>r.private)).toMatchObject({chapterCount:null,wordCount:null});
  expect(x.find(r=>!r.private)).toMatchObject({chapterCount:null,wordCount:null});
 });
 it('protects private reading history from community records',()=>{
  const privateRecord=records().find(r=>r.private);
  expect(privateRecord.category).toBe('reading');
  expect(privateRecord.label).toBe('New chapter since your saved place');
  expect(privateRecord.room).toBeNull();
  expect(privateRecord.href).not.toContain('/palace-life');
 });
});
