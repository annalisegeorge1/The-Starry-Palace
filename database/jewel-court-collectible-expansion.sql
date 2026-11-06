-- Jewel Court II: keep an approachable sample and make luxury colours collectable.
-- Only 5 of 32 Jewel Court palettes are free. Existing member looks are protected.
begin;

do $jewel$
declare changed_rows integer;
begin
 if (select count(*) from public.chamber_prism_palettes
      where family='Jewel Court' and category='free'
        and slug in ('imperial-amethyst','midnight-sapphire','emerald-court','ruby-velvet','moonstone-silver','royal-orchid','black-opal','topaz-gold','crimson-crown')) <> 9
 then raise exception 'Jewel Court colours changed since this migration was prepared'; end if;

 if exists (select 1 from public.member_chamber_decor
    where prism_palette in ('imperial-amethyst','midnight-sapphire','emerald-court','ruby-velvet','moonstone-silver','royal-orchid','black-opal','topaz-gold','crimson-crown'))
 or exists (select 1 from public.chamber_prism_saved_looks
    where palette_slug in ('imperial-amethyst','midnight-sapphire','emerald-court','ruby-velvet','moonstone-silver','royal-orchid','black-opal','topaz-gold','crimson-crown'))
 then raise exception 'A Jewel Court colour is in use. Preserve wearers before changing eligibility.'; end if;

 update public.chamber_prism_palettes p
 set category=v.category,point_price=v.point_price,
     unlock_key=v.unlock_key,unlock_threshold=v.unlock_threshold,
     description=v.description
 from (values
      ('imperial-amethyst','earned',0,'chapters',5,'Vivid amethyst facets above royal violet velvet. Unlock: publish 5 chapters.'),
      ('midnight-sapphire','earned',0,'chapters',3,'Electric royal-blue sapphires. Unlock: publish 3 chapters.'),
      ('emerald-court','earned',0,'reads',10,'Emerald-lit garden glass. Unlock: complete 10 rewarded reads.'),
      ('ruby-velvet','earned',0,'words',2000,'Crimson rubies set in dark velvet. Unlock: publish 2,000 words.'),
      ('moonstone-silver','earned',0,'reads',5,'Cold moonstones glistening in silver. Unlock: complete 5 rewarded reads.'),
      ('royal-orchid','earned',0,'chapters',1,'Regal magenta orchids in purple silk. Unlock: publish 1 chapter.'),
      ('black-opal','treasury',135,null,0,'Black opal lit by blue-violet iridescence. Collect with 135 Celestial Points.'),
      ('topaz-gold','treasury',95,null,0,'Rich amber topaz in gold. Collect with 95 Celestial Points.'),
      ('crimson-crown','treasury',160,null,0,'Brilliant red coronation jewels. Collect with 160 Celestial Points.')
 ) as v(slug,category,point_price,unlock_key,unlock_threshold,description)
 where p.slug=v.slug and p.family='Jewel Court' and p.category='free';
 get diagnostics changed_rows=row_count;
 if changed_rows <> 9 then raise exception 'Expected to update nine existing Jewel Court palettes, changed %',changed_rows; end if;
end $jewel$;

insert into public.chamber_prism_palettes
 (slug,name,family,category,primary_hex,secondary_hex,accent_hex,point_price,unlock_key,unlock_threshold,description)
