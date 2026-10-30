import {describe,it,expect} from 'vitest';
import {choosePalaceStartingStory,palaceStoryPath,PALACE_FIRST_READING_DOORS} from './palaceLaunchDiscovery';

const story=(overrides={})=>({
 id:'public-work',title:'The Lantern House',slug:'lantern-house',summary:'A quiet story.',
 work_type:'original',rating:'general',completion_status:'complete',
 publication_status:'published',visibility:'public',...overrides
});
describe('honest Palace newcomer recommendations',()=>{
 it('chooses a published public completed general-audience original work',()=>{
  const candidates=[
   story({id:'adult',rating:'explicit'}),story({id:'ongoing',completion_status:'in_progress'}),
   story({id:'hidden',visibility:'unlisted'}),story({id:'draft',publication_status:'draft'}),
   story({id:'eligible'})
  ];
  expect(choosePalaceStartingStory(candidates)?.id).toBe('eligible');
 });
 it('never presents incomplete or unrated work as a completed safe starting recommendation',()=>{
  expect(choosePalaceStartingStory([
   story({rating:null}),story({completion_status:null}),story({work_type:'fanwork'}),
   story({summary:''}),story({title:''}),story({slug:null})
  ])).toBeNull();
  expect(choosePalaceStartingStory([])).toBeNull();
  expect(choosePalaceStartingStory(null)).toBeNull();
 });
 it('preserves chronological order among eligible titles without inventing a popularity rank',()=>{
  expect(choosePalaceStartingStory([story({id:'first'}),story({id:'second'})]).id).toBe('first');
 });
 it('uses safe story routes and real public discovery destinations',()=>{
  expect(palaceStoryPath('moonlight')).toBe('/work/moonlight');
  expect(palaceStoryPath('teahouse stories')).toBe('/work/teahouse%20stories');
  expect(palaceStoryPath('../private')).toBe('/reading');
  expect(PALACE_FIRST_READING_DOORS.map(x=>x.href)).toEqual(['/reading','/fandoms','/comics']);
 });
});
