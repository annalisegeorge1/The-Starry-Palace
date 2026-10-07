export const CEREMONY_STAGES=[{name:'Founding Crest',min:0},{name:'Awakened Court',min:25},{name:'Starlit Court',min:150},{name:'Regal Court',min:500},{name:'Sovereign Constellation',min:1500}];
export function ceremonyStage(n){return [...CEREMONY_STAGES].reverse().find(x=>(Number(n)||0)>=x.min)||CEREMONY_STAGES[0]}
