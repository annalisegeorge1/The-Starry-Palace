import {describe,it,expect} from 'vitest';
import {filterPalaceSearchGroups,countPalaceSearchGroups,activePalaceSearchFacets,palaceSearchEmptyGroups} from './palaceSearchResults';
const data={
 works:[{id:'w1',title:'A Blue Shore',rating:'general',completion_status:'complete',last_published_at:'2026-02-11'},
        {id:'w2',title:'Zebra Moon',rating:'mature',completion_status:'in_progress',last_published_at:'2026-10-04'},
        {id:'w3',title:'Tender Night',rating:'not_rated',completion_status:'hiatus',last_published_at:'2025-12-01'}],
 comics:[{id:'c1',title:'A Comic',rating:'mature',completion_status:'complete',last_published_at:'2026-01-01'}],
 members:[{id:'p1'}],tags:[{id:'t1'}],clubs:[{id:'club'}],archive:[{id:'archive'}]
};
describe('Search Room facets and result ordering',()=>{
 it('keeps author, tag, club and archived results even when a content rating is selected',()=>{
  const filtered=filterPalaceSearchGroups(data,{rating:'mature'});
  expect(filtered.works.map(x=>x.id)).toEqual(['w2']);
  expect(filtered.comics.map(x=>x.id)).toEqual(['c1']);
  expect(filtered.members).toEqual(data.members);
  expect(filtered.tags).toEqual(data.tags);
  expect(filtered.archive).toEqual(data.archive);
  expect(countPalaceSearchGroups(filtered)).toBe(6);
  expect(countPalaceSearchGroups(filtered,'works')).toBe(1);
 });
 it('filters by rating AND progress, and does not modify source search ranking',()=>{
  expect(filterPalaceSearchGroups(data,{rating:'mature',completion:'complete'}).works).toEqual([]);
  expect(filterPalaceSearchGroups(data,{rating:'mature',completion:'complete'}).comics).toEqual(data.comics);
  expect(filterPalaceSearchGroups(data,{sort:'recent'}).works.map(x=>x.id)).toEqual(['w2','w1','w3']);
  expect(filterPalaceSearchGroups(data,{sort:'title'}).works.map(x=>x.id)).toEqual(['w1','w3','w2']);
  expect(data.works.map(x=>x.id)).toEqual(['w1','w2','w3']);
  expect(filterPalaceSearchGroups(data,{sort:'best'}).works).toEqual(data.works);
 });
 it('interprets missing ratings conservatively and handles empty data',()=>{
  expect(filterPalaceSearchGroups(data,{rating:'not_rated'}).works.map(x=>x.id)).toEqual(['w3']);
  expect(filterPalaceSearchGroups(null)).toEqual(palaceSearchEmptyGroups());
  expect(countPalaceSearchGroups(null)).toBe(0);
  expect(countPalaceSearchGroups(data,'nonexistent')).toBe(0);
  expect(activePalaceSearchFacets()).toBe(false);
  expect(activePalaceSearchFacets({rating:'teen'})).toBe(true);
 });
});
