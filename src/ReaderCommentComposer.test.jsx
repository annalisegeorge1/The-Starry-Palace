import React from 'react';
import {afterEach, expect, it, vi} from 'vitest';
import {cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react';
import ReaderCommentComposer from './ReaderCommentComposer';
import {addComment} from './palaceData';
vi.mock('./palaceData', () => ({addComment: vi.fn()}));
afterEach(() => { cleanup(); sessionStorage.clear(); vi.resetAllMocks(); });

it('keeps a failed spoiler draft across remount, isolated by chapter and account', async () => {
  const setError = vi.fn();
  const show = (userId, chapterId) => render(<ReaderCommentComposer userId={userId}
    workId="work" chapterId={chapterId} reload={vi.fn()} setError={setError}/>);
  const page = show('alice', 'one');
  fireEvent.change(screen.getByRole('textbox'), {target:{value:'Synthetic response'}});
  fireEvent.click(screen.getByRole('checkbox'));
  addComment.mockRejectedValueOnce(new Error('Offline'));
  fireEvent.click(screen.getByRole('button'));
  await waitFor(() => expect(setError).toHaveBeenCalledWith('Offline'));
  page.unmount();
  for (const [user, chapter] of [['alice','two'],['bob','one']]) {
    const other = show(user, chapter);
    expect(screen.getByRole('textbox').value).toBe('');
    other.unmount();
  }
  show('alice', 'one');
  expect(screen.getByRole('checkbox').checked).toBe(true);
  const restoredField = screen.getByRole('textbox', {name: 'Chapter comment'});
  expect(screen.getByText('Chapter comment', {selector: 'label'}).control).toBe(restoredField);
  expect(restoredField.value).toBe('Synthetic response');
  addComment.mockResolvedValueOnce({});
  const form = screen.getByRole('button').form;
  fireEvent.submit(form);
  fireEvent.submit(form);
  await waitFor(() => expect(screen.getByRole('textbox').value).toBe(''));
  expect(addComment).toHaveBeenCalledTimes(2);
  expect(sessionStorage.length).toBe(0);
});
