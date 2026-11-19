import React from 'react';
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {CommentInteractionMenu} from './DiscussionInteractions';
import CommentRevisionEditor from './CommentRevisionEditor';
import {saveCommentRevision} from './palaceData';
import {readerCommentThreads} from './readerCommentThreads';

vi.mock('./palaceData',()=>({saveCommentRevision:vi.fn()}));
afterEach(()=>{cleanup();vi.resetAllMocks()});
it('places a pinned thread first, leaving its replies attached in every ordering',()=>{
 const comments=[{id:'first'},{id:'root'},{id:'reply',parent_comment_id:'root'},{id:'last'}];
 for(const order of ['oldest','newest','writer']){
  expect(readerCommentThreads(comments,order,'writer',{root:{pinned:true}}).slice(0,2).map(x=>x.comment.id)).toEqual(['root','reply']);
 }
});
it('uses one disclosure for reactions and thread settings and reserves pinning for writers',()=>{
 const setChoice=vi.fn(),tools={items:{r:{reaction:'heart',preference:'muted',counts:{heart:2}}},setChoice};
 render(<CommentInteractionMenu comment={{id:'r'}} tools={tools} owner={false} signedIn/>);
 fireEvent.click(screen.getByText(/Response options/));
 expect(screen.getByLabelText('Reaction').value).toBe('heart');
 fireEvent.change(screen.getByLabelText('Reaction'),{target:{value:'laugh'}});
 fireEvent.change(screen.getByLabelText('Thread notifications'),{target:{value:'following'}});
 expect(setChoice.mock.calls).toEqual([['r','reaction','laugh'],['r','preference','following']]);
 expect(screen.queryByText('Pin thread')).toBeNull();
});
it('retains the edited text on a stale moderation result',async()=>{
 const comment={id:'r',body:'Before',spoiler:false,edit_revision:2};
 const close=vi.fn(),reload=vi.fn();
 saveCommentRevision.mockRejectedValueOnce(new Error('Reload before editing.'));
 render(<CommentRevisionEditor comment={comment} close={close} reload={reload}/>);
 fireEvent.change(screen.getByLabelText('Edit your comment'),{target:{value:'Revised'}});
 fireEvent.click(screen.getByRole('button',{name:'Save for review'}));
 await waitFor(()=>expect(screen.getByRole('alert').textContent).toMatch(/Reload/));
 expect(screen.getByLabelText('Edit your comment').value).toBe('Revised');
 expect(close).not.toHaveBeenCalled();expect(reload).not.toHaveBeenCalled();
});
