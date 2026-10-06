create table if not exists public.palace_titles (
  title text primary key,
  category text not null,
  description text not null default '',
  public_selectable boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);

alter table public.palace_titles enable row level security;
drop policy if exists "Palace titles are readable" on public.palace_titles;
create policy "Palace titles are readable" on public.palace_titles for select to anon, authenticated using (true);

create table if not exists public.profile_title_entitlements (
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null references public.palace_titles(title) on delete cascade,
  source text not null default 'special',
  granted_at timestamptz not null default now(),
  primary key (user_id,title)
);

alter table public.profile_title_entitlements enable row level security;
drop policy if exists "Members can read own title entitlements" on public.profile_title_entitlements;
create policy "Members can read own title entitlements" on public.profile_title_entitlements for select to authenticated using (auth.uid()=user_id);

insert into public.palace_titles(title,category,description,public_selectable,sort_order) values
 ('Palace Member','Palace','A simple title for anyone who prefers to let their work speak first.',true,10),
 ('Moonlit Wanderer','Palace','For members who move quietly from room to room beneath the Palace moon.',true,20),
 ('Celestial Wanderer','Palace','A traveller among stories, courts and constellations.',true,30),
 ('Starlit Dreamer','Palace','For members drawn to imagination, possibility and unfinished worlds.',true,40),
 ('Keeper of Moonlight','Palace','A quiet keeper of the Palace atmosphere and its nocturnal spirit.',true,50),
 ('Moonlit Reader','Reader','A reader most at home with a story beneath the moon.',true,110),
 ('Starbound Reader','Reader','A reader always looking toward the next world.',true,120),
 ('Keeper of Stories','Reader','For someone who keeps beloved worlds close.',true,130),
 ('Night Librarian','Reader','A keeper of late-night shelves, notes and reading paths.',true,140),
 ('Story Pilgrim','Reader','For readers who cross many worlds and return changed.',true,150),
 ('Constellation Reader','Reader','A reader who follows threads between tags, fandoms and worlds.',true,160),
 ('Inkwell Apprentice','Writer','For a writer still happily learning the shape of the page.',true,210),
 ('Court Scribe','Writer','A Palace writer with an eye for words, records and detail.',true,220),
 ('Moonlit Writer','Writer','For writers whose pages come alive after dark.',true,230),
 ('Story Weaver','Writer','A maker of connected lives, plots and worlds.',true,240),
 ('Ink Alchemist','Writer','For writers who turn fragments, feeling and language into something new.',true,250),
 ('Dream Cartographer','Writer','A mapper of imagined places, histories and possibilities.',true,260),
 ('Chronicler of Courts','Writer','A storyteller who gathers voices and worlds across the Palace.',true,270),
 ('Panel Dreamer','Artist','For comic creators and visual storytellers building worlds one image at a time.',true,310),
 ('Moonlit Illustrator','Artist','A visual creator working in the Palace afterglow.',true,320),
 ('Storyboard Scribe','Artist','For creators who think in both sequence and image.',true,330),
 ('Court Artist','Artist','A maker of illustrations, covers, comics or visual worlds.',true,340),
 ('Celestial Artisan','Artist','A craftsperson of images, objects and imaginative detail.',true,350),
 ('Circle Keeper','Community','For members who nurture clubs, discussions and recurring gatherings.',true,410),
 ('Salon Keeper','Community','A host of thoughtful conversation and creative company.',true,420),
 ('Gathering Steward','Community','For members who help gatherings feel organized, safe and welcoming.',true,430),
 ('Court Ambassador','Community','A bridge between people, fandoms, clubs and Palace rooms.',true,440),
 ('Lantern Bearer','Community','Someone who helps other members find their way into the Palace.',true,450),
 ('Treasure Seeker','Collector','For members who delight in discovering Palace treasures.',true,510),
 ('Curio Keeper','Collector','A collector with an eye for small and unusual Palace objects.',true,520),
 ('Starlit Archivist','Collector','A keeper of collected histories, honours and preserved things.',true,530),
 ('Royal Collector','Collector','For members who take particular pride in their Treasury cabinet.',true,540),
 ('Celestial Monarch','Special','A singular Palace title reserved for its established holder.',false,900)
on conflict (title) do update set category=excluded.category,description=excluded.description,public_selectable=excluded.public_selectable,sort_order=excluded.sort_order;

insert into public.profile_title_entitlements(user_id,title,source)
select id,'Celestial Monarch','existing special title' from public.profiles where title='Celestial Monarch'
on conflict (user_id,title) do nothing;

do $$
begin
 if not exists (select 1 from pg_constraint where conname='profiles_title_catalog_fkey' and conrelid='public.profiles'::regclass) then
  alter table public.profiles add constraint profiles_title_catalog_fkey foreign key (title) references public.palace_titles(title);
 end if;
end $$;

create or replace function public.validate_profile_title_choice()
returns trigger language plpgsql security definer set search_path=public as $$
begin
 if new.title is null then return new; end if;
 if exists (select 1 from public.palace_titles t where t.title=new.title and t.public_selectable=true) then return new; end if;
 if exists (select 1 from public.profile_title_entitlements e where e.user_id=new.id and e.title=new.title) then return new; end if;
 raise exception 'That Palace title is not available to this member.';
end;
$$;

drop trigger if exists validate_profile_title_choice_trigger on public.profiles;
create trigger validate_profile_title_choice_trigger before insert or update of title on public.profiles
for each row execute function public.validate_profile_title_choice();

grant select on public.palace_titles to anon,authenticated;
grant select on public.profile_title_entitlements to authenticated;
