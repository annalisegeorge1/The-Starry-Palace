-- Public member creative accomplishment showcase with opt-in reading totals.
-- Only published, publicly visible writing contributes to public statistics.
create table public.member_reading_showcase_preferences(
 user_id uuid primary key references public.profiles(id) on delete cascade,
 show_reading boolean not null default false,
 updated_at timestamptz not null default now()
);
alter table public.member_reading_showcase_preferences enable row level security;
revoke all on public.member_reading_showcase_preferences from public,anon,authenticated;

create or replace function public.get_member_creative_showcase(p_member uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare
 v_viewer uuid:=auth.uid();
 v_profile record;
 v_public_reading boolean:=false;
 v_author record;
 v_reader record;
 v_lifetime bigint:=0;
 v_spendable bigint:=0;
begin
 select id,visibility into v_profile from public.profiles where id=p_member;
 if v_profile.id is null or (v_profile.visibility='hidden' and p_member is distinct from v_viewer) then
   return null;
 end if;
 select coalesce(show_reading,false) into v_public_reading
 from public.member_reading_showcase_preferences where user_id=p_member;
 v_public_reading:=coalesce(v_public_reading,false);

 select count(*)::integer as published_chapters,
        coalesce(sum(c.word_count),0)::bigint as published_words,
        count(distinct c.work_id)::integer as published_worlds
 into v_author
 from public.chapters c
 join public.works w on w.id=c.work_id
 where w.author_id=p_member and w.publication_status='published'
 and w.visibility='public' and c.status='published';

 if p_member=v_viewer then
   select lifetime_points into v_lifetime from public.celestial_point_accounts where user_id=v_viewer;
   select spendable_points into v_spendable from public.grand_palace_wallets where user_id=v_viewer;
 end if;
 if p_member=v_viewer or v_public_reading then
   select count(*)::integer as finished_chapters, coalesce(sum(awarded),0)::integer as earned_reading_points
   into v_reader from public.palace_reading_sessions
   where reader_id=p_member and finished_at is not null and awarded>0;
 end if;
 return jsonb_build_object(
  'published_chapters',coalesce(v_author.published_chapters,0),
  'published_words',coalesce(v_author.published_words,0),
  'published_worlds',coalesce(v_author.published_worlds,0),
  'reading_visible',p_member=v_viewer or v_public_reading,
  'reading_opted_in',v_public_reading,
  'finished_chapters',case when p_member=v_viewer or v_public_reading then coalesce(v_reader.finished_chapters,0) else null end,
  'reading_points',case when p_member=v_viewer or v_public_reading then coalesce(v_reader.earned_reading_points,0) else null end,
  'own_account',p_member=v_viewer,
  'lifetime_points',case when p_member=v_viewer then coalesce(v_lifetime,0) else null end,
  'spendable_points',case when p_member=v_viewer then coalesce(v_spendable,0) else null end
 );
end $$;
create or replace function public.set_member_reading_showcase(p_show boolean)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();
begin
 if v_user is null then raise exception 'Sign in to set your reading privacy.';end if;
 if p_show is null then raise exception 'Choose whether to show your reading achievements.';end if;
 insert into public.member_reading_showcase_preferences(user_id,show_reading,updated_at)
 values(v_user,p_show,now())
 on conflict(user_id) do update set show_reading=excluded.show_reading, updated_at=now();
 return p_show;
end $$;
revoke all on function public.get_member_creative_showcase(uuid) from public,anon;
revoke all on function public.set_member_reading_showcase(boolean) from public,anon;
grant execute on function public.get_member_creative_showcase(uuid) to authenticated;
grant execute on function public.set_member_reading_showcase(boolean) to authenticated;
