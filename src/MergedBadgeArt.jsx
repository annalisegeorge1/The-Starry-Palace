import React from 'react';

const tiers=['bronze','silver','gold','platinum','emerald'];
const normal=value=>String(value||'').toLowerCase().replace(/[^a-z0-9]/g,'');

export const mergedObjectPaths={
 'reading-circle-host':{name:'Reading Circle Host',label:'Moonlit Tea',asset:'moonlit-tea'},
 'lunar-lantern':{name:'Lunar Lantern',label:'Moonflower Lanterns',asset:'moonlit-lantern'},
 'crown-of-completion':{name:'Crown of Completion',label:'Crescent Crowns',asset:'moonlit-crown'},
 'infinite-inkwell':{name:'Infinite Inkwell',label:"Poet’s Inkwells",asset:'moonlit-inkwell'},
 'story-pilgrim':{name:'Story Pilgrim',label:'Celestial Folios',asset:'moonlit-book'}
};

export const mergedCourtPaths={
 'thoughtful-voice':{name:'Thoughtful Voice',court:'Mali',sheet:'courts-1',row:0},
 'welcome-lantern':{name:'Welcome Lantern',court:'Egypt',sheet:'courts-1',row:1},
 'community-host':{name:'Community Host',court:'Ethiopia',sheet:'courts-1',row:2},
 'reading-festival-voyager':{name:'Reading Festival Voyager',court:'Tang China',sheet:'courts-1',row:3},
 'salon-guest':{name:'Salon Guest',court:'Korea',sheet:'courts-2',row:0},
 'workshop-scholar':{name:'Workshop Scholar',court:'Britain',sheet:'courts-2',row:1},
 'event-steward':{name:'Event Steward',court:'Rome',sheet:'courts-2',row:2},
 'club-founder':{name:'Club Founder',court:'Persia',sheet:'courts-2',row:3},
 'steward-s-key':{name:"Steward's Key",court:'Mongol',sheet:'courts-3',row:0},
 'circle-of-moons':{name:'Circle of Moons',court:'Ottoman',sheet:'courts-3',row:1},
 'cross-court-visitor':{name:'Cross-Court Visitor',court:'Greek',sheet:'courts-3',row:2},
 'community-bridge':{name:'Community Bridge',court:'Russian',sheet:'courts-3',row:3}
};

const byName=new Map([
 ...Object.entries(mergedObjectPaths).map(([id,x])=>[normal(x.name),{...x,id,type:'object'}]),
 ...Object.entries(mergedCourtPaths).map(([id,x])=>[normal(x.name),{...x,id,type:'court'}])
]);
const byId=new Map([
 ...Object.entries(mergedObjectPaths).map(([id,x])=>[id,{...x,id,type:'object'}]),
 ...Object.entries(mergedCourtPaths).map(([id,x])=>[id,{...x,id,type:'court'}])
]);

export const mergedBadgePathCount=byId.size;

export function mergedBadgeArtwork(family,tier='bronze'){
 const rank=tiers.includes(tier)?tier:'bronze';
 const id=String(family?.id||'');
 const found=byId.get(id)||byName.get(normal(family?.name));
 if(!found)return null;
 return{...found,tier:rank,column:tiers.indexOf(rank)};
}

export function MergedBadgeArt({art,name}){
 if(!art)return null;
 if(art.type==='object'){
  const src='/assets/palace-collectibles/'+art.asset+'-'+art.tier+'.png';
  return <img className="merged-badge-object" src={src} alt={(name||art.name)+' · '+art.tier+' watercolour'} loading="lazy" decoding="async"/>;
 }
 const x=art.column*25;
 const y=art.row*(100/3);
 return <span
  className="merged-court-portrait"
  role="img"
  aria-label={(name||art.name)+' · '+art.tier+' · '+art.court+' court watercolour'}
  style={{
   backgroundImage:'url(/assets/palace-courts/'+art.sheet+'.png?v=badge-merge-1)',
   backgroundSize:'500% 400%',
   backgroundPosition:x+'% '+y+'%',
   backgroundRepeat:'no-repeat'
  }}
 />;
}
