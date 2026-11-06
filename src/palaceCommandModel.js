// Resolve navigation symbols from destinations, including older saved history.
export function palaceCommandIcon(path='') {
 const route=path.split('?')[0];
 if(path.includes('surprise=1'))return 'activity';
 if(route==='/search')return 'search';
 if(route.startsWith('/writing')||route==='/writers')return 'writing';
 if(route.startsWith('/library'))return 'library';
 if(route.startsWith('/treasury'))return 'treasury';
 if(route.startsWith('/events'))return 'events';
 if(route.startsWith('/settings')||route==='/code'||route==='/legal')return 'settings';
 if(route.startsWith('/council'))return 'council';
 if(route.startsWith('/reading')||/^\/(work|comic|comics|classic|tags|series|lost-works)(\/|$)/.test(route))return 'reading';
 if(route==='/activity')return 'bell';
 if(route.includes('letters'))return 'letters';
 if(route.startsWith('/palace-life')||route.startsWith('/club'))return 'life';
 return 'palace';
}
export function uniquePalaceCommandRecents(items,currentHref) {
 const seen=new Set();
 return items.filter(item=>{
  if(item.path===currentHref)return false;
  const key=item.label+'|'+item.detail;
  if(seen.has(key))return false;
  seen.add(key);return true;
 }).slice(0,4);
}
