/**
 * Observationally safe staging build gate.
 * Run before compiling a review build. This module does not connect to
 * Supabase or Cloudflare and never logs key values.
 */
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

export const OBSERVATORY_STAGE_PROJECT_REF='ysbntuyyprnhptlxxsng';
export const OBSERVATORY_STAGE_URL=`https://${OBSERVATORY_STAGE_PROJECT_REF}.supabase.co`;

export function checkObservatoryStageEnvironment(env={}){
 const errors=[];
 if(env.VITE_OBSERVATORY_STAGE!=='true')
  errors.push('Observatory stage marker must be explicitly set to true.');
 if(String(env.VITE_SUPABASE_URL||'').trim()!==OBSERVATORY_STAGE_URL)
  errors.push('Supabase URL does not match the isolated Security Staging project.');
 const key=String(env.VITE_SUPABASE_PUBLISHABLE_KEY||'');
 if(!key.startsWith('sb_publishable_')||key.length<30)
  errors.push('A Supabase staging publishable key is required; secret keys are forbidden.');
 if(env.VITE_GOOGLE_LOGIN_ENABLED!=='false')
  errors.push('Google OAuth login must remain disabled in this staging build.');
 return {ok:errors.length===0,errors};
}

const invoked=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(invoked){
 const checked=checkObservatoryStageEnvironment(process.env);
 if(checked.ok){
  console.log('Observatory staging build gate passed. No database changes were made.');
 }else{
  for(const error of checked.errors)console.error('Staging configuration blocked: '+error);
  process.exitCode=1;
 }
}
