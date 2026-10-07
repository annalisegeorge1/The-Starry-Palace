-- Palace Arts discovery, consensual invitations and rotating features
-- All memberships and exhibition placements remain controlled by existing trusted tables.
create table public.grand_palace_quest_invite_prefs(
 user_id uuid primary key references public.profiles(id) on delete cascade,
 invites_enabled boolean not null default false,
 updated_at timestamptz not null default now()
);
create table public.grand_palace_quest_invites(
 id uuid primary key default gen_random_uuid(),
 collaboration_id uuid not null references public.grand_palace_collaborations(id) on delete cascade,
 sender_id uuid not null references public.profiles(id) on delete cascade,
 recipient_id uuid not null references public.profiles(id) on delete cascade,
 status text not null default 'pending' check(status in ('pending','accepted','declined')),
 created_at timestamptz not null default now(),
 responded_at timestamptz,
 unique(collaboration_id,recipient_id),
 check(sender_id<>recipient_id)
);
create index grand_palace_quest_invites_inbox on public.grand_palace_quest_invites(recipient_id,created_at desc);
create index grand_palace_quest_invites_sender on public.grand_palace_quest_invites(sender_id,created_at desc);
alter table public.grand_palace_quest_invite_prefs enable row level security;
alter table public.grand_palace_quest_invites enable row level security;
revoke all on public.grand_palace_quest_invite_prefs, public.grand_palace_quest_invites from anon,authenticated;

create or replace function public.get_palace_arts_discovery()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_palace smallint;v_month text:=to_char(now() at time zone 'UTC','YYYY-MM');v_date date:=(now() at time zone 'UTC')::date;v_result jsonb;
begin
 if v_user is null then raise exception 'Sign in to visit Palace Arts discovery.'; end if;
 select palace_id into v_palace from public.grand_palace_memberships where user_id=v_user;
 if v_palace is null then raise exception 'Grand Palace membership is unavailable.'; end if;
 select jsonb_build_object(
  'month',v_month,
  'invites_enabled',coalesce((select invites_enabled from public.grand_palace_quest_invite_prefs where user_id=v_user),false),
  'featured',coalesce((
   select jsonb_agg(jsonb_build_object(
     'id',e.id,'title',e.title,'body',e.body,'kind',e.kind,'palace_id',e.palace_id,
     'palace_name',g.name,'author_name',p.display_name,'username',p.username,
     'created_at',e.created_at) order by e.palace_id)
   from public.grand_palaces g
   join lateral (
     select x.* from public.grand_palace_exhibits x
     join public.profiles px on px.id=x.user_id
     where x.palace_id=g.id and x.festival_key=v_month
      and x.removed_at is null and (px.visibility='public' or px.id=v_user)
      and not exists(select 1 from public.user_member_boundaries b
       where b.blocked and ((b.user_id=v_user and b.other_user_id=x.user_id)
        or (b.user_id=x.user_id and b.other_user_id=v_user)))
     order by md5(v_date::text||x.user_id::text||x.id::text),x.created_at
     limit 1
   ) e on true
   join public.profiles p on p.id=e.user_id
  ),'[]'::jsonb),
  'court_creators',coalesce((
    select jsonb_agg(jsonb_build_object('id',x.id,'username',x.username,
      'display_name',x.display_name,'avatar_url',x.avatar_url,
      'bio',left(coalesce(x.bio,''),200),
      'featured_genres',x.featured_genres,
      'accepts_invites',x.invites_enabled) order by x.rotation)
    from (
      select p.id,p.username,p.display_name,p.avatar_url,p.bio,p.featured_genres,
       coalesce(pref.invites_enabled,false) as invites_enabled,
       md5(v_date::text||p.id::text) as rotation
      from public.grand_palace_memberships m
      join public.profiles p on p.id=m.user_id
      left join public.grand_palace_quest_invite_prefs pref on pref.user_id=p.id
      where m.palace_id=v_palace and p.visibility='public' and p.id<>v_user
        and not exists(select 1 from public.user_member_boundaries b
         where b.blocked and ((b.user_id=v_user and b.other_user_id=p.id)
          or (b.user_id=p.id and b.other_user_id=v_user)))
      order by md5(v_date::text||p.id::text) limit 35
    )x
  ),'[]'::jsonb),
  'invitations',coalesce((
    select jsonb_agg(jsonb_build_object(
      'id',i.id,'collaboration_id',i.collaboration_id,'title',c.title,
      'prompt',c.prompt,'status',i.status,'sender',coalesce(p.display_name,p.username),
      'sender_handle',p.username,'created_at',i.created_at,
      'quest_status',c.status
     ) order by i.created_at desc)
    from (
      select * from public.grand_palace_quest_invites
      where recipient_id=v_user and created_at>=now()-interval '90 days'
      order by created_at desc limit 20
    ) i join public.grand_palace_collaborations c on c.id=i.collaboration_id
      and c.palace_id=v_palace
    join public.profiles p on p.id=i.sender_id
    where not exists(select 1 from public.user_member_boundaries b
     where b.blocked and ((b.user_id=v_user and b.other_user_id=i.sender_id)
      or (b.user_id=i.sender_id and b.other_user_id=v_user)))
  ),'[]'::jsonb)
 ) into v_result;
 return v_result;
