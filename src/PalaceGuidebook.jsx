import React,{useEffect,useMemo,useState} from 'react';
import {Link} from 'react-router-dom';
import PalaceInfoMark from './PalaceInfoMark';
import {PALACE_HELP_TOPICS,palaceHelpTopic} from './palaceHelpTopics';
import './palace-guidebook.css';

/** Use this next to a specific unfamiliar concept, never every obvious button. */
export function PalaceTopicHelp({id,className=''}) {
 const topic=palaceHelpTopic(id);
 if(!topic)return null;
 return <PalaceInfoMark title={topic.title} className={'palace-topic-help '+className}>
  <p>{topic.summary}</p>
  <ul>{topic.details.slice(0,2).map(line=><li key={line}>{line}</li>)}</ul>
  <Link className="palace-help-more" to={'/guidebook#guide-'+topic.id}>More in the Palace Guidebook →</Link>
 </PalaceInfoMark>;
}

const groups=['All',...new Set(PALACE_HELP_TOPICS.map(t=>t.group))];
export default function PalaceGuidebook({Frame}){
 const [query,setQuery]=useState('');
 const [group,setGroup]=useState('All');
 const visible=useMemo(()=>PALACE_HELP_TOPICS.filter(topic=>
  (group==='All'||topic.group===group)&&
  [topic.title,topic.summary,topic.group,...topic.details].join(' ').toLowerCase().includes(query.trim().toLowerCase())
 ),[group,query]);
 useEffect(()=>{
  const hash=decodeURIComponent(window.location.hash.slice(1));
  if(!hash.startsWith('guide-'))return;
  setGroup('All');setQuery('');
  const target=document.getElementById(hash);
  if(target)requestAnimationFrame(()=>target.scrollIntoView({block:'start'}));
 },[]);
 return <Frame><section className="palace-guidebook-page">
  <header className="palace-guidebook-hero">
   <p className="eyebrow">THE PALACE GUIDEBOOK · OPEN TO EVERYONE</p>
   <h1>Find your way among the stars.</h1>
   <p>Every Palace tradition has a purpose. Find a quick answer here, or use the small question marks beside features when you need one.</p>
   <div className="palace-guidebook-starts"><Link to="/reading">Start reading →</Link><Link to="/writers">Start writing →</Link><Link to="/code">Community Code →</Link></div>
  </header>
  <section className="palace-guidebook-controls" aria-label="Find help">
   <label htmlFor="palace-guidebook-search">Search the Guidebook
    <input id="palace-guidebook-search" type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Try drafts, titles, clubs, safety…" autoComplete="off"/>
   </label>
   <div className="palace-guidebook-filters" role="group" aria-label="Guidebook topics">{groups.map(g=><button key={g} type="button" aria-pressed={group===g} onClick={()=>setGroup(g)}>{g}</button>)}</div>
  </section>
  <p role="status" className="palace-guidebook-count">{visible.length} {visible.length===1?'topic':'topics'} available</p>
  {visible.length?<div className="palace-guidebook-topics">{visible.map(topic=><article id={'guide-'+topic.id} key={topic.id} className="palace-guidebook-topic">
   <small>{topic.group}</small>
   <h2>{topic.title}</h2>
   <p>{topic.summary}</p>
   <ul>{topic.details.map(point=><li key={point}>{point}</li>)}</ul>
   <Link to={topic.route}>Explore this Palace room →</Link>
  </article>)}</div>:<div className="palace-guidebook-empty"><strong>No topics match that search.</strong><p>Try a different word or see every section of the Guidebook.</p><button type="button" onClick={()=>{setGroup('All');setQuery('')}}>Show all topics</button></div>}
  <footer className="palace-guidebook-footer"><p>For conduct and member rights, the <Link to="/code">Palace Code</Link> takes precedence over short help summaries. For current eligibility, prize and account settings, review the live feature before taking action.</p><Link to="/beta">Report confusing guidance →</Link></footer>
 </section></Frame>;
}
