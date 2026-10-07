export const HONOUR_SHOP=[
 {key:'heart',glyph:'♥',name:'Heart',price:20,rarity:'Common'},
 {key:'star',glyph:'✦',name:'Star',price:150,rarity:'Uncommon'},
 {key:'moon',glyph:'☾',name:'Moon',price:600,rarity:'Rare'},
 {key:'crown',glyph:'♛',name:'Crown',price:3000,rarity:'Legendary'}
];
export const QUARTERLY_BOXES=[
 {rank:'1',tier:'emerald',label:'Celestial Monarch Box',details:'100 points · 2 Emerald gifts · 12 hearts · 5 stars · 1 moon · 1 crown · imperial theme'},
 {rank:'2',tier:'platinum',label:'Sovereign Star Box',details:'75 points · 2 Platinum gifts · 10 hearts · 3 stars · 1 moon · exclusive theme'},
 {rank:'3',tier:'gold',label:'Regent of the Moon Box',details:'55 points · 1 Gold gift · 8 hearts · 2 stars · 1 moon · exclusive theme'},
 {rank:'4–5',tier:'silver',label:'Silver Court Box',details:'35 points · 1 Silver gift · 5 hearts · 2 stars · exclusive theme'},
 {rank:'6–10',tier:'bronze',label:'Starling Court Box',details:'20 points · 1 Bronze gift · 3 hearts · 1 star · exclusive theme'}
];
export function prizeTierForRank(rank){
 if(!Number.isInteger(rank)||rank<1||rank>10)return null;
 return rank===1?'emerald':rank===2?'platinum':rank===3?'gold':rank<=5?'silver':'bronze';
}
export function daysUntilSeasonEnd(value,at=Date.now()){
 const ms=new Date(value).getTime()-at;
 return Number.isFinite(ms)?Math.max(0,Math.ceil(ms/86400000)):0;
}
export function formatHonourCount(rows,kind){
 return Number((rows||[]).find(item=>item.honour===kind)?.display_count||0);
}
