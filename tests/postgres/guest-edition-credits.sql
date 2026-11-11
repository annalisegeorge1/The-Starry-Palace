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
CREATE ROLE fixture_curator IN ROLE authenticated;
CREATE SCHEMA private;
CREATE FUNCTION private.can_curate_archive() RETURNS boolean LANGUAGE sql AS $$ SELECT current_user = 'fixture_curator' $$;
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
-- Model guest text visibility independently of the proposed credits policy.
CREATE TABLE public.archive_texts (record_id integer REFERENCES public.archive_records(id), guest_readable boolean);
GRANT SELECT ON public.archive_texts TO anon, authenticated;
ALTER TABLE public.archive_texts ENABLE ROW LEVEL SECURITY;
CREATE POLICY guest_text ON public.archive_texts FOR SELECT TO anon USING (
 guest_readable AND EXISTS (SELECT FROM public.archive_records e WHERE e.id=record_id)
);
INSERT INTO public.archive_records VALUES
 (1,'published'),(2,'draft'),(3,'published'),(4,'published'),(5,'published'),(6,'published');
-- 1 reviewed translation, 2 draft, 3 restricted, 4 credit-free, 5 rights unavailable,
-- 6 metadata-only. Hosted-text eligibility itself is a dependency of this policy.
INSERT INTO public.archive_texts VALUES (1,true),(2,true),(3,false),(4,true),(5,false);
INSERT INTO public.archive_translation_records VALUES
 (1,1,'published'),(2,1,'approved'),(3,1,'draft'),(4,2,'approved'),(5,3,'approved'),(6,5,'approved'),(7,6,'published');
\ir ../../database/review/guest-archive-translation-credits.sql
SET ROLE anon;
DO $$ BEGIN
  IF (SELECT array_agg(id ORDER BY id) FROM public.archive_translation_records) IS DISTINCT FROM ARRAY[1,2]
    THEN RAISE EXCEPTION 'Incorrect guest credits'; END IF;
END $$;
RESET ROLE;
SET ROLE authenticated;
DO $$ BEGIN
  IF (SELECT array_agg(id ORDER BY id) FROM public.archive_translation_records) IS DISTINCT FROM ARRAY[1,2,4,5,6,7]
    THEN RAISE EXCEPTION 'Changed existing signed-in access'; END IF;
END $$;
RESET ROLE;

SET ROLE fixture_curator;
DO $$ BEGIN
 IF (SELECT count(*) FROM public.archive_translation_records) <> 7 THEN RAISE EXCEPTION 'Curator lost access'; END IF;
END $$;
RESET ROLE;
DO $$ BEGIN
 IF (SELECT count(*) FROM public.archive_translation_records) <> 7 THEN RAISE EXCEPTION 'Owner lost access'; END IF;
END $$;
-- Rollback fixture: restore the original policy name, role set and predicate.
BEGIN;
DROP POLICY "guests read published edition translation credits" ON public.archive_translation_records;
ALTER POLICY "approved translations readable" ON public.archive_translation_records TO anon, authenticated;
COMMIT;
DO $$ BEGIN
 IF (SELECT count(*) FROM pg_policies WHERE tablename='archive_translation_records') <> 1
    OR NOT EXISTS (SELECT FROM pg_policies WHERE tablename='archive_translation_records'
                  AND policyname='approved translations readable' AND roles = ARRAY['anon','authenticated']::name[])
 THEN RAISE EXCEPTION 'Policy rollback mismatch'; END IF;
END $$;
