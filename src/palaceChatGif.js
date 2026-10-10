/* GIFs are stored as a single ordinary text message. No database migration,
 * raw HTML, scripts or cross-site embeds; only trusted direct media URLs. */
export const PALACE_GIF_PREFIX='🎞️ GIF: ';
export function palaceGifUrl(input){
 try{
  const u=new URL(String(input||'').trim());
  const host=u.hostname.toLowerCase();
  const trusted=host==='media.giphy.com'||host==='i.giphy.com'||/^media[0-9]*\.giphy\.com$/.test(host)||/^media[0-9]*\.tenor\.com$/.test(host)||host==='c.tenor.com';
  if(u.protocol!=='https:'||!trusted||u.port||u.username||u.password||u.href.length>750)return null;
  if(!/\.(gif|webp)$/i.test(u.pathname))return null;
  if(!/^[A-Za-z0-9%/_ .-]+$/.test(u.pathname))return null;
  u.hash='';return u.toString();
 }catch{return null}
}
export function encodePalaceGif(input){
 const url=palaceGifUrl(input);return url?PALACE_GIF_PREFIX+url:null;
}
export function parsePalaceGif(body){
 const str=String(body||'');if(!str.startsWith(PALACE_GIF_PREFIX))return null;
 const value=str.slice(PALACE_GIF_PREFIX.length);
 return value===value.trim()?palaceGifUrl(value):null;
}
