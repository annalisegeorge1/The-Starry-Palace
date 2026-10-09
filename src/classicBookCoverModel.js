/**
 * Palace Classics use their cited Project Gutenberg edition covers.
 * This artwork belongs to the Gutenberg source edition, not necessarily to
 * the historical first printing. Never infer an edition from title alone.
 */
const COLLECTION_EXCERPT_SLUGS=new Set([
 'a-scandal-in-bohemia-arthur-conan-doyle',
 'miss-ying-ning-pu-songling','planting-a-pear-tree-pu-songling',
 'the-painted-skin-pu-songling','the-painted-wall-pu-songling',
 'the-curious-case-of-benjamin-button-f-scott-fitzgerald',
 'the-last-leaf-o-henry','the-gift-of-the-magi-o-henry',
 'the-monkeys-paw-w-w-jacobs'
]);
export function gutenbergEditionId(source){
 const value=String(source||'').trim();
 let match=value.match(/^https:\/\/(?:www\.)?gutenberg\.org\/ebooks\/(\d+)(?:[/?#]|$)/i);
 if(!match)match=value.match(/^https:\/\/github\.com\/GITenberg\/[^\s/]+_(\d+)(?:[/?#]|$)/i);
 if(!match)return null;
 const id=Number(match[1]);
 return Number.isSafeInteger(id)&&id>0&&id<1000000?id:null;
}
export function classicBookCoverInfo(record={}){
 if(record?.cover_url && /^https:\/\//i.test(record.cover_url)){
  return {url:record.cover_url,source:'catalogue'};
 }
 if(record?.is_archive===false || record?.rights_status && record.rights_status!=='public_domain_verified')return null;
 if(COLLECTION_EXCERPT_SLUGS.has(String(record.slug||'')))return null;
 const id=gutenbergEditionId(record?.archive_source_url||record?.source_url);
 return id?{
  url:`https://www.gutenberg.org/cache/epub/${id}/pg${id}.cover.medium.jpg`,
  source:'Project Gutenberg',id
 }:null;
}
export function classicCoverPalette(title=''){
 const palettes=['violet','ocean','plum','slate','aqua'];
 const text=String(title||'');
 const checksum=[...text].reduce((sum,char)=>sum+char.charCodeAt(0),0);
 return palettes[checksum%palettes.length];
}
