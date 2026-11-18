-- Manual migration. Interaction tables have no client grants. Each entry
-- point resolves work, chapter, thread and actor from stored identities.
begin;
create table private.discussion_thread_preferences (
 reader uuid references public.profiles on delete cascade,
 root uuid references public.comments on delete cascade,
 preference text not null check(preference in ('following','muted')),
 primary key(reader,root)
);
create index discussion_thread_followers on private.discussion_thread_preferences(root) where preference='following';
create table private.discussion_reactions (
 reader uuid references public.profiles on delete cascade,
 response uuid references public.comments on delete cascade,
 reaction text not null check(reaction in ('heart','laugh','surprise')),
 primary key(reader,response)
);
create index discussion_reaction_totals on private.discussion_reactions(response,reaction);
create table private.discussion_pins (
 root uuid primary key references public.comments on delete cascade
);
create table public.discussion_closed_chapters (
 chapter uuid primary key references public.chapters on delete cascade
);
revoke all on private.discussion_thread_preferences, private.discussion_reactions,
 private.discussion_pins,public.discussion_closed_chapters from public,anon,authenticated;

create function private.discussion_visible_root(response_id uuid,viewer uuid) returns uuid
language sql stable security definer set search_path='' as $$
 with recursive lineage as (
  select c.id,c.parent_comment_id,c.work_id,c.chapter_id,c.author_id from public.comments c
   join public.works w on w.id=c.work_id
   where c.id=response_id and c.status='approved'
   and (viewer=w.author_id or (
    w.publication_status='published' and (w.visibility='public' or (w.visibility='members' and viewer is not null))
    and ((viewer is null and coalesce(w.minimum_reader_age,12)<=12) or exists (
     select 1 from private.member_age a where a.user_id=viewer and
      (a.birth_date+make_interval(years=>greatest(coalesce(w.minimum_reader_age,12),12)))::date<=current_date))
    and (c.chapter_id is null or exists(select 1 from public.chapters ch where ch.id=c.chapter_id and ch.work_id=w.id and ch.status='published'))
   ))
   and not exists(select 1 from public.user_member_boundaries b where b.blocked and
    ((b.user_id=viewer and b.other_user_id=w.author_id) or (b.other_user_id=viewer and b.user_id=w.author_id)))
  union
  select c.id,c.parent_comment_id,c.work_id,c.chapter_id,c.author_id from public.comments c
   join lineage child on child.parent_comment_id=c.id and child.work_id=c.work_id
    and child.chapter_id is not distinct from c.chapter_id where c.status='approved'
 )
 select id from lineage where parent_comment_id is null and not exists (
  select 1 from lineage l join public.user_member_boundaries b on b.blocked and
   ((b.user_id=viewer and b.other_user_id=l.author_id) or (b.other_user_id=viewer and b.user_id=l.author_id))
 );
$$;
revoke all on function private.discussion_visible_root(uuid,uuid) from public,anon,authenticated;

create function public.set_discussion_interaction(response_id uuid,kind text,choice text) returns void
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); root_id uuid;
begin
 if actor is null then raise exception 'Sign in to continue.'; end if;
 root_id:=private.discussion_visible_root(response_id,actor);
 if root_id is null then raise exception 'Response unavailable.'; end if;
 if kind='preference' and choice in ('following','muted','off') then
  if choice='off' then delete from private.discussion_thread_preferences where reader=actor and root=root_id;
  else insert into private.discussion_thread_preferences values(actor,root_id,choice)
   on conflict(reader,root) do update set preference=excluded.preference;
  end if;
 elsif kind='reaction' and choice in ('heart','laugh','surprise','off') then
  if choice='off' then delete from private.discussion_reactions where reader=actor and response=response_id;
  else insert into private.discussion_reactions values(actor,response_id,choice)
   on conflict(reader,response) do update set reaction=excluded.reaction;
  end if;
 elsif kind='pin' and choice in ('on','off') and response_id=root_id and exists (
  select 1 from public.comments c join public.works w on w.id=c.work_id where c.id=root_id and w.author_id=actor
 ) then
  if choice='on' then insert into private.discussion_pins values(root_id) on conflict do nothing;
  else delete from private.discussion_pins where root=root_id; end if;
 else raise exception 'Action unavailable.';
 end if;
end $$;
revoke all on function public.set_discussion_interaction(uuid,text,text) from public,anon;
grant execute on function public.set_discussion_interaction(uuid,text,text) to authenticated;

create function public.set_discussion_chapter_closed(chapter_id uuid,closed boolean) returns void
language plpgsql security definer set search_path='' as $$
begin
 if closed is null or not exists(select 1 from public.chapters c join public.works w on w.id=c.work_id
   where c.id=chapter_id and w.author_id=auth.uid()) then raise exception 'Chapter unavailable.'; end if;
 perform pg_advisory_xact_lock(hashtextextended(chapter_id::text,1142));
 if closed then insert into public.discussion_closed_chapters values(chapter_id) on conflict do nothing;
 else delete from public.discussion_closed_chapters where chapter=chapter_id; end if;
