-- Roll back the client before retiring the RPC. Existing member positions survive.
BEGIN;
SET LOCAL lock_timeout = '2s';
DROP FUNCTION public.save_reading_position(uuid,uuid,bigint,numeric,numeric,boolean);
DROP TRIGGER guard_reading_progress_revision ON public.reading_progress;
DROP FUNCTION public.guard_reading_progress_revision();
ALTER TABLE public.reading_progress DROP COLUMN progress_revision;
COMMIT;
