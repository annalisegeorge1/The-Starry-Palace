-- The eight simple rings are included for every signed-in member.
alter table public.member_chamber_decor
 drop constraint member_chamber_painted_frame_check;
alter table public.member_chamber_decor
 add constraint member_chamber_painted_frame_check
 check (chamber_frame is null or chamber_frame in ('bamboo-ink','willow-mist','lotus-thread','orchid-frost','jade-fern','dusk-ring','moon-halo','golden-orbit','opal-eclipse','aurora-veil','rain-trace','silver-ripple','gilded-tide','frozen-lake','jade-current','ink-circle','script-ribbon','poet-laurel','porcelain-quill','archive-vine','autumn-reed','winter-lace','dawn-petals','crystal-bloom','spring-canopy','bronze-lattice','silver-dewdrop','golden-diadem','platinum-sovereign','emerald-empress','copper-blossom','silver-camellia','golden-garden','platinum-moonflower','emerald-eden','crown-jewel','midnight-sapphire','starlit-amethyst','black-diamond','emerald-garden','ruby-coronation','rose-palace','opal-dream','treasury-relic','celestial-aquamarine','golden-topaz','violet-empress','grand-coronation','sapphire-cathedral','emerald-fortress','black-diamond-throne','amethyst-empress','treasury-vault','rose-palace-deluxe','moonstone-halo','opal-bloom','star-garland','golden-ivy','twilight-pearl','solid-midnight-ink','solid-pearl-white','solid-palace-gold','solid-ruby-red','solid-sapphire-blue','solid-amethyst-violet','solid-emerald-green','solid-lagoon-teal'));
create or replace function private.painted_frame_eligible(p_user uuid,p_slug text)
returns boolean language plpgsql stable security definer set search_path='' as $$
declare pos integer; tier integer; chapters bigint; reads bigint; all_frames text[]:=array['bamboo-ink','willow-mist','lotus-thread','orchid-frost','jade-fern','dusk-ring','moon-halo','golden-orbit','opal-eclipse','aurora-veil','rain-trace','silver-ripple','gilded-tide','frozen-lake','jade-current','ink-circle','script-ribbon','poet-laurel','porcelain-quill','archive-vine','autumn-reed','winter-lace','dawn-petals','crystal-bloom','spring-canopy','bronze-lattice','silver-dewdrop','golden-diadem','platinum-sovereign','emerald-empress','copper-blossom','silver-camellia','golden-garden','platinum-moonflower','emerald-eden','crown-jewel','midnight-sapphire','starlit-amethyst','black-diamond','emerald-garden','ruby-coronation','rose-palace','opal-dream','treasury-relic','celestial-aquamarine','golden-topaz','violet-empress','grand-coronation','sapphire-cathedral','emerald-fortress','black-diamond-throne','amethyst-empress','treasury-vault','rose-palace-deluxe','moonstone-halo','opal-bloom','star-garland','golden-ivy','twilight-pearl'];
begin
 if p_user is null then return false;end if;
 if p_slug is null or p_slug in ('solid-midnight-ink','solid-pearl-white','solid-palace-gold','solid-ruby-red','solid-sapphire-blue','solid-amethyst-violet','solid-emerald-green','solid-lagoon-teal') then return true;end if;
 pos:=array_position(all_frames,p_slug);if pos is null then return false;end if;
 tier:=(pos-1)%5;if tier=0 then return true;end if;
 select count(*) into chapters from public.chapters c join public.works w on w.id=c.work_id where w.author_id=p_user and w.publication_status='published' and w.visibility='public' and c.status='published';
 select count(*) into reads from public.palace_reading_sessions where reader_id=p_user and finished_at is not null and awarded>0;
 return chapters>=(array[0,1,5,20,50])[tier+1] or reads>=(array[0,5,25,100,250])[tier+1];
end $$;
revoke all on function private.painted_frame_eligible(uuid,text) from public,anon,authenticated;
