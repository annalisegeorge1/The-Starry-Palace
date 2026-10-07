// The five banners are derived from verified per-member season scores.
// Their decorations cannot be purchased through the Treasury or the Celestial Vault.
export const CEREMONY_STAGES=[
 {name:'Founding Crest',min:0,glyph:'✧',description:'The first crest waits for its constellation.'},
 {name:'Awakened Court',min:25,glyph:'✦',description:'A silver spark lights the court standard.'},
 {name:'Starlit Court',min:150,glyph:'☾',description:'Astral threads appear around the crest.'},
 {name:'Regal Court',min:500,glyph:'♛',description:'Silver regalia gathers around its banner.'},
 {name:'Sovereign Constellation',min:1500,glyph:'❖',description:'The full celestial standard comes into bloom.'}
];
export function ceremonyStage(points){
 const value=Math.max(0,Number(points)||0);
 return [...CEREMONY_STAGES].reverse().find(tier=>value>=tier.min)||CEREMONY_STAGES[0];
}
export function nextCeremonyStage(points){
 const value=Math.max(0,Number(points)||0);
 return CEREMONY_STAGES.find(tier=>value<tier.min)||null;
}
export function ceremonyProgress(points){
 const value=Math.max(0,Number(points)||0);
 const current=ceremonyStage(value),next=nextCeremonyStage(value);
 return next?Math.min(100,Math.round((value-current.min)/(next.min-current.min)*100)):100;
}
export function ceremonyOrnaments(victories,limit=7){
 const n=Math.max(0,Math.floor(Number(victories)||0));
 return Array.from({length:Math.min(n,limit)},(_,i)=>({id:i,glyph:i===0?'✦':'✧'}));
}
export function ceremonyQuarterLabel(value){
 const found=/^(\d{4})-(\d{2})-\d{2}$/.exec(String(value||''));
 if(!found)return 'Recorded season';
 const quarter=Math.ceil(Number(found[2])/3);
 return 'Quarter '+quarter+' · '+found[1];
}
