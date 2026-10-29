import {describe,it,expect} from 'vitest';
import {visibleLibrarySnapshot,isCurrentLibraryRequest} from './libraryMemberGate';

describe('My Library member safety',()=>{
 it('never displays one reader\'s private shelf for a different signed-in member',()=>{
  const snapshot={ownerId:'member-a',data:{saved:[{id:'secret'}]},org:{notes:[{id:'private-note'}]}};
  expect(visibleLibrarySnapshot(snapshot,'member-a')).toEqual({data:snapshot.data,org:snapshot.org});
  expect(visibleLibrarySnapshot(snapshot,'member-b')).toEqual({data:null,org:null});
  expect(visibleLibrarySnapshot(snapshot,null)).toEqual({data:null,org:null});
  expect(visibleLibrarySnapshot(null,'member-a')).toEqual({data:null,org:null});
 });
 it('discards stale loads across members and out-of-order requests',()=>{
  expect(isCurrentLibraryRequest('member-b',3,'member-a',2)).toBe(false);
  expect(isCurrentLibraryRequest('member-a',3,'member-a',2)).toBe(false);
  expect(isCurrentLibraryRequest('member-a',3,'member-a',3)).toBe(true);
  expect(isCurrentLibraryRequest(null,3,'member-a',3)).toBe(false);
 });
});
