-- Manual review script. Rehearse with synthetic records in staging first.
-- Both policy changes are transactional. Existing member and curator access is preserved.
BEGIN;
ALTER POLICY "approved translations readable" ON public.archive_translation_records
  TO authenticated;

-- The guest text policy already checks publication, host mode, age and hosting rights.
-- Refer only to its record identifier. No body text is selected.
CREATE POLICY "guests read published edition translation credits"
  ON public.archive_translation_records FOR SELECT TO anon
  USING (
    status IN ('approved', 'published')
    AND EXISTS (
      SELECT 1 FROM public.archive_texts AS edition
      WHERE edition.record_id = archive_translation_records.record_id
    )
  );
COMMIT;

-- Rollback in one transaction:
-- BEGIN;
-- DROP POLICY "guests read published edition translation credits" ON public.archive_translation_records;
-- ALTER POLICY "approved translations readable" ON public.archive_translation_records TO anon, authenticated;
-- COMMIT;
