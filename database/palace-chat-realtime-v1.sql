-- Palace Chat live updates: keep row-level security as the authorization boundary.
-- Existing group and direct chat data remain unchanged.
-- Supabase Realtime authorizes each event against the authenticated member's
-- SELECT RLS policy on the source table.
-- Direct correspondence must not be exposed to signed-out visitors, even if
-- policies were ever broadened. Authenticated member policies stay in force.
REVOKE SELECT ON public.messages FROM anon;

DO $palace$
BEGIN
 IF NOT EXISTS (
  SELECT 1 FROM pg_publication_tables
  WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='messages'
 ) THEN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
 END IF;
 IF NOT EXISTS (
  SELECT 1 FROM pg_publication_tables
  WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='palace_group_chat_messages'
 ) THEN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.palace_group_chat_messages;
 END IF;
END $palace$;
