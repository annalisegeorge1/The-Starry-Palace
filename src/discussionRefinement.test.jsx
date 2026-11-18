import React from 'react';
import {afterEach, expect, it, vi} from 'vitest';
import {cleanup, fireEvent, render, screen, within} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {WorkCommunity} from './liveRooms';
import {readerCommentThreads} from './readerCommentThreads';

afterEach(()=>{cleanup(); vi.restoreAllMocks(); sessionStorage.clear()});
const comment=(id,extra={})=>({id,author_id:'reader',profiles:{display_name:'Reader'},status:'approved',chapter_id:'c',body:id,...extra});
function show(comments,hash='',props={}) {
 return render(<MemoryRouter initialEntries={['/work/test/chapter/c'+hash]}><WorkCommunity
  work={{id:'w',slug:'test',author_id:'author'}} community={{tags:[],comments}} chapterId="c" chapterReturnTo="/work/test/chapter/c#comments"
  session={{user:{id:'guest-member'}}} reload={vi.fn()} setError={vi.fn()} {...props}/></MemoryRouter>);
}
it('sorts whole threads, keeping children chronological and hidden ancestors out',()=>{
 const items=[comment('a'),comment('b'),comment('c',{parent_comment_id:'b',author_id:'author'}),comment('d',{parent_comment_id:'b'}),comment('e'),comment('f',{parent_comment_id:'missing',author_id:'author'})];
 expect(readerCommentThreads(items,'writer','author').map(x=>x.comment.id)).toEqual(['b','c','d','a','e']);
 show(items);
 fireEvent.change(screen.getByRole('combobox'),{target:{value:'newest'}});
 expect(screen.getAllByRole('article').map(x=>x.id)).toEqual(['comment-e','comment-b','comment-c','comment-d','comment-a']);
 expect(within(document.getElementById('comment-c')).getByText('Writer')).toBeTruthy();
 expect(screen.getAllByText('Writer')).toHaveLength(1);
});
it('focuses a direct link beyond the first page, retaining the exact parent at flattened depth',()=>{
 const rows=Array.from({length:25},(_,i)=>comment(String(i),{parent_comment_id:i?String(i-1):null}));
 Element.prototype.scrollIntoView ??= ()=>{};
 show(rows,'#comment-24');
 expect(document.activeElement.id).toBe('comment-24');
 const article=screen.getAllByRole('article').at(-1);
 expect(article.style.getPropertyValue('--reply-level')).toBe('3');
 expect(within(article).getByText('Reply to Reader').getAttribute('href')).toBe('#comment-23');
 expect(within(article).getByText('Comment link').getAttribute('href')).toBe('/work/test/chapter/c#comment-24');
});
it('hides individual passages independently, including inside a whole-comment spoiler',()=>{
 show([comment('one',{body:'Before ||secret|| after ||another||',spoiler:true})]);
 expect(screen.queryByText(/Before/)).toBeNull();
 fireEvent.click(screen.getByText('Spoiler hidden'));
 expect(screen.getByText(/Before/)).toBeTruthy();
 const [first,second]=screen.getAllByText('Reveal spoiler');
 expect(screen.queryByText('secret')).toBeNull();
 fireEvent.click(first);
 expect(first.getAttribute('aria-expanded')).toBe('true');
 expect(screen.getByText('secret')).toBeTruthy();
 expect(second.getAttribute('aria-expanded')).toBe('false');
 fireEvent.click(first);
 expect(screen.queryByText('secret')).toBeNull();
});
it('keeps two reply drafts separate when switching parents',()=>{
 show([comment('one'),comment('two')]);
 const replies=screen.getAllByRole('button',{name:'Reply',exact:true});
 fireEvent.click(replies[0]);fireEvent.change(screen.getByLabelText('Reply to comment'),{target:{value:'Draft A'}});
 fireEvent.click(replies[1]);expect(screen.getByLabelText('Reply to comment').value).toBe('');
 fireEvent.change(screen.getByLabelText('Reply to comment'),{target:{value:'Draft B'}});
 fireEvent.click(replies[0]);expect(screen.getByLabelText('Reply to comment').value).toBe('Draft A');
});
