/**
 * Protect rooms in which a member may have an unsaved draft, post, message,
 * profile change, or transaction when a newer Palace build is published.
 *
 * Keep public reading/discovery routes eligible for automatic stale-bundle
 * recovery; let writers choose when to refresh after saving their work.
 */
export function shouldOfferManualPalaceRefresh(pathname=''){
 if(typeof pathname!=='string')return false;
 return /^\/(?:writing(?:\/|$)|comics\/studio(?:\/|$)|palace-life(?:\/|$)|club(?:\/|$)|member(?:\/|$)|events(?:\/|$)|grand-palaces(?:\/|$)|council(?:\/|$)|settings(?:\/|$)|letters(?:\/|$)|treasury(?:\/|$))/.test(pathname);
}
