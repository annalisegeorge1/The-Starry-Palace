-- Raise the Palace account minimum from 12 to 13.
-- Existing under-13 accounts are retained, but palace_age_status() blocks their access.

create or replace function public.palace_age_status()
returns text
language sql stable security definer
set search_path = ''
as $$
  select case
    when (select auth.uid()) is null then 'signed_out'
    when not exists (select 1 from private.member_age a where a.user_id=(select auth.uid())) then 'needs_birth_date'
    when exists (select 1 from private.member_age a where a.user_id=(select auth.uid()) and (a.birth_date + interval '13 years')::date <= current_date) then 'eligible'
    else 'under_minimum'
  end;
$$;
revoke all on function public.palace_age_status() from public, anon;
grant execute on function public.palace_age_status() to authenticated;

create or replace function public.set_my_palace_birth_date(p_birth_date date)
returns text
language plpgsql security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then raise exception 'Sign in to continue.'; end if;
  if p_birth_date is null or p_birth_date > current_date then raise exception 'Enter a valid date of birth.'; end if;
  if (p_birth_date + interval '13 years')::date > current_date then
    raise exception 'The Palace requires members to be at least 13 years old.';
  end if;
  insert into private.member_age(user_id,birth_date)
  values ((select auth.uid()),p_birth_date)
  on conflict (user_id) do nothing;
  return public.palace_age_status();
end;
$$;
revoke all on function public.set_my_palace_birth_date(date) from public, anon;
grant execute on function public.set_my_palace_birth_date(date) to authenticated;

create or replace function public.require_palace_signup_age()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare entered date;
begin
  begin
    entered := (new.raw_user_meta_data ->> 'palace_birth_date')::date;
  exception when others then
    raise exception 'Enter a valid date of birth to create a Palace account.';
  end;
  if entered is null or entered > current_date or (entered + interval '13 years')::date > current_date then
    raise exception 'The Palace requires members to be at least 13 years old.';
  end if;
  return new;
end;
$$;
revoke all on function public.require_palace_signup_age() from public, anon, authenticated;
