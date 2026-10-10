-- Finalized quarterly champions: only members already in the winning Palace
-- when the result was certified may see a victory celebration.
-- Read-only; no points, rankings, sigils, banners or prize assignments change.
create or replace function public.get_my_grand_palace_victory()
returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object(
  'quarter_start',s.quarter_start,
  'palace_name',p.name,
  'palace_slug',p.slug,
  'palace_accent',p.accent,
  'finalized_at',s.finalized_at
 )
 from public.grand_palace_memberships m
 join public.grand_palace_seasons s
   on s.winner_id=m.palace_id and s.status='finalized' and s.finalized_at is not null
 join public.grand_palaces p on p.id=s.winner_id
 where m.user_id=auth.uid()
   and m.joined_at<=s.finalized_at
   and s.finalized_at>=now()-interval '45 days'
 order by s.finalized_at desc
 limit 1;
$$;
revoke all on function public.get_my_grand_palace_victory() from public,anon,authenticated;
grant execute on function public.get_my_grand_palace_victory() to authenticated;
comment on function public.get_my_grand_palace_victory() is
 'Only confirmed winning Palace members at the moment of season finalization; celebration display metadata only.';
