-- THE PALACE OBSERVATORY — PHASE 3 SCHEMA PROPOSAL
-- REVIEW ONLY. NOT APPLIED TO PRODUCTION OR STAGING.
-- Do NOT execute automatically or add to deployed migration runners.
-- Preconditions: existing private.has_platform_role(text[]) and auth.uid().
-- Owner permission provisioned separately after identity review.
--
-- This is a proposed SQL review artifact rather than an executable Supabase
-- migration. After approval, validate it against an isolated database first.
BEGIN;

CREATE TABLE public.observatory_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  finding_key text UNIQUE CHECK (finding_key IS NULL OR length(finding_key)<=190),
  title text NOT NULL CHECK (length(trim(title)) BETWEEN 3 AND 160),
  work_title text NOT NULL DEFAULT '' CHECK (length(work_title)<=160),
  surface text NOT NULL CHECK (length(trim(surface)) BETWEEN 1 AND 100),
  severity text NOT NULL DEFAULT 'Medium' CHECK (severity IN ('Critical','High','Medium','Low')),
  status text NOT NULL DEFAULT 'New' CHECK (status IN
    ('New','Investigating','Fix Proposed','Awaiting Review','Fixed','Rechecked','Reopened')),
  expected text NOT NULL CHECK (length(trim(expected)) BETWEEN 1 AND 1800),
  observed text NOT NULL CHECK (length(trim(observed)) BETWEEN 1 AND 1800),
  steps text NOT NULL DEFAULT '' CHECK (length(steps)<=2400),
  device text NOT NULL DEFAULT '' CHECK (length(device)<=120),
  browser text NOT NULL DEFAULT '' CHECK (length(browser)<=120),
  source_url text CHECK (source_url IS NULL OR (length(source_url)<=750 AND source_url ~* '^https://')),
  fix_proposal text NOT NULL DEFAULT '' CHECK (length(fix_proposal)<=2400),
  review_note text NOT NULL DEFAULT '' CHECK (length(review_note)<=2400),
  created_by uuid NOT NULL DEFAULT auth.uid(),
  updated_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX observatory_issues_status_updated_idx ON public.observatory_issues (status,updated_at DESC);
ALTER TABLE public.observatory_issues ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.observatory_issue_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid NOT NULL REFERENCES public.observatory_issues(id) ON DELETE RESTRICT,
  action text NOT NULL CHECK (action IN ('Created','Edited','Status changed','Evidence added')),
  changed_fields text[] NOT NULL DEFAULT '{}'::text[],
  status_before text,
  status_after text,
  review_note text NOT NULL DEFAULT '',
  actor_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX observatory_issue_events_order_idx ON public.observatory_issue_events(issue_id,created_at DESC);
ALTER TABLE public.observatory_issue_events ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.observatory_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid NOT NULL REFERENCES public.observatory_issues(id) ON DELETE RESTRICT,
  file_path text NOT NULL UNIQUE CHECK (length(file_path)<=240),
  CONSTRAINT observatory_evidence_folder_matches_issue CHECK (split_part(file_path,'/',1)=issue_id::text),
  CONSTRAINT observatory_evidence_filename_is_image CHECK
    (file_path ~* '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(png|jpg|webp)$'),
  file_name text NOT NULL CHECK (length(file_name) BETWEEN 1 AND 160),
  file_size integer NOT NULL CHECK (file_size BETWEEN 1 AND 6291456),
  mime_type text NOT NULL CHECK (mime_type IN ('image/png','image/jpeg','image/webp')),
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX observatory_evidence_issue_idx ON public.observatory_evidence(issue_id,created_at DESC);
ALTER TABLE public.observatory_evidence ENABLE ROW LEVEL SECURITY;

-- No privileges for public guests; no DELETE or direct audit-event writes.
REVOKE ALL ON TABLE public.observatory_issues,public.observatory_issue_events,
 public.observatory_evidence FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.observatory_issues TO authenticated;
