/* Prevent one member's Library contents from appearing under another account. */
export function visibleLibrarySnapshot(snapshot,memberId){
 if(!memberId||snapshot?.ownerId!==memberId)return {data:null,org:null};
 return {data:snapshot.data??null,org:snapshot.org??null};
}
export function isCurrentLibraryRequest(activeMemberId,activeRequestId,requestMemberId,requestId){
 return Boolean(requestMemberId&&activeMemberId===requestMemberId&&activeRequestId===requestId);
}
