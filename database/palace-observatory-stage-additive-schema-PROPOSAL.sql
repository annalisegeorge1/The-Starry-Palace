-- REVIEW-ONLY PROPOSAL. DO NOT EXECUTE WITHOUT SEPARATE APPROVAL.
-- Isolated Security Staging project ONLY (ysbntuyyprnhptlxxsng).
-- Purpose: metadata discovery + synthetic reading/Owner access test surface.
-- No production records, authentication users, copied manuscripts or real rights grants.
-- Preserve the twelve existing Security Staging fixture migrations.
-- This is not a supabase/migrations file and cannot be auto-deployed.
BEGIN;

-- Fail closed against production or an unknown database. The sentinel
-- private.staging_chat_rooms exists ONLY in the security staging fixture.
DO $staging_guard$
BEGIN
 IF to_regclass('private.staging_chat_rooms') IS NULL THEN
  RAISE EXCEPTION 'Staging fixture sentinel missing. Refusing schema changes.';
 END IF;
 IF to_regclass('public.profiles') IS NOT NULL
    OR to_regclass('public.fandom_directory') IS NOT NULL THEN
  RAISE EXCEPTION 'Existing compatibility objects found. Re-audit before any replay.';
 END IF;
END
$staging_guard$;

-- Extend reduced security-fixture tables. Existing rows and columns remain intact.
-- Transitional NULL title/slug preserves the existing synthetic work fixture.
ALTER TABLE public.works
 ADD COLUMN IF NOT EXISTS title text,
 ADD COLUMN IF NOT EXISTS slug text,
 ADD COLUMN IF NOT EXISTS summary text NOT NULL DEFAULT '',
 ADD COLUMN IF NOT EXISTS work_type text NOT NULL DEFAULT 'original',
 ADD COLUMN IF NOT EXISTS rating text NOT NULL DEFAULT 'general',
 ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'en',
 ADD COLUMN IF NOT EXISTS completion_status text NOT NULL DEFAULT 'in_progress',
 ADD COLUMN IF NOT EXISTS cover_url text,
 ADD COLUMN IF NOT EXISTS first_published_at timestamptz,
 ADD COLUMN IF NOT EXISTS last_published_at timestamptz,
 ADD COLUMN IF NOT EXISTS comment_policy text NOT NULL DEFAULT 'moderated',
 ADD COLUMN IF NOT EXISTS constructive_criticism boolean NOT NULL DEFAULT false,
 ADD COLUMN IF NOT EXISTS translation_policy text NOT NULL DEFAULT 'ask',
 ADD COLUMN IF NOT EXISTS download_policy text NOT NULL DEFAULT 'off',
 ADD COLUMN IF NOT EXISTS scheduled_for timestamptz,
 ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
 ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE UNIQUE INDEX IF NOT EXISTS observatory_stage_work_slug_unique
 ON public.works(slug) WHERE slug IS NOT NULL;

ALTER TABLE public.chapters
 ADD COLUMN IF NOT EXISTS title text,
 ADD COLUMN IF NOT EXISTS position integer,
 ADD COLUMN IF NOT EXISTS body_html text NOT NULL DEFAULT '',
 ADD COLUMN IF NOT EXISTS revision integer NOT NULL DEFAULT 0,
 ADD COLUMN IF NOT EXISTS word_count integer NOT NULL DEFAULT 0,
 ADD COLUMN IF NOT EXISTS scheduled_for timestamptz,
 ADD COLUMN IF NOT EXISTS published_at timestamptz,
 ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
 ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.work_tags
 ADD COLUMN IF NOT EXISTS position integer NOT NULL DEFAULT 1,
 ADD COLUMN IF NOT EXISTS added_at timestamptz NOT NULL DEFAULT now();

