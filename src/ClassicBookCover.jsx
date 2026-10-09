import React,{useState} from 'react';
import {classicBookCoverInfo,classicCoverPalette} from './classicBookCoverModel';
import StoryRatingBadge from './StoryRatingBadge';
import './classic-book-covers.css';

export default function ClassicBookCover({record={},className='',rating,showRating=false,compact=false}){
 const [failed,setFailed]=useState(false);
 const source=classicBookCoverInfo(record);
 const title=String(record.title||'Untitled classic');
 const author=String(record.creator_name||record.profiles?.display_name||'Historical author');
 return <span className={'palace-classic-book-cover palette-'+classicCoverPalette(title)+(compact?' compact':'')+(className?' '+className:'')}>
  {source&&!failed?<img loading="lazy" decoding="async" src={source.url}
    alt={'Cover of '+title+(source.source==='Project Gutenberg'?' — Project Gutenberg edition':'')}
    onError={()=>setFailed(true)}/>:<span className="palace-classic-fallback" aria-label={'Book cover placeholder for '+title}>
    <small>THE STARRY PALACE · CLASSICS</small>
    <span className="palace-classic-fallback-glyph" aria-hidden="true">✧</span>
    <strong>{title}</strong><em>{author}</em>
   </span>}
  {showRating&&<StoryRatingBadge rating={rating??record.rating??'not_rated'}/>}
 </span>;
}
