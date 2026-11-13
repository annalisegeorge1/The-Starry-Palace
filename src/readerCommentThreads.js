// Start at visible roots. An unavailable or moderated ancestor must never
// expose its replies. Iterate rather than recursing on long threads.
export function readerCommentThreads(comments) {
  const children = new Map();
  for (const comment of comments) {
    const parent = comment.parent_comment_id || null;
    if (!children.has(parent)) children.set(parent, []);
    children.get(parent).push(comment);
  }
  const pending = (children.get(null) || []).map(comment => ({comment,depth:0})).reverse();
  const seen = new Set();
  const rows = [];
  while (pending.length) {
    const row = pending.pop();
    if (seen.has(row.comment.id)) continue;
    seen.add(row.comment.id);
    rows.push(row);
    const replies = children.get(row.comment.id) || [];
    for (let i=replies.length-1;i>=0;i--) pending.push({comment:replies[i],depth:row.depth+1});
  }
  return rows;
}
