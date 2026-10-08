import React from 'react';
import {Link} from 'react-router-dom';
import './palace-prism-rooms.css';

/* One consistent wayfinding ribbon across writing, discovery, saved shelves and Palace Life.
   Link destinations deliberately reuse existing routes and tabs. */
const rooms=[
 {id:'writing',label:'Writing Chamber',hint:'Ink & drafts',icon:'✎',to:'/writing',colour:'violet'},
 {id:'reading',label:'Reading Rooms',hint:'Discover worlds',icon:'▤',to:'/reading',colour:'teal'},
 {id:'library',label:'My Library',hint:'Your shelves',icon:'◈',to:'/library',colour:'sapphire'},
 {id:'commons',label:'Palace Commons',hint:'Gather together',icon:'✧',to:'/palace-life?room=commons',colour:'rose'},
 {id:'duels',label:'Ink Duels',hint:'Create & compete',icon:'⚔',to:'/writing?tab=duels',colour:'mint'}
];
export default function PrismWayfinder({active='writing'}){
 return <nav className="prism-room-wayfinder" aria-label="Explore the Palace's creative rooms">
  <div className="prism-room-wayfinder-intro"><span aria-hidden="true">✦</span><div><small>ONE LIVING PALACE</small><strong>Follow your next spark</strong></div></div>
  <div className="prism-room-wayfinder-links">
   {rooms.map(room=><Link key={room.id} to={room.to} aria-current={active===room.id?'page':undefined} className={'prism-room-wayfinder-link prism-hue-'+room.colour+(active===room.id?' is-current':'')}>
    <span className="prism-room-wayfinder-glyph" aria-hidden="true">{room.icon}</span>
    <span className="prism-room-wayfinder-label"><strong>{room.label}</strong><small>{room.hint}</small></span>
    {active===room.id&&<span className="prism-room-wayfinder-active" aria-hidden="true">✧</span>}
   </Link>)}
  </div>
 </nav>;
}
