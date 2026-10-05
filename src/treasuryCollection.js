const tiers=['bronze','silver','gold','platinum','emerald'];
export function buildInventory(rows=[]){
 const map=new Map();
 for(const row of rows||[]){
  const id=row.virtual_gifts?.id, copies=Number(row.copies), tier=row.tier;
  if(!id||!tiers.includes(tier)||!Number.isFinite(copies)||copies<=0)continue;
  const entry=map.get(id)||{copies:0,tiers:[],hasDuplicates:false,ascendable:false,counts:new Map()};
  entry.copies+=copies;
  entry.counts.set(tier,(entry.counts.get(tier)||0)+copies);
  entry.upgradeCopies=Number(row.virtual_gifts.upgrade_copies)>0?Number(row.virtual_gifts.upgrade_copies):3;
  map.set(id,entry);
 }
 for(const entry of map.values()){
  entry.tiers=tiers.filter(t=>entry.counts.has(t));
  entry.hasDuplicates=[...entry.counts.values()].some(n=>n>1);
  entry.ascendable=[...entry.counts].some(([t,n])=>t!=='emerald'&&n>=entry.upgradeCopies);
  delete entry.counts;delete entry.upgradeCopies;
 }
 return map;
}
