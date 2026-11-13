BEGIN;
SET LOCAL lock_timeout = '2s';
ALTER TABLE public.reading_progress ADD COLUMN progress_revision bigint NOT NULL DEFAULT 0;

-- Old clients upsert without specifying a revision. Once a new client has
-- claimed a row, reject those updates rather than overwriting its position.
CREATE FUNCTION public.guard_reading_progress_revision() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF NEW.progress_revision = OLD.progress_revision AND (OLD.progress_revision <= 0 OR NEW.chapter_id IS NULL) THEN
    -- Track legacy saves and FK-driven chapter removal while retaining ownership.
    NEW.progress_revision := CASE WHEN OLD.progress_revision > 0 THEN OLD.progress_revision+1 ELSE OLD.progress_revision-1 END;
  ELSIF NEW.progress_revision <> greatest(OLD.progress_revision,0) + 1 THEN
    RAISE EXCEPTION 'Reading position changed; reopen the chapter' USING ERRCODE = '40001';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.guard_reading_progress_revision() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER guard_reading_progress_revision BEFORE UPDATE OF chapter_id, progress_percent, chapter_progress_percent, completed
ON public.reading_progress FOR EACH ROW
EXECUTE FUNCTION public.guard_reading_progress_revision();

CREATE FUNCTION public.save_reading_position(p_work uuid, p_chapter uuid,
  p_expected bigint, p_work_percent numeric, p_chapter_percent numeric, p_finished boolean)
RETURNS bigint LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  member uuid := auth.uid();
  saved bigint;
BEGIN
  IF member IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.chapters WHERE id=p_chapter AND work_id=p_work AND status='published'
  ) THEN RAISE EXCEPTION 'Chapter unavailable' USING ERRCODE='42501'; END IF;
  IF p_expected IS NULL THEN
    INSERT INTO public.reading_progress(user_id,work_id,chapter_id,progress_percent,
      chapter_progress_percent,completed,updated_at,progress_revision)
    VALUES(member,p_work,p_chapter,p_work_percent,p_chapter_percent,p_finished,clock_timestamp(),1)
    ON CONFLICT (user_id,work_id) DO NOTHING RETURNING progress_revision INTO saved;
  ELSE
    UPDATE public.reading_progress SET chapter_id=p_chapter,
      progress_percent=CASE WHEN chapter_id=p_chapter THEN greatest(progress_percent,p_work_percent) ELSE p_work_percent END,
      chapter_progress_percent=p_chapter_percent, completed=completed OR p_finished,
      updated_at=clock_timestamp(), progress_revision=greatest(progress_revision,0)+1
    WHERE user_id=member AND work_id=p_work AND progress_revision=p_expected
    RETURNING progress_revision INTO saved;
  END IF;
  RETURN saved;
END;
$$;
REVOKE ALL ON FUNCTION public.save_reading_position(uuid,uuid,bigint,numeric,numeric,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_reading_position(uuid,uuid,bigint,numeric,numeric,boolean) TO authenticated;
COMMIT;
