-- Private offence checklist and appeal register. Reports are allegations until reviewed.
create table if not exists public.palace_case_assessments(
 report_id uuid primary key references public.community_reports(id) on delete cascade,
 reviewer_id uuid not null references public.profiles(id),
 categories text[] not null default '{}',
 evidence_checked boolean not null default false,
 context_checked boolean not null default false,
 member_heard boolean not null default false,
 conflict_checked boolean not null default false,
 proportionality_checked boolean not null default false,
 appeal_explained boolean not null default false,
 finding text not null default 'pending' check(finding in ('pending','unsubstantiated','substantiated','inconclusive')),
 action_label text not null default 'none' check(action_label in ('none','guidance','warning_recommended','restriction_recommended','escalation_recommended')),
 reviewer_note text not null default '',
 updated_at timestamptz not null default now()
);
create table if not exists public.palace_case_assessment_history(
 id uuid primary key default gen_random_uuid(),
 report_id uuid not null references public.community_reports(id) on delete cascade,
 reviewer_id uuid not null references public.profiles(id),
 snapshot jsonb not null,
 recorded_at timestamptz not null default now()
);
create table if not exists public.palace_case_appeals(
 id uuid primary key default gen_random_uuid(),
 report_id uuid not null references public.community_reports(id) on delete cascade,
 appellant_id uuid not null references public.profiles(id),
 appeal_text text not null check(char_length(appeal_text) between 25 and 2000),
 status text not null default 'submitted' check(status in ('submitted','reviewing','upheld','changed','dismissed')),
 reviewed_by uuid references public.profiles(id),
 review_note text not null default '',
 created_at timestamptz not null default now(),
 reviewed_at timestamptz,
 unique(report_id,appellant_id)
);
alter table public.palace_case_assessments enable row level security;
alter table public.palace_case_assessment_history enable row level security;
alter table public.palace_case_appeals enable row level security;
revoke all on public.palace_case_assessments,public.palace_case_assessment_history,public.palace_case_appeals from public,anon,authenticated;
create or replace function public.get_palace_case_checklists()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_user uuid:=auth.uid();
begin
 if v_user is null or not private.has_platform_role(array['owner','council']::text[]) then
  raise exception 'Council access is required to review offence checklists.';
 end if;
 return jsonb_build_object('cases',coalesce((
 select jsonb_agg(jsonb_build_object('report_id',r.id,'reason',r.reason,
 'target_kind',r.target_kind,'target_id',r.target_id,'status',r.status,
 'created_at',r.created_at,'assessment',case when a.report_id is null then null
 else jsonb_build_object('categories',a.categories,'evidence_checked',a.evidence_checked,
 'context_checked',a.context_checked,'member_heard',a.member_heard,
 'conflict_checked',a.conflict_checked,'proportionality_checked',a.proportionality_checked,
 'appeal_explained',a.appeal_explained,'finding',a.finding,
 'action_label',a.action_label,'reviewer_note',a.reviewer_note) end)
 order by r.created_at desc)
 from (select * from public.community_reports order by created_at desc limit 40)r
 left join public.palace_case_assessments a on a.report_id=r.id
 ),'[]'::jsonb),'appeals',coalesce((
 select jsonb_agg(jsonb_build_object('id',a.id,'report_id',a.report_id,
 'status',a.status,'appeal_text',a.appeal_text,'created_at',a.created_at,
 'review_note',a.review_note) order by a.created_at desc)
 from (select * from public.palace_case_appeals order by created_at desc limit 40)a
 ),'[]'::jsonb));
