/** An earned title path is measured from the member's actual lifetime points. */
export function nextCelestialTitleProgress(total,groups=[]){
 const points=Number.isFinite(Number(total))?Math.max(0,Math.floor(Number(total))):0;
 const tiers=[...groups].filter(g=>Number.isFinite(Number(g?.need))&&Number(g.need)>0).sort((a,b)=>Number(a.need)-Number(b.need));
 const next=tiers.find(g=>Number(g.need)>points);
 if(!next)return{allUnlocked:tiers.length>0,missing:0,progress:100,next:null};
 const previous=[...tiers].reverse().find(g=>Number(g.need)<=points);
 const start=Number(previous?.need)||0;
 const limit=Number(next.need);
 return{
  allUnlocked:false,next,missing:limit-points,
  progress:Math.max(0,Math.min(100,Math.round((points-start)/(limit-start)*100))),
  current:points,previousThreshold:start
 };
}
