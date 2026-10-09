import React from 'react';
import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {writerReleaseVisibility} from './writerReleaseVisibility';
import WriterReleaseInfo from './WriterReleaseInfo';

describe('writing publication clarity',()=>{
 it('does not suggest a private chapter automatically becomes public',()=>{
  const msg=writerReleaseVisibility({visibility:'private',publication_status:'draft'});
  expect(msg.label).toBe('Private');
  expect(msg.access).toContain('does not change the work to Public');
  expect(msg.notice).toContain('not marked published');
 });
 it('distinguishes member-only reading from public reading',()=>{
  const members=writerReleaseVisibility({visibility:'members',publication_status:'published'});
  const publicStory=writerReleaseVisibility({visibility:'public',publication_status:'published'});
  expect(members.label).toBe('Members only');
  expect(members.notice).toBeNull();
  expect(publicStory.access).toContain('may be available to public readers');
 });
 it('renders the visibility warning to writers before scheduling',()=>{
  const markup=renderToStaticMarkup(<WriterReleaseInfo work={{visibility:'private',publication_status:'draft'}}/>);
  expect(markup).toContain('Who can read this work?');
  expect(markup).toContain('Work settings');
  expect(markup).toContain('not marked published');
 });
});
