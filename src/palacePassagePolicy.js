/** The passage is a discovery aid, never an obstacle to reading or editing.
 * Room landing pages keep their links; immersive content gets the space back.
 * Matching is segment-aware so /writing remains different from /writing/:slug.
 */
export function shouldShowPalacePassage(pathname){
 if(typeof pathname!=='string')return true;
 // These rooms already have strong in-page tabs. A second passage rail repeats navigation.
 if(['/palace-life','/library','/writing','/settings','/treasury'].includes(pathname))return false;
 if(/^\/writing\/[^/]+(?:\/|$)/.test(pathname))return false;
 if(/^\/work\/[^/]+\/chapter\/[^/]+(?:\/|$)/.test(pathname))return false;
 if(/^\/classic\/[^/]+(?:\/|$)/.test(pathname))return false;
 if(/^\/comic\/[^/]+\/episode\/[^/]+(?:\/|$)/.test(pathname))return false;
 if(/^\/comics\/studio(?:\/|$)/.test(pathname))return false;
 return true;
}
