import React, {useId, useRef, useState} from 'react';
import {addComment} from './palaceData';

export default function ReaderCommentComposer({userId, workId, chapterId, reload, setError}) {
  const fieldId = useId();
  const key = 'palace-comment-draft:' + JSON.stringify([userId, workId, chapterId]);
  const empty = {body: '', spoiler: false};
  const [draft, setDraft] = useState(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(key));
      if (typeof saved?.body === 'string') return {body: saved.body, spoiler: saved.spoiler === true};
    } catch {}
    return empty;
  });
  const [sending, setSending] = useState(false);
  const pending = useRef(false);

  function update(next) {
    setDraft(next);
    try {
      if (next.body || next.spoiler) sessionStorage.setItem(key, JSON.stringify(next));
      else sessionStorage.removeItem(key);
    } catch {}
  }

  async function submit(event) {
    event.preventDefault();
    if (pending.current || !draft.body.trim()) return;
    pending.current = true;
    setSending(true);
    setError('');
    try {
      await addComment(userId, workId, chapterId, draft.body, 'response', draft.spoiler);
      update(empty);
      await reload();
    } catch (error) {
      setError(error.message || 'Your comment could not be confirmed.');
    } finally {
      pending.current = false;
      setSending(false);
    }
  }

  const prompt = chapterId ? 'Leave a comment about this chapter…' : 'Leave a response for the writer…';
  return <form className="comment-compose" onSubmit={submit}>
    {chapterId && <label htmlFor={fieldId}>Chapter comment</label>}
    <textarea id={fieldId} aria-label={chapterId ? undefined : prompt} placeholder={prompt} value={draft.body} disabled={sending}
      onChange={event => update({...draft, body: event.target.value})} required/>
    <label><input type="checkbox" checked={draft.spoiler} disabled={sending}
      onChange={event => update({...draft, spoiler: event.target.checked})}/> Contains spoilers</label>
    <button disabled={sending || !draft.body.trim()}>{sending ? 'Submitting…' : 'Send for moderation'}</button>
  </form>;
}
