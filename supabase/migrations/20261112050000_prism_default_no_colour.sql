-- Explicit Prism selections remain unchanged; a missing selection means the Palace's original theme.
-- The extra boolean is additive and is safe for older clients.
create or replace function public.get_chamber_prism_state(p_member uuid)
 returns jsonb
 language plpgsql
 stable security definer
 set search_path to ''
as $function$
declare
 v_user uuid:=auth.uid();
 v_original jsonb;
 v_selected text;
 v_chosen boolean:=false;
 v_finish text;
 v_accent text;
 v_balance bigint;
 v_items jsonb;
 v_looks jsonb;
 v_effective text;
begin
 if v_user is null then raise exception 'Sign in to visit the Prism Atelier.';end if;
 v_original:=public.get_member_chamber_decor(p_member);
 if v_original is null then return null; end if;
 select coalesce(prism_palette,backdrop),prism_palette is not null,prism_finish,prism_accent
 into v_selected,v_chosen,v_finish,v_accent
 from public.member_chamber_decor where user_id=p_member;
 v_selected:=coalesce(v_selected,'midnight');
 v_chosen:=coalesce(v_chosen,false);
 v_finish:=coalesce(v_finish,'soft');
 v_accent:=coalesce(v_accent,'harmony');
 v_effective:=v_selected;
 if not private.chamber_prism_eligible(p_member,v_selected) then v_effective:='midnight';end if;
 if p_member=v_user then
  select spendable_points into v_balance from public.grand_palace_wallets where user_id=v_user;
  select coalesce(jsonb_agg(jsonb_build_object(
    'slug',p.slug,'name',p.name,'family',p.family,'category',p.category,
    'primary',p.primary_hex,'secondary',p.secondary_hex,'accent',p.accent_hex,
    'price',p.point_price,'description',p.description,'season_quarter',p.season_quarter,
    'available_now',p.category<>'seasonal' or p.season_quarter=extract(quarter from now() at time zone 'UTC')::integer,
    'unlocked',private.chamber_prism_eligible(v_user,p.slug),
    'owned',p.category='free' or exists(select 1 from public.chamber_prism_ownership o
      where o.user_id=v_user and o.palette_slug=p.slug),
    'selected',p.slug=v_effective and v_chosen
  ) order by case p.category when 'free' then 1 when 'earned' then 2
      when 'treasury' then 3 when 'seasonal' then 4 when 'prestige' then 5 else 6 end,p.name),'[]'::jsonb)
   into v_items from public.chamber_prism_palettes p;
  select coalesce(jsonb_agg(jsonb_build_object('slot',slot,'name',look_name,
    'palette',palette_slug,'finish',finish,'accent',accent_mode) order by slot),'[]'::jsonb)
   into v_looks from public.chamber_prism_saved_looks where user_id=v_user;
 end if;
 return v_original||jsonb_build_object(
  'prism_season',extract(quarter from now() at time zone 'UTC')::integer,
  'prism_colour_chosen',v_chosen,
  'prism_palette',v_effective,'prism_requested_palette',v_selected,
  'prism_finish',v_finish,'prism_accent',v_accent,
  'prism_palette_data',(select jsonb_build_object(
     'slug',slug,'name',name,'primary',primary_hex,'secondary',secondary_hex,'accent',accent_hex)
     from public.chamber_prism_palettes where slug=v_effective),
  'prism_catalogue',case when p_member=v_user then coalesce(v_items,'[]'::jsonb) else null end,
  'prism_looks',case when p_member=v_user then coalesce(v_looks,'[]'::jsonb) else null end,
  'prism_balance',case when p_member=v_user then coalesce(v_balance,0) else null end
 );
end
$function$;

-- Preserve the existing function privileges and definer ownership.
