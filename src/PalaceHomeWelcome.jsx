import React from 'react';
import {Link} from 'react-router-dom';
import './palace-home-welcome.css';

const CHOICES=[
 {id:'read',sigil:'◈',kicker:'DISCOVER',title:'Find a story',description:'Wander through original stories, fanworks, poetry and comics.',url:'/reading',action:'Enter the Reading Rooms'},
 {id:'write',sigil:'✎',kicker:'CREATE',title:'Tell your story',description:'Begin a private draft, find your rhythm and publish when you are ready.',url:'/writers',action:'Explore the Writer’s Door'},
 {id:'belong',sigil:'☾',kicker:'GATHER',title:'Find your people',description:'Meet kindred readers and writers, discover events and explore the Grand Palaces.',url:'/grand-palaces',action:'Discover Palace Life'}
];
export function PalaceHomeWelcome({member=false}){
 return <section className="palace-home-welcome" aria-label="Choose how to begin">
  <header><div><p className="eyebrow">YOUR PALACE, AT YOUR PACE</p>
    <h2>What would you like to do tonight?</h2>
    <p>Three simple doorways. A whole world beyond them. You can explore freely without learning everything at once.</p></div></header>
  <div className="palace-home-choices">
   {CHOICES.map(choice=><Link className={'palace-choice-card palace-choice-'+choice.id}
    key={choice.id} to={member&&choice.id==='write'?'/writing':member&&choice.id==='belong'?'/palace-life':choice.url}>
    <div className="palace-choice-top"><span className="palace-choice-sigil" aria-hidden="true">{choice.sigil}</span><span className="palace-choice-kicker">{choice.kicker}</span></div>
    <h3>{choice.title}</h3><p>{choice.description}</p><span className="palace-choice-action">{member&&choice.id==='write'?'Open my Writing Chamber':choice.action} <span aria-hidden="true">→</span></span>
   </Link>)}
  </div>
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
