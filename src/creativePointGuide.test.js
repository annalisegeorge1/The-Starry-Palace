import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {cleanManuscriptGoal,manuscriptGoalProgress} from './manuscriptGoalModel';
import {celestialPointBreakdown,CELESTIAL_CREATIVE_RULES} from './creativePointGuide';

const live=readFileSync('src/liveRooms.jsx','utf8');
const css=readFileSync('src/palace-creative-points-polish.css','utf8');

describe('chapter word goals and transparent Celestial Points',()=>{
 it('sanitizes empty, pasted and extreme chapter goals without invalid progress',()=>{
  expect(cleanManuscriptGoal('1,500')).toBe('1500');
  expect(cleanManuscriptGoal('')).toBe('');
  expect(cleanManuscriptGoal('nonsense')).toBe('');
  expect(cleanManuscriptGoal('999999999')).toBe('1000000');
  expect(manuscriptGoalProgress(250,'500')).toEqual({target:500,percent:50,remaining:250});
  expect(manuscriptGoalProgress(600,'500')).toEqual({target:500,percent:100,remaining:0});
  expect(manuscriptGoalProgress(50,'')).toEqual({target:0,percent:0,remaining:0});
  expect(manuscriptGoalProgress(-10,'bad')).toEqual({target:0,percent:0,remaining:0});
 });
 it('counts earlier / reading rewards in the lifetime display without assuming they are all reading',()=>{
  const items=celestialPointBreakdown({lifetime_points:105,giving_points:20,receiving_points:30,participation_points:45});
  expect(items.map(x=>x.points)).toEqual([20,30,45,10]);
  expect(items[3].label).toMatch(/Reading & earlier/);
  expect(items.reduce((sum,x)=>sum+x.points,0)).toBe(105);
  expect(celestialPointBreakdown(null).every(x=>x.points===0)).toBe(true);
 });
 it('describes verified public publication, revision and reading safeguards',()=>{
  expect(CELESTIAL_CREATIVE_RULES.map(x=>x.reward)).toEqual(['+20','+10','+2']);
  const all=CELESTIAL_CREATIVE_RULES.map(x=>x.detail).join(' ');
  for(const phrase of ['150 words','150 additional words','60 per UTC day','24 hours','90 seconds','200 words','20 reading points'])expect(all).toContain(phrase);
 });
 it('integrates safe saved goals, truthful points guide and responsive designs',()=>{
  expect(live).toContain("writePalacePreference('chapter-goal:'+chapter.id,next)");
  expect(live).toContain("readPalacePreference('chapter-goal:'+ch.id,'1500')");
  expect(live).not.toContain("localStorage.setItem('chapter-goal:'+chapter.id");
  expect(live).toContain('manuscriptGoalProgress(wordCount,goal)');
  expect(live).toContain('onClick={()=>updateChapterGoal(String(n))}');
  expect(live).toContain('celestialPointBreakdown(celestial)');
  expect(live).toContain('CELESTIAL_CREATIVE_RULES.map(');
  expect(live).toContain('See fair points rules →');
  expect(css).toContain('grid-template-columns:repeat(4,minmax(0,1fr))');
  expect(css).toContain('@media(max-width:900px)');
  expect(css).toContain('.daylight');
  expect(css).toContain('focus-visible');
 });
});
