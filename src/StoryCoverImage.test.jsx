import React from 'react';
import {describe,it,expect} from 'vitest';
import {render,fireEvent} from '@testing-library/react';
import {readFileSync} from 'node:fs';
import StoryCoverImage,{DEFAULT_STORY_COVER,storyCoverSource} from './StoryCoverImage';

describe('simple default Palace story cover',()=>{
 it('uses the same lightweight asset for stories without an uploaded cover',()=>{
  expect(storyCoverSource(null)).toBe(DEFAULT_STORY_COVER);
  expect(storyCoverSource(' ')).toBe(DEFAULT_STORY_COVER);
  const {container}=render(<StoryCoverImage src={null}/>);
  const image=container.querySelector('img');
  expect(image?.getAttribute('src')).toBe(DEFAULT_STORY_COVER);
  expect(image?.getAttribute('alt')).toBe('');
  expect(image?.getAttribute('loading')).toBe('lazy');
 });
 it('preserves an author-provided uploaded cover',()=>{
  const source='https://images.example.invalid/cover.jpg';
  const {container}=render(<StoryCoverImage src={source}/>);
  expect(container.querySelector('img')?.getAttribute('src')).toBe(source);
 });
 it('shows the default cover when a remote image is broken',()=>{
  const {container}=render(<StoryCoverImage src="https://images.example.invalid/missing.png"/>);
  const image=container.querySelector('img');
  fireEvent.error(image);
  expect(image.getAttribute('src')).toBe(DEFAULT_STORY_COVER);
  fireEvent.error(image);
  expect(image.getAttribute('src')).toBe(DEFAULT_STORY_COVER);
 });
 it('keeps a simple scalable purple gradient and centered open-book illustration',()=>{
  const svg=readFileSync('public/assets/default-story-cover.svg','utf8');
  expect(svg).toContain('<svg');
  expect(svg).toContain('linearGradient');
  expect(svg).toContain('stroke="#fff"');
  expect(svg).not.toMatch(/<image\b|<script\b/i);
 });
});
