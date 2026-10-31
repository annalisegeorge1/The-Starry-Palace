-- Disposable, entirely synthetic assertions for the PROPOSED security RPCs.
-- No real accounts, manuscripts, API keys, or external services involved.
-- Simulated JWT subjects exercise auth.uid() branches; NOT real PostgREST
-- or full Supabase Auth/Storage permission integration.

do $tests$
declare
  v jsonb;
  n bigint;
  v_raises boolean;
  work_public uuid := '10000000-0000-0000-0000-000000000001';
  work_private uuid := '10000000-0000-0000-0000-000000000002';
  work_members uuid := '10000000-0000-0000-0000-000000000003';
  work_adult uuid := '10000000-0000-0000-0000-000000000004';
  chapter_draft uuid := '20000000-0000-0000-0000-000000000002';
  chapter_adult uuid := '20000000-0000-0000-0000-000000000004';
  owner_id uuid := '00000000-0000-0000-0000-000000000001';
  adult_id uuid := '00000000-0000-0000-0000-000000000002';
  young_id uuid := '00000000-0000-0000-0000-000000000003';
  editor_id uuid := '00000000-0000-0000-0000-000000000004';
  blocked_id uuid := '00000000-0000-0000-0000-000000000005';
begin
  -- Signed-out reader.
  perform set_config('request.jwt.claim.sub','',false);
  select public.get_palace_praise_state('work',work_public) into v;
  if (v->'counts'->>'heart')::int <> 1 then raise exception 'guest public praise count'; end if;
  select public.get_palace_praise_state('work',work_private) into v;
  if (v->'counts'->>'crown')::int <> 0 then raise exception 'guest private praise leaked'; end if;
  select public.get_palace_praise_state('work',work_members) into v;
  if (v->'counts'->>'heart')::int <> 0 then raise exception 'guest member praise leaked'; end if;
  select public.get_palace_praise_state('work',work_adult) into v;
  if (v->'counts'->>'star')::int <> 0 then raise exception 'guest adult praise leaked'; end if;

  select count(*) into n from public.get_reading_room_bookmark_counts(array[work_public]);
  if n<>1 then raise exception 'guest public bookmark missing'; end if;
  select count(*) into n from public.get_reading_room_bookmark_counts(array[work_adult]);
  if n<>0 then raise exception 'guest adult bookmark leaked'; end if;
  select count(*) into n from public.get_reading_room_bookmark_counts(array[work_private]);
  if n<>0 then raise exception 'guest draft bookmark leaked'; end if;
  select count(*) into n from public.get_reading_room_bookmark_counts(array[]::uuid[]);
  if n<>0 then raise exception 'empty bookmark request returned rows'; end if;

  select public.get_grand_palace_identity(owner_id) into v;
  if v is not null then raise exception 'guest private Grand Palace identity exposed'; end if;
  select public.get_work_lore(work_public) into v;
  if jsonb_array_length(v)<>1 then raise exception 'public lore not returned'; end if;
  if v->0->'unlock_chapter' <> 'null'::jsonb or v->0->'unlock_chapter_id' <> 'null'::jsonb
    then raise exception 'guest saw unpublished chapter metadata'; end if;
  if v->0->>'body' <> '' then raise exception 'guest saw locked lore body'; end if;

  select usage_count into n from public.search_palace_tags_v2('DraftOnlyTag','genre',10);
  if n<>0 then raise exception 'guest draft tag usage leaked'; end if;
  select usage_count into n from public.search_palace_tags('AdultTag','genre',10);
  if n<>0 then raise exception 'guest adult tag usage leaked'; end if;
  select usage_count into n from public.search_palace_tags_v2('PublicTag','genre',10);
  if n<>1 then raise exception 'guest public tag usage wrong'; end if;

  -- A signed-in 13-year-old may read members 13+, not published 18+.
  perform set_config('request.jwt.claim.sub',young_id::text,false);
  select count(*) into n from public.get_reading_room_bookmark_counts(array[work_members]);
  if n<>1 then raise exception 'younger member 13+ bookmark absent'; end if;
  select count(*) into n from public.get_reading_room_bookmark_counts(array[work_adult]);
  if n<>0 then raise exception 'younger member 18+ bookmark leaked'; end if;
  select public.get_palace_praise_state('work',work_adult) into v;
  if (v->'counts'->>'star')::int<>0 then raise exception 'younger member 18+ praise leaked'; end if;
  select usage_count into n from public.search_palace_tags('AdultTag','genre',20);
  if n<>0 then raise exception 'younger member adult tag count leaked'; end if;

  v_raises:=false;
  begin
    perform public.record_palace_share(work_adult);
  exception when others then v_raises:=true;
  end;
  if not v_raises then raise exception 'young user shared age-restricted work'; end if;
  v_raises:=false;
  begin
    perform public.give_palace_praise('chapter',chapter_adult,'moon');
  exception when others then v_raises:=true;
  end;
  if not v_raises then raise exception 'young user praised age-restricted chapter'; end if;

  -- Unrelated adult sees eligible public/member data, not private drafts.
  perform set_config('request.jwt.claim.sub',adult_id::text,false);
  select count(*) into n from public.get_reading_room_bookmark_counts(array[work_adult]);
  if n<>1 then raise exception 'adult eligible bookmark absent'; end if;
  select usage_count into n from public.search_palace_tags_v2('AdultTag','genre',20);
  if n<>2 then raise exception 'adult published work/comic tag count wrong'; end if;
  select usage_count into n from public.search_palace_tags_v2('DraftOnlyTag','genre',20);
  if n<>0 then raise exception 'adult private draft tag leaked'; end if;
  select public.get_palace_praise_state('work',work_private) into v;
  if (v->'counts'->>'crown')::int<>0 then raise exception 'unrelated adult private praise leaked'; end if;

  -- Adult reward amounts and weekly idempotence remain unchanged.
  select public.record_palace_share(work_adult) into v;
  if (v->>'giver_points_awarded_now')::int<>2 or (v->>'receiver_points_awarded_now')::int<>1
     then raise exception 'adult first share rewards changed'; end if;
  select public.record_palace_share(work_adult) into v;
  if (v->>'giver_points_awarded_now')::int<>0 or (v->>'receiver_points_awarded_now')::int<>0
     then raise exception 'adult duplicate share not idempotent'; end if;
  select public.give_palace_praise('chapter',chapter_adult,'star') into v;
  if (v->>'giver_points_awarded_now')::int<=0 or (v->>'receiver_points_awarded_now')::int<=0
     then raise exception 'adult chapter praise reward missing'; end if;

  -- Author and editor preserve private editing access.
  perform set_config('request.jwt.claim.sub',owner_id::text,false);
  select public.get_grand_palace_identity(owner_id) into v;
  if v is null then raise exception 'owner lost own Grand Palace identity'; end if;
  select public.get_work_lore(work_public) into v;
  if v->0->>'unlock_chapter_id'<>chapter_draft::text
    then raise exception 'author lost draft-linked lore metadata'; end if;
  select public.get_palace_praise_state('work',work_private) into v;
  if (v->'counts'->>'crown')::int<>1 then raise exception 'author lost private praise count'; end if;
  perform set_config('request.jwt.claim.sub',editor_id::text,false);
  select public.get_palace_praise_state('work',work_private) into v;
  if (v->'counts'->>'crown')::int<>1 then raise exception 'editor lost permitted private count'; end if;

  -- Profile settings, guest/member discovery and blocking.
  perform set_config('request.jwt.claim.sub',adult_id::text,false);
  update public.privacy_preferences set discovery_visibility='members' where user_id=owner_id;
  select public.get_grand_palace_identity(owner_id) into v;
  if v is null then raise exception 'adult member cannot see member-discoverable profile'; end if;
  perform set_config('request.jwt.claim.sub','',false);
  select public.get_grand_palace_identity(owner_id) into v;
  if v is not null then raise exception 'guest saw member-discoverable profile'; end if;
  update public.privacy_preferences set discovery_visibility='everyone' where user_id=owner_id;
  select public.get_grand_palace_identity(owner_id) into v;
  if v is null then raise exception 'guest public profile not discoverable'; end if;
  insert into private.test_blocks values(blocked_id,owner_id);
  perform set_config('request.jwt.claim.sub',blocked_id::text,false);
  select public.get_grand_palace_identity(owner_id) into v;
  if v is not null then raise exception 'blocked viewer saw Grand Palace identity'; end if;

  -- Restore the intended initial privacy state for subsequent HTTP tests.
  update public.privacy_preferences
  set discovery_visibility='private'
  where user_id=owner_id;

  raise notice 'Passed: synthetic guest, young member, adult, author, editor, blocked viewer; SQL functions were actually executed';
end;
$tests$;
