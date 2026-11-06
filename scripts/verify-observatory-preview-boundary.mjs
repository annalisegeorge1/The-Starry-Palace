/** Fail closed on automatic Cloudflare Pages PR previews of Observatory draft.
 * The normal Palace Pages project shares its PR preview environment with the
 * production Supabase project. This draft must not be previewed against it.
 * Safe: no network calls, credentials logged, or external data reads.
 */
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

export const OBSERVATORY_REVIEW_BRANCH='feature/palace-observatory-readonly-2026-11-03';
export const OBSERVATORY_STAGE_REF='ysbntuyyprnhptlxxsng';
export const OBSERVATORY_STAGE_URL=`https://${OBSERVATORY_STAGE_REF}.supabase.co`;

export function verifyObservatoryPreviewBoundary(env={}){
 const branch=String(env.CF_PAGES_BRANCH||'').trim();
 const onPages=env.CF_PAGES==='1'||env.CF_PAGES==='true';
 // Only target the draft's Cloudflare build, never production main or CI.
 if(!onPages||branch!==OBSERVATORY_REVIEW_BRANCH)return {ok:true,reason:'not-observatory-pages-preview'};
 const url=String(env.VITE_SUPABASE_URL||'').trim();
 const stageMarked=env.VITE_OBSERVATORY_STAGE==='true';
 const googleDisabled=env.VITE_GOOGLE_LOGIN_ENABLED==='false';
 const key=String(env.VITE_SUPABASE_PUBLISHABLE_KEY||'');
 if(env.VITE_OBSERVATORY_PREVIEW_APPROVED!=='true'||url!==OBSERVATORY_STAGE_URL||!stageMarked||!googleDisabled||!key.startsWith('sb_publishable_'))
  return {ok:false,reason:'Observatory draft Pages preview requires explicit preview approval, the isolated staging project, staging marker, Google login disabled and a staging publishable key. Use the dedicated staging Pages project after approval.'};
 return {ok:true,reason:'staging-only-preview-config-checked'};
}
const invoked=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(invoked){
 const result=verifyObservatoryPreviewBoundary(process.env);
 if(!result.ok){console.error('Blocked unsafe Observatory preview: '+result.reason);process.exitCode=1;}
 else console.log('Observatory preview boundary checked; no database access performed.');
}
