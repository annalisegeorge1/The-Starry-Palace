-- Approved painted collection: adds 20 families and 25 portrait frames.
-- Existing inventories, award prices, standings and grandmaster requirements stay intact.
alter table public.achievement_families drop constraint achievement_families_catalogue_number_check;
alter table public.achievement_families add constraint achievement_families_catalogue_number_check check(catalogue_number between 1 and 128);
insert into public.achievement_families(achievement_key,catalogue_number,name,description,metric_key,thresholds,active,art_status) values
('first-light',109,'First Light','Publish stories with at least one published chapter.','painted_published_works','{"bronze": 1, "silver": 5, "gold": 20, "platinum": 50, "emerald": 100}'::jsonb,true,'final'),
('inkkeeper',110,'Inkkeeper','Share published words with the Palace.','painted_words','{"bronze": 1000, "silver": 10000, "gold": 50000, "platinum": 250000, "emerald": 1000000}'::jsonb,true,'final'),
('chapter-weaver',111,'Chapter Weaver','Publish chapters in your public stories.','painted_chapters','{"bronze": 1, "silver": 5, "gold": 20, "platinum": 50, "emerald": 100}'::jsonb,true,'final'),
('story-voyager',112,'Story Voyager','Read rewarded chapters from different stories.','painted_read_works','{"bronze": 1, "silver": 5, "gold": 20, "platinum": 50, "emerald": 100}'::jsonb,true,'final'),
('margin-garden',113,'Margin Garden','Leave approved responses on other writers’ stories.','painted_comments','{"bronze": 1, "silver": 5, "gold": 20, "platinum": 50, "emerald": 100}'::jsonb,true,'final'),
('quiet-reader',114,'Quiet Reader','Complete distinct rewarded chapter reads.','painted_read_chapters','{"bronze": 5, "silver": 25, "gold": 100, "platinum": 250, "emerald": 1000}'::jsonb,true,'final'),
('library-lantern',115,'Library Lantern','Return on different days for rewarded chapter reading.','painted_read_days','{"bronze": 1, "silver": 5, "gold": 20, "platinum": 50, "emerald": 100}'::jsonb,true,'final'),
('echoing-words',116,'Echoing Words','Receive approved responses from different readers.','painted_readers','{"bronze": 1, "silver": 5, "gold": 20, "platinum": 50, "emerald": 100}'::jsonb,true,'final'),
('poetry-dew',117,'Poetry Dew','Submit poetry to completed Ink Duels.','painted_poetry','{"bronze": 1, "silver": 5, "gold": 20, "platinum": 50, "emerald": 100}'::jsonb,true,'final'),
('haiku-petals',118,'Haiku Petals','Submit haiku to completed Ink Duels.','painted_haiku','{"bronze": 1, "silver": 5, "gold": 20, "platinum": 50, "emerald": 100}'::jsonb,true,'final'),
('duel-blossom',119,'Duel Blossom','Submit entries to completed Ink Duels.','painted_duels','{"bronze": 1, "silver": 5, "gold": 20, "platinum": 50, "emerald": 100}'::jsonb,true,'final'),
('baton-bearer',120,'Baton Bearer','Pass the baton with completed relay turns.','painted_relays','{"bronze": 1, "silver": 5, "gold": 20, "platinum": 50, "emerald": 100}'::jsonb,true,'final'),
('worldmaker',121,'Worldmaker','Publish original worlds with a published chapter.','painted_originals','{"bronze": 1, "silver": 3, "gold": 10, "platinum": 25, "emerald": 50}'::jsonb,true,'final'),
('lore-keeper',122,'Lore Keeper','Finish and publish complete stories.','painted_completed','{"bronze": 1, "silver": 3, "gold": 10, "platinum": 25, "emerald": 50}'::jsonb,true,'final'),
('comic-constellation',123,'Comic Constellation','Publish illustrated pages in public comics.','painted_comic_pages','{"bronze": 1, "silver": 10, "gold": 50, "platinum": 150, "emerald": 500}'::jsonb,true,'final'),
('faithful-return',124,'Faithful Return','Read rewarded chapters in different calendar months.','painted_read_months','{"bronze": 1, "silver": 3, "gold": 6, "platinum": 12, "emerald": 24}'::jsonb,true,'final'),
('kindred-voices',125,'Kindred Voices','Leave approved responses for different writers.','painted_kindred','{"bronze": 1, "silver": 5, "gold": 20, "platinum": 50, "emerald": 100}'::jsonb,true,'final'),
('thoughtful-critic',126,'Thoughtful Critic','Share approved constructive critiques on others’ stories.','painted_critiques','{"bronze": 1, "silver": 5, "gold": 20, "platinum": 50, "emerald": 100}'::jsonb,true,'final'),
('prompt-alchemist',127,'Prompt Alchemist','Complete verified daily Palace creative prompts.','painted_rituals','{"bronze": 1, "silver": 5, "gold": 20, "platinum": 50, "emerald": 100}'::jsonb,true,'final'),
('festival-scribe',128,'Festival Scribe','Host published events through their scheduled end.','painted_events','{"bronze": 1, "silver": 3, "gold": 10, "platinum": 25, "emerald": 50}'::jsonb,true,'final')
on conflict(achievement_key) do update set name=excluded.name,description=excluded.description,metric_key=excluded.metric_key,thresholds=excluded.thresholds,art_status=excluded.art_status;