end $$;

create or replace function public.set_palace_quest_invites_enabled(p_enabled boolean)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();
begin
 if v_user is null then raise exception 'Sign in to set your invitation preferences.'; end if;
 if p_enabled is null then raise exception 'Choose whether to allow quest invitations.'; end if;
 if not exists(select 1 from public.grand_palace_memberships where user_id=v_user)
 then raise exception 'Grand Palace membership unavailable.'; end if;
 insert into public.grand_palace_quest_invite_prefs(user_id,invites_enabled,updated_at)
 values(v_user,p_enabled,now())
 on conflict(user_id) do update set invites_enabled=excluded.invites_enabled,updated_at=now();
 return p_enabled;
end $$;

create or replace function public.send_palace_quest_invite(p_collaboration uuid,p_recipient uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_court smallint;v_receiver smallint;v_id uuid;
begin
 if v_user is null then raise exception 'Sign in to invite another Palace member.'; end if;
 if p_recipient is null or p_collaboration is null or p_recipient=v_user then
   raise exception 'Choose a different member and a valid quest.'; end if;
 select palace_id into v_court from public.grand_palace_memberships where user_id=v_user;
 select palace_id into v_receiver from public.grand_palace_memberships where user_id=p_recipient;
 if v_court is null or v_court<>v_receiver
    or not exists(select 1 from public.grand_palace_collaborations
       where id=p_collaboration and palace_id=v_court and status='open')
 then raise exception 'Only members of your court can be invited to an open quest.'; end if;
 if not exists(select 1 from public.grand_palace_quest_invite_prefs
      where user_id=p_recipient and invites_enabled)
   or not exists(select 1 from public.profiles where id=p_recipient and visibility='public')
 then raise exception 'This member is not accepting quest invitations.'; end if;
 if exists(select 1 from public.user_member_boundaries b where b.blocked
   and ((b.user_id=v_user and b.other_user_id=p_recipient)
     or (b.user_id=p_recipient and b.other_user_id=v_user)))
 then raise exception 'This invitation is unavailable due to a member boundary.'; end if;
 perform pg_advisory_xact_lock(hashtext(v_user::text),7040355);
 if (select count(*) from public.grand_palace_quest_invites
     where sender_id=v_user and (created_at at time zone 'UTC')::date=(now() at time zone 'UTC')::date)>=3
 then raise exception 'You have sent three quest invitations today.'; end if;
 insert into public.grand_palace_quest_invites(collaboration_id,sender_id,recipient_id)
 values(p_collaboration,v_user,p_recipient)
 on conflict(collaboration_id,recipient_id) do nothing returning id into v_id;
 if v_id is null then raise exception 'This member was already invited to this quest.'; end if;
 return v_id;
end $$;

create or replace function public.respond_palace_quest_invite(p_invitation uuid,p_accept boolean)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_quest uuid;v_status text;
begin
 if v_user is null then raise exception 'Sign in to respond to your invitation.'; end if;
 if p_invitation is null or p_accept is null then raise exception 'Choose an invitation and response.'; end if;
 update public.grand_palace_quest_invites i
 set status=case when p_accept then 'accepted' else 'declined' end,responded_at=now()
 from public.grand_palace_collaborations c
 where i.id=p_invitation and i.recipient_id=v_user and i.status='pending'
   and c.id=i.collaboration_id and c.status='open'
   and c.palace_id=(select palace_id from public.grand_palace_memberships where user_id=v_user)
 returning i.collaboration_id,i.status into v_quest,v_status;
 if v_quest is null then raise exception 'This quest invitation is unavailable or already answered.'; end if;
 return jsonb_build_object('status',v_status,'collaboration_id',v_quest);
end $$;

revoke all on function public.get_palace_arts_discovery() from public,anon;
revoke all on function public.set_palace_quest_invites_enabled(boolean) from public,anon;
revoke all on function public.send_palace_quest_invite(uuid,uuid) from public,anon;
revoke all on function public.respond_palace_quest_invite(uuid,boolean) from public,anon;
grant execute on function public.get_palace_arts_discovery() to authenticated;
grant execute on function public.set_palace_quest_invites_enabled(boolean) to authenticated;
grant execute on function public.send_palace_quest_invite(uuid,uuid) to authenticated;
grant execute on function public.respond_palace_quest_invite(uuid,boolean) to authenticated;
