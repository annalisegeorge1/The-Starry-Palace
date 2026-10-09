import React,{useState} from 'react';
import {Link} from 'react-router-dom';
import {readingCardTagItems} from './readingCardModel';
import './reading-discovery-finish.css';

/** A few clickable tags are enough for discovery; a reader may reveal the rest. */
export default function ReadingCardTags({tags=[],limit=3}){
 const [expanded,setExpanded]=useState(false);
 const items=readingCardTagItems(tags,expanded,limit);
 if(!items.total)return null;
 return <div className="reading-card-tags reading-card-tags-reveal" aria-label="Story tags">
  {items.visible.map((tag,index)=><Link key={tag.id||tag.name+'-'+index} to={'/tags?q='+encodeURIComponent(tag.name)}>#{tag.name}</Link>)}
  {items.total>Math.max(1,limit)&&<button type="button" className="reading-tag-show" aria-expanded={expanded} onClick={()=>setExpanded(value=>!value)}>
   {expanded?'Show fewer tags ↑':'+'+items.hidden+' more '+(items.hidden===1?'tag':'tags')+' ↓'}
  </button>}
 </div>;
}
