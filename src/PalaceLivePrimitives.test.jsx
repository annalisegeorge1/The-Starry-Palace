import React from 'react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {PalaceDialog,State} from './PalaceLivePrimitives';
afterEach(cleanup);

describe('Shared Palace loading, error and dialog primitives',()=>{
 it('shows a coherent loading room without rendering unfinished content',()=>{
  render(<State loading><button>Should stay hidden</button></State>);
  expect(screen.getByRole('status').textContent).toContain('Gathering the room beneath the stars');
  expect(screen.queryByRole('button',{name:'Should stay hidden'})).toBeNull();
 });
 it('labels room errors for accessibility',()=>{
  render(<State error="Connection unavailable"/>);
  expect(screen.getByRole('alert').textContent).toContain('Connection unavailable');
 });
 it('keeps readable empty-room content',()=>{
  render(<State empty="Nothing found yet"/>);
  expect(screen.getByText('Nothing found yet')).toBeTruthy();
 });
 it('keeps ordinary page children unchanged when ready',()=>{
  render(<State><p>Ready to explore</p></State>);
  expect(screen.getByText('Ready to explore')).toBeTruthy();
 });
 it('portals Palace dialogs and preserves dismissal and actions',()=>{
  const onClose=vi.fn();
  render(<PalaceDialog open title="Account safety" eyebrow="SETTINGS" onClose={onClose}
   actions={<button type="button">Keep changes</button>}><p>Review this decision.</p></PalaceDialog>);
  const dialog=screen.getByRole('dialog',{name:'Account safety'});
  expect(dialog.getAttribute('aria-modal')).toBe('true');
  expect(screen.getByText('Review this decision.')).toBeTruthy();
  expect(screen.getByRole('button',{name:'Keep changes'})).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'Close'}));
  expect(onClose).toHaveBeenCalledTimes(1);
 });
 it('does not add hidden dialogs to the page',()=>{
  render(<PalaceDialog open={false} title="Closed">Hidden</PalaceDialog>);
  expect(screen.queryByRole('dialog')).toBeNull();
 });
});
