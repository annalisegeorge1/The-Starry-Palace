-- Protect the Celestial economy without modifying existing ledgers or wallets.
-- No self-comment rewards; only public, published writing yields participation credit.
create or replace function private.award_approved_comment_points()
returns trigger language plpgsql security definer set search_path='' as $fn$
declare v_author uuid;v_commenter_today integer:=0;v_writer_today integer:=0;
begin
 if new.status<>'approved' or (tg_op='UPDATE' and old.status='approved') then return new;end if;
 if char_length(btrim(coalesce(new.body,'')))<20 then return new;end if;
 select author_id into v_author from public.works
  where id=new.work_id and publication_status='published' and visibility='public';
 if v_author is null or v_author=new.author_id then return new;end if;
 perform pg_advisory_xact_lock(hashtext(new.author_id::text),7040411);
 select coalesce(sum(points),0)::int into v_commenter_today
  from public.celestial_point_ledger
  where user_id=new.author_id and reason='thoughtful_comment'
   and (created_at at time zone 'UTC')::date=(now() at time zone 'UTC')::date;
 if v_commenter_today<10 then
  perform private.grant_celestial_points(new.author_id,least(2,10-v_commenter_today),
   'participation','thoughtful_comment','comment',new.id,v_author,
   'comment:'||new.id::text||':writer');
 end if;
 perform pg_advisory_xact_lock(hashtext(v_author::text),7040412);
 select coalesce(sum(points),0)::int into v_writer_today
  from public.celestial_point_ledger
  where user_id=v_author and reason='reader_response_received'
   and (created_at at time zone 'UTC')::date=(now() at time zone 'UTC')::date;
 if v_writer_today<15 then
  perform private.grant_celestial_points(v_author,1,'receiving','reader_response_received',
   'comment',new.id,new.author_id,'comment:'||new.id::text||':creator');
 end if;
 return new;
end; $fn$;
