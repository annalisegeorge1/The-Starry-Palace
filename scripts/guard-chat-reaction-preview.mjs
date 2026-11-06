/** Fail closed on automatic Cloudflare Pages PR previews of private-chat features.
 * The ordinary Palace Pages preview may target the production Supabase project.
 * Run full CI without accessing any member conversations or changing deployment config.
 */
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
export const REACTION_REVIEW_BRANCH='feature/chat-frequent-reactions-2026-11-07';
export function chatReactionPreviewAllowed(env={}){
 return !((env.CF_PAGES==='1'||env.CF_PAGES==='true')&&env.CF_PAGES_BRANCH===REACTION_REVIEW_BRANCH);
}
const invoked=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(invoked&&!chatReactionPreviewAllowed(process.env)){
 console.error('Chat reaction PR preview blocked: ordinary Pages preview is not isolated from production Supabase.');
 process.exitCode=1;
}
