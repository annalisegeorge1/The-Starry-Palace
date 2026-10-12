-- Anonymous reading of public works uses this collaborator predicate under RLS.
-- This security-definer boolean helper only checks the caller's auth.uid();
-- anonymous users always receive false and cannot discover private drafts.
grant execute on function private.is_accepted_work_collaborator(uuid) to anon;
