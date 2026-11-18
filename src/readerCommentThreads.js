// Traverse only from visible roots. Orphaned, moderated and cyclic branches
// must never supply a row or influence the sorting of visible conversations.
export function readerCommentThreads(comments, order = 'oldest', writerId = null) {
  const children = new Map();
  for (const comment of comments) {
    const parent = comment.parent_comment_id || null;
    if (!children.has(parent)) children.set(parent, []);
    children.get(parent).push(comment);
  }
  const threads = [];
  const seen = new Set();
  for (const root of children.get(null) || []) {
    const thread = {rows: [], writerReply: false};
    const pending = [{comment: root, depth: 0, parent: null}];
    while (pending.length) {
      const row = pending.pop();
      if (seen.has(row.comment.id)) continue;
      seen.add(row.comment.id);
      thread.rows.push(row);
      if (writerId && row.depth && row.comment.author_id === writerId) thread.writerReply = true;
      const replies = children.get(row.comment.id) || [];
      for (let i = replies.length - 1; i >= 0; i--) {
        pending.push({comment: replies[i], depth: row.depth + 1, parent: row.comment});
      }
    }
    threads.push(thread);
  }
  // The query supplies chronological order. Reorder complete threads only.
  if (order === 'newest') threads.reverse();
  if (order === 'writer') threads.sort((a, b) => Number(b.writerReply) - Number(a.writerReply));
  return threads.flatMap(thread => thread.rows);
}
