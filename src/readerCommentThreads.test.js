import {expect,it} from 'vitest';
import {readerCommentThreads} from './readerCommentThreads';
it('orders visible nested replies under their parent, keeping sibling order',()=>{
 const row=(id,parent_comment_id)=>({id,parent_comment_id});
 const rows=readerCommentThreads([row('a'),row('b'),row('d','c'),row('c','a'),row('e','a')]);
 expect(rows.map(r=>[r.comment.id,r.depth])).toEqual([['a',0],['c',1],['d',2],['e',1],['b',0]]);
});
it('does not surface descendants of a missing ancestor or cyclic references',()=>{
 expect(readerCommentThreads([{id:'b',parent_comment_id:'a'},{id:'c',parent_comment_id:'b'},
 {id:'cycle',parent_comment_id:'cycle'}])).toEqual([]);
});