GRANT SELECT ON public.observatory_issue_events TO authenticated;
GRANT SELECT,INSERT ON public.observatory_evidence TO authenticated;

CREATE POLICY observatory_owner_select_issues ON public.observatory_issues
 FOR SELECT TO authenticated USING (private.has_platform_role(ARRAY['owner']::text[]));
CREATE POLICY observatory_owner_insert_issues ON public.observatory_issues
 FOR INSERT TO authenticated WITH CHECK (
  private.has_platform_role(ARRAY['owner']::text[])
  AND created_by=(SELECT auth.uid()) AND updated_by=(SELECT auth.uid())
 );
CREATE POLICY observatory_owner_update_issues ON public.observatory_issues
 FOR UPDATE TO authenticated
 USING (private.has_platform_role(ARRAY['owner']::text[]))
 WITH CHECK (
  private.has_platform_role(ARRAY['owner']::text[])
  AND updated_by=(SELECT auth.uid())
 );
CREATE POLICY observatory_owner_read_events ON public.observatory_issue_events
 FOR SELECT TO authenticated USING (private.has_platform_role(ARRAY['owner']::text[]));
CREATE POLICY observatory_owner_read_evidence ON public.observatory_evidence
 FOR SELECT TO authenticated USING (private.has_platform_role(ARRAY['owner']::text[]));
CREATE POLICY observatory_owner_add_evidence ON public.observatory_evidence
 FOR INSERT TO authenticated WITH CHECK (
  private.has_platform_role(ARRAY['owner']::text[]) AND created_by=(SELECT auth.uid())
 );

-- Owner authentication and review-state transitions are checked again by DB.
CREATE OR REPLACE FUNCTION private.observatory_guard_issue()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
BEGIN
 IF NOT private.has_platform_role(ARRAY['owner']::text[]) OR auth.uid() IS NULL THEN
  RAISE EXCEPTION 'Observatory Owner privileges required' USING ERRCODE='42501';
 END IF;
 IF TG_OP='INSERT' THEN
  NEW.created_by := auth.uid();
  NEW.updated_by := auth.uid();
  NEW.status := 'New';
 ELSE
  IF NEW.created_by IS DISTINCT FROM OLD.created_by
   OR NEW.created_at IS DISTINCT FROM OLD.created_at
   OR NEW.finding_key IS DISTINCT FROM OLD.finding_key THEN
   RAISE EXCEPTION 'Immutable issue identity cannot be altered' USING ERRCODE='23514';
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
   IF NOT (
     (OLD.status='New' AND NEW.status='Investigating') OR
     (OLD.status='Investigating' AND NEW.status='Fix Proposed') OR
     (OLD.status='Fix Proposed' AND NEW.status IN ('Awaiting Review','Investigating')) OR
     (OLD.status='Awaiting Review' AND NEW.status IN ('Fixed','Investigating')) OR
     (OLD.status='Fixed' AND NEW.status IN ('Rechecked','Reopened')) OR
     (OLD.status='Rechecked' AND NEW.status='Reopened') OR
     (OLD.status='Reopened' AND NEW.status='Investigating')
   ) THEN
    RAISE EXCEPTION 'Invalid Observatory issue status transition' USING ERRCODE='23514';
   END IF;
   IF NEW.status IN ('Fixed','Rechecked','Reopened')
      AND (length(trim(coalesce(NEW.review_note,'')))<8
           OR NEW.review_note IS NOT DISTINCT FROM OLD.review_note) THEN
    RAISE EXCEPTION 'A fresh evidence note is required for this status' USING ERRCODE='23514';
   END IF;
  END IF;
  NEW.updated_by := auth.uid();
 END IF;
 NEW.updated_at := clock_timestamp();
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.observatory_guard_issue() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER observatory_guard_issue_before
 BEFORE INSERT OR UPDATE ON public.observatory_issues
 FOR EACH ROW EXECUTE FUNCTION private.observatory_guard_issue();