values
  ('sunlit-coral','Sunlit Coral','Jewel Court','free','#8D2046','#FF7E84','#FFE2A9',0,null,0,'Vivid sun-warmed coral and peach silk. Included for every member.'),
  ('tropical-cyan','Tropical Cyan','Jewel Court','free','#00556E','#00D7D9','#C6FFF8',0,null,0,'Tropical aqua and radiant cyan glass. Included for every member.'),
  ('deep-magenta','Deep Magenta','Jewel Court','earned','#4B0B56','#D21BE1','#FFE0FD',0,'words',1000,'Saturated orchid-magenta. Unlock: publish 1,000 words.'),
  ('volcanic-rose','Volcanic Rose','Jewel Court','earned','#6B152F','#FF526C','#FFB3C7',0,'chapters',2,'Molten coral-rose and warm ruby light. Unlock: publish 2 chapters.'),
  ('peacock-jade','Peacock Jade','Jewel Court','earned','#003D57','#008B73','#C8FFE0',0,'reads',25,'Deep peacock blue with electric jade. Unlock: complete 25 rewarded reads.'),
  ('electric-lilac','Electric Lilac','Jewel Court','earned','#47217D','#B25CFF','#F5C8FF',0,'points',150,'Bright amethyst-lilac glow. Unlock: earn 150 lifetime Celestial Points.'),
  ('glacial-aqua','Glacial Aqua','Jewel Court','earned','#155C80','#69E7F2','#F2FFFF',0,'reads',15,'Crystal aquamarine and icy aqua. Unlock: complete 15 rewarded reads.'),
  ('royal-cobalt','Royal Cobalt','Jewel Court','earned','#001F7E','#3158FF','#B9DBFF',0,'chapters',7,'Electric cobalt ink and blue gemstone flashes. Unlock: publish 7 chapters.'),
  ('scarlet-flame','Scarlet Flame','Jewel Court','earned','#720F19','#FA3E32','#FFD1A3',0,'words',4500,'Brilliant scarlet crystal with tangerine flame. Unlock: publish 4,500 words.'),
  ('orchid-nocturne','Orchid Nocturne','Jewel Court','earned','#300B54','#A128D6','#EFAFFF',0,'chapters',12,'Midnight orchid gemstones lit from within. Unlock: publish 12 chapters.'),
  ('dragonfire-red','Dragonfire Red','Jewel Court','treasury','#5F0712','#FF2027','#FFC46B',125,null,0,'Intense dragonfire ruby and molten gold. Collect with 125 Celestial Points.'),
  ('luminous-peridot','Luminous Peridot','Jewel Court','treasury','#355318','#B0D936','#F4FF99',70,null,0,'Peridot-green crystals glowing with chartreuse light. Collect with 70 Celestial Points.'),
  ('dark-merlot','Dark Merlot','Jewel Court','treasury','#360A30','#8E1A60','#F6A7C5',90,null,0,'Wine-dark garnet and plum silk. Collect with 90 Celestial Points.'),
  ('aurora-emerald','Aurora Emerald','Jewel Court','treasury','#003C4A','#00BDA4','#99FFBF',180,null,0,'Luminous emerald aurora over midnight teal. Collect with 180 Celestial Points.'),
  ('solar-citrine','Solar Citrine','Jewel Court','treasury','#73440E','#FEBB1C','#FFF0A0',85,null,0,'A vault of brilliant citrine and hot gold. Collect with 85 Celestial Points.'),
  ('obsidian-violet','Obsidian Violet','Jewel Court','treasury','#0D0824','#6533C5','#DCB1FF',165,null,0,'Black-violet obsidian with ultraviolet lightning. Collect with 165 Celestial Points.'),
  ('kingfisher-blue','Kingfisher Blue','Jewel Court','treasury','#05405F','#008BCC','#76F0FF',70,null,0,'Brilliant kingfisher-blue gems and turquoise facets. Collect with 70 Celestial Points.'),
  ('fuchsia-nebula','Fuchsia Nebula','Jewel Court','treasury','#540C63','#EF2CAB','#FFB5EC',145,null,0,'Blazing fuchsia stars across purple nebulae. Collect with 145 Celestial Points.'),
  ('violet-flame','Violet Flame','Jewel Court','treasury','#240A58','#8939F4','#F3ADFF',115,null,0,'White-hot violet fire and amethyst sparks. Collect with 115 Celestial Points.'),
  ('imperial-copper','Imperial Copper','Jewel Court','treasury','#5A241C','#C96D31','#FFD5A0',65,null,0,'Burnished copper filigree and warm gemstone fire. Collect with 65 Celestial Points.')
on conflict(slug) do nothing;

commit;
