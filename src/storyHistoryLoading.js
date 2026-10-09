/** The shared Palace Life shell should not request story-history metadata unless opened. */
export function shouldFetchStoryHistory(room,status='idle'){
 return room==='history'&&status!=='ready';
}
export function canShowHistoryChapterDetails(status='idle'){
 return status==='ready';
}
