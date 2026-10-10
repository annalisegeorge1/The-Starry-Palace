-- Palace Tidings: read-only verified award feed, with private member identities masked.
-- Approved royal mottos are text-only; existing banner art, emblems, and scoring remain untouched.
begin;
update public.grand_palaces p set motto=v.new_motto
from (values
 ('azure-moon','Where quiet brilliance rises.','In silence, even stars speak.'),
 ('violet-star','Our stories outshine the dark.','We were born to illuminate.'),
 ('sapphire-tide','Each wave carries a new world.','No horizon shall contain us.'),
 ('silver-crane','Elegance in every endeavour.','Grace is our strength.'),
 ('obsidian-rose','Beauty is bold in shadow.','Even darkness bears flowers.'),
 ('celestial-lotus','Bloom among the constellations.','From still waters, we rise.'),
 ('midnight-lantern','We keep the light for one another.','No soul wanders alone.'),
 ('whispering-comet','A single spark becomes a universe.','The heavens remember our passage.'),
 ('amethyst-sky','Beyond the horizon, imagination.','Beyond imagination lies infinity.'),
 ('winter-phoenix','We rise through every season.','Not even winter shall end us.')
) as v(slug,old_motto,new_motto)
where p.slug=v.slug and p.motto=v.old_motto;

create or replace function public.get_palace_tidings()
returns jsonb language sql stable security definer set search_path='' as $$
with member_totals as (
 select palace_id,count(*)::bigint members from public.grand_palace_memberships group by palace_id
),
quarter_scores as (
 select palace_id,sum(points)::bigint points
 from public.grand_palace_daily_scores
 where quarter_start=date_trunc('quarter',now() at time zone 'UTC')::date
 group by palace_id
),
ranked as (
 select p.id,p.name,coalesce(score.points,0)::bigint points,
 row_number() over (order by
   coalesce(score.points,0)::numeric/greatest(coalesce(m.members,0),1) desc,
   coalesce(score.points,0) desc,p.id asc) place
 from public.grand_palaces p
 left join member_totals m on m.palace_id=p.id
 left join quarter_scores score on score.palace_id=p.id
),
verified_news as (
 select 'season_winner'::text kind,('season:'||s.quarter_start)::text id,
 (p.name||' won first place in the completed quarterly race.')::text headline,
 s.finalized_at happened_at
 from public.grand_palace_seasons s
 join public.grand_palaces p on p.id=s.winner_id
 where s.status='finalized' and s.finalized_at is not null and s.winner_id is not null

 union all
 select 'first_place'::text,('place:'||a.quarter_start||':'||a.user_id)::text,
 (case when pr.visibility='public'
       then coalesce(nullif(btrim(pr.display_name),''),pr.username,'A Palace member')
       else 'A Palace member' end
  ||' placed first among the winning Palace contributors.')::text,
 a.awarded_at
 from public.grand_palace_awards a
 join public.grand_palace_seasons s on s.quarter_start=a.quarter_start
 left join public.profiles pr on pr.id=a.user_id
 where s.status='finalized' and s.finalized_at is not null
   and a.award_kind='top_ten_box' and a.individual_rank=1

 union all
 select 'lottery_winner'::text,('lottery:'||award.id)::text,
 (case when pr.visibility='public'
       then coalesce(nullif(btrim(pr.display_name),''),pr.username,'A Palace member')
       else 'A Palace member' end
  ||' won the Celestial Vault lottery and received a Celestial Sovereign Box!')::text,
 award.awarded_at
 from public.grand_palace_celestial_awards award
 join public.grand_palace_celestial_draws draw
   on draw.id::text=award.source_key and draw.user_id=award.user_id and draw.won=true
 left join public.profiles pr on pr.id=award.user_id
 where award.source='lottery'

 union all
 select 'celestial_award'::text,('celestial:'||award.id)::text,
 (case when pr.visibility='public'
       then coalesce(nullif(btrim(pr.display_name),''),pr.username,'A Palace member')
       else 'A Palace member' end
  ||' earned the Celestial Sovereign Gift Box by completing every founding badge family.')::text,
 award.awarded_at
 from public.grand_palace_celestial_awards award
 left join public.profiles pr on pr.id=award.user_id
 where award.source='badge_grandmaster'

 union all
 select 'current_leader'::text,
 ('lead:'||date_trunc('quarter',now() at time zone 'UTC')::date)::text,
 (name||' is currently first in the Grand Palace race (not yet a confirmed winner).')::text,
 (date_trunc('quarter',now() at time zone 'UTC') at time zone 'UTC') happened_at
 from ranked where place=1 and points>0
),
latest as (
 select kind,id,headline,happened_at
 from verified_news
 where happened_at>=now()-interval '120 days'
 order by happened_at desc,id desc limit 12
)
select coalesce(jsonb_agg(jsonb_build_object(
 'kind',kind,'id',id,'headline',left(headline,180),
 'created_at',happened_at
) order by happened_at desc,id desc),'[]'::jsonb)
from latest;
$$;
revoke all on function public.get_palace_tidings() from public;
grant execute on function public.get_palace_tidings() to anon,authenticated;
comment on function public.get_palace_tidings() is 'Read-only verified Palace Tidings. Only finalized victories, actually awarded boxes, winning draws, and explicitly provisional current leader; masks private member identities.';
commit;
