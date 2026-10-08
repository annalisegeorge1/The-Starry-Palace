/**
 * Keep sign-in links pointed at Palace rooms, never arbitrary external URLs.
 * A chapter/deep link can include a local query string. Auth callbacks reuse
 * the same validator rather than trusting a user-controlled `next` value.
 */
const SAFE_ROOMS=new Set([
 '/', '/chamber','/welcome','/reading','/series','/comics','/comics/studio',
 '/writing','/library','/palace-life','/grand-palaces','/events','/settings',
 '/activity','/letters','/treasury','/search','/tags','/writers'
]);
const SAFE_DEEP_LINK=/^\/(?:writing|work|comic|club|member)\/[a-zA-Z0-9_-]+(?:\/(?:chapter|episode)\/[a-zA-Z0-9_-]+)?$/;
export function safePalaceReturnPath(candidate,fallback='/chamber'){
 if(typeof candidate!=='string'||candidate.length>500||!candidate.startsWith('/')||candidate.startsWith('//')||candidate.includes('\\')||/[\x00-\x1f\x7f]/.test(candidate))return fallback;
 const pathname=candidate.split(/[?#]/,1)[0];
 if(!SAFE_ROOMS.has(pathname)&&!SAFE_DEEP_LINK.test(pathname))return fallback;
 // React Router interprets these as relative-internal paths, never URLs.
 return candidate;
}
export function palaceCallbackUrl(origin,destination){
 const next=safePalaceReturnPath(destination);
 return origin+'/auth/callback?next='+encodeURIComponent(next);
}
