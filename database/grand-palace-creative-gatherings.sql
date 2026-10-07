-- Grand Palace creative gatherings: community participation, no scoring changes
create table public.grand_palace_exhibits(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(id) on delete cascade,
 palace_id smallint not null references public.grand_palaces(id),
 kind text not null check(kind in ('poetry','flash_fiction','art_description','worldbuilding','recommendation','collaboration')),
 title text not null check(char_length(title) between 4 and 100),
 body text not null check(char_length(body) between 25 and 2000),
 festival_key text not null,
 created_at timestamptz not null default now(),
 removed_at timestamptz
);
create index grand_palace_exhibits_lookup on public.grand_palace_exhibits(festival_key,created_at desc);
create index grand_palace_exhibits_court on public.grand_palace_exhibits(palace_id,created_at desc);
alter table public.grand_palace_exhibits enable row level security;
revoke all on public.grand_palace_exhibits from anon,authenticated;

create table public.grand_palace_collaborations(
 id uuid primary key default gen_random_uuid(),
 palace_id smallint not null references public.grand_palaces(id),
 quarter_start date not null references public.grand_palace_seasons(quarter_start),
 initiator_id uuid not null references public.profiles(id) on delete cascade,
 title text not null check(char_length(title) between 8 and 100),
 prompt text not null check(char_length(prompt) between 20 and 600),
 status text not null default 'open' check(status in ('open','closed')),
 created_at timestamptz not null default now(),
 unique(palace_id,quarter_start,title)
);
create table public.grand_palace_collaboration_lines(
 id uuid primary key default gen_random_uuid(),
 collaboration_id uuid not null references public.grand_palace_collaborations(id) on delete cascade,
 author_id uuid not null references public.profiles(id) on delete cascade,
 content text not null check(char_length(content) between 40 and 500),
 created_at timestamptz not null default now()
);
create index grand_palace_collaboration_lines_lookup on public.grand_palace_collaboration_lines(collaboration_id,created_at);
alter table public.grand_palace_collaborations enable row level security;
alter table public.grand_palace_collaboration_lines enable row level security;
revoke all on public.grand_palace_collaborations,public.grand_palace_collaboration_lines from anon,authenticated;

create or replace function public.get_grand_palace_gatherings()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_palace smallint;v_quarter date:=date_trunc('quarter',now() at time zone 'UTC')::date;v_key text;v_result jsonb;
begin
 if v_user is null then raise exception 'Sign in to the Palace gatherings.'; end if;
 select palace_id into v_palace from public.grand_palace_memberships where user_id=v_user;
 if v_palace is null then raise exception 'Your Grand Palace is not assigned.'; end if;
 v_key:=to_char(now() at time zone 'UTC','YYYY-MM');
 select jsonb_build_object(
  'festival_key',v_key,'palace_id',v_palace,
  'exhibits',coalesce((select jsonb_agg(jsonb_build_object(
   'id',e.id,'kind',e.kind,'title',e.title,'body',e.body,'created_at',e.created_at,
   'palace_id',e.palace_id,'palace_name',gp.name,
   'username',p.username,'display_name',p.display_name,
   'is_mine',e.user_id=v_user) order by e.created_at desc)
   from(select * from public.grand_palace_exhibits where festival_key=v_key and removed_at is null
     order by created_at desc limit 48)e
   join public.profiles p on p.id=e.user_id
   join public.grand_palaces gp on gp.id=e.palace_id
   where p.visibility='public' or e.user_id=v_user),'[]'::jsonb),
  'collaborations',coalesce((select jsonb_agg(jsonb_build_object(
    'id',c.id,'title',c.title,'prompt',c.prompt,'status',c.status,
    'created_at',c.created_at,
    'lines',coalesce((select jsonb_agg(jsonb_build_object(
      'id',l.id,'body',l.content,'created_at',l.created_at,
      'display_name',p.display_name,'username',p.username)
      order by l.created_at)
      from public.grand_palace_collaboration_lines l
      join public.profiles p on p.id=l.author_id
      where l.collaboration_id=c.id and (p.visibility='public' or p.id=v_user)),'[]'::jsonb))
     order by c.created_at desc)
     from(select * from public.grand_palace_collaborations
       where palace_id=v_palace and quarter_start=v_quarter
       order by created_at desc limit 8)c),'[]'::jsonb),
  'my_exhibits_today',(select count(*) from public.grand_palace_exhibits where user_id=v_user
    and (created_at at time zone 'UTC')::date=(now() at time zone 'UTC')::date),
  'my_lines_today',(select count(*) from public.grand_palace_collaboration_lines where author_id=v_user
    and (created_at at time zone 'UTC')::date=(now() at time zone 'UTC')::date)
 ) into v_result;
 return v_result;
end $$;

