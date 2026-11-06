-- REVIEW-ONLY PROPOSAL. DO NOT EXECUTE WITHOUT SEPARATE STAGING APPROVAL.
-- Restrict only two existing Security Staging reward mutation RPCs.
-- NOT a Supabase migration; never deploy to production or CI-connected Supabase.
-- A real restorable Security Staging backup and independent approval are REQUIRED.
BEGIN;

DO $rpc_stage_guard$
BEGIN
 IF to_regclass('private.staging_chat_rooms') IS NULL THEN
  RAISE EXCEPTION 'Staging fixture sentinel missing. Refusing RPC permission changes.';
 END IF;
 IF to_regclass('public.profiles') IS NULL
    OR to_regclass('public.fandom_directory') IS NULL THEN
  RAISE EXCEPTION 'Staging compatibility schema missing; apply only after approved preparation.';
 END IF;
 IF to_regprocedure('public.give_palace_praise(text,uuid,text)') IS NULL
    OR to_regprocedure('public.record_palace_share(uuid)') IS NULL THEN
  RAISE EXCEPTION 'Expected original staging reward RPCs missing or signatures changed.';
 END IF;
 IF NOT has_function_privilege('anon','public.give_palace_praise(text,uuid,text)','EXECUTE')
    OR NOT has_function_privilege('anon','public.record_palace_share(uuid)','EXECUTE') THEN
  RAISE EXCEPTION 'Mutation RPC grant baseline changed; refusing replay or unexpected state.';
 END IF;
 IF NOT has_function_privilege('authenticated','public.give_palace_praise(text,uuid,text)','EXECUTE')
    OR NOT has_function_privilege('authenticated','public.record_palace_share(uuid)','EXECUTE') THEN
  RAISE EXCEPTION 'Authenticated RPC baseline missing; independent permissions review required.';
 END IF;
END
$rpc_stage_guard$;

-- The existing functions check auth.uid(), but anonymous EXECUTE is still
-- unnecessary. Preserve the authenticated role's existing direct grants.
-- PUBLIC and anon must BOTH be revoked; a PUBLIC grant still permits anon calls.
REVOKE EXECUTE ON FUNCTION
 public.give_palace_praise(text,uuid,text),
 public.record_palace_share(uuid)
 FROM PUBLIC, anon;

DO $rpc_postcheck$
BEGIN
 IF has_function_privilege('anon','public.give_palace_praise(text,uuid,text)','EXECUTE')
    OR has_function_privilege('anon','public.record_palace_share(uuid)','EXECUTE') THEN
  RAISE EXCEPTION 'Anonymous reward mutation RPC EXECUTE remains accessible.';
 END IF;
 IF NOT has_function_privilege('authenticated','public.give_palace_praise(text,uuid,text)','EXECUTE')
    OR NOT has_function_privilege('authenticated','public.record_palace_share(uuid)','EXECUTE') THEN
  RAISE EXCEPTION 'Authenticated reward mutation RPC was unexpectedly blocked.';
 END IF;
END
$rpc_postcheck$;
COMMIT;