-- No client-provided counts: recompute from authoritative activity only.
create or replace function public.refresh_painted_achievements()
returns void language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); v record; counts jsonb; ch bigint; words bigint; worlds bigint; originals bigint; completed bigint;
begin
 if u is null then raise exception 'Sign in to see your achievements.';end if;
 select count(c.id),coalesce(sum(c.word_count),0),count(distinct w.id),count(distinct w.id) filter(where w.work_type='original'),count(distinct w.id) filter(where w.completion_status='complete')
 into ch,words,worlds,originals,completed from public.works w join public.chapters c on c.work_id=w.id
 where w.author_id=u and w.publication_status='published' and w.visibility='public' and c.status='published';
 counts:=jsonb_build_object('painted_published_works',worlds,'painted_words',words,'painted_chapters',ch,'painted_originals',originals,'painted_completed',completed);
 counts:=counts||(select jsonb_build_object('painted_read_works',count(distinct c.work_id),'painted_read_chapters',count(distinct s.chapter_id),'painted_read_days',count(distinct (s.finished_at at time zone 'UTC')::date),'painted_read_months',count(distinct date_trunc('month',s.finished_at at time zone 'UTC'))) from public.palace_reading_sessions s join public.chapters c on c.id=s.chapter_id where s.reader_id=u and s.finished_at is not null and s.awarded>0);
 counts:=counts||(select jsonb_build_object('painted_comments',count(*),'painted_critiques',count(*) filter(where c.comment_type='critique'),'painted_kindred',count(distinct w.author_id)) from public.comments c join public.works w on w.id=c.work_id where c.author_id=u and w.author_id<>u and c.status='approved');
 counts:=counts||jsonb_build_object('painted_readers',(select count(distinct c.author_id) from public.comments c join public.works w on w.id=c.work_id where w.author_id=u and c.author_id<>u and c.status='approved'));
 counts:=counts||(select jsonb_build_object('painted_poetry',count(*) filter(where d.content_type='poetry'),'painted_haiku',count(*) filter(where d.content_type='haiku'),'painted_duels',count(*)) from public.micro_duel_entries e join public.micro_duels d on d.id=e.duel_id where e.user_id=u and d.status<>'cancelled' and d.voting_closes_at<=now());
 counts:=counts||jsonb_build_object('painted_relays',(select count(*) from public.relay_turns where writer_id=u),'painted_rituals',(select count(*) from public.grand_palace_daily_rituals where user_id=u and points>0),'painted_events',(select count(*) from public.events where created_by=u and publication_status='published' and ends_at<=now()),'painted_comic_pages',(select count(*) from public.comic_pages p join public.comic_episodes e on e.id=p.episode_id join public.comics c on c.id=e.comic_id where c.creator_id=u and c.visibility='public' and c.publication_status='published' and e.status='published'));
 for v in select achievement_key,metric_key from public.achievement_families where catalogue_number between 109 and 128 and active loop
  perform private.set_achievement_progress_value(u,v.achievement_key,coalesce((counts->>v.metric_key)::bigint,0));
 end loop;
