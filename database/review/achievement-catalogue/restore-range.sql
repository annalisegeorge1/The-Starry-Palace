-- A number above 128 causes validation to fail and the transaction to abort.
-- Preserve every catalogue row even if the rollback can no longer proceed.
BEGIN;
SET LOCAL lock_timeout = '2s';
ALTER TABLE public.achievement_families
  ADD CONSTRAINT achievement_families_catalogue_number_original
  CHECK (catalogue_number BETWEEN 1 AND 128) NOT VALID;
ALTER TABLE public.achievement_families
  VALIDATE CONSTRAINT achievement_families_catalogue_number_original;
ALTER TABLE public.achievement_families
  DROP CONSTRAINT achievement_families_catalogue_number_check;
ALTER TABLE public.achievement_families
  RENAME CONSTRAINT achievement_families_catalogue_number_original
  TO achievement_families_catalogue_number_check;
COMMIT;