end $$;
revoke all on function public.set_discussion_chapter_closed(uuid,boolean) from public,anon;
grant execute on function public.set_discussion_chapter_closed(uuid,boolean) to authenticated;

create function private.guard_closed_discussion() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if new.chapter_id is not null then
  perform pg_advisory_xact_lock_shared(hashtextextended(new.chapter_id::text,1142));
  if exists(select 1 from public.discussion_closed_chapters where chapter=new.chapter_id) then
   raise exception 'This chapter is closed to new responses.';
  end if;
 end if;
 return new;
end $$;
revoke all on function private.guard_closed_discussion() from public,anon,authenticated;
create trigger guard_closed_discussion before insert on public.comments
 for each row execute function private.guard_closed_discussion();

alter table public.discussion_closed_chapters enable row level security;
create policy "Visible chapter closure" on public.discussion_closed_chapters for select using
 (exists(select 1 from public.chapters c where c.id=chapter));
grant select on public.discussion_closed_chapters to anon, authenticated;

create function public.discussion_interaction_state(response_ids uuid[]) returns jsonb
language sql stable security definer set search_path='' as $$
 with visible as materialized (
  select id,private.discussion_visible_root(id,auth.uid()) root
  from (select distinct id from unnest(response_ids[1:100]) id) batch
 )
 select coalesce(jsonb_object_agg(v.id,jsonb_build_object(
  'pinned',p.root is not null,'preference',pref.preference,'reaction',mine.reaction,
  'counts',coalesce((select jsonb_object_agg(t.reaction,t.total) from (
    select reaction,count(*) total from private.discussion_reactions where response=v.id group by reaction
   ) t),'{}'::jsonb)
 )),'{}'::jsonb) from visible v
 left join private.discussion_pins p on p.root=v.id
 left join private.discussion_thread_preferences pref on pref.reader=auth.uid() and pref.root=v.root
 left join private.discussion_reactions mine on mine.reader=auth.uid() and mine.response=v.id
 where v.root is not null;
$$;
revoke all on function public.discussion_interaction_state(uuid[]) from public;
grant execute on function public.discussion_interaction_state(uuid[]) to anon,authenticated;

-- First approval only. Keep excerpts and member names out of notification previews.
create table private.discussion_announced (
 response uuid primary key references public.comments on delete cascade
);
insert into private.discussion_announced(response)
 select id from public.comments where status='approved';
revoke all on private.discussion_announced from public,anon,authenticated;
create function private.alert_discussion_readers() returns trigger
language plpgsql security definer set search_path='' as $$
declare root_id uuid; recipient record; slug text;
begin
 if new.status<>'approved' or (tg_op='UPDATE' and old.status='approved') then return new; end if;
 insert into private.discussion_announced values(new.id) on conflict do nothing;
 if not found then return new; end if;
 root_id:=private.discussion_visible_root(new.id,new.author_id);
 if root_id is null then return new; end if;
 select w.slug into slug from public.works w where w.id=new.work_id and w.publication_status='published';
 if slug is null then return new; end if;
 for recipient in
  with mentions as (
   select distinct lower(m[2]) username from regexp_matches(new.body,
    '(^|[^[:alnum:]_@])@([a-zA-Z0-9_]{3,30})(?![[:alnum:]_])','g') m limit 5
  ), interested as (
   select author_id reader,1 priority from public.comments where id=new.parent_comment_id
   union all select p.id,2 from mentions m join public.profiles p on lower(p.username)=m.username
   union all select reader,3 from private.discussion_thread_preferences where root=root_id and preference='following'
  )
  select i.reader,min(i.priority) reason from interested i where i.reader<>new.author_id
  and not exists(select 1 from private.discussion_thread_preferences t where t.reader=i.reader and t.root=root_id and t.preference='muted')
  group by i.reader
 loop
  if private.discussion_visible_root(new.id,recipient.reader) is not null then
   perform private.create_notification(recipient.reader,'comments',
    case recipient.reason when 1 then 'Someone replied to your comment' when 2 then 'You were mentioned in a discussion' else 'New response in a followed thread' end,
    'Open the discussion to read the response.','work',slug,'Read response','discussion-response:'||new.id::text,
    jsonb_build_object('chapter_id',new.chapter_id,'comment_id',new.id));
  end if;
 end loop;
 return new;
end $$;
revoke all on function private.alert_discussion_readers() from public,anon,authenticated;
create trigger alert_discussion_readers after insert or update of status,body,spoiler on public.comments
 for each row execute function private.alert_discussion_readers();
commit;
