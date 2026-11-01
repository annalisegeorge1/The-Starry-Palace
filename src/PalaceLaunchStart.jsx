import React from 'react';
import {Link} from 'react-router-dom';
import PalaceIcon from './PalaceIcon';
import {choosePalaceStartingStory,PALACE_FIRST_READING_DOORS,palaceStoryPath} from './palaceLaunchDiscovery';
import './palace-launch-discovery.css';

/** First reader path; makes no fabricated story, completion or length claims. */
const landingDoorIcons={original:'sparkles',fanworks:'book-open',comics:'comic-book'};
export default function PalaceLaunchStart({works=[],status='ready'}){
 if(status==='loading')return null;
 const start=status==='ready'?choosePalaceStartingStory(works):null;
 return <section className="palace-launch-start" aria-labelledby="palace-launch-title">
  <div className="palace-launch-intro">
   <p className="eyebrow">NEW TO THE PALACE?</p>
   <h2 id="palace-launch-title">Your first story begins here.</h2>
   <p>Read for free, no account required. Discover an original world, follow a favourite fandom, or explore comics.</p>
  </div>
  {start?<div className="palace-launch-feature">
   <div className="palace-launch-feature-art">
    {start.cover_url?<img src={start.cover_url} alt="" loading="lazy" decoding="async"/>:<span aria-hidden="true">☾<small>✦</small></span>}
   </div>
   <div className="palace-launch-feature-body">
    <p className="palace-launch-kicker">A FINISHED {start.work_type==='fanwork'?'FANWORK':'STORY'} TO BEGIN WITH · GENERAL AUDIENCES</p>
    <h3>{start.title}</h3>
    <p className="palace-launch-description">{start.summary}</p>
    <p className="palace-launch-author">By {start.profiles?.display_name||start.profiles?.username||'a Palace writer'}</p>
    <div className="palace-launch-actions"><Link className="palace-launch-primary" to={palaceStoryPath(start.slug)}>Start reading <span aria-hidden="true">→</span></Link><Link to="/reading">See more stories</Link></div>
   </div>
  </div>:<p className="palace-launch-fallback">Pick a doorway that interests you. No need to decide on a genre before you explore.</p>}
  <nav className="palace-launch-doors" aria-label="Choose your first reading path">
   {PALACE_FIRST_READING_DOORS.map(door=><Link to={door.href} key={door.id}>
    <span className="palace-launch-door-sigil" aria-hidden="true"><PalaceIcon name={landingDoorIcons[door.id]||'book-open'} size={23} strokeWidth={1.85}/></span>
    <span><strong>{door.title}</strong><small>{door.description}</small></span>
    <span className="palace-launch-door-arrow" aria-hidden="true">↗</span>
   </Link>)}
  </nav>
 </section>;
}
