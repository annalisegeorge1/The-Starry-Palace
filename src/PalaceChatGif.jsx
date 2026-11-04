import React,{useState} from 'react';
import {parsePalaceGif} from './palaceChatGif';
/* External GIF loads only after a deliberate tap: private messages must not
   leak viewing activity to a media host automatically. */
export default function PalaceChatGif({body}){
 const[loaded,setLoaded]=useState(false);
 const url=parsePalaceGif(body);
 if(!url){
  const text=String(body||'');
  if(!/^↩ Quoting [^\r\n]+$/m.test(text))return <p>{body}</p>;
  return <div className="palace-chat-quoted-message">{text.split(/(↩ Quoting [^\r\n]+)(?:\r?\n|$)/).map((part,index)=>part.trim()?part.startsWith('↩ Quoting ')?<blockquote className="palace-chat-inline-quote" key={index}>{part}</blockquote>:<p key={index}>{part.trim()}</p>:null)}</div>;
 }
 return <div className="palace-chat-gif-preview">
  {loaded?<img src={url} alt="GIF shared in this conversation" loading="lazy" referrerPolicy="no-referrer"/>:
   <button type="button" onClick={()=>setLoaded(true)} aria-label="View shared GIF">▶ View GIF <small>Loads from GIPHY or Tenor</small></button>}
  <small>GIF · External media</small>
 </div>;
}
