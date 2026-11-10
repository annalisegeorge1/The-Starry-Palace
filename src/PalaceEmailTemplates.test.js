import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';

const actionTypes={
 confirmation:'email',
 recovery:'recovery',
 magic_link:'magiclink',
 invite:'invite',
 email_change:'email_change',
};
const all=[...Object.keys(actionTypes),'reauthentication','password_changed_notification'];
const get=(name)=>readFileSync(new URL('../supabase/email-templates/'+name+'.html',import.meta.url),'utf8');

describe('Palace transaction email templates',()=>{
 it('all have readable email-safe structure and a recognisable sender brand',()=>{
  for(const name of all){
   const html=get(name);
   expect(html).toContain('The Starry Palace');
   expect(html).toContain('role="presentation"');
   expect(html).toContain('https://thestarrypalace.com');
   expect(html).toContain('font-family:');
   expect(html).not.toContain('supabase.co');
   expect(html).not.toMatch(/<script|<iframe|tracking|google-analytics/i);
   expect(html).not.toContain('?token_hash=');
  }
 });
 it('uses one-time fragment links with correct Supabase OTP type for each action',()=>{
  for(const [name,type] of Object.entries(actionTypes)){
   const html=get(name);
   expect(html).toContain('https://thestarrypalace.com/auth/verify#token_hash={{ .TokenHash }}&amp;type='+type);
   expect(html).not.toContain('{{ .ConfirmationURL }}');
   expect(html).not.toContain('https://sservftxygunkacmwsad.supabase.co');
  }
 });
 it('uses a code, not a link, for reauthentication',()=>{
  const html=get('reauthentication');
  expect(html).toContain('{{ .Token }}');
  expect(html).not.toContain('token_hash');
 });
 it('does not claim security alerts have been enabled',()=>{
  expect(get('password_changed_notification')).not.toContain('token_hash');
 });
});
