-- THE STARRY PALACE — PROPOSED REVIEW ONLY, NOT APPLIED TO PRODUCTION.
-- One-purpose guard: align the public Grand Palace identity RPC with the
-- existing profile discovery policy (visibility, discovery preference, blocks).
-- This function intentionally remains callable by anon for discoverable profiles.
-- Do not apply without staging tests using synthetic unrelated users.

create or replace function public.get_grand_palace_identity(p_member uuid)
returns jsonb
language sql
stable security definer
set search_path to ''
as $function$
 select jsonb_build_object(
   'palace_id', gp.id, 'palace_name',gp.name, 'palace_slug',gp.slug,
   'sigil',gp.sigil, 'accent',gp.accent, 'motto',gp.motto,
   'theme',w.selected_theme,
   'honours',coalesce((select jsonb_object_agg(h.honour,h.display_count)
                       from public.grand_palace_honours h
                       where h.user_id=p.id and h.display_count>0),'{}'::jsonb)
 )
 from public.profiles p
 join public.grand_palace_memberships m on m.user_id=p.id
 join public.grand_palaces gp on gp.id=m.palace_id
 left join public.grand_palace_wallets w on w.user_id=p.id
 where p.id=p_member
   -- Mirrors the profile SELECT RLS gate, including the owner's own access.
   and private.viewer_can_discover_profile(p.id)
 limit 1
$function$;

-- Required staging scenarios, using disposable synthetic profiles:
-- 1. Signed-out: public profile + everyone discovery -> visible.
-- 2. Signed-out: members-only profile or member-only discovery -> null.
-- 3. Signed-in unrelated member: members-only + members discovery -> visible.
-- 4. Any unrelated viewer: discovery=private -> null.
-- 5. Viewer blocked by target -> null even if otherwise public.
-- 6. Owner: own hidden/discovery-private profile -> visible.
-- 7. Unknown UUID -> null.
-- Preserve response keys, signature, grants, and publicly discoverable profiles.
