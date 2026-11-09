-- Existing skins stay active. A No colour preference needs no uploaded skin.
alter table public.member_page_skins
 add column appearance_mode text not null default 'skin'
   check (appearance_mode in ('skin','palette','none')),
 alter column name drop not null,
 alter column colors drop not null,
 add constraint member_skin_payload check (
   (name is not null and colors is not null) or
   (appearance_mode <> 'skin' and name is null and colors is null)
 );

create function public.apply_atelier_colour(
 p_slug text,p_finish text,p_accent text,p_backdrop text,p_ornament text,p_gallery_layout text
) returns void language plpgsql security invoker set search_path='' as $$
declare member_id uuid:=auth.uid();
begin
 if member_id is null then raise exception 'Sign in to change your Atelier colours.'; end if;
 if p_slug='none' then
  insert into public.member_page_skins(user_id,appearance_mode)
  values(member_id,'none') on conflict(user_id) do update
  set appearance_mode='none',updated_at=now();
 else
  perform public.select_chamber_prism_palette(p_slug,p_finish,p_accent);
  update public.member_page_skins set appearance_mode='palette',updated_at=now()
   where user_id=member_id;
 end if;
 perform public.set_member_chamber_decor(p_backdrop,p_ornament,p_gallery_layout);
end $$;
revoke all on function public.apply_atelier_colour(text,text,text,text,text,text) from public,anon;
grant execute on function public.apply_atelier_colour(text,text,text,text,text,text) to authenticated;
