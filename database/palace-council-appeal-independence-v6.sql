-- Council appeals: independent review, clear deadlines, and private in-app notices.
alter table public.palace_case_appeals
 add column if not exists review_due timestamptz not null default (now()+interval '7 days');
create index if not exists palace_appeals_review_queue
 on public.palace_case_appeals(status,review_due);

create or replace function public.submit_palace_case_appeal(p_report uuid,p_text text)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_id uuid;
begin
 if v_user is null then raise exception 'Sign in to request an appeal.';end if;
 if char_length(btrim(coalesce(p_text,''))) not between 25 and 2000 then
  raise exception 'Please explain your appeal in 25–2000 characters.';end if;
 if not exists(
  select 1 from public.community_reports r where r.id=p_report
  and ((r.reporter_id=v_user and r.status in ('resolved','dismissed'))
   or exists(select 1 from public.palace_case_restoration c
    where c.report_id=r.id and c.subject_id=v_user and c.stage='recommendation'))
 ) then raise exception 'You may appeal only an eligible concluded report or a reviewed notice about your own account.';end if;
 insert into public.palace_case_appeals(report_id,appellant_id,appeal_text)
 values(p_report,v_user,btrim(p_text)) returning id into v_id;
 return v_id;
end $$;

create or replace function public.review_palace_case_appeal(p_appeal uuid,p_status text,p_note text)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_appeal public.palace_case_appeals%rowtype;
begin
 if v_user is null or not private.has_platform_role(array['owner','council']::text[]) then
 raise exception 'Council access required.';end if;
 if p_status not in ('reviewing','upheld','changed','dismissed') then
 raise exception 'Unknown appeal status.';end if;
 if p_status<>'reviewing' and char_length(btrim(coalesce(p_note,'')))<25 then
 raise exception 'Provide a reasoned review note of at least 25 characters.';end if;
 if char_length(coalesce(p_note,''))>2000 then raise exception 'Review note too long.';end if;
 select * into v_appeal from public.palace_case_appeals where id=p_appeal for update;
 if not found or v_appeal.status not in ('submitted','reviewing') then
  raise exception 'This appeal is no longer awaiting review.';end if;
 if v_appeal.appellant_id=v_user
   or exists(select 1 from public.community_reports r where r.id=v_appeal.report_id and r.reviewed_by=v_user)
   or exists(select 1 from public.palace_case_assessments a where a.report_id=v_appeal.report_id and a.reviewer_id=v_user)
   or exists(select 1 from public.palace_case_restoration c where c.report_id=v_appeal.report_id
      and (c.opened_by=v_user or c.secondary_reviewer=v_user)) then
 raise exception 'An appeal must be handled by a different, impartial Council reviewer.';end if;
 if v_appeal.reviewed_by is not null and v_appeal.reviewed_by<>v_user then
 raise exception 'This appeal is assigned to another reviewer.';end if;
 update public.palace_case_appeals set status=p_status,review_note=btrim(coalesce(p_note,'')),
 reviewed_by=v_user,reviewed_at=case when p_status='reviewing' then null else now() end
 where id=p_appeal;
 return true;
end $$;

create or replace function public.get_my_palace_appeals()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_user uuid:=auth.uid();
begin
 if v_user is null then raise exception 'Sign in to review your appeals.';end if;
 return jsonb_build_object('reports',coalesce((
 select jsonb_agg(jsonb_build_object(
 'id',r.id,
 'reason',case when r.reporter_id=v_user then r.reason else 'Private Council recommendation' end,
 'status',case when r.reporter_id=v_user then r.status else coalesce(c.stage,'notice') end,
 'source',case when r.reporter_id=v_user then 'submitted_report' else 'my_case' end,
 'created_at',r.created_at,
 'can_appeal',a.id is null and (
  (r.reporter_id=v_user and r.status in ('resolved','dismissed'))
  or (c.subject_id=v_user and c.stage='recommendation')),
 'appeal',case when a.id is null then null else jsonb_build_object(
 'status',a.status,'appeal_text',a.appeal_text,'review_note',a.review_note,
 'created_at',a.created_at,'review_due',a.review_due) end
 ) order by r.created_at desc)
 from (select r.* from public.community_reports r
 where r.reporter_id=v_user or exists(select 1 from public.palace_case_restoration c
   where c.report_id=r.id and c.subject_id=v_user)
 order by r.created_at desc limit 40)r
 left join public.palace_case_restoration c on c.report_id=r.id and c.subject_id=v_user
 left join public.palace_case_appeals a on a.report_id=r.id and a.appellant_id=v_user
 ),'[]'::jsonb));
end $$;

