import {useId,useState} from 'react';

// Change only names supplied entirely in capitals; preserve fandom acronyms.
export function tagDisplayName(name){
 const value=String(name||'');
 if(value!==value.toUpperCase())return value;
 return value.split(/(\s+)/).map(word=>/^(?:[A-Z](?:\/[A-Z])+|LGBTQ\+?|LGBTQIA\+?|AO3|ASOIAF|TV|AU|OC|POV|USA|UK|DC|MCU|BDSM|ADHD|PTSD|1920S)$/i.test(word)?word:word.toLowerCase().replace(/(^|[-(])([a-z])/g,(_,prefix,letter)=>prefix+letter.toUpperCase())).join('');
}
export default function TagFamilyRows({tags,category,children}){
 const [limit,setLimit]=useState(8),id=useId();
 const remaining=tags.length-limit;
 return <><div id={id} className="tag-picker restored">{tags.slice(0,limit).map(children)}</div>
 {tags.length>8&&<div className="tag-family-pager">{remaining>0&&<button type="button" aria-controls={id} onClick={()=>setLimit(n=>n+16)}>Show more {category.replaceAll('_',' ')} tags ({remaining} more)</button>}{limit>8&&<button type="button" aria-controls={id} onClick={()=>setLimit(8)}>Show fewer</button>}</div>}</>;
}
