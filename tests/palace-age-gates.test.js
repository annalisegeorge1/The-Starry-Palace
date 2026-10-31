import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(path,'utf8');
const ageMigration=read('supabase/migrations/20261031063218_palace_member_age_gates.sql');
const minimumAgeMigration=read('supabase/migrations/20261031103254_palace_account_minimum_13.sql');
const auth=read('src/PalaceAuthGates.jsx');
const accountGate=read('src/PalaceAgeGate.jsx');
const studios=read('src/liveRooms.jsx');

describe('Palace account and reader age gates',()=>{
 it('requires age at account creation and checks legacy accounts before app access',()=>{
  expect(ageMigration).toContain("'palace_birth_date'");
  expect(ageMigration).toContain('before insert on auth.users');
  expect(minimumAgeMigration).toContain('at least 13 years old');
  expect(minimumAgeMigration).toContain("interval '13 years'");
  expect(auth).toContain('The Palace minimum account age is 13.');
  expect(auth).toContain('getFullYear()-13');
  expect(accountGate).toContain('getFullYear()-13');
  expect(ageMigration).toContain('private.member_age');
  expect(ageMigration).toContain('raw_user_meta_data = raw_user_meta_data -');
  expect(auth).toContain('palace_birth_date: birthDate');
  expect(accountGate).toContain("supabase.rpc('palace_age_status')");
  expect(accountGate).toContain("supabase.rpc('set_my_palace_birth_date'");
 });

 it('limits every published work and comic read path using private age data',()=>{
  for(const relation of ['public.works','public.comics','public.comic_episodes','public.comic_pages','public.comments','public.work_tags','public.comic_tags','storage.objects'])
   expect(ageMigration).toContain(`on ${relation}`);
  expect(ageMigration).toContain('create or replace function private.can_read_chapter');
  expect(ageMigration).toContain('private.member_meets_age(w.minimum_reader_age)');
  expect(ageMigration).toContain('private.member_meets_age(c.minimum_reader_age)');
  expect(ageMigration).toContain('create or replace function public.get_work_lore');
  expect(ageMigration).toContain('create policy "read accessible comic reader pages"');
 });

 it('enforces rating floors and lets creators select higher age limits',()=>{
  expect(ageMigration).toContain('minimum_reader_age >= private.minimum_age_for_rating(rating)');
  expect(studios).toContain('name="minimum_reader_age"');
  expect(studios).toContain('Readers below this age cannot access the published work.');
  expect(studios).toContain('Readers below this age cannot access published episodes and pages.');
 });

 it('fails closed when account age status cannot be checked',()=>{
  expect(accountGate).toContain("setStatus('unavailable')");
  expect(accountGate).toContain('status===\'eligible\'');
  expect(accountGate).toContain('Your exact birth date is private.');
 });
});
