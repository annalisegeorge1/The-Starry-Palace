import React from 'react';
import {readingStoryPresentation} from './readingStoryPresentation';
import './reading-story-context.css';

export default function ReadingStoryContext({work}){
 const details=readingStoryPresentation(work);
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
    <p>{details.summary}</p>
   </div>
 </section>;
}
