import React,{useState} from 'react';
import {readingStoryPresentation} from './readingStoryPresentation';
import {readingSummaryPreview} from './readingCardModel';
import './reading-story-context.css';

/** Full metadata on a story page; a calmer summary-first view on discovery cards. */
export default function ReadingStoryContext({work,compact=false}){
 const details=readingStoryPresentation(work);
 const[expanded,setExpanded]=useState(false);
 const {preview,truncated}=readingSummaryPreview(details.summary,compact?165:280);
 const overflowFandoms=compact&&details.fandoms.length>1;
 return <section className={'reading-story-context'+(compact?' is-compact':'')} aria-label="Story details">
   <div className="reading-story-context-facts">
    <span className="reading-story-kind">{details.kind}</span>
    {compact?<>
     <span><strong>Rating:</strong> {details.rating}</span>
     <span><strong>Status:</strong> {details.status}</span>
     {details.fandoms.length>0&&<span className="reading-story-fandom"><strong>Fandom:</strong> {details.fandoms[0]}{overflowFandoms?' +'+(details.fandoms.length-1):''}</span>}
    </>:<>
     {details.fandoms.length>0&&<span className="reading-story-fandom"><strong>Fandom:</strong> {details.fandoms.join(' · ')}</span>}
     <span><strong>Rating:</strong> {details.rating}</span>
     <span><strong>Status:</strong> {details.status}</span>
     {details.language&&<span><strong>Language:</strong> {details.language}</span>}
    </>}
   </div>
   <div className="reading-story-context-summary">
    <small>SUMMARY</small>
    <p>{expanded?details.summary:preview}</p>
    {truncated&&<button type="button" className="reading-story-summary-toggle" aria-expanded={expanded} onClick={()=>setExpanded(value=>!value)}>{expanded?'Show less ↑':'Read full summary ↓'}</button>}
   </div>
   {compact&&(overflowFandoms||details.language)&&<details className="reading-story-context-extra">
    <summary>More work details {overflowFandoms?'· '+details.fandoms.length+' fandoms':''}</summary>
    {details.fandoms.length>0&&<p><strong>Fandoms:</strong> {details.fandoms.join(' · ')}</p>}
    {details.language&&<p><strong>Language:</strong> {details.language}</p>}
   </details>}
 </section>;
}
