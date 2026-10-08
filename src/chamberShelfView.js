/* A Chamber shelf is a curated preview, not a search of every published work.
 * Normalize accents and whitespace so visible titles are easier to find. */
function foldSearchText(value){
 return String(value??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase().replace(/\s+/g,' ').trim();
}
export function matchesChamberPreview(item,query=''){
 const needle=foldSearchText(query);
 if(!needle)return true;
 if(!item)return false;
 return [item.title,item.summary,item.completion_status]
  .some(value=>foldSearchText(value).includes(needle));
}
export function chamberPreviewCount({shown=0,loaded=0,total=0,search=false}={}){
 const visible=Math.max(0,Number(shown)||0);
 const preview=Math.max(0,Number(loaded)||0);
 const available=Math.max(preview,Number(total)||0);
 if(search)return visible+' match'+(visible===1?'':'es')+' in preview';
 return preview+' of '+available+' visible';
}
