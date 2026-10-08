/**
 * Keep the blank-screen watchdog from mistaking a hidden first panel for
 * an entirely invisible room. Responsive layouts can render a hidden
 * illustration, dialog or decorative node before their visible content.
 *
 * This checks top-level render surfaces only; callers supply the browser
 * visibility predicate, keeping this policy testable without a live browser.
 */
export function isPalaceRoomVisuallyBlank(content, isInvisible){
 if(!content||typeof isInvisible!=='function')return false;
 if(isInvisible(content))return true;
 const surfaces=Array.from(content.children||[]).filter(node=>
  node&&node.nodeType===1&&!['STYLE','SCRIPT','TEMPLATE','NOSCRIPT'].includes(node.tagName)
 );
 if(surfaces.length===0)return false;
 return surfaces.every(node=>isInvisible(node));
}
