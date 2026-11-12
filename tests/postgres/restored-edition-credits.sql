-- Check the restored copy while the source database remains available.
DO $$ BEGIN
 IF current_database() <> 'palace_credits_restored' THEN RAISE EXCEPTION 'Unexpected target'; END IF;
 IF NOT EXISTS (SELECT FROM pg_constraint WHERE conrelid='public.archive_texts'::regclass
                AND confrelid='public.archive_records'::regclass AND contype='f' AND convalidated)
 THEN RAISE EXCEPTION 'Missing relationship after restore'; END IF;
 IF (SELECT count(*) FROM public.archive_translation_records) <> 10 THEN RAISE EXCEPTION 'Missing fixture data'; END IF;
END $$;
SET ROLE anon;
DO $$ BEGIN
 IF (SELECT array_agg(id ORDER BY id) FROM public.archive_translation_records) IS DISTINCT FROM ARRAY[1,2,8]
 THEN RAISE EXCEPTION 'Guest policy changed after restore'; END IF;
END $$;
RESET ROLE;
SET ROLE fixture_curator;
DO $$ BEGIN
 IF (SELECT count(*) FROM public.archive_translation_records) <> 10 THEN RAISE EXCEPTION 'Curator access changed after restore'; END IF;
END $$;
