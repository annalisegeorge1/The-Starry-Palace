-- Extend approved frame slugs to 47, preserving the existing 35 and their tier order.
begin;

-- Free jewel colours: no spendable-point charges and no new permissions.
insert into public.chamber_prism_palettes(slug,name,family,category,primary_hex,secondary_hex,accent_hex,point_price,unlock_key,unlock_threshold,description)
values
('imperial-amethyst','Imperial Amethyst','Jewel Court','free','#3B0C6E','#AA32ED','#F1C7FF',0,null,0,'A fierce violet jewel box, illuminated by amethyst facets'),
('midnight-sapphire','Midnight Sapphire','Jewel Court','free','#071C5D','#1769ED','#B5E3FF',0,null,0,'Deep royal blue with electric sapphire light'),
('emerald-court','Emerald Court','Jewel Court','free','#043E39','#00B884','#C7FFE6',0,null,0,'Luminous emeralds against antique green velvet'),
('ruby-velvet','Ruby Velvet','Jewel Court','free','#5A0827','#E32258','#FFD0DB',0,null,0,'Red garnets and ruby silk with glowing highlights'),
('rose-garnet','Rose Garnet','Jewel Court','free','#68114A','#E742A1','#FFD4EC',0,null,0,'Bold rosy gemstones with luminous pink depth'),
('black-opal','Black Opal','Jewel Court','free','#090E22','#4156B9','#D0E6FF',0,null,0,'Iridescent midnight-blue facets on black glass'),
('moonstone-silver','Moonstone Silver','Jewel Court','free','#283761','#AFA9EC','#F6F7FF',0,null,0,'Bright moonstone shimmer with cool silver edges'),
('topaz-gold','Topaz Gold','Jewel Court','free','#5B2A0A','#E59C21','#FFE7A1',0,null,0,'Amber and golden topaz blazing like a royal vault'),
('celestial-teal','Celestial Teal','Jewel Court','free','#053E56','#11C3CE','#CCFFF8',0,null,0,'Electric teal crystals suspended in deep ocean light'),
('royal-orchid','Royal Orchid','Jewel Court','free','#48105F','#D23DDC','#FFD8FB',0,null,0,'Vivid magenta-violet silk and orchid jewels'),
('crimson-crown','Crimson Crown','Jewel Court','free','#560815','#EB3D4D','#FFCBBA',0,null,0,'Coronation red brightened with glowing crystal facets'),
('electric-azure','Electric Azure','Jewel Court','free','#082A70','#168EF1','#D7F4FF',0,null,0,'A saturated azure sky cut into brilliant stones')
on conflict(slug) do nothing;

alter table public.member_chamber_decor drop constraint member_chamber_painted_frame_check;
alter table public.member_chamber_decor add constraint member_chamber_painted_frame_check check(chamber_frame is null or chamber_frame in ('bamboo-ink','willow-mist','lotus-thread','orchid-frost','jade-fern','dusk-ring','moon-halo','golden-orbit','opal-eclipse','aurora-veil','rain-trace','silver-ripple','gilded-tide','frozen-lake','jade-current','ink-circle','script-ribbon','poet-laurel','porcelain-quill','archive-vine','autumn-reed','winter-lace','dawn-petals','crystal-bloom','spring-canopy','bronze-lattice','silver-dewdrop','golden-diadem','platinum-sovereign','emerald-empress','copper-blossom','silver-camellia','golden-garden','platinum-moonflower','emerald-eden','crown-jewel','midnight-sapphire','starlit-amethyst','black-diamond','emerald-garden','ruby-coronation','rose-palace','opal-dream','treasury-relic','celestial-aquamarine','golden-topaz','violet-empress'));
create or replace function private.painted_frame_eligible(p_user uuid,p_slug text)
returns boolean language plpgsql stable security definer set search_path='' as $$
declare pos integer; tier integer; chapters bigint; reads bigint; all_frames text[]:=array['bamboo-ink','willow-mist','lotus-thread','orchid-frost','jade-fern','dusk-ring','moon-halo','golden-orbit','opal-eclipse','aurora-veil','rain-trace','silver-ripple','gilded-tide','frozen-lake','jade-current','ink-circle','script-ribbon','poet-laurel','porcelain-quill','archive-vine','autumn-reed','winter-lace','dawn-petals','crystal-bloom','spring-canopy','bronze-lattice','silver-dewdrop','golden-diadem','platinum-sovereign','emerald-empress','copper-blossom','silver-camellia','golden-garden','platinum-moonflower','emerald-eden','crown-jewel','midnight-sapphire','starlit-amethyst','black-diamond','emerald-garden','ruby-coronation','rose-palace','opal-dream','treasury-relic','celestial-aquamarine','golden-topaz','violet-empress'];
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

commit;
