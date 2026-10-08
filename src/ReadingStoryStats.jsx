import React from 'react';
import {Link} from 'react-router-dom';
import './reading-story-stats.css';
export default function ReadingStoryStats({work,overview=false}){
 const stats=work?.reading_stats;
 if(!stats)return null;
 const numeric=value=>value===null||value===undefined?'—':Math.max(0,Number(value)||0).toLocaleString();
 const chapters=numeric(stats.chapters);
 const total=work.completion_status==='complete'?chapters:'?';
 return <dl className="palace-story-statline" aria-label="Story information">
  <div><dt>Words:</dt><dd>{numeric(stats.words)}</dd></div>
  <div><dt>Chapters:</dt><dd>{overview?<a href="#palace-work-chapters">{chapters}/{total}</a>:<Link to={'/work/'+work.slug}>{chapters}/{total}</Link>}</dd></div>
  <div><dt>Comments:</dt><dd>{overview?<a href="#comments">{numeric(stats.comments)}</a>:<Link to={'/work/'+work.slug+'#comments'}>{numeric(stats.comments)}</Link>}</dd></div>
  <div><dt>Bookmarks:</dt><dd><span>{numeric(stats.bookmarks)}</span></dd></div>
 </dl>;
}
