-- Disposable database only. Fail before setup if run against a different database.
\set ON_ERROR_STOP on
SELECT current_database() = 'palace_credits_fixture' AS is_fixture \gset
\if :is_fixture
\else
  \echo 'Expected the isolated palace_credits_fixture database.'
  \quit 1
\endif
CREATE ROLE anon;
CREATE ROLE authenticated;
CREATE SCHEMA private;
CREATE FUNCTION private.can_curate_archive() RETURNS boolean LANGUAGE sql AS 'SELECT false';
REVOKE ALL ON FUNCTION private.can_curate_archive() FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.can_curate_archive() TO authenticated;
CREATE TABLE public.archive_records (id integer PRIMARY KEY, publication_status text);
CREATE TABLE public.archive_translation_records (id integer PRIMARY KEY, record_id integer, status text);
GRANT SELECT ON public.archive_records, public.archive_translation_records TO anon, authenticated;
ALTER TABLE public.archive_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archive_translation_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY published ON public.archive_records FOR SELECT USING (publication_status = 'published');
CREATE POLICY "approved translations readable" ON public.archive_translation_records FOR SELECT TO anon, authenticated
  USING (status IN ('approved','published') OR private.can_curate_archive());
INSERT INTO public.archive_records VALUES (1,'published'),(2,'draft');
INSERT INTO public.archive_translation_records VALUES (1,1,'published'),(2,1,'approved'),(3,1,'draft'),(4,2,'approved');
\ir ../../database/review/guest-archive-translation-credits.sql
SET ROLE anon;
DO $$ BEGIN
  IF (SELECT array_agg(id ORDER BY id) FROM public.archive_translation_records) IS DISTINCT FROM ARRAY[1,2]
    THEN RAISE EXCEPTION 'Incorrect guest credits'; END IF;
END $$;
RESET ROLE;
SET ROLE authenticated;
DO $$ BEGIN
  IF (SELECT array_agg(id ORDER BY id) FROM public.archive_translation_records) IS DISTINCT FROM ARRAY[1,2,4]
    THEN RAISE EXCEPTION 'Changed existing signed-in access'; END IF;
END $$;
RESET ROLE;
