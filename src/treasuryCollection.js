const tiers=['bronze','silver','gold','platinum','emerald'];
export function buildInventory(rows=[]){
 const map=new Map();
 for(const row of rows||[]){
  const id=row.virtual_gifts?.id, copies=Number(row.copies), tier=row.tier;
  if(!id||!tiers.includes(tier)||!Number.isFinite(copies)||copies<=0)continue;
  const entry=map.get(id)||{copies:0,tiers:[],hasDuplicates:false,ascendable:false,counts:{},upgradeCopies:3};
  entry.copies+=copies;
  entry.counts[tier]=(entry.counts[tier]||0)+copies;
  entry.upgradeCopies=Number(row.virtual_gifts.upgrade_copies)>0?Number(row.virtual_gifts.upgrade_copies):3;
  map.set(id,entry);
 }
 for(const entry of map.values()){
  entry.tiers=tiers.filter(t=>Number(entry.counts[t]||0)>0);
  entry.hasDuplicates=tiers.some(t=>Number(entry.counts[t]||0)>1);
  entry.ascendable=tiers.some(t=>t!=='emerald'&&Number(entry.counts[t]||0)>=entry.upgradeCopies);
 }
 return map;
}