create or replace function public.get_council_appeal_queue()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_user uuid:=auth.uid();
begin
 if v_user is null or not private.has_platform_role(array['owner','council']::text[]) then
 raise exception 'Council access required.';end if;
 return coalesce((
 select jsonb_agg(jsonb_build_object(
 'id',a.id,'report_id',a.report_id,'appeal_text',a.appeal_text,
 'status',a.status,'created_at',a.created_at,'review_due',a.review_due,
 'review_note',a.review_note,'reviewed_by',a.reviewed_by,
 'can_review',a.status in ('submitted','reviewing')
   and (a.reviewed_by is null or a.reviewed_by=v_user)
   and a.appellant_id<>v_user
   and not exists(select 1 from public.community_reports r
       where r.id=a.report_id and r.reviewed_by=v_user)
   and not exists(select 1 from public.palace_case_assessments x
       where x.report_id=a.report_id and x.reviewer_id=v_user)
   and not exists(select 1 from public.palace_case_restoration c
       where c.report_id=a.report_id
       and (c.opened_by=v_user or c.secondary_reviewer=v_user))
 ) order by a.created_at desc)
 from (select * from public.palace_case_appeals order by created_at desc limit 60)a
 ),'[]'::jsonb);
end $$;
revoke all on function public.get_council_appeal_queue() from public,anon;
grant execute on function public.get_council_appeal_queue() to authenticated;

-- Reuse the existing Palace notification inbox. Nothing confidential goes in notification text.
create or replace function private.palace_case_notice(
 p_user uuid,p_title text,p_body text,p_key text,p_tab text)
returns void language plpgsql security definer set search_path='' as $$
begin
 if p_user is null then return; end if;
 insert into public.notifications
 (user_id,notice_type,title,body,route_name,activity_key,action_label,metadata)
 values(p_user,'council',p_title,p_body,'council',p_key,'Open Council',
 jsonb_build_object('tab',p_tab))
 on conflict(user_id,activity_key) where activity_key is not null do nothing;
end $$;
revoke all on function private.palace_case_notice(uuid,text,text,text,text) from public,anon,authenticated;

create or replace function private.council_restoration_notify()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_op='INSERT' then
  perform private.palace_case_notice(new.subject_id,'Private Council notice',
   'A Council review notice is ready. You have an opportunity to respond.',
   'council:notice:'||new.report_id::text,'notices-private');
 elsif new.responded_at is distinct from old.responded_at and new.responded_at is not null then
  perform private.palace_case_notice(new.opened_by,'Council member response',
    'A member has responded to a private case notice. An independent review may be needed.',
    'council:response:'||new.report_id::text,'accountability');
 elsif new.reviewed_at is distinct from old.reviewed_at and new.reviewed_at is not null then
  perform private.palace_case_notice(new.subject_id,'Council second review recorded',
    'An independent reviewer has recorded the Council recommendation. You can read it privately.',
    'council:second-review:'||new.report_id::text,'notices-private');
 end if;
 return new;
end $$;
drop trigger if exists palace_restoration_notice on public.palace_case_restoration;
create trigger palace_restoration_notice after insert or update on public.palace_case_restoration
 for each row execute function private.council_restoration_notify();

create or replace function private.council_appeal_notify()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_op='INSERT' then
  perform private.palace_case_notice(new.appellant_id,'Council appeal received',
   'Your request for a second review is in the private Council queue.',
   'council:appeal:received:'||new.id::text,'appeals');
 elsif new.status is distinct from old.status then
  perform private.palace_case_notice(new.appellant_id,
   case when new.status='reviewing' then 'Council appeal under review'
        else 'Council appeal decision recorded' end,
   case when new.status='reviewing' then 'An impartial reviewer has started reviewing your appeal.'
        else 'Your appeal has an outcome. Open your private Council appeals room to read the decision.' end,
   'council:appeal:'||new.status||':'||new.id::text,'appeals');
 end if;
 return new;
end $$;
drop trigger if exists palace_appeal_notice on public.palace_case_appeals;
create trigger palace_appeal_notice after insert or update on public.palace_case_appeals
 for each row execute function private.council_appeal_notify();

create or replace function public.check_my_palace_council_deadlines()
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_count integer:=0;v_row record;
begin
 if v_user is null then return jsonb_build_object('checked',false);end if;
 for v_row in select c.report_id,c.response_due
 from public.palace_case_restoration c
 where c.subject_id=v_user and c.stage='notice'
 and c.response_due between now() and now()+interval '48 hours'
 loop
  perform private.palace_case_notice(v_user,'Council response deadline approaching',
   'Your private Council response window closes within 48 hours.',
   'council:deadline:response:'||v_row.report_id::text,'notices-private');
  v_count:=v_count+1;
 end loop;
 for v_row in select a.id,a.review_due
 from public.palace_case_appeals a
 where a.appellant_id=v_user and a.status in ('submitted','reviewing')
 and a.review_due between now() and now()+interval '48 hours'
 loop
  perform private.palace_case_notice(v_user,'Council appeal review deadline',
   'The target date for reviewing your appeal is approaching. You can track its status in the Council.',
   'council:deadline:appeal:'||v_row.id::text,'appeals');
  v_count:=v_count+1;
 end loop;
 return jsonb_build_object('checked',true,'eligible_deadlines',v_count);
end $$;
revoke all on function public.check_my_palace_council_deadlines() from public,anon;
grant execute on function public.check_my_palace_council_deadlines() to authenticated;
