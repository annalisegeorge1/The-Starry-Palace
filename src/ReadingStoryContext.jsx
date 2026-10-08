import React,{useState} from 'react';
import {readingStoryPresentation} from './readingStoryPresentation';
import './reading-story-context.css';

export default function ReadingStoryContext({work}){
 const details=readingStoryPresentation(work);
 const[expanded,setExpanded]=useState(false);
 const isLong=details.summary.length>280;
 const cutoff=details.summary.lastIndexOf(' ',280);
 const preview=isLong?details.summary.slice(0,cutoff>180?cutoff:280).trimEnd()+'…':details.summary;
 return <section className="reading-story-context" aria-label="Story details">
   <div className="reading-story-context-facts">
    <span className="reading-story-kind">{details.kind}</span>
    {details.fandoms.length>0&&<span className="reading-story-fandom"><strong>Fandom:</strong> {details.fandoms.join(' · ')}</span>}
    <span><strong>Rating:</strong> {details.rating}</span>
    <span><strong>Status:</strong> {details.status}</span>
    {details.language&&<span><strong>Language:</strong> {details.language}</span>}
   </div>
   <div className="reading-story-context-summary">
    <small>SUMMARY</small>
    <p>{expanded?details.summary:preview}</p>
    {isLong&&<button type="button" className="reading-story-summary-toggle" aria-expanded={expanded} onClick={()=>setExpanded(value=>!value)}>{expanded?'Show less ↑':'Read full summary ↓'}</button>
   </div>
 </section>;
}
