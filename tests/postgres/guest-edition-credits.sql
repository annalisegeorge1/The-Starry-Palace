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
-- Fixture reproduces the hosted text eligibility rules without importing any edition bodies.
ALTER TABLE public.archive_records ADD COLUMN host_mode text DEFAULT 'full',
 ADD COLUMN rights_status text DEFAULT 'public_domain_verified',
 ADD COLUMN minimum_reader_age integer DEFAULT 13, ADD COLUMN verified_at timestamptz;
CREATE TABLE public.archive_texts (record_id integer PRIMARY KEY REFERENCES public.archive_records(id));
CREATE TABLE public.archive_rights_records (record_id integer REFERENCES public.archive_records(id), status text,
 permits_hosting boolean,valid_from date,valid_until date);
GRANT SELECT ON public.archive_texts,public.archive_rights_records TO anon,authenticated;
ALTER TABLE public.archive_texts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archive_rights_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY verified ON public.archive_rights_records FOR SELECT TO anon USING(status='verified');
CREATE POLICY guest_text ON public.archive_texts FOR SELECT TO anon USING (EXISTS (
 SELECT FROM public.archive_records e WHERE e.id=archive_texts.record_id AND e.publication_status='published'
 AND e.host_mode IN ('full','excerpt') AND coalesce(e.minimum_reader_age,13)<18
 AND (e.rights_status='public_domain_verified' OR (e.rights_status IN ('licensed','creator_authorised')
 AND e.verified_at IS NOT NULL AND EXISTS (SELECT FROM public.archive_rights_records r
 WHERE r.record_id=e.id AND r.status='verified' AND r.permits_hosting
 AND (r.valid_from IS NULL OR r.valid_from<=current_date) AND (r.valid_until IS NULL OR r.valid_until>=current_date))))));
INSERT INTO public.archive_records(id,publication_status) VALUES
 (1,'published'),(2,'draft'),(3,'published'),(4,'published'),(5,'published'),(6,'published'),
 (7,'published'),(8,'published'),(9,'published');
UPDATE public.archive_records SET minimum_reader_age=18 WHERE id=3;
UPDATE public.archive_records SET rights_status='licensed',verified_at=now() WHERE id IN(5,7);
UPDATE public.archive_records SET host_mode='citation' WHERE id=8;
UPDATE public.archive_records SET rights_status='unreviewed' WHERE id=9;
INSERT INTO public.archive_rights_records VALUES (5,'verified',true,NULL,current_date-1),(7,'verified',true,current_date-1,NULL);
-- 4 is credit-free; 6 is metadata-only.
INSERT INTO public.archive_texts VALUES (1),(2),(3),(4),(5),(7),(8),(9);
INSERT INTO public.archive_translation_records VALUES
 (1,1,'published'),(2,1,'approved'),(3,1,'draft'),(4,2,'approved'),(5,3,'approved'),(6,5,'approved'),(7,6,'published'),(8,7,'approved'),(9,8,'approved'),(10,9,'published');
\ir ../../database/review/guest-archive-translation-credits.sql
SET ROLE anon;
DO $$ BEGIN
 IF NOT EXISTS (SELECT FROM public.archive_texts WHERE record_id=4) OR EXISTS (SELECT FROM public.archive_translation_records WHERE record_id=4) THEN RAISE EXCEPTION 'Credit-free edition mismatch'; END IF;
  IF (SELECT array_agg(id ORDER BY id) FROM public.archive_translation_records) IS DISTINCT FROM ARRAY[1,2,8]
    THEN RAISE EXCEPTION 'Incorrect guest credits'; END IF;
END $$;
RESET ROLE;
SET ROLE authenticated;
DO $$ BEGIN
  IF (SELECT array_agg(id ORDER BY id) FROM public.archive_translation_records) IS DISTINCT FROM ARRAY[1,2,4,5,6,7,8,9,10]
    THEN RAISE EXCEPTION 'Changed existing signed-in access'; END IF;
END $$;
RESET ROLE;

SET ROLE fixture_curator;
DO $$ BEGIN
 IF (SELECT count(*) FROM public.archive_translation_records) <> 10 THEN RAISE EXCEPTION 'Curator lost access'; END IF;
END $$;
RESET ROLE;
DO $$ BEGIN
 IF (SELECT count(*) FROM public.archive_translation_records) <> 10 THEN RAISE EXCEPTION 'Owner lost access'; END IF;
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