create or replace function public.submit_grand_palace_exhibit(p_kind text,p_title text,p_body text)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_palace smallint;v_id uuid;v_today integer;v_key text;
begin
 if v_user is null then raise exception 'Sign in to contribute an exhibit.'; end if;
 if p_kind not in ('poetry','flash_fiction','art_description','worldbuilding','recommendation','collaboration')
   or char_length(btrim(coalesce(p_title,''))) not between 4 and 100
   or char_length(btrim(coalesce(p_body,''))) not between 25 and 2000
 then raise exception 'Choose a valid exhibit with a title and 25–2,000 characters.'; end if;
 select palace_id into v_palace from public.grand_palace_memberships where user_id=v_user;
 if v_palace is null then raise exception 'Grand Palace membership missing.'; end if;
 perform pg_advisory_xact_lock(hashtext(v_user::text),7040320);
 select count(*) into v_today from public.grand_palace_exhibits where user_id=v_user
 and (created_at at time zone 'UTC')::date=(now() at time zone 'UTC')::date;
 if v_today>=3 then raise exception 'Three festival submissions allowed each UTC day.'; end if;
 v_key:=to_char(now() at time zone 'UTC','YYYY-MM');
 insert into public.grand_palace_exhibits(user_id,palace_id,kind,title,body,festival_key)
 values(v_user,v_palace,p_kind,btrim(p_title),btrim(p_body),v_key) returning id into v_id;
 return v_id;
end $$;

create or replace function public.open_grand_palace_collaboration(p_title text,p_prompt text)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_palace smallint;v_quarter date:=date_trunc('quarter',now() at time zone 'UTC')::date;v_id uuid;
begin
 if v_user is null then raise exception 'Sign in to open a Palace quest.'; end if;
 if char_length(btrim(coalesce(p_title,''))) not between 8 and 100
 or char_length(btrim(coalesce(p_prompt,''))) not between 20 and 600 then
 raise exception 'Write a quest title (8–100) and premise (20–600).';end if;
 select palace_id into v_palace from public.grand_palace_memberships where user_id=v_user;
 if v_palace is null then raise exception 'Grand Palace membership missing.'; end if;
 perform pg_advisory_xact_lock(7040321,v_palace::integer);
 if (select count(*) from public.grand_palace_collaborations
   where palace_id=v_palace and quarter_start=v_quarter and status='open')>=3
 then raise exception 'Your Palace can host up to three open quests at once.'; end if;
 insert into public.grand_palace_collaborations(palace_id,quarter_start,initiator_id,title,prompt)
 values(v_palace,v_quarter,v_user,btrim(p_title),btrim(p_prompt)) returning id into v_id;
 return v_id;
end $$;

create or replace function public.add_grand_palace_collaboration_line(p_collaboration uuid,p_content text)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_palace smallint;v_id uuid;v_count integer;v_last uuid;
begin
 if v_user is null then raise exception 'Sign in to join this Palace quest.'; end if;
 if char_length(btrim(coalesce(p_content,''))) not between 40 and 500 then
 raise exception 'Contribute 40–500 characters.'; end if;
 select palace_id into v_palace from public.grand_palace_memberships where user_id=v_user;
 if v_palace is null then raise exception 'Grand Palace membership missing.'; end if;
 perform pg_advisory_xact_lock(hashtext(p_collaboration::text),7040322);
 if not exists(select 1 from public.grand_palace_collaborations
 where id=p_collaboration and palace_id=v_palace and status='open')
 then raise exception 'This quest is not open to your Palace.';end if;
 select count(*) into v_count from public.grand_palace_collaboration_lines
 where author_id=v_user and (created_at at time zone 'UTC')::date=(now() at time zone 'UTC')::date;
 if v_count>=5 then raise exception 'Five collaborative contributions per UTC day.';end if;
 select author_id into v_last from public.grand_palace_collaboration_lines
 where collaboration_id=p_collaboration order by created_at desc,id desc limit 1;
 if v_last=v_user then raise exception 'Pass the quill to another member before writing again.';end if;
 insert into public.grand_palace_collaboration_lines(collaboration_id,author_id,content)
 values(p_collaboration,v_user,btrim(p_content)) returning id into v_id;
 return v_id;
end $$;

create or replace function public.close_grand_palace_collaboration(p_collaboration uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();
begin
 if v_user is null then raise exception 'Sign in first.';end if;
 update public.grand_palace_collaborations set status='closed'
 where id=p_collaboration and initiator_id=v_user and status='open';
 if not found then raise exception 'Only the hosting author can close an active quest.';end if;
 return true;
end $$;

revoke all on function public.get_grand_palace_gatherings() from public,anon;
revoke all on function public.submit_grand_palace_exhibit(text,text,text) from public,anon;
revoke all on function public.open_grand_palace_collaboration(text,text) from public,anon;
revoke all on function public.add_grand_palace_collaboration_line(uuid,text) from public,anon;
revoke all on function public.close_grand_palace_collaboration(uuid) from public,anon;
grant execute on function public.get_grand_palace_gatherings() to authenticated;
grant execute on function public.submit_grand_palace_exhibit(text,text,text) to authenticated;
grant execute on function public.open_grand_palace_collaboration(text,text) to authenticated;
grant execute on function public.add_grand_palace_collaboration_line(uuid,text) to authenticated;
grant execute on function public.close_grand_palace_collaboration(uuid) to authenticated;