-- Account and public author metadata. Only staged Auth test users can exist here.
CREATE TABLE public.profiles(
 id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 username text NOT NULL UNIQUE,
 display_name text NOT NULL DEFAULT '',
 avatar_url text,
 title text,
 visibility text NOT NULL DEFAULT 'public'
  CHECK (visibility IN ('public','members','hidden')),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
-- PostgREST needs an explicit author relationship for the existing
-- profiles!works_author_id_fkey embed. NOT VALID preserves old fixture rows
-- whose synthetic author IDs do not yet have matching Auth test profiles.
-- New inserts are still checked; later validation requires fixture review.
ALTER TABLE public.works
 ADD CONSTRAINT works_author_id_fkey
 FOREIGN KEY (author_id) REFERENCES public.profiles(id)
 NOT VALID;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY observatory_stage_profiles_public ON public.profiles
 FOR SELECT TO anon,authenticated
 USING (visibility='public' OR id=(SELECT auth.uid()));
GRANT SELECT ON public.profiles TO anon,authenticated;
-- No client INSERT/UPDATE policies: synthetic account provisioning requires review.

CREATE TABLE public.fandom_directory(
 tag_id uuid PRIMARY KEY REFERENCES public.tags(id) ON DELETE CASCADE,
 media_categories text[] NOT NULL DEFAULT ARRAY['uncategorized']::text[],
 subcategory text NOT NULL DEFAULT '',
 aliases text[] NOT NULL DEFAULT ARRAY[]::text[],
 franchise text NOT NULL DEFAULT '',
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.fandom_directory ENABLE ROW LEVEL SECURITY;
CREATE POLICY observatory_stage_public_fandom_directory
 ON public.fandom_directory FOR SELECT TO anon,authenticated
 USING (EXISTS(
  SELECT 1 FROM public.tags t
  WHERE t.id=tag_id AND t.category='fandom'
   AND t.status IN ('canonical','community')
 ));
GRANT SELECT ON public.fandom_directory TO anon,authenticated;

-- Read-only archive metadata. No copyrighted full texts are seeded by this plan.
CREATE TABLE public.archive_records(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 slug text NOT NULL UNIQUE,
 title text NOT NULL,
 creator_name text NOT NULL DEFAULT 'Fictional Test Creator',
 category text NOT NULL,
 publication_status text NOT NULL DEFAULT 'draft'
  CHECK (publication_status IN ('draft','review','published','archived')),
 host_mode text NOT NULL DEFAULT 'metadata_only'
  CHECK (host_mode IN ('metadata_only','citation','excerpt','full')),
 rights_status text NOT NULL DEFAULT 'unresolved'
  CHECK (rights_status IN ('unresolved','metadata_only','permission_pending',
    'creator_authorised','licensed','public_domain_verified')),
 rating text NOT NULL DEFAULT 'not_rated',
 minimum_reader_age integer NOT NULL DEFAULT 13,
 hosted_word_count integer NOT NULL DEFAULT 0 CHECK (hosted_word_count>=0),
 source_notes text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK (host_mode NOT IN ('full','excerpt') OR
  rights_status IN ('creator_authorised','licensed','public_domain_verified'))
);
ALTER TABLE public.archive_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY observatory_stage_archive_public_metadata
 ON public.archive_records FOR SELECT TO anon,authenticated
 USING (publication_status='published');
GRANT SELECT ON public.archive_records TO anon,authenticated;

CREATE TABLE public.archive_rights_records(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 record_id uuid NOT NULL REFERENCES public.archive_records(id) ON DELETE CASCADE,
 basis text NOT NULL DEFAULT 'unresolved',
 status text NOT NULL DEFAULT 'review'
  CHECK (status IN ('review','verified','expired','withdrawn')),
 permits_hosting boolean NOT NULL DEFAULT false,
 valid_from date,
 valid_until date,
 verified_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.archive_rights_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY observatory_stage_archive_verified_rights
 ON public.archive_rights_records FOR SELECT TO anon,authenticated
 USING (status='verified');
GRANT SELECT ON public.archive_rights_records TO anon,authenticated;

-- Text is private by default; only Owner may see its minimal index metadata,
-- never its body via the browser client. No public text access is provisioned.
CREATE TABLE public.archive_texts(
 record_id uuid PRIMARY KEY REFERENCES public.archive_records(id) ON DELETE CASCADE,
 body_text text NOT NULL DEFAULT '',
 source_url text NOT NULL DEFAULT '',
 word_count integer NOT NULL DEFAULT 0 CHECK (word_count>=0),
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.archive_texts ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.platform_memberships(
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 platform_role text NOT NULL DEFAULT 'member'
  CHECK (platform_role IN ('member','moderator','council','owner')),
 council_enabled boolean NOT NULL DEFAULT false,
 suspended boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.platform_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY observatory_stage_own_membership
 ON public.platform_memberships FOR SELECT TO authenticated
 USING (user_id=(SELECT auth.uid()));
GRANT SELECT ON public.platform_memberships TO authenticated;
-- No membership INSERT/UPDATE policies. No Owner assignments are included.

-- Match the production role lookup contract, but only within this isolated DB.
-- The helper does NOT grant an Owner role, and checks the logged-in user's ID.
CREATE FUNCTION private.has_platform_role(p_roles text[])
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
 AS $stage_role$
 SELECT EXISTS(
  SELECT 1 FROM public.platform_memberships pm
  WHERE pm.user_id=(SELECT auth.uid()) AND pm.suspended=false
   AND (pm.platform_role=ANY(p_roles)
    OR (pm.council_enabled=true AND 'council'=ANY(p_roles)))
 );
 $stage_role$;
REVOKE ALL ON FUNCTION private.has_platform_role(text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_platform_role(text[]) TO authenticated;

CREATE POLICY observatory_stage_archive_owner_review
 ON public.archive_records FOR SELECT TO authenticated
 USING (private.has_platform_role(ARRAY['owner']::text[]));
CREATE POLICY observatory_stage_archive_owner_rights
 ON public.archive_rights_records FOR SELECT TO authenticated
 USING (private.has_platform_role(ARRAY['owner']::text[]));
CREATE POLICY observatory_stage_archive_index_owner
 ON public.archive_texts FOR SELECT TO authenticated
 USING (private.has_platform_role(ARRAY['owner']::text[]));
-- Column grants protect body_text even from an Owner browser session.
GRANT SELECT(record_id,word_count,source_url) ON public.archive_texts TO authenticated;

-- Approved tag/metadata discovery; private drafts remain RLS-protected.
CREATE POLICY observatory_stage_accepted_tags_read
 ON public.tags FOR SELECT TO anon,authenticated
 USING (status IN ('canonical','community'));
GRANT SELECT ON public.tags TO anon,authenticated;

CREATE POLICY observatory_stage_public_works_metadata
 ON public.works FOR SELECT TO anon,authenticated
 USING (publication_status='published'
  AND (visibility='public'
   OR (visibility='members' AND (SELECT auth.uid()) IS NOT NULL)));
GRANT SELECT ON public.works TO anon,authenticated;

CREATE POLICY observatory_stage_work_tags_metadata
 ON public.work_tags FOR SELECT TO anon,authenticated
 USING (EXISTS(
  SELECT 1 FROM public.works w
  WHERE w.id=work_id AND (w.author_id=(SELECT auth.uid())
   OR (w.publication_status='published'
   AND (w.visibility='public'
    OR (w.visibility='members' AND (SELECT auth.uid()) IS NOT NULL))))
 ));
GRANT SELECT ON public.work_tags TO anon,authenticated;

-- Chapter text is never covered by work-metadata visibility alone.
-- The existing staging security helper enforces ownership, publication, age.
CREATE POLICY observatory_stage_chapters_read
 ON public.chapters FOR SELECT TO anon,authenticated
 USING (private.can_read_chapter(work_id,status));
GRANT SELECT ON public.chapters TO anon,authenticated;

-- Approved comment counts for the published-search RPC, no writing controls.
CREATE TABLE public.comments(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 work_id uuid NOT NULL REFERENCES public.works(id) ON DELETE CASCADE,
 status text NOT NULL DEFAULT 'pending'
  CHECK (status IN ('pending','approved','hidden','deleted'))
);
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY observatory_stage_approved_comment_counts
 ON public.comments FOR SELECT TO anon,authenticated
 USING (status='approved' AND EXISTS(
  SELECT 1 FROM public.works w
  WHERE w.id=work_id AND w.publication_status='published'
   AND (w.visibility='public' OR
    (w.visibility='members' AND (SELECT auth.uid()) IS NOT NULL))
 ));
GRANT SELECT ON public.comments TO anon,authenticated;

-- Intentionally omitted: inserts/updates by browser, Auth accounts, privileges
-- for live users, any Observatory issue/evidence tables or Storage, email,
-- payments, notifications, and RLS policy changes to existing security fixtures.
COMMIT;
