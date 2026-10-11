/* GIPHY Search API runs directly in the browser as required by GIPHY.
 * The site's GIPHY web beta key is intentionally a client-side build setting.
 * No media or API proxy, server cache, or extra tracking layer. */
import {palaceGifUrl} from './palaceChatGif';

export const GIPHY_REACTIONS=['Love','Laugh','Celebrate','Applause','Hug','Wow'];
export const palaceGiphyEnabled=()=>Boolean(String(import.meta.env?.VITE_GIPHY_API_KEY||'').trim());

export function palaceGiphyItem(item){
 const images=item?.images||{};
 const safeMedia=input=>{try{
   const u=new URL(String(input||''));
   // GIPHY rendition URLs can carry transient analytics params; keep only
   // the image URL after verifying the CDN and allowed extension.
   if(!/^media[0-9]*\\.giphy\\.com$/.test(u.hostname)&&u.hostname!=='i.giphy.com')return null;
   if(!/\\.(gif|webp)$/i.test(u.pathname))return null;
   u.search='';u.hash='';
   return palaceGifUrl(u.toString());
  }catch{return null}};

 const preview=images.fixed_width_small?.webp||images.fixed_width_small?.url||images.fixed_width?.webp||images.fixed_width?.url||'';
 const url=images.fixed_width?.url||images.downsized?.url||images.original?.url||'';
 return{
  id:String(item?.id||''),
  title:String(item?.title||'Animated GIF'),
  preview:safeMedia(preview),
  url:safeMedia(url),
  creator:String(item?.user?.display_name||item?.username||item?.user?.username||'').slice(0,80),
  permalink:(()=>{try{const u=new URL(String(item?.url||''));return u.protocol==='https:'&&(u.hostname==='giphy.com'||u.hostname==='www.giphy.com')?u.toString():''}catch{return''}})()
 };
}

export async function searchPalaceGiphy(query,{apiKey=import.meta.env?.VITE_GIPHY_API_KEY,signal,limit=18}={}){
 const q=String(query||'').trim();
 if(q.length<2||q.length>50)throw new Error('Enter 2–50 characters to search GIFs.');
 if(!String(apiKey||'').trim())throw new Error('GIPHY search is awaiting its developer key.');
 const url=new URL('https://api.giphy.com/v1/gifs/search');
 url.searchParams.set('api_key',String(apiKey).trim());
 url.searchParams.set('q',q);
 url.searchParams.set('rating','pg');
 url.searchParams.set('limit',String(Math.max(1,Math.min(20,Math.floor(limit)||18))));
 url.searchParams.set('lang','en');
 const response=await fetch(url.toString(),{signal,mode:'cors',referrerPolicy:'no-referrer'});
 if(response.status===429)throw new Error('GIPHY is handling a lot of searches. Please try again later.');
 if(!response.ok)throw new Error('GIF search is unavailable right now. Please try again.');
 const payload=await response.json();
 if(!Array.isArray(payload?.data))throw new Error('Unexpected GIF search response.');
 // Preserve GIPHY's order and all result slots. Unsafe/unusable GIFs display
 // as unavailable rather than being silently replaced or rearranged.
 return payload.data.map(palaceGiphyItem);
}