-- DB-maintained append-only audit. No frontend INSERT/UPDATE/DELETE privilege
-- is granted on observatory_issue_events.
CREATE OR REPLACE FUNCTION private.observatory_audit_issue()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE edited_fields text[];
BEGIN
 IF TG_OP='INSERT' THEN
  INSERT INTO public.observatory_issue_events
    (issue_id,action,status_before,status_after,review_note,actor_id,changed_fields)
  VALUES (NEW.id,'Created',NULL,NEW.status,NEW.review_note,auth.uid(),ARRAY['created']::text[]);
 ELSE
  -- Log which fields changed without copying old manuscript-related notes
  -- or full issue bodies into additional tables.
  SELECT coalesce(array_agg(n.key ORDER BY n.key),'{}'::text[])
    INTO edited_fields
    FROM jsonb_each(to_jsonb(NEW)-'updated_at'-'updated_by') AS n
    JOIN jsonb_each(to_jsonb(OLD)-'updated_at'-'updated_by') AS o USING (key)
    WHERE n.value IS DISTINCT FROM o.value;
  INSERT INTO public.observatory_issue_events
    (issue_id,action,status_before,status_after,review_note,actor_id,changed_fields)
  VALUES (NEW.id,
    CASE WHEN NEW.status IS DISTINCT FROM OLD.status THEN 'Status changed' ELSE 'Edited' END,
    OLD.status,NEW.status,NEW.review_note,auth.uid(),edited_fields);
 END IF;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.observatory_audit_issue() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER observatory_audit_issue_after
 AFTER INSERT OR UPDATE ON public.observatory_issues
 FOR EACH ROW EXECUTE FUNCTION private.observatory_audit_issue();

CREATE OR REPLACE FUNCTION private.observatory_audit_evidence()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
 INSERT INTO public.observatory_issue_events
  (issue_id,action,review_note,actor_id)
 VALUES (NEW.issue_id,'Evidence added','Private screenshot attached: '||NEW.file_name,auth.uid());
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.observatory_audit_evidence() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER observatory_audit_evidence_after
 AFTER INSERT ON public.observatory_evidence
 FOR EACH ROW EXECUTE FUNCTION private.observatory_audit_evidence();

-- Entirely private screenshot storage. Do not place screenshots in public
-- GitHub, public storage, error reports or AI services.
-- Deliberately do not create a Storage bucket through SQL.
-- This is a separate, explicitly approved Supabase Storage API/Dashboard action.
-- Verify public=false, a 6 MiB file-size limit,
-- and an allowlist of PNG/JPEG/WebP before any evidence upload is enabled.
-- See docs/palace-observatory-phase3.md for the review checklist.

CREATE POLICY observatory_owner_read_screenshots ON storage.objects
 FOR SELECT TO authenticated USING (
  bucket_id='palace-observatory-evidence'
  AND private.has_platform_role(ARRAY['owner']::text[])
  -- A private upload that was not indexed must never be previewed.
  AND EXISTS (SELECT 1 FROM public.observatory_evidence e
    WHERE e.file_path=storage.objects.name)
 );
CREATE POLICY observatory_owner_upload_screenshots ON storage.objects
 FOR INSERT TO authenticated WITH CHECK (
  bucket_id='palace-observatory-evidence'
  AND private.has_platform_role(ARRAY['owner']::text[])
  AND name ~* '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(png|jpg|webp)$'
  AND EXISTS (SELECT 1 FROM public.observatory_issues issue
   WHERE issue.id::text=split_part(name,'/',1))
 );
-- No UPDATE, DELETE, upsert or public bucket policies.

COMMIT;

-- REQUIRED BEFORE APPROVAL:
-- (1) Apply in isolated staging only after explicit permission.
-- (2) Confirm nonowner/anon access denied for all three tables and storage.
-- (3) Test status changes, optimistic concurrency and immutable event history.
-- (4) Test private screenshot URLs expire; redact personal info first.
-- (5) Confirm existing Owner role via separate identity-approved provisioning.
-- (6) Never run this proposal from an automatically executed migration path.