end $$;
create or replace function public.save_palace_case_checklist(
 p_report uuid,p_categories text[],p_evidence boolean,p_context boolean,
 p_heard boolean,p_conflict boolean,p_proportionality boolean,p_appeal boolean,
 p_finding text,p_action text,p_note text
) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_row public.palace_case_assessments%rowtype;
begin
 if v_user is null or not private.has_platform_role(array['owner','council']::text[]) then
 raise exception 'Council access required.'; end if;
 if not exists(select 1 from public.community_reports where id=p_report) then raise exception 'Report not found.'; end if;
 if p_finding not in ('pending','unsubstantiated','substantiated','inconclusive')
 or p_action not in ('none','guidance','warning_recommended','restriction_recommended','escalation_recommended')
 then raise exception 'Unsupported Council assessment choice.'; end if;
 if exists(select 1 from unnest(coalesce(p_categories,'{}'::text[])) cat where cat not in
 ('harassment','hate','threats','sexual_content','spam','plagiarism','impersonation','privacy','other'))
 then raise exception 'Use an established offence checklist category.'; end if;
 if p_finding<>'pending' and (not p_evidence or not p_context or not p_conflict
 or not p_proportionality or not p_appeal or char_length(btrim(coalesce(p_note,'')))<25)
 then raise exception 'Complete evidence, context, conflict, proportionality, appeal and a reasoned note before deciding.';end if;
 if p_action<>'none' and (p_finding<>'substantiated' or not p_heard) then
 raise exception 'A recommendation requires a substantiated finding and member response or documented opportunity to respond.';end if;
 if char_length(coalesce(p_note,''))>2000 then raise exception 'Review note too long.';end if;
 insert into public.palace_case_assessments
 (report_id,reviewer_id,categories,evidence_checked,context_checked,member_heard,
 conflict_checked,proportionality_checked,appeal_explained,finding,action_label,reviewer_note)
 values(p_report,v_user,coalesce(p_categories,'{}'),coalesce(p_evidence,false),coalesce(p_context,false),
 coalesce(p_heard,false),coalesce(p_conflict,false),coalesce(p_proportionality,false),
 coalesce(p_appeal,false),p_finding,p_action,btrim(coalesce(p_note,'')))
 on conflict(report_id) do update set reviewer_id=excluded.reviewer_id,categories=excluded.categories,
 evidence_checked=excluded.evidence_checked,context_checked=excluded.context_checked,
 member_heard=excluded.member_heard,conflict_checked=excluded.conflict_checked,
 proportionality_checked=excluded.proportionality_checked,appeal_explained=excluded.appeal_explained,
 finding=excluded.finding,action_label=excluded.action_label,reviewer_note=excluded.reviewer_note,updated_at=now()
 returning * into v_row;
 insert into public.palace_case_assessment_history(report_id,reviewer_id,snapshot)
 values(p_report,v_user,to_jsonb(v_row));
 return jsonb_build_object('saved',true,'finding',v_row.finding,'action',v_row.action_label);
end $$;
create or replace function public.submit_palace_case_appeal(p_report uuid,p_text text)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_id uuid;
begin
 if v_user is null then raise exception 'Sign in to request an appeal.';end if;
 -- Only the report submitter can use this route; no target identity is inferred from an arbitrary text target_id.
 if not exists(select 1 from public.community_reports r
 where r.id=p_report and r.reporter_id=v_user and r.status in ('resolved','dismissed')) then
 raise exception 'Only eligible resolved reports you submitted can be appealed here.';end if;
 insert into public.palace_case_appeals(report_id,appellant_id,appeal_text)
 values(p_report,v_user,btrim(p_text)) returning id into v_id; return v_id;
end $$;
create or replace function public.review_palace_case_appeal(p_appeal uuid,p_status text,p_note text)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();
begin
 if v_user is null or not private.has_platform_role(array['owner','council']::text[]) then raise exception 'Council access required.';end if;
 if p_status not in ('reviewing','upheld','changed','dismissed') then raise exception 'Unknown appeal status.';end if;
 if p_status<>'reviewing' and char_length(btrim(coalesce(p_note,'')))<25 then raise exception 'Provide a reasoned review note.';end if;
 update public.palace_case_appeals set status=p_status,review_note=btrim(coalesce(p_note,'')),
 reviewed_by=v_user,reviewed_at=case when p_status='reviewing' then null else now() end
 where id=p_appeal and (status in ('submitted','reviewing'));
 if not found then raise exception 'This appeal is no longer awaiting review.';end if;
 return true;
end $$;
revoke all on function public.get_palace_case_checklists() from public,anon;
revoke all on function public.save_palace_case_checklist(uuid,text[],boolean,boolean,boolean,boolean,boolean,boolean,text,text,text) from public,anon;
revoke all on function public.submit_palace_case_appeal(uuid,text) from public,anon;
revoke all on function public.review_palace_case_appeal(uuid,text,text) from public,anon;
grant execute on function public.get_palace_case_checklists() to authenticated;
grant execute on function public.save_palace_case_checklist(uuid,text[],boolean,boolean,boolean,boolean,boolean,boolean,text,text,text) to authenticated;
grant execute on function public.submit_palace_case_appeal(uuid,text) to authenticated;
grant execute on function public.review_palace_case_appeal(uuid,text,text) to authenticated;