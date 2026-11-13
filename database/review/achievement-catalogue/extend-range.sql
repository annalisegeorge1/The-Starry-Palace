-- Review candidate for the five proposed invitation honours. Run only after
-- separate approval. This changes the permitted range, without registering
-- families, selecting thresholds or granting rewards.
BEGIN;
SET LOCAL lock_timeout = '2s';
ALTER TABLE public.achievement_families
  ADD CONSTRAINT achievement_families_catalogue_number_extended
  CHECK (catalogue_number BETWEEN 1 AND 133) NOT VALID;
ALTER TABLE public.achievement_families
  VALIDATE CONSTRAINT achievement_families_catalogue_number_extended;
ALTER TABLE public.achievement_families
  DROP CONSTRAINT achievement_families_catalogue_number_check;
ALTER TABLE public.achievement_families
  RENAME CONSTRAINT achievement_families_catalogue_number_extended
  TO achievement_families_catalogue_number_check;
COMMIT;
