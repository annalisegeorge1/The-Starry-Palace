import {FANDOM_MEDIA_SHELVES,NON_FANDOM_CLASSIFICATIONS} from './palaceFandomCatalogue';

export const FANDOMS_PER_PAGE=24;
export function normalizeFandomName(input=''){
 return String(input||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
  .toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
}
export function visibleFandoms(rows=[],{media='all',query='',sort='alpha',subcategory='all',franchise='all'}={}){
 const needle=normalizeFandomName(query);
 const filtered=(Array.isArray(rows)?rows:[]).filter(row=>{
  if(!row||NON_FANDOM_CLASSIFICATIONS.some(name=>normalizeFandomName(name)===normalizeFandomName(row.name)))return false;
  const kinds=Array.isArray(row.media_categories)&&row.media_categories.length?row.media_categories:['uncategorized'];
  if(media!=='all'&&!kinds.includes(media))return false;
  if(subcategory!=='all'&&normalizeFandomName(row.subcategory)!==normalizeFandomName(subcategory))return false;
  if(franchise!=='all'&&normalizeFandomName(row.franchise||row.name)!==normalizeFandomName(franchise))return false;
  if(!needle)return true;
  const hay=[row.name,row.subcategory,row.franchise,...(row.aliases||[])].map(normalizeFandomName);
  return needle.split(' ').every(word=>hay.some(field=>field.includes(word)));
 });
 return filtered.sort((a,b)=>sort==='used'
  ?Number(b.usage_count||0)-Number(a.usage_count||0)||a.name.localeCompare(b.name)
  :a.name.localeCompare(b.name,undefined,{sensitivity:'base'}));
}
export function pageFandoms(rows=[],requested=0,size=FANDOMS_PER_PAGE){
 const list=Array.isArray(rows)?rows:[];
 const take=Math.max(1,Math.min(50,Number(size)||FANDOMS_PER_PAGE));
 const pageCount=Math.max(1,Math.ceil(list.length/take));
 const page=Math.max(0,Math.min(pageCount-1,Math.floor(Number(requested)||0)));
 return {page,pages:pageCount,total:list.length,start:list.length?page*take+1:0,
  end:Math.min(list.length,(page+1)*take),items:list.slice(page*take,(page+1)*take)};
}
export function fandomMediaLabel(id){
 return FANDOM_MEDIA_SHELVES.find(item=>item.id===id)?.label||'Uncategorized';
}
export function safeFandomSelection(ids=[],available=[],max=5){
 const known=new Set((available||[]).map(row=>row.id));
 return [...new Set((ids||[]).filter(id=>typeof id==='string'&&known.has(id)))].slice(0,max);
}

/** Derived only from actual registered fandoms, not invented placeholder categories. */
export function fandomFacetOptions(rows=[],media='all'){
 const eligible=(Array.isArray(rows)?rows:[]).filter(row=>
  row&&Array.isArray(row.media_categories)
   &&(media==='all'||row.media_categories.includes(media)));
 const categories=[...new Set(eligible.map(x=>String(x.subcategory||'').trim()).filter(Boolean))]
  .sort((a,b)=>a.localeCompare(b,undefined,{sensitivity:'base'}));
 const franchises=[...new Set(eligible.map(x=>String(x.franchise||x.name||'').trim()).filter(Boolean))]
  .sort((a,b)=>a.localeCompare(b,undefined,{sensitivity:'base'}));
 return {categories,franchises};
}