end $$;
revoke all on function public.refresh_painted_achievements() from public,anon;
grant execute on function public.refresh_painted_achievements() to authenticated;

alter table public.member_chamber_decor add column chamber_frame text;
alter table public.member_chamber_decor add constraint member_chamber_painted_frame_check check(chamber_frame is null or chamber_frame in ('bamboo-ink','willow-mist','lotus-thread','orchid-frost','jade-fern','dusk-ring','moon-halo','golden-orbit','opal-eclipse','aurora-veil','rain-trace','silver-ripple','gilded-tide','frozen-lake','jade-current','ink-circle','script-ribbon','poet-laurel','porcelain-quill','archive-vine','autumn-reed','winter-lace','dawn-petals','crystal-bloom','spring-canopy'));

create or replace function private.painted_frame_eligible(p_user uuid,p_slug text)
returns boolean language plpgsql stable security definer set search_path='' as $$
declare pos integer; tier integer; chapters bigint; reads bigint; all_frames text[]:=array['bamboo-ink','willow-mist','lotus-thread','orchid-frost','jade-fern','dusk-ring','moon-halo','golden-orbit','opal-eclipse','aurora-veil','rain-trace','silver-ripple','gilded-tide','frozen-lake','jade-current','ink-circle','script-ribbon','poet-laurel','porcelain-quill','archive-vine','autumn-reed','winter-lace','dawn-petals','crystal-bloom','spring-canopy'];
begin
 if p_user is null then return false;end if;
 if p_slug is null then return true;end if;
 pos:=array_position(all_frames,p_slug);if pos is null then return false;end if;
 tier:=(pos-1)%5;if tier=0 then return true;end if;
 select count(*) into chapters from public.chapters c join public.works w on w.id=c.work_id where w.author_id=p_user and w.publication_status='published' and w.visibility='public' and c.status='published';
 select count(*) into reads from public.palace_reading_sessions where reader_id=p_user and finished_at is not null and awarded>0;
 return chapters>=(array[0,1,5,20,50])[tier+1] or reads>=(array[0,5,25,100,250])[tier+1];
end $$;
revoke all on function private.painted_frame_eligible(uuid,text) from public,anon,authenticated;

create or replace function public.get_painted_chamber_state(p_member uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare s text;
begin
 if auth.uid() is null then raise exception 'Sign in to visit chambers.';end if;
 if public.get_member_chamber_decor(p_member) is null then return null;end if;
 select chamber_frame into s from public.member_chamber_decor where user_id=p_member;
 return jsonb_build_object('chamber_frame',case when private.painted_frame_eligible(p_member,s) then s else null end);
end $$;
revoke all on function public.get_painted_chamber_state(uuid) from public,anon;
grant execute on function public.get_painted_chamber_state(uuid) to authenticated;

create or replace function public.set_painted_chamber_frame(p_slug text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();
begin
 if u is null then raise exception 'Sign in to decorate your chamber.';end if;
 if not private.painted_frame_eligible(u,p_slug) then raise exception 'This frame is not unlocked yet.';end if;
 insert into public.member_chamber_decor(user_id,chamber_frame) values(u,p_slug)
 on conflict(user_id) do update set chamber_frame=excluded.chamber_frame,updated_at=now();
 return public.get_painted_chamber_state(u);
end $$;
revoke all on function public.set_painted_chamber_frame(text) from public,anon;
grant execute on function public.set_painted_chamber_frame(text) to authenticated;
