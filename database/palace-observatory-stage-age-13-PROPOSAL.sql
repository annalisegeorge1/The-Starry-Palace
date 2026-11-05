-- STAGING ONLY, REVIEW-ONLY SQL PROPOSAL — NOT FOR EXECUTION YET.
-- Existing synthetic security fixtures use an anonymous age threshold of 12.
-- The Palace minimum is now 13. This is an independently reviewed correction.
-- Do not conflate the public age-13 default with access to Mature/Explicit 18+ text.
BEGIN;
DO $stage_guard$
BEGIN
 IF to_regclass('private.staging_chat_rooms') IS NULL THEN
  RAISE EXCEPTION 'Security Staging sentinel missing; refusing age-gate change.';
 END IF;
END
$stage_guard$;

CREATE OR REPLACE FUNCTION private.member_meets_age(p_minimum_age integer)
 RETURNS boolean
 LANGUAGE sql STABLE SECURITY DEFINER
 SET search_path=''
 AS $age_check$
 SELECT CASE
  WHEN (SELECT auth.uid()) IS NULL THEN coalesce(p_minimum_age,13)<=13
  ELSE EXISTS(
   SELECT 1 FROM private.member_age a
   WHERE a.user_id=(SELECT auth.uid())
    AND (a.birth_date+make_interval(years=>greatest(coalesce(p_minimum_age,13),13)))::date<=current_date
  )
 END;
 $age_check$;

-- Do NOT widen execution grants. The preexisting private function's permissions
-- and its callers must be re-audited after any separately approved installation.
COMMIT;
