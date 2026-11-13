import React from 'react';
import {afterEach, expect, it, vi} from 'vitest';
import {cleanup, fireEvent, render, screen} from '@testing-library/react';
import {MemoryRouter, Route, Routes, useNavigate} from 'react-router-dom';
import {ChapterLive} from './liveRooms';
import {getChapter} from './palaceData';

vi.mock('./auth', () => ({useAuth: () => ({session: null})}));
vi.mock('./palaceData', async (original) => ({
  ...(await original()),
  getChapter: vi.fn(),
  getPalacePraiseState: async () => ({praise: null, counts: {}}),
  getWorkCommunity: async () => ({comments: [], tags: []})
}));
afterEach(cleanup);

function Frame({children}) { return <main>{children}</main>; }

function HistoryButtons() {
  const navigate = useNavigate();
  return <><button onClick={() => navigate(-1)}>Back</button>
    <button onClick={() => navigate(1)}>Forward</button></>;
}

it('focuses the loaded Next chapter heading and leaves history navigation alone', async () => {
  const chapters = ['First passage', 'Second passage'].map((title, index) => ({
    id: String(index + 1), title, status: 'published', body_html: '<p>A passage.</p>'
  }));
  const work = {id: 'work', slug: 'moon', title: 'Moon', chapters, visibility: 'public'};
  getChapter.mockImplementation(async (_, id) => ({work, chapter: chapters.find(ch => ch.id === id)}));
  render(<MemoryRouter initialEntries={['/work/moon/chapter/1']}>
    <HistoryButtons/><Routes><Route path="/work/:slug/chapter/:chapterId" element={<ChapterLive Frame={Frame}/>}/></Routes>
  </MemoryRouter>);
  const heading = name => screen.findByRole('heading', {level: 1, name});
  expect(await heading('First passage')).not.toBe(document.activeElement);
  const next = screen.getByRole('link', {name: /Continue to next chapter/});
  next.focus();
  fireEvent.click(next, {detail: 0});
  expect(await heading('Second passage')).toBe(document.activeElement);
  for (const [action, title] of [['Back', 'First passage'], ['Forward', 'Second passage']]) {
    const button = screen.getByRole('button', {name: action});
    button.focus();
    fireEvent.click(button);
    await heading(title);
    expect(document.activeElement).toBe(button);
  }
});
