import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
const edge=readFileSync(new URL('../supabase/functions/palace-invitations/index.ts',import.meta.url),'utf8');
const sql=readFileSync(new URL('../supabase/migrations/20261111010000_palace_age_safe_outbound_invitations.sql',import.meta.url),'utf8');
const mail=readFileSync(new URL('../supabase/functions/palace-invitations/email.ts',import.meta.url),'utf8');

describe('Palace invitation-first server security',()=>{
 it('requires server-verified authenticated administrator and private sending key',()=>{
  expect(edge).toContain("'/auth/v1/user'");
  expect(edge).toContain("PALACE_INVITE_ADMIN_EMAILS");
  expect(edge).toContain("email_confirmed_at");
  expect(edge).toContain("RESEND_API_KEY");
  expect(edge).toContain("SUPABASE_SERVICE_ROLE_KEY");
  expect(edge).toContain("return json({error:'Forbidden'},403");
  expect(edge).not.toContain('inviteUserByEmail');
  expect(edge).not.toContain('auth.admin.createUser');
 });
 it('never creates an account before the invitee chooses a birth date',()=>{
  expect(mail).toContain('https://thestarrypalace.com/invitation');
  expect(mail).not.toContain('TokenHash');
  expect(sql).not.toContain('alter table auth.users');
  expect(sql).not.toContain('drop trigger');
  expect(edge).not.toContain('inviteUserByEmail');
 });
 it('stores only keyed recipient fingerprints and imposes atomic quotas',()=>{
  expect(sql).toContain('recipient_fingerprint');
  expect(sql).not.toContain('recipient_email');
  expect(sql).toContain('pg_advisory_xact_lock');
  expect(sql).toContain("interval '24 hours'");
  expect(sql).toContain('enable row level security');
  expect(sql).toContain('revoke all on private.palace_invitation_delivery_log from public,anon,authenticated');
  expect(edge).toContain("name:'HMAC'");
  expect(edge).toContain('Idempotency-Key');
 });
 it('restricts both private RPC functions to service role',()=>{
  expect(sql).toContain('grant execute on function public.palace_invitation_reserve(uuid,text) to service_role');
  expect(sql).toContain('grant execute on function public.palace_invitation_finish(uuid,boolean,text) to service_role');
 });
});
