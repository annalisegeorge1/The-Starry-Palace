-- Ink Duels v3
-- Applied to the live Palace database on 2026-10-07.
-- This checked-in migration record documents the live multi-format arena:
-- fiction, poetry, haiku, drabble, dialogue, art, comic and wildcard duels;
-- open, one_v_one and group matches; blind voting; craft laurels; visual uploads;
-- challenge invitations; duel records; and achievement integration.

-- Core v3 relations:
-- public.micro_duel_participants
-- public.micro_duel_marks
-- storage bucket: duel-art

-- Core v3 RPCs:
-- public.create_micro_duel_v3
-- public.respond_micro_duel_invitation
-- public.start_micro_duel
-- public.submit_micro_duel_entry_v3
-- public.vote_micro_duel
-- public.mark_micro_duel_entry
-- public.get_micro_duels
-- public.get_micro_duel_record
-- public.cancel_micro_duel

-- The production schema was applied through Supabase migrations:
-- expand_achievement_catalogue_for_duel_paths
-- ink_duels_v3_schema_and_badges
-- ink_duels_v3_core_functions
-- ink_duels_v3_entries_art_and_laurels
-- ink_duels_v3_gallery_record

-- Tables intentionally referenced here for launch-safety verification:
-- micro_duel_participants
-- micro_duel_marks
-- duel-art
