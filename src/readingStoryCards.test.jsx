import React from 'react';
import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {MemoryRouter} from 'react-router-dom';
import ReadingStoryStats from './ReadingStoryStats';
import ReadingStoryContext from './ReadingStoryContext';
const render=component=>renderToStaticMarkup(<MemoryRouter>{component}</MemoryRouter>);
describe('Reading Room card information',()=>{
 it('renders real counts with a chapter link and comments anchor',()=>{
  const html=render(<ReadingStoryStats work={{slug:'a-tale',completion_status:'complete',reading_stats:{words:62329,chapters:15,comments:16,bookmarks:52}}}/>);
  expect(html).toContain('62,329');expect(html).toContain('15/15');
  expect(html).toContain('16');expect(html).toContain('52');
  expect(html).toContain('/work/a-tale#comments');
 });
 it('shows incomplete works without inventing a total',()=>{
  const html=render(<ReadingStoryStats work={{slug:'ongoing',completion_status:'in_progress',reading_stats:{words:1000,chapters:3,comments:0,bookmarks:0}}}/>);
  expect(html).toContain('3/?');
 });
 it('does not invent statistics when a count is unavailable',()=>{
  const html=render(<ReadingStoryStats work={{slug:'untracked'}}/>);
  expect(html).toBe('');
 });
 it('shows stored summary and fandom on compact story cards',()=>{
  const html=render(<ReadingStoryContext work={{work_type:'fanwork',rating:'teen',completion_status:'complete',summary:'A road through the stars',work_tags:[{tags:{name:'Star Wars',category:'fandom',status:'canonical'}}]}}/>);
  expect(html).toContain('Star Wars');
  expect(html).toContain('A road through the stars');
  expect(html).toContain('Complete');
 });
});
