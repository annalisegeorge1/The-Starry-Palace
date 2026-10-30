import React from 'react';
import PalaceIcon,{palaceIconForRoute} from './PalaceIcon';
import {Link} from 'react-router-dom';
import {useAuth} from './auth';
import {palaceSignInDoor} from './palaceDoorway';
import './palace-prism-rooms.css';
import './palace-journey-focus.css';

/** Small context-sensitive directions rather than a second five-room directory.
 * Never block a public reader from browsing other public creative work.
 * Guests are shown sign-in doors only when they specifically choose a member action.
 */
const ACTIONS={
 reading:{
  signed:[
   ['continue','Continue reading','Your saved place','▤','/library?tab=continue','sapphire',true],
   ['write','Start writing','Your creative desk','✎','/writing','violet',true],
   ['gather','Talk about stories','Join the Commons','✧','/palace-life?room=commons','rose',true]
  ],
  guest:[
   ['fandoms','Explore fandoms','Find your universe','◈','/fandoms','teal',false],
   ['comics','Browse comics','Illustrated worlds','▤','/comics','sapphire',false],
   ['tags','Explore tags','Follow your interests','⌕','/tags','violet',false]
  ]
 },
 library:[
  ['read','Find another story','Reading Rooms','▤','/reading','teal',false],
  ['write','Work on a draft','Writing Chamber','✎','/writing','violet',true],
  ['gather','Visit the Commons','Palace Life','✧','/palace-life?room=commons','rose',true]
 ],
 writing:[
  ['read','Find inspiration','Reading Rooms','▤','/reading','teal',false],
  ['saved','Your reading shelf','My Library','◈','/library?tab=continue','sapphire',true],
  ['gather','Join the Commons','Palace Life','✧','/palace-life?room=commons','rose',true]
 ],
 duels:[
  ['write','Return to drafts','Writing Chamber','✎','/writing','violet',true],
  ['gather','Share your ideas','Palace Commons','✧','/palace-life?room=commons','rose',true],
  ['prizes','See your badges','Royal Treasury','♛','/treasury?tab=achievements','mint',true]
 ],
 commons:[
  ['read','Discover a story','Reading Rooms','▤','/reading','teal',false],
  ['saved','Your saved worlds','My Library','◈','/library?tab=continue','sapphire',true],
  ['home','Return home','Your Chamber','☾','/chamber','violet',true]
 ]
};
export function palaceJourneyDoors(active='writing',signedIn=true){
 const source=active==='reading'?(signedIn?ACTIONS.reading.signed:ACTIONS.reading.guest):(ACTIONS[active]||ACTIONS.writing);
 return source.map(([id,label,hint,icon,path,colour,needsAccount])=>({
  id,label,hint,icon,colour,to:!signedIn&&needsAccount?palaceSignInDoor(path):path
 }));
}
export default function PrismWayfinder({active='writing'}){
 const {session}=useAuth();
 const signedIn=Boolean(session?.user?.id);
 const doors=palaceJourneyDoors(active,signedIn);
 return <nav className="prism-room-wayfinder palace-journey-strip" aria-label="Where to go next in the Palace">
  <div className="prism-room-wayfinder-intro">
   <span aria-hidden="true"><PalaceIcon name="compass"/></span><div><small>KEEP EXPLORING</small><strong>Where next?</strong></div>
  </div>
  <div className="prism-room-wayfinder-links">
   {doors.map(door=><Link key={door.id} to={door.to} className={'prism-room-wayfinder-link prism-hue-'+door.colour}>
    <span className="prism-room-wayfinder-glyph" aria-hidden="true"><PalaceIcon name={palaceIconForRoute(door.to)} /></span>
    <span className="prism-room-wayfinder-label"><strong>{door.label}</strong><small>{door.hint}</small></span>
    <span className="palace-journey-arrow" aria-hidden="true"><PalaceIcon name="arrow-up-right"/></span>
   </Link>)}
  </div>
 </nav>;
}
