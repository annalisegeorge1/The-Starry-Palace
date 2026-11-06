/**
 * Read only the publicly eligible fandom directory rows, in stable pages.
 * A partial/ambiguous result must never be mistaken for a complete directory:
 * do not silently stop at a fixed tag or metadata count.
 *
 * PostgREST can impose a per-request row cap; small range requests avoid it.
 */
export const FANDOM_DIRECTORY_PAGE_SIZE=250;
export const FANDOM_DIRECTORY_MAX_ROWS=20000;

export async function scanFandomDirectoryPages(fetchPage,{
 pageSize=FANDOM_DIRECTORY_PAGE_SIZE,maxRows=FANDOM_DIRECTORY_MAX_ROWS,keyField='id'
}={}){
 if(typeof fetchPage!=='function')throw Error('A fandom directory page fetcher is required.');
 if(!Number.isSafeInteger(pageSize)||pageSize<1||pageSize>1000
  ||!Number.isSafeInteger(maxRows)||maxRows<pageSize)
  throw Error('Invalid fandom directory pagination bounds.');
 const records=[],seen=new Set();
 // Query once beyond the maximum, so exactly maxRows records are not
 // mistakenly declared incomplete and maxRows+1 cannot be silently omitted.
 for(let offset=0;offset<=maxRows;offset+=pageSize){
  const page=await fetchPage(offset,pageSize);
  if(!Array.isArray(page)||page.length>pageSize)
   throw Error('A fandom directory page was incomplete or invalid.');
  if(offset+page.length>maxRows)
   throw Error('The fandom directory exceeds the safe review limit. Check its pagination before declaring any tags missing.');
  for(const row of page){
   const key=String(row?.[keyField]||'');
   if(!key||seen.has(key))
    throw Error('Fandom directory pages overlapped or lacked stable identifiers.');
   seen.add(key);
   records.push(row);
  }
  if(page.length<pageSize)return records;
 }
 throw Error('The fandom directory could not be completely verified.');
}
