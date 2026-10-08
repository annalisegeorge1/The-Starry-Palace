/**
 * Global Ctrl/Command+K belongs to Palace navigation only outside editors.
 * Manuscript pads and text fields keep their own writing shortcuts.
 */
export function shouldOpenPalaceQuickNavigation(event){
 if(!event||(event.ctrlKey!==true&&event.metaKey!==true)||String(event.key||'').toLowerCase()!=='k'||event.altKey===true)return false;
 const target=event.target;
 if(target?.isContentEditable)return false;
 return !target?.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"]');
}
