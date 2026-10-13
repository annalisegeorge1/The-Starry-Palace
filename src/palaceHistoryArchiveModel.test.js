import {describe,it,expect} from 'vitest';
import {buildPalaceChronicle,filterPalaceChronicle,groupPalaceChronicle,palaceChronicleBucket} from './palaceHistoryArchiveModel';

const story={work:{id:'w1',slug:'star-and-sea',title:'Star & Sea',summary:'Two wanderers',last_published_at:'2026-10-11T12:00:00Z',profiles:{display_name:'Blue Moon'}},
 details:{chapterCount:15,wordCount:62329,changeKind:'updated',chapterTitle:'The Lighthouse',lastChangedAt:'2026-10-12T10:20:00Z'}};
const thread={id:'t1',title:'Gathering moonlight',body:'The Commons met tonight',created_at:'2026-10-13T11:00:00Z'};
const introduction={id:'i1',title:'Greetings',body:'A new member arrives',created_at:'2026-10-10T09:00:00Z'};
const recognition={id:'h1',title:'Golden star',reason:'A kind contribution',created_at:'2026-10-09T15:00:00Z'};
const records=()=>buildPalaceChronicle({threads:[thread],introductions:[introduction],highlights:[recognition],stories:[story],chaptersReady:true});

describe('Palace Life chronological History',()=>{
 it('unites real community and published work events with accurate dates and stats',()=>{
  const x=records();
  expect(x).toHaveLength(4);
  expect(x.find(e=>e.kind==='stories')).toMatchObject({
   label:'Chapter updated',chapterCount:15,wordCount:62329,chapterTitle:'The Lighthouse',href:'/work/star-and-sea'
  });
  expect(x.find(e=>e.kind==='forum').room).toBe('forum');
  expect(x.find(e=>e.kind==='stars').room).toBe('stars');
  expect(x.find(e=>e.kind==='highlights').room).toBe('highlights');
  expect(filterPalaceChronicle(x).map(e=>e.kind)).toEqual(['forum','stories','stars','highlights']);
 });
 it('searches chapter title, summary and author while narrowing by type',()=>{
  expect(filterPalaceChronicle(records(),{query:'lighthouse'})).toHaveLength(1);
  expect(filterPalaceChronicle(records(),{query:'blue moon'})).toHaveLength(1);
  expect(filterPalaceChronicle(records(),{kind:'stories',query:'wanderers'})).toHaveLength(1);
  expect(filterPalaceChronicle(records(),{kind:'forum',query:'wanderers'})).toHaveLength(0);
  expect(filterPalaceChronicle(records(),{kind:'forum',query:'moonlight'})).toHaveLength(1);
 });
 it('offers reliable date ranges and reverse order without mutating source data',()=>{
  const a=records(),now=new Date('2026-10-13T16:00:00Z');
  expect(filterPalaceChronicle(a,{now,period:'week'})).toHaveLength(4);
  expect(filterPalaceChronicle(a,{now,period:'month'})).toHaveLength(4);
  expect(filterPalaceChronicle(a,{now:new Date('2026-11-30T16:00:00Z'),period:'week'})).toHaveLength(0);
  expect(filterPalaceChronicle(a,{sort:'oldest'}).map(e=>e.kind)).toEqual(['highlights','stars','stories','forum']);
  expect(a[0].kind).toBe('forum');
 });
 it('does not claim chapter counts or updates when chapter details are unavailable',()=>{
  const x=buildPalaceChronicle({stories:[story],chaptersReady:false});
  expect(x[0]).toMatchObject({label:'Published story',chapterCount:null,wordCount:null,chapterTitle:null});
 });
 it('ignores malformed community timestamps and never creates fictitious events',()=>{
  const x=buildPalaceChronicle({threads:[{id:'bad',created_at:'not-a-date',body:'Ghost event'}],
    stories:[{work:{id:'no-slug',title:'Missing destination'},details:{}}]});
  expect(x).toEqual([]);
 });
 it('groups dates meaningfully for scanning and keeps original order',()=>{
  const now=new Date('2026-10-13T16:00:00Z'),groups=groupPalaceChronicle(filterPalaceChronicle(records()),now);
  expect(groups.map(g=>g.label)).toEqual(['Today','Yesterday','Earlier this week']);
  expect(groups.map(g=>g.items.length)).toEqual([1,1,2]);
  expect(palaceChronicleBucket(0,now)).toBe('Date not recorded');
 });
});
