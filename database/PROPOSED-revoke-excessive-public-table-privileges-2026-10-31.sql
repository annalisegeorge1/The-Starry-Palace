-- THE STARRY PALACE: staged, least-privilege public table grant cleanup.
-- PostgreSQL table RLS does not authorize TRUNCATE or REFERENCES. Ordinary
-- web roles have no legitimate need for TRUNCATE, TRIGGER, REFERENCES or
-- MAINTAIN on application tables. Preserve all SELECT/INSERT/UPDATE/DELETE
-- and existing RLS policies exactly as they are.
-- This script intentionally excludes storage/auth and private schemas.
do $block$
declare rel record;
begin
 for rel in
   select n.nspname, c.relname
   from pg_class c
   join pg_namespace n on n.oid=c.relnamespace
   where n.nspname='public' and c.relkind in ('r','p')
   order by c.oid
 loop
   execute format(
      'revoke truncate, trigger, references, maintain on table %I.%I from anon, authenticated',
      rel.nspname,rel.relname
   );
 end loop;
end $block$;
-- Post-deploy read-only verification:
-- select c.relname
-- from pg_class c join pg_namespace n on n.oid=c.relnamespace
-- where n.nspname='public' and c.relkind in ('r','p')
-- and (has_table_privilege('anon',c.oid,'TRUNCATE')
--    or has_table_privilege('authenticated',c.oid,'TRUNCATE')
--    or has_table_privilege('anon',c.oid,'TRIGGER')
--    or has_table_privilege('authenticated',c.oid,'TRIGGER')
--    or has_table_privilege('anon',c.oid,'REFERENCES')
--    or has_table_privilege('authenticated',c.oid,'REFERENCES'));
--
-- DO NOT blindly regrant these privileges during rollback. If application
-- behavior unexpectedly depends on a grant, explicitly assess one table
-- and one role before granting the narrowest permission. No data changes.
