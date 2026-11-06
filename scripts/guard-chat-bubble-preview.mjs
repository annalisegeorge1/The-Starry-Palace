/** No production-backed Cloudflare Pages preview for this chat styling PR. */
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
export const CHAT_BUBBLE_BRANCH='feature/soft-purple-chat-bubbles-2026-11-07';
export function isSafeChatBubblePreview(env={}){
 return !((env.CF_PAGES==='1'||env.CF_PAGES==='true')&&env.CF_PAGES_BRANCH===CHAT_BUBBLE_BRANCH);
}
const invoked=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(invoked&&!isSafeChatBubblePreview(process.env)){
 console.error('Blocked automatic chat styling preview: shared Pages previews are currently production-Supabase-backed.');
 process.exitCode=1;
}
