-- DISPOSABLE POSTGRES UNIT TEST ONLY: synthetic Supabase-shaped starting state.
-- This file MUST NOT be executed on any Supabase project.
-- The GitHub Actions job uses a throwaway PostgreSQL service container.
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE SCHEMA auth;
CREATE SCHEMA private;
GRANT USAGE ON SCHEMA auth TO anon, authenticated;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;

CREATE TABLE auth.users(id uuid PRIMARY KEY);
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE
AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
GRANT EXECUTE ON FUNCTION auth.uid() TO anon,authenticated;

-- Stage-specific protection: never allow proposal SQL to run without this.
CREATE TABLE private.staging_chat_rooms(id uuid PRIMARY KEY);
CREATE TABLE private.member_age(user_id uuid PRIMARY KEY REFERENCES auth.users(id),birth_date date);
CREATE TABLE public.works(
 id uuid PRIMARY KEY,author_id uuid NOT NULL,
 publication_status text NOT NULL DEFAULT 'draft',
 visibility text NOT NULL DEFAULT 'private',
 minimum_reader_age integer DEFAULT 13
);
CREATE TABLE public.work_collaborators(
 work_id uuid NOT NULL REFERENCES public.works(id),
 user_id uuid NOT NULL,
 status text NOT NULL DEFAULT 'pending',
 PRIMARY KEY(work_id,user_id)
);
CREATE TABLE public.chapters(
 id uuid PRIMARY KEY,work_id uuid NOT NULL REFERENCES public.works(id),
 status text NOT NULL
);
CREATE TABLE public.tags(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 name text NOT NULL,category text NOT NULL,
 status text NOT NULL DEFAULT 'canonical'
);
CREATE TABLE public.work_tags(
 work_id uuid NOT NULL REFERENCES public.works(id),
 tag_id uuid NOT NULL REFERENCES public.tags(id),
 PRIMARY KEY(work_id,tag_id)
);
ALTER TABLE public.works ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_tags ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION private.is_work_owner(p_work uuid)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $$ SELECT EXISTS(SELECT 1 FROM public.works w
 WHERE w.id=p_work AND w.author_id=(SELECT auth.uid())) $$;
CREATE OR REPLACE FUNCTION private.is_accepted_work_collaborator(p_work uuid)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $$ SELECT EXISTS(SELECT 1 FROM public.work_collaborators c
 WHERE c.work_id=p_work AND c.user_id=(SELECT auth.uid()) AND c.status='accepted') $$;
CREATE OR REPLACE FUNCTION private.member_meets_age(p_minimum_age integer)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $$ SELECT CASE WHEN (SELECT auth.uid()) IS NULL THEN coalesce(p_minimum_age,12)<=12
 ELSE EXISTS(SELECT 1 FROM private.member_age a
 WHERE a.user_id=(SELECT auth.uid()) AND
 (a.birth_date+make_interval(years=>greatest(coalesce(p_minimum_age,12),12)))::date<=current_date) END $$;
CREATE OR REPLACE FUNCTION private.can_read_chapter(p_work uuid,p_chapter_status text)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $$ SELECT private.is_work_owner(p_work)
 OR private.is_accepted_work_collaborator(p_work)
 OR EXISTS(SELECT 1 FROM public.works w
 WHERE w.id=p_work AND w.publication_status='published'
 AND p_chapter_status='published'
 AND (w.visibility='public' OR
 (w.visibility='members' AND (SELECT auth.uid()) IS NOT NULL))
 AND private.member_meets_age(w.minimum_reader_age)) $$;
-- Reproduce the pre-existing collaborator-aware stage policy.
CREATE POLICY "authors and collaborators read works" ON public.works
 FOR SELECT TO authenticated
 USING (author_id=(SELECT auth.uid()) OR private.is_accepted_work_collaborator(id));

-- Reproduce a pre-existing dummy work whose author is not an Auth user;
-- the compatibility FK must remain NOT VALID to preserve it.
INSERT INTO public.works(id,author_id,publication_status,visibility,minimum_reader_age)
VALUES ('11111111-1111-4111-8111-111111111111',
 '99999999-9999-4999-8999-999999999999','draft','private',13);

-- Disposable permission fixtures only: signatures and initial grants match
-- the Security Staging reward RPCs; these stubs NEVER award points or write rows.
CREATE OR REPLACE FUNCTION public.give_palace_praise(
 p_target_kind text,p_target_id uuid,p_praise_type text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
 AS $fictional_praise$
BEGIN
 IF auth.uid() IS NULL THEN
  RAISE EXCEPTION 'Synthetic fixture: authenticated account required.';
 END IF;
 RETURN '{}'::jsonb;
END
$fictional_praise$;
CREATE OR REPLACE FUNCTION public.record_palace_share(p_work_id uuid)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
 AS $fictional_share$
BEGIN
 IF auth.uid() IS NULL THEN
  RAISE EXCEPTION 'Synthetic fixture: authenticated account required.';
 END IF;
 RETURN '{}'::jsonb;
END
$fictional_share$;
GRANT EXECUTE ON FUNCTION public.give_palace_praise(text,uuid,text),
 public.record_palace_share(uuid) TO PUBLIC, anon, authenticated;
