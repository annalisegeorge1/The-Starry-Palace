import React,{useState} from 'react';
import PalaceIcon,{palaceIconForRoute} from './PalaceIcon';
import {Link,useNavigate} from 'react-router-dom';
import {palaceSignInDoor} from './palaceDoorway';
import {palaceRecentDoorKey,readPalaceRecentDoors,distinctRecentPalaceRooms} from './palaceRecentDoors';
import './palace-home-hub.css';

const paths={
 read:[
  ['◈','Reading Rooms','Original worlds, fanfiction and poetry.','/reading'],
  ['▤','Comics Gallery','Discover stories told in pictures.','/comics'],
  ['✦','Find your fandom','Browse the worlds you already love.','/fandoms'],
  ['⌕','Explore tags','Find a theme, a pairing or a new obsession.','/tags'],
  ['☾','Your library','Return to your saved stories and collections.','/library',true],
  ['❖','Lost Works','Explore the preservation archive.','/lost-works']
 ],
 create:[
  ['✎','Writing Chamber','Your drafts, chapters and published worlds.','/writing',true],
  ['▧','Comic Studio','Build your next visual story.','/comics/studio',true],
  ['✧','The Writer’s Door','Get to know your creative tools.','/writers'],
  ['♛','Throne of Honour','Discover writers and their published work.','/honour'],
  ['☾','Your chamber','Make a home for your creative identity.','/chamber',true],
  ['◷','Creative calendar','Find a gathering and make time to create.','/events']
 ],
 gather:[
  ['◇','Palace Commons','Join the conversations happening inside.','/palace-life',true],
  ['♜','Grand Palaces','Find your palace and follow the competition.','/grand-palaces',true],
  ['✧','Events & gatherings','See what is on the Palace calendar.','/events'],
  ['♛','Royal Treasury','Explore badges, gifts and your collection.','/treasury',true],
  ['✉','Palace Letters','Pick up your private conversations.','/letters',true],
  ['❖','Heritage & festivals','Discover histories and shared celebrations.','/events?tab=heritage']
 ]
};
const descriptions={read:'A new world, or an old favourite.',create:'Make space for your next idea.',gather:'Find the people who make it feel like home.'};
export default function PalaceHomeHub({memberId,children}){
 const[view,setView]=useState('read');
 const[query,setQuery]=useState('');
 const navigate=useNavigate();
 const member=Boolean(memberId);
 // Read by the current identity on every render; never retain another member's doors.
 const recent=distinctRecentPalaceRooms(readPalaceRecentDoors(key=>window.localStorage.getItem(key),palaceRecentDoorKey(memberId))
  .filter(door=>door.path!=='/'),4);
 return <>
  <section className={'palace-hub-hero'+(member?' is-member':'')} aria-labelledby="palace-home-title">
   <div className="palace-hub-copy">
    <p className="palace-hub-eyebrow">{member?'WELCOME BACK TO YOUR PALACE':'THE STARRY PALACE'}</p>
    <h1 id="palace-home-title">{member?'Make yourself at home.':<>A world of stories.<br/>A place to belong.</>}</h1>
    <p className="palace-hub-motto">Gather. Have a cup of tea. Write and read with me.</p>
    {!member&&<p className="palace-hub-guest-promise"><strong>Read freely, no account needed.</strong> Join only when you want to comment, save, follow, chat or take part in Palace Life.</p>}
    <div className="palace-hub-actions"><Link className="hub-primary" to="/reading">Find your next story <span aria-hidden="true">→</span></Link><Link to={member?'/writing':'/writers'}>{member?'Open my writing desk':'Step through the Writer’s Door'} <span aria-hidden="true">↗</span></Link></div>
   </div>
   <div className="palace-hub-art"><img src="/assets/palace/palace-belonging.gif" alt="" decoding="async"/><span>YOUR PALACE · A PLACE TO BELONG</span></div>
  </section>
  {recent.length>0&&<nav className="palace-hub-recent" aria-label="Recently visited Palace rooms"><span className="palace-hub-recent-heading"><strong>Pick up your path</strong><small>Your latest stop in each Palace room</small></span>{recent.map(door=><Link key={door.path} to={door.path}><span aria-hidden="true"><PalaceIcon name={palaceIconForRoute(door.path)}/></span>{door.label}<span aria-hidden="true">↗</span></Link>)}</nav>}
  {children}
  <section className="palace-hub-discovery" aria-labelledby="palace-discovery-title">
   <header><div><p className="palace-hub-eyebrow">FOLLOW YOUR CURIOSITY</p><h2 id="palace-discovery-title">What brings you here today?</h2></div>
    <form role="search" aria-label="Discover stories and creators" onSubmit={event=>{event.preventDefault();if(query.trim())navigate('/search?q='+encodeURIComponent(query.trim()))}}><label className="hub-search-label" htmlFor="hub-search">Search the Palace</label><input id="hub-search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="A story, writer, fandom…"/><button type="submit" aria-label="Search the Palace"><PalaceIcon name="search"/></button></form>
   </header>
   <div className="palace-hub-lenses" role="group" aria-label="Choose a discovery path">{['read','create','gather'].map(key=><button key={key} type="button" aria-pressed={view===key} aria-controls="palace-discovery-paths" onClick={()=>setView(key)}>{key==='read'?'Read':key==='create'?'Create':'Gather'}</button>)}</div>
   <p className="palace-hub-description" aria-live="polite">{descriptions[view]}</p>
   <nav id="palace-discovery-paths" className="palace-hub-paths" aria-label={view+' discovery destinations'}>{paths[view].map(([icon,title,description,path,protectedPath])=><Link key={path} to={protectedPath&&!member?palaceSignInDoor(path):path}><span className="palace-hub-path-icon" aria-hidden="true"><PalaceIcon name={palaceIconForRoute(path)}/></span><span><strong>{title}</strong><small>{description}</small></span><span className="palace-hub-path-arrow" aria-hidden="true"><PalaceIcon name="arrow-up-right"/></span></Link>)}</nav>
  </section>
 </>;
}
