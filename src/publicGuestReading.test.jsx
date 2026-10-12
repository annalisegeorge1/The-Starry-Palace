import React from 'react';
import {describe,it,expect,afterEach} from 'vitest';
import {render,screen,cleanup} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {readFileSync} from 'node:fs';
import GuestReadingInvitation from './GuestReadingInvitation';
import {palaceSignInDoor} from './palaceDoorway';

afterEach(cleanup);
describe('public reading with member-only participation',()=>{
 it('invites a guest to comment without locking the public story',()=>{
  render(<MemoryRouter><GuestReadingInvitation context="comment" returnTo="/work/moonlit-pages#comments"/></MemoryRouter>);
  expect(screen.getByText(/No account needed to read/)).toBeTruthy();
  expect(screen.getByText(/Reader responses are open to members/)).toBeTruthy();
  const links=screen.getAllByRole('link');
  const signup=links.find(link=>link.textContent==='Create an account');
  const login=links.find(link=>link.textContent==='Sign in');
  expect(signup.getAttribute('href')).toContain('mode=signup');
  expect(new URLSearchParams(signup.getAttribute('href').split('?')[1]).get('next')).toBe('/work/moonlit-pages#comments');
  expect(new URLSearchParams(login.getAttribute('href').split('?')[1]).get('next')).toBe('/work/moonlit-pages#comments');
 });
 it('preserves deep comic and chapter reading URLs after a member signs in',()=>{
  for(const path of ['/comic/moonlit-pages','/work/moonlit-pages/chapter/part-1']){
   const next=new URLSearchParams(palaceSignInDoor(path).split('?')[1]).get('next');
   expect(next).toBe(path);
  }
 });
 it('keeps public reading, comics and chapters outside the member route guard',()=>{
  const source=readFileSync('src/main.jsx','utf8');
  for(const path of ['/reading','/work/:slug','/work/:slug/chapter/:chapterId','/comics','/comic/:slug','/comic/:slug/episode/:episodeId','/classic/:slug','/lost-works']){
   const route=source.split('<Route path="'+path+'" element=')[1]?.split('</Route>')[0]||'';
   expect(route,path).not.toBe('');
   expect(route.slice(0,155),path).not.toContain('<ProtectedRoute>');
  }
  for(const path of ['/writing','/palace-life','/letters','/grand-palaces','/treasury']){
   const route=source.split('<Route path="'+path+'" element=')[1]?.slice(0,130)||'';
   expect(route,path).toContain('<ProtectedRoute>');
  }
 });
 it('keeps comments restricted to logged-in readers without hiding responses',()=>{
  const source=readFileSync('src/liveRooms.jsx','utf8');
  expect(source).toContain("{!session&&work.comment_policy!=='closed'&&<GuestReadingInvitation");
  expect(source).toContain("{session&&work.comment_policy!=='closed'&&<form className=\"comment-compose\"");
  expect(source).toContain("community.comments.filter(c=>own||c.status==='approved'||c.author_id===session?.user?.id)");
  expect(source).toContain("!session&&<GuestReadingInvitation returnTo=\"/reading\"");
  expect(source).toContain("!session&&<GuestReadingInvitation returnTo={'/comic/'+data.slug}");
 });
});
