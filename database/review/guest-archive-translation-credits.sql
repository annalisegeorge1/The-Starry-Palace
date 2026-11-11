-- Manual review script. Rehearse with synthetic records in staging first.
-- Both policy changes are transactional. Existing member and curator access is preserved.
BEGIN;
ALTER POLICY "approved translations readable" ON public.archive_translation_records
  TO authenticated;

CREATE POLICY "guests read published edition translation credits"
  ON public.archive_translation_records FOR SELECT TO anon
  USING (
    status IN ('approved', 'published')
    AND EXISTS (
      SELECT 1 FROM public.archive_records AS edition
      WHERE edition.id = archive_translation_records.record_id
        AND edition.publication_status = 'published'
    )
  );
COMMIT;

-- Rollback in one transaction:
-- BEGIN;
-- DROP POLICY "guests read published edition translation credits" ON public.archive_translation_records;
-- ALTER POLICY "approved translations readable" ON public.archive_translation_records TO anon, authenticated;
-- COMMIT;
