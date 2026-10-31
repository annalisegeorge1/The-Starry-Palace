import React,{useState} from 'react';
import {Link} from 'react-router-dom';
import PalaceInfoMark from './PalaceInfoMark';
import {palaceHelpTopic} from './palaceHelpTopics';
import './palace-guidebook-hints.css';

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

/** Quiet, dismissible orientation; no tour overlay or forced steps. */
export function PalaceFirstRoomHint({id}){
 const topic=palaceHelpTopic(id);
 const key='palace-room-introduction:v1:'+id;
 const [dismissed,setDismissed]=useState(()=>{
  try{return localStorage.getItem(key)==='seen'}catch{return false}
 });
 if(!topic||dismissed)return null;
 return <aside className="palace-first-room-hint" aria-label={'Getting started: '+topic.title}>
  <div><small>A GENTLE FIRST LOOK</small><p>{topic.summary}</p></div>
  <div className="palace-first-room-actions">
   <Link to={'/guidebook#guide-'+topic.id}>How this works →</Link>
   <button type="button" onClick={()=>{setDismissed(true);try{localStorage.setItem(key,'seen')}catch{}}}>Got it</button>
  </div>
 </aside>;
}
