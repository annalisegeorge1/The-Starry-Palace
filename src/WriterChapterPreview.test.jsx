import React from 'react';
import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import WriterChapterPreview from './WriterChapterPreview';

describe('private manuscript preview',()=>{
 it('renders a real in-editor draft snapshot as a read-only chapter',()=>{
  const html=renderToStaticMarkup(<WriterChapterPreview preview={{title:'The Moon Garden',workTitle:'A Court of Stars',wordCount:62329,html:'<h2>CHAPTER I</h2><p>The first sentence.</p>'}}/>);
  expect(html).toContain('The Moon Garden');
  expect(html).toContain('62,329');
  expect(html).toContain('CHAPTER I');
  expect(html).toContain('The first sentence.');
  expect(html).toContain('Private preview');
  expect(html).toContain('does not publish or save your chapter');
  expect(html).not.toContain('contenteditable');
 });
 it('is transparent about empty and unsaved drafts',()=>{
  const html=renderToStaticMarkup(<WriterChapterPreview preview={{title:'',workTitle:'',wordCount:0,html:''}}/>);
  expect(html).toContain('Untitled chapter');
  expect(html).toContain('No chapter text yet');
  expect(html).toContain('may not have finished saving');
 });
});
