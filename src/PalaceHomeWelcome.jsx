import React from 'react';
import {Link} from 'react-router-dom';
import './palace-home-welcome.css';

const CHOICES=[
 {id:'read',sigil:'◈',kicker:'DISCOVER',title:'Find a story',description:'Wander through original stories, fanworks, poetry and comics.',url:'/reading',action:'Enter the Reading Rooms'},
 {id:'write',sigil:'✎',kicker:'CREATE',title:'Tell your story',description:'Begin a private draft, find your rhythm and publish when you are ready.',url:'/writers',action:'Explore the Writer’s Door'},
 {id:'belong',sigil:'☾',kicker:'GATHER',title:'Find your people',description:'Meet kindred readers and writers, discover events and explore the Grand Palaces.',url:'/events',action:'Explore Palace gatherings'}
];
export function PalaceHomeWelcome({member=false}){
 return <section className="palace-home-welcome" aria-label="Choose how to begin">
  <header><div><p className="eyebrow">YOUR PALACE, AT YOUR PACE</p>
    <h2>Where would you like to begin?</h2>
    <p>Read, write, or find your people. Every other Palace room is here when you're ready.</p></div></header>
  <div className="palace-home-choices">
   {CHOICES.map(choice=><Link className={'palace-choice-card palace-choice-'+choice.id}
    key={choice.id} to={member&&choice.id==='write'?'/writing':member&&choice.id==='belong'?'/palace-life':choice.url}>
    <div className="palace-choice-top"><span className="palace-choice-sigil" aria-hidden="true">{choice.sigil}</span><span className="palace-choice-kicker">{choice.kicker}</span></div>
    <h3>{choice.title}</h3><p>{choice.id==='belong'?(member?'Step into the Commons, meet kindred readers and writers, and find a conversation that feels like yours.':'Browse public Palace events and see the kind of gatherings waiting inside.'):choice.description}</p><span className="palace-choice-action">{choice.id==='belong'?(member?'Enter Palace Life':'Explore public gatherings'):member&&choice.id==='write'?'Open my Writing Chamber':choice.action} <span aria-hidden="true">→</span></span>
   </Link>)}
  </div>
  <nav className="palace-culture-paths" aria-label="Events and literary heritage">
   <Link to="/events?tab=heritage" className="palace-culture-path palace-culture-events">
    <span className="palace-culture-icon" aria-hidden="true">✧</span>
    <span><strong>History, heritage & festivals</strong><small>Explore cultural histories, traditions, festivals and celebrations.</small></span>
    <span className="palace-culture-arrow" aria-hidden="true">→</span>
   </Link>
   <Link to="/reading" className="palace-culture-path palace-culture-literature">
    <span className="palace-culture-icon" aria-hidden="true">❖</span>
    <span><strong>Literature across generations</strong><small>Discover classics, storytelling traditions and new voices side by side.</small></span>
    <span className="palace-culture-arrow" aria-hidden="true">→</span>
   </Link>
  </nav>
 </section>;
}
const glyphs=['◈','▤','✎','♢','✧','♛','☄','☷'];
export function PalaceRoomDirectory({rooms}){
 return <details className="palace-room-directory">
  <summary><span><strong>Explore all the Palace rooms</strong><small>Comics, events, Treasury, Grand Palaces, preservation and more</small></span><span className="palace-room-chevron" aria-hidden="true">⌄</span></summary>
  <div className="room-grid expanded">{rooms.map(([name,path,copy],i)=><Link className={'room-card room-'+i}
   to={path} key={path}><span>{String(i+1).padStart(2,'0')}</span>
   <div className="room-glyph" aria-hidden="true">{glyphs[i]||'✦'}</div>
   <h2>{name}</h2><p>{copy}</p><b>Enter room →</b>
  </Link>)}</div>
 </details>;
}
