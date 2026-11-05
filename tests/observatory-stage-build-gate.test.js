import {describe,it,expect} from 'vitest';
import {checkObservatoryStageEnvironment,OBSERVATORY_STAGE_URL}
 from '../scripts/verify-observatory-stage-env.mjs';

const valid={
 VITE_OBSERVATORY_STAGE:'true',
 VITE_SUPABASE_URL:OBSERVATORY_STAGE_URL,
 VITE_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test_fixture_for_no_live_connection',
 VITE_GOOGLE_LOGIN_ENABLED:'false'
};

describe('Isolated Observatory staging build gate',()=>{
 it('accepts only the known independent staging URL and browser publishable key',()=>{
  expect(checkObservatoryStageEnvironment(valid)).toEqual({ok:true,errors:[]});
 });
 it('rejects missing markers, including a production build with no staging opt-in',()=>{
  const result=checkObservatoryStageEnvironment({
   ...valid,VITE_OBSERVATORY_STAGE:undefined
  });
  expect(result.ok).toBe(false);
  expect(result.errors.join(' ')).toMatch(/stage marker/i);
 });
 it('rejects the production database and alternate Supabase projects',()=>{
  for(const url of [
   'https://sservftxygunkacmwsad.supabase.co',
   'https://other-example.supabase.co',
   '',
   OBSERVATORY_STAGE_URL+'/'
  ]){
   const result=checkObservatoryStageEnvironment({...valid,VITE_SUPABASE_URL:url});
   expect(result.ok).toBe(false);
   expect(result.errors.join(' ')).toMatch(/Supabase URL/i);
  }
 });
 it('rejects absent, secret and service-role credentials without ever printing their values',()=>{
  for(const key of ['', 'sb_secret_not_for_the_client','service_role_token','sb_publishable_short']){
   const result=checkObservatoryStageEnvironment({...valid,VITE_SUPABASE_PUBLISHABLE_KEY:key});
   expect(result.ok).toBe(false);
   expect(result.errors.join(' ')).not.toContain(key);
  }
 });
 it('keeps OAuth disabled for the isolated review build',()=>{
  const result=checkObservatoryStageEnvironment({...valid,VITE_GOOGLE_LOGIN_ENABLED:'true'});
  expect(result.ok).toBe(false);
  expect(result.errors.join(' ')).toMatch(/OAuth/i);
 });
});
