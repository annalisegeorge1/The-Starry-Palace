/** Block automatic PR previews that would use the ordinary Palace project's production-backed Supabase preview variables. */
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
export const STORY_COVER_BRANCH='feature/simple-story-cover-fallback-2026-11-07';
export function storyCoverPreviewAllowed(env={}){
 return !((env.CF_PAGES==='1'||env.CF_PAGES==='true')&&env.CF_PAGES_BRANCH===STORY_COVER_BRANCH);
}
const invoked=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(invoked&&!storyCoverPreviewAllowed(process.env)){
 console.error('Cover-only PR Pages preview blocked: this environment currently targets production Supabase.');
 process.exitCode=1;
}
