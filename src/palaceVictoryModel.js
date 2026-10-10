// The celebration must not interrupt long-form work or active composition.
export const VICTORY_SAFE_ROUTES=new Set(['/','/grand-palaces','/palace-life','/events']);
export function shouldCelebratePalaceVictory(pathname){
 return VICTORY_SAFE_ROUTES.has(String(pathname||'').split('?')[0]);
}
export function validatedPalaceVictory(payload){
 if(!payload||typeof payload!=='object'||Array.isArray(payload))return null;
 if(typeof payload.quarter_start!=='string'||!/^20\d{2}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/.test(payload.quarter_start))return null;
 if(typeof payload.palace_name!=='string'||!payload.palace_name.startsWith('Palace of the ')||typeof payload.finalized_at!=='string'||!Number.isFinite(Date.parse(payload.finalized_at)))return null;
 return {season:payload.quarter_start,name:payload.palace_name.slice(0,100),
  accent:/^#[0-9a-fA-F]{6}$/.test(payload.palace_accent||'')?payload.palace_accent:'#a9a3f5'};
}
export function palaceVictorySeenKey(userId,season){
 return 'palace:quarterly-victory:seen:'+String(userId||'')+':'+String(season||'');
}
export function isPalaceTextInputActive(element){
 return Boolean(element?.closest?.('input, textarea, [contenteditable="true"], [role="textbox"]'));
}
