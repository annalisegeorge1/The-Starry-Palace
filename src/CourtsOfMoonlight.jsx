import {useState} from 'react';

export const courtSheets=[
 {id:'courts-1',name:'Mali · Egypt · Ethiopia · Tang China'},
 {id:'courts-2',name:'Korea · Britain · Rome · Persia'},
 {id:'courts-3',name:'Mongol · Ottoman · Greek · Russian'}
];
export default function CourtsOfMoonlight(){
 const [selected,setSelected]=useState('courts-1');
 const sheet=courtSheets.find(s=>s.id===selected);
 return <section className="court-watercolour-gallery">
  <h2>Courts of Moonlight</h2>
  <p>Twelve court-inspired portraits, painted in five tiers. These are artwork previews; they do not grant an achievement or indicate ownership.</p>
  <div className="badge-collection-switch" role="group" aria-label="Court portrait collection">{courtSheets.map(s=><button key={s.id} aria-pressed={selected===s.id} onClick={()=>setSelected(s.id)}>{s.name}</button>)}</div>
  <figure>
   <figcaption><strong>{sheet.name}</strong><br/>Rows follow the cultures above. Columns: Bronze · Silver · Gold · Platinum · Emerald.</figcaption>
   <img key={sheet.id} src={'/assets/palace-courts/'+sheet.id+'.png'} alt={`${sheet.name}: four rows of watercolour portraits, each progressing from Bronze through Emerald`} loading="lazy" decoding="async"/>
  </figure>
 </section>;
}
