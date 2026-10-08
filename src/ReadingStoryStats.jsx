import React from 'react';
import {Link} from 'react-router-dom';
import './reading-story-stats.css';
export default function ReadingStoryStats({work}){
 const stats=work?.reading_stats;
 if(!stats)return null;
 const numeric=value=>Math.max(0,Number(value)||0).toLocaleString();
 const chapters=numeric(stats.chapters);
 const total=work.completion_status==='complete'?chapters:'?';
 return <dl className="palace-story-statline" aria-label="Story information">
  <div><dt>Words:</dt><dd>{numeric(stats.words)}</dd></div>
  <div><dt>Chapters:</dt><dd><Link to={'/work/'+work.slug}>{chapters}/{total}</Link></dd></div>
  <div><dt>Comments:</dt><dd><Link to={'/work/'+work.slug+'#comments'}>{numeric(stats.comments)}</Link></dd></div>
  <div><dt>Bookmarks:</dt><dd><span>{numeric(stats.bookmarks)}</span></dd></div>
 </dl>;
}
