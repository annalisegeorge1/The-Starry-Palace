import {describe,it,expect} from 'vitest';
import {buildLibraryOverview,newerPublishedSince} from './libraryOverviewModel';

const work=(id,extra={})=>({id,title:'Story '+id,slug:'story '+id,cover_url:null,...extra});
const comic=(id,extra={})=>({id,title:'Comic '+id,slug:'comic '+id,...extra});
const started='2026-10-15T12:00:00Z',released='2026-10-20T12:00:00Z';

describe('My Library overview — read-only shelves',()=>{
 it('separates unfinished, finished, and saved-for-later stories and comics',()=>{
  const view=buildLibraryOverview({
   progress:[
    {work_id:'a',chapter_id:'chapter-1',completed:false,updated_at:started,chapter_progress_percent:34,works:work('a')},
    {work_id:'b',chapter_id:'chapter-2',completed:true,updated_at:started,works:work('b')},
    {work_id:'c',chapter_id:'chapter-3',completed:true,updated_at:started,works:work('c',{last_published_at:released})}
   ],
   comicProgress:[{comic_id:'c1',episode_id:'ep 1',completed:true,updated_at:started,comics:comic('c1')}],
   saved:[{saved_at:started,works:work('a')},{saved_at:released,works:work('fresh')}],
   savedComics:[{saved_at:released,comics:comic('fresh')}],
   subscriptions:[{work_id:'c',enabled:true,works:work('c',{last_published_at:released})}]
  },{collections:[{id:'k1',name:'Dream Worlds'}],lists:[{id:'l1',name:'Autumn Reads'}],notes:[{id:'n'}]});
  expect(view.counts.reading).toBe(2);
  expect(view.counts.finished).toBe(2);
  expect(view.counts.later).toBe(2);
  expect(view.counts.updates).toBe(1);
  expect(view.continueReading.find(x=>x.key==='story:c').href).toBe('/work/story%20c');
  expect(view.continueReading.find(x=>x.key==='story:a').href).toBe('/work/story%20a/chapter/chapter-1');
  expect(view.savedForLater.map(x=>x.key)).toEqual(['story:fresh','comic:fresh']);
  expect(view.collectionPreview[0].name).toBe('Dream Worlds');
  expect(view.listPreview[0].name).toBe('Autumn Reads');
  expect(view.counts.notes).toBe(1);
 });
 it('only announces verified published updates newer than recorded reading dates',()=>{
  expect(newerPublishedSince(released,started)).toBe(true);
  expect(newerPublishedSince(started,released)).toBe(false);
  expect(newerPublishedSince(released,null)).toBe(false);
  expect(newerPublishedSince('bad',started)).toBe(false);
  const view=buildLibraryOverview({
   progress:[{work_id:'recent',updated_at:released,works:work('recent')}],
   subscriptions:[{work_id:'recent',enabled:true,works:work('recent',{last_published_at:started})},
     {work_id:'unread',enabled:true,works:work('unread',{last_published_at:released})}],
   comicSubscriptions:[{comic_id:'no-progress',enabled:true,comics:comic('no-progress',{last_published_at:released})}]
  });
  expect(view.counts.updates).toBe(0);
 });
 it('keeps malformed or missing relations out of links, deduplicates entries, and handles empty records',()=>{
  expect(buildLibraryOverview().counts.reading).toBe(0);
  const view=buildLibraryOverview({
   progress:[{work_id:'x',chapter_id:'abc',completed:false,works:work('x')},
    {work_id:'x',chapter_id:'def',completed:false,works:work('x')},
    {work_id:'lost',works:{id:'lost',slug:null}}],
   comicProgress:[{comic_id:'p',episode_id:'part/1',updated_at:started,comics:comic('p')}],
   saved:[{works:{id:'broken',slug:null}}]
  });
  expect(view.counts.reading).toBe(2);
  expect(view.continueReading.find(x=>x.type==='comic').href).toBe('/comic/comic%20p/episode/part%2F1');
  expect(view.counts.later).toBe(0);
 });
});
