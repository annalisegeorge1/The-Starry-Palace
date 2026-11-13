// A reader owns the revision it opened. Only its own acknowledged writes may
// advance that revision. A lost response is safely retried with the same token.
export function readerProgressSession(initialRevision, write) {
  let revision = initialRevision;
  let conflicted = false;
  let queue = Promise.resolve();
  return function save(position) {
    const operation = queue.then(async () => {
      if (!conflicted) {
        const next = await write(revision, position);
        if (next != null) {
          revision = next;
          return;
        }
        conflicted = true;
      }
      throw new Error('Another session changed your reading position. Reopen this chapter to sync again.');
    });
    queue = operation.catch(() => {});
    return operation;
  };
}
